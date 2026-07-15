# ADR 0022: Gen2 Endpoint Responsibility and Contract Cleanup

## Status

Accepted

## Date

2026-07-15

## Context

The Gen2 local API already exposes three useful endpoints, but their responsibilities have drifted together:

- `/measurements` contains current observations plus repeated batch identity, wiring details, control metadata, and nested diagnostics.
- `/capabilities` mixes static configuration with live sensor reads, I2C scans, mux detection, and prove-out diagnostics.
- `/status` mixes current runtime health with static capability fields and legacy DHT-specific state.

The same drift continues into the cloud paths. Measurement batches preserve complete `records[]`, while heartbeats use older telemetry/diagnostics names and a mixture of scalar columns and nested details. Hosted and local frontend consumers depend on those older shapes.

This creates several practical problems:

- the meaning of each endpoint is not immediately clear;
- `/capabilities` can create side effects and delays merely by describing configuration;
- measurement rows repeat device identity and time that already belong to the batch envelope;
- the most specific provider failure can be hidden under a generic `read_failed` reason;
- static watering authority is duplicated in status and heartbeat data;
- legacy field names make local status, heartbeat storage, SQL views, and hosted diagnostics harder to compare;
- Balcony02 currently emits an uninstalled SEN0308 expansion slot as a measurement rather than only as configured inventory.

The endpoint cleanup must not change hardware, installed sensor assignments, electrical boundaries, watering behavior, local control ownership, timing, or safety gates.

## Decision

Gen2 endpoint responsibilities are separated and frozen as follows.

### `/measurements`

`/measurements` reports what configured and installed sensors observed at one authoritative measurement time.

The top-level envelope is the single authority for:

- device identity;
- device role;
- firmware/build provenance;
- batch measurement time.

Individual records contain only:

- `sensor_key`;
- `sensor_type`;
- optional `physical_sensor_id` when a physical identity exists;
- `measurement_name`;
- `measurement_value`;
- `measurement_unit`;
- `valid`;
- coarse `quality`;
- the most specific available `reason`.

New records do not contain:

- record-level `device_id`;
- record-level `measured_at`;
- `control_eligible`;
- `details`.

The allowed coarse quality values are:

- `good`;
- `diagnostic`;
- `missing`;
- `failed`.

When a provider supplies a specific failure such as `mux_not_detected`, `channel_select_failed`, or another concrete read failure, the record `reason` must preserve that specific cause instead of replacing it with generic `read_failed`.

The successful Balcony02 response contains exactly 11 records in this order:

1. BME280 air temperature;
2. BME280 relative humidity;
3. BME280 barometric pressure;
4. DS18B20 soil temperature;
5. SEN0308 M01;
6. SEN0308 M02;
7. SEN0308 M03;
8. SEN0562 L01;
9. SEN0562 L02;
10. SEN0562 L03;
11. SEN0204 WL01.

SEN0308 M04 is configured expansion inventory but is not installed and therefore is omitted from `/measurements`.

The DS18B20 stable `sensor_key` remains `ds18b20_temperature`. Only its external `measurement_name` changes from legacy `temperature` to exactly `soil temp`.

The SEN0204 external `measurement_name` changes from `reservoir_liquid_state` to `reservoir_liquid_detected`. Its numeric meaning remains unchanged:

- `1` means liquid detected;
- `0` means liquid not detected.

### Measurement batch storage

The raw Gen2 batch architecture from ADR 0017 remains active:

- one append-only row represents one complete device measurement package;
- the complete `records[]` array is stored as `jsonb`;
- `device_id` and `measured_at` remain authoritative batch columns;
- a derived SQL view flattens records for query and display.

When the database flattens a batch, each derived row receives `device_id` and `measured_at` from the batch row. The firmware does not repeat those values inside each new record.

Historical batches remain valid. Older stored records may continue to contain `control_eligible`, `details`, record-level identity, record-level time, or legacy DS18B20 `temperature`. No historical data rewrite is required by this ADR.

### `/capabilities`

`/capabilities` reports what the running firmware declares is configured, installed, and intended to be available.

It is a static manifest generated from compile-time/profile configuration. Merely requesting `/capabilities` must not perform:

- sensor reads;
- GPIO state reads used as health proof;
- I2C address scans;
- mux detection scans;
- mux channel scans;
- live device detection;
- provider conversions;
- other side-effecting diagnostics.

The endpoint contains:

- device identity and provenance;
- `can_water`, derived from the existing internal compile-time safety gates;
- `control_authority`;
- troubleshooting pinout;
- configured active states;
- shared I2C/provider configuration;
- configured module inventory;
- installed state;
- module-specific connection metadata;
- actual declared control roles.

The endpoint does not contain live health fields such as `present`, `quality`, or `reason`.

Balcony02 capability inventory includes:

- `bme280_air`;
- `ds18b20_temperature`;
- `sen0308_m01`;
- `sen0308_m02`;
- `sen0308_m03`;
- `sen0308_m04` with `installed:false`;
- `sen0562_l01`;
- `sen0562_l02`;
- `sen0562_l03`;
- `sen0204_wl01`.

Only SEN0204 currently declares a sensor control role:

```json
{
  "control_role": "watering_interlock"
}
```

SEN0308 does not receive an automatic-watering trigger role until that behavior is separately implemented and validated.

The BME280 capability manifest declares the intended configured connection as mux channel 4 at address `0x76`. Existing runtime measurement address-detection behavior, including any current fallback behavior, is not changed by this static declaration.

### `/status`

`/status` reports how the running unit is operating now.

The local response contains top-level identity, provenance, report time, and uptime plus four nested objects:

- `network`;
- `cloud_reporting`;
- `watering`;
- `system`.

The network object contains current Wi-Fi state, readable status labels, local network identity, recovery counters, event times, disconnect reason evidence, and normalized activity labels.

Numeric Wi-Fi status and disconnect codes are retained where useful, but readable labels are added using compile-time Arduino/ESP-IDF constants and safe fallbacks such as `unknown` and `not_recorded`.

Never-recorded events use `null` for numeric/time evidence rather than sentinel values such as `-1`, `0`, or `0.0.0.0`.

The cloud-reporting object uses measurement and status terminology rather than legacy telemetry and diagnostics terminology. It preserves both UTC timestamps and boot-relative uptime evidence.

The watering object reports only current and recent runtime evidence:

- whether watering is active;
- the active trigger while watering;
- the last watering start time;
- the last completed duration.

Static watering authority does not appear in `/status`; it belongs in `/capabilities` as `can_water`.

The system object reports ESP32 heap evidence only. Legacy DHT-specific cache state does not belong in the generic status contract.

### Heartbeat alignment

The periodic device heartbeat is the cloud representation of current status.

The local `/status` response may remain nested while heartbeat storage remains flattened, provided the field names and meanings stay aligned.

Heartbeat and hosted diagnostics use the same active semantics for:

- Wi-Fi status and recovery evidence;
- cloud POST health;
- measurement/status success evidence;
- watering runtime state;
- heap state.

Local IP and MAC address remain local `/status` evidence and are not exposed through hosted-safe diagnostics views.

Supabase remains append-only evidence storage. Hosted diagnostics remain read-only and do not gain command authority.

### Compatibility and rollout

The cleanup is implemented in controlled slices so producers and consumers remain compatible:

1. freeze the contracts in documentation;
2. update `/measurements`, batch flattening, and frontend measurement consumers together;
3. preserve hosted recognition of historical DS18B20 `temperature` while new firmware emits `soil temp`;
4. implement static `/capabilities` and prove that its call path performs no reads or scans;
5. add heartbeat storage fields before new firmware posts them;
6. update `/status`, heartbeat payloads, SQL views, hosted API types, and hosted diagnostics together;
7. run watering-regression validation before closeout.

Additive database migration is preferred over destructive historical renaming. Old heartbeat and measurement evidence remains readable during the transition.

## Supersession and Amendment Scope

This ADR refines ADR 0016 and ADR 0017 only where those documents describe the active external Gen2 endpoint record shape.

Specifically:

- per-record `control_eligible` and `details` are no longer part of new `/measurements` records;
- record-level `device_id` and `measured_at` are no longer part of new `/measurements` records;
- optional `physical_sensor_id` is now permitted directly on a record;
- `/capabilities` is a static configuration manifest rather than live detection evidence;
- `/status` and heartbeat semantics are aligned around current runtime state.

This ADR does not supersede:

- ADR 0017 raw batch storage;
- ADR 0018 control-quality and freshness gates;
- local firmware ownership of watering;
- the hosted read-only boundary;
- offline autonomy;
- watering event evidence separation.

Control eligibility remains an internal firmware/control-design concern and may remain available in historical stored evidence or privileged analysis. It is not part of the cleaned external measurement record contract.

## Consequences

Each endpoint has one clear responsibility.

Measurement payloads become smaller and easier to flatten without losing batch identity or time.

Capabilities become fast, deterministic, and safe to request repeatedly because they no longer probe hardware.

Status becomes easier to compare with cloud heartbeat evidence and easier for support users to interpret.

Specific provider failures become directly visible in measurement `reason`.

Balcony02 emits exactly the installed observation set while still declaring its uninstalled expansion slot in capabilities.

Frontend code must explicitly support the new DS18B20 name and retain compatibility with historical rows.

SQL views and heartbeat storage require coordinated migration, but historical evidence is preserved.

## Non-Goals

- No changes to pins.
- No changes to sensors or installed assignments.
- No changes to electrical values or voltage boundaries.
- No changes to mux channels or provider channels.
- No changes to sensor read algorithms.
- No changes to BME280 runtime address-detection behavior.
- No changes to watering thresholds, duration, cooldown, or timing.
- No changes to relay, button, reservoir, or pump-interlock behavior.
- No automatic SEN0308 watering.
- No use of `device_role` as a watering gate.
- No Remote Water Now.
- No hosted calls to local ESP32 endpoints.
- No Supabase command/control.
- No hosted write path.
- No historical measurement or heartbeat rewrite.
- No production provisioning redesign.
