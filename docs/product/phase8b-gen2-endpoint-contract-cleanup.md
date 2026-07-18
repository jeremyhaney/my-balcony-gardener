# Phase 8B Gen2 Endpoint Contract Cleanup

- Phase 8B `/measurements` slice: COMPLETE / END-TO-END VALIDATED
- Phase 8B `/capabilities` slice: COMPLETE / LIVE DEVICE VALIDATED
- Phase 8B `/status` slice: COMPLETE / LIVE DEVICE, CLOUD, AND HOSTED-DIAGNOSTICS VALIDATED
- Phase 8B overall endpoint cleanup: FRONTEND VALIDATED / COMPLETE PENDING COMMIT AND PUSH
- Phase 8B parent: FRONTEND VALIDATED / COMPLETE PENDING COMMIT AND PUSH
- Phase 8B.5 Gen2 Endpoint Integration and Closeout: FRONTEND VALIDATED / COMPLETE PENDING COMMIT AND PUSH
- Date: 2026-07-18
- Device profile under primary validation: `balcony02-gen2`
- Device label: `Balcony02`
- Device UUID: `7e5bd328-ad68-4389-a71a-fa5cd01b3813`
- Firmware version: `phase8b4-gen2-status-contract`
- Governing ADR: [`0022-gen2-endpoint-responsibility-and-contract-cleanup.md`](../adr/0022-gen2-endpoint-responsibility-and-contract-cleanup.md)

## Purpose

This document freezes the approved external contracts and coordinated cloud/frontend semantics for the Gen2 endpoint cleanup before implementation begins.

The `/measurements`, `/capabilities`, and `/status` contracts are implemented and validated at their recorded evidence levels. Phase 8B.5 integrated hosted frontend closeout is FRONTEND VALIDATED / COMPLETE PENDING COMMIT AND PUSH; production deployment validation remains pending.

It is the implementation specification for this phase. It does not authorize unrelated refactoring, pin changes, sensor changes, timing changes, watering changes, or control-policy changes.

## `/measurements` production closeout — 2026-07-16

Implementation commits `b17bf1a` (`Document Gen2 endpoint contract cleanup`) and `2096394` (`Implement Gen2 measurement contract cleanup`) were pushed to `main`.

Cloudflare Pages deployed the hosted frontend. Before the coordinated Supabase migration was applied, the hosted frontend temporarily could not query measurements. After Jeremy manually applied [`phase8b-measurement-contract-cleanup.sql`](../sql/phase8b-measurement-contract-cleanup.sql) through the Supabase SQL Editor on 2026-07-16, the hosted Support View recovered and displayed current data normally. This was the expected contract deployment boundary, not a defect.

The applied schema preserves the append-only `sensor_measurement_batches` table, `schema_version:1`, and all base measurement-table columns. `sensor_measurements_flat` derives `device_id` and `measured_at` from the batch, exposes `physical_sensor_id`, prefers the top-level value, and falls back to historical `details.physical_sensor_id`. Privileged flat evidence retains historical `details` and `control_eligible`; hosted-safe public, customer, and support views expose `physical_sensor_id` but not `details` or `control_eligible`. Existing read-only customer/support boundaries remain intact, and no Supabase command/control was introduced.

All four PlatformIO environments built successfully: `balcony02-gen2`, `bench-proto-gen2`, `balcony-installed-gen2`, and `balcony-sensor-scout-01`. Only `balcony02-gen2` was uploaded. The validated unit was `Balcony02`, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, firmware `phase8b-balcony02-proveout`, build profile `balcony02-gen2`, on `COM5` at `10.0.0.69`.

Normal boot detected the BME280 and one DS18B20, initialized WL01 on GPIO26 as `INPUT`, reported SEN0562-L01 missing and SEN0562-L02/L03 detected, enabled the active-low GPIO32 physical button with 50 ms debounce and 15000 ms maximum hold, connected Wi-Fi, and started the web server without a reboot loop.

The PowerShell validator passed every `/measurements` assertion against `http://10.0.0.69`. The exact 11-record order is:

1. `bme280_air` / `air_temperature`
2. `bme280_air` / `relative_humidity`
3. `bme280_air` / `barometric_pressure`
4. `ds18b20_temperature` / `soil temp`
5. `sen0308_m01` / `raw_adc`
6. `sen0308_m02` / `raw_adc`
7. `sen0308_m03` / `raw_adc`
8. `sen0562_l01` / `ambient_light`
9. `sen0562_l02` / `ambient_light`
10. `sen0562_l03` / `ambient_light`
11. `sen0204_wl01` / `reservoir_liquid_detected`

M04 emits no measurement. New records contain only `sensor_key`, `sensor_type`, optional `physical_sensor_id`, `measurement_name`, `measurement_value`, `measurement_unit`, `valid`, `quality`, and `reason`. They omit record-level `device_id`, record-level `measured_at`, `details`, `control_eligible`, null `physical_sensor_id`, and empty details objects. Physical IDs `SEN0308-M01`, `SEN0308-M02`, `SEN0308-M03`, `SEN0562-L01`, `SEN0562-L02`, `SEN0562-L03`, and `WL01` were validated; BME280 and DS18B20 omit `physical_sensor_id`.

SEN0562-L01 remains explicit missing evidence: `measurement_value:null`, `valid:false`, `quality:missing`, `reason:sensor_not_detected_on_selected_channel`, and `physical_sensor_id:SEN0562-L01`. It is not healthy and is not classified as uninstalled.

Repeated 15-minute production batches were stored at `2026-07-16 16:16:58+00`, `2026-07-16 16:31:58+00`, and `2026-07-16 16:46:58+00`. Each recorded firmware `phase8b-balcony02-proveout`, build profile `balcony02-gen2`, and `record_count:11`. The following heartbeat reported `last_supabase_http_status:201`, `consecutive_supabase_failures:0`, and `last_supabase_error_category:none`.

Hosted validation passed: current Balcony02 samples displayed; Soil Temperature appeared as one card; historical DS18B20 `temperature` compatibility worked; air temperature, humidity, and pressure displayed normally; hosted views loaded without errors; watering history remained read-only; no Water Now control appeared; and no hosted local-device control or Supabase command/control was introduced.

Deferred beyond this slice are merging or hiding legacy `reservoir_liquid_state`; making `reservoir_liquid_detected` the canonical new name; an obvious hosted warning when liquid is not detected; final M01/M02/M03 and L01/L02/L03 customer/support card presentation; local browser UI retirement; and remaining local Water Now retirement.

WL01 semantics remain unchanged: HIGH means liquid detected, LOW means liquid not detected, LOW blocks watering, and a HIGH-to-LOW transition during watering stops the relay.

## `/capabilities` live-device closeout — 2026-07-16

Phase 8B.3 Gen2 `/capabilities` Static Contract Cleanup is COMPLETE / LIVE DEVICE VALIDATED. Phase 8B remains IN PROGRESS; Phase 8B.4 `/status` Nested Diagnostics Contract Cleanup is CURRENT / next, and Phase 8B.5 integrated endpoint closeout remains planned.

All four Gen2 profiles built successfully: `balcony02-gen2`, `bench-proto-gen2`, `balcony-installed-gen2`, and `balcony-sensor-scout-01`. Only Balcony02 was uploaded. Live validation used label `Balcony02`, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, firmware `phase8b-balcony02-proveout`, profile `balcony02-gen2`, and IP `10.0.0.69`.

The exact cleaned response is isolated to `balcony02-gen2`; existing non-Balcony02 capability behavior remains unchanged. Balcony02 `/capabilities` is a static configured-hardware and control-feature response whose installed values come from existing compile-time/profile flags. Its request path performs no sensor reads, GPIO reads, I2C scans, mux scans, detection probes, or provider conversions.

The live response contained exactly ten modules in this order:

1. `bme280_air`
2. `ds18b20_temperature`
3. `sen0308_m01`
4. `sen0308_m02`
5. `sen0308_m03`
6. `sen0308_m04`
7. `sen0562_l01`
8. `sen0562_l02`
9. `sen0562_l03`
10. `sen0204_wl01`

M04 was configured with `installed:false`. L01 remained `installed:true` independently of current live detection. WL01 was the only module with `control_role:"watering_interlock"`. Two live responses were identical after normalizing only `reported_at`, and the validator ended with `All /measurements and /capabilities contract assertions passed.`

The frozen `/measurements` contract remained unchanged and passed regression validation. `/status` remained unchanged and is deferred to Phase 8B.4. No frontend, SQL, Supabase, Cloudflare, pin, sensor, watering, cadence, threshold, duration, cooldown, relay, button, or interlock behavior changed.

## /status live-device, cloud, and hosted-diagnostics closeout — 2026-07-17

Phase 8B.4 is COMPLETE / LIVE DEVICE, CLOUD, AND HOSTED-DIAGNOSTICS VALIDATED. At this checkpoint, Phase 8B.5 had not yet begun; its later integrated hosted frontend closeout is recorded below.

Firmware `phase8b4-gen2-status-contract` built successfully in all seven environments: `esp32doit-devkit-v1`, `balcony-installed`, `balcony-installed-gen2`, `bench-prototype`, `bench-proto-gen2`, `balcony02-gen2`, and `balcony-sensor-scout-01`. The firmware version applies to all four Gen2 profiles (`balcony-installed-gen2`, `bench-proto-gen2`, `balcony02-gen2`, and `balcony-sensor-scout-01`); Gen1 behavior remains unchanged.

Primary validation used Balcony02, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, profile `balcony02-gen2`, IP `10.0.0.69`, on `COM5`. Prototype01, UUID `318fab98-89ad-4f36-9100-3134a04e0be5`, role `bench`, profile `bench-proto-gen2`, passed status-only validation. The validator added parse-only mode, `-StatusOnly`, expected identity/provenance parameters, exact property-order assertions, code/label consistency checks, null-semantics checks, nonnegative uptime checks, and recursive forbidden-field checks. Both the Balcony02 full validator and Prototype01 status-only validator ended with `All requested Gen2 endpoint contract assertions passed.`

The current Balcony02 boot detected the BME280, reported a DS18B20 device count of `1`, initialized SEN0204 WL01 on GPIO26 as `INPUT`, detected SEN0562-L01, SEN0562-L02, and SEN0562-L03, enabled the GPIO32 physical button as active-low with `50 ms` debounce and `15000 ms` maximum hold, connected Wi-Fi, and started the web server. The full `/measurements` validator separately confirmed working SEN0308 M01, M02, and M03 measurement records. L01 was repaired on 2026-07-17 by replacing its bad connector; the distribution board was not at fault. The Phase 8B.2 L01-missing observations above remain correct historical evidence.

The live response passed its exact top-level order and exact nested `network`, `cloud_reporting`, `watering`, and `system` order. Cold-boot evidence reported `last_http_status:null` with `last_http_status_label:"not_recorded"`, null measurement-success and status-success timestamp/uptime pairs, `currently_watering:false`, `active_trigger_source:null`, `last_watering_at:null`, and `last_watering_duration_seconds:null`. Network evidence showed connected status code `3`, one startup disconnect with reason code `2` / `auth_expire`, one IP acquisition, zero lightweight reconnect attempts, zero full-recovery attempts, and activity `ip_acquired`. This closeout does not claim a forced disconnected state, a nonzero reconnect, or a full-recovery test.

At local uptime `1709`, the response retained the last successful measurement post at `2026-07-17T23:07:39Z`, uptime `905`, separately from the last successful status post at `2026-07-17T23:07:41Z`, uptime `907`. The raw heartbeat at `2026-07-17 23:22:38.285407+00`, uptime `1802`, recorded the next measurement success at `2026-07-17T23:22:36Z`, uptime `1802`, while carrying the prior status success at `2026-07-17T23:07:41Z`, uptime `907`. HTTP result was `201` / `created`, consecutive failures were `0`, and error category was `none`. This proves measurement and status success evidence remain separate, watering does not become a measurement success, and a heartbeat does not self-claim a successful status post. No failed-cloud-post test is claimed.

WL01 reported value `1`, valid, `good`, and `read_ok`. Active physical-button watering reported `active_trigger_source:physical_button` and retained last-watering time and duration; idle status returned a null active trigger while preserving the last completed watering evidence. The six current-firmware/current-profile event rows were: start `2026-07-17T22:53:58+00:00` (`physical_button`, `physical_button_pressed`, null duration), completion `22:54:09` (`physical_button`, `physical_button_released`, `11` seconds), start `22:55:31` (`physical_button`, null duration), completion `22:55:39` (`physical_button`, `7` seconds), start `22:57:24` (`physical_button`, null duration), and completion `22:57:35` (`physical_button`, `11` seconds). All reported `Balcony02`, firmware `phase8b4-gen2-status-contract`, and profile `balcony02-gen2`.

The latest raw heartbeat carried current firmware/profile, uptime `1802`, reason `periodic`, RSSI `-47`, HTTP `201` / `created`, zero failures, error `none`, idle watering with a null trigger, last watering at `2026-07-17T22:57:24Z` for `11` seconds, free heap `232720`, minimum free heap `176876`, and `details:{}`. Hosted normalized diagnostics matched the raw heartbeat for the contract fields while excluding local IP and MAC. This is a data-contract validation; no new hosted browser review is claimed.

This firmware/runtime checkpoint made no further changes to the already-applied Phase 8B.4 SQL/frontend contract: the base columns, normalized output columns, hosted-view joins, filters, grants, RLS boundaries, and historical fallbacks remained unchanged during this checkpoint. It also changed no pin, sensor assignment, GPIO mode/polarity, I2C/mux topology, threshold, duration, cooldown, cadence, relay, button, reservoir interlock, local firmware watering ownership, or Gen1 endpoint contract. No automatic SEN0308 watering, Supabase command/control, hosted Water Now, or hosted IP/MAC exposure was introduced.

## Phase 8B.5 integrated hosted frontend closeout — 2026-07-18

Phase 8B.5 is FRONTEND VALIDATED / COMPLETE PENDING COMMIT AND PUSH. A shared presentation contract defines the four Garden Reading sections, eleven deterministic cards, five compatible chart families, physical-series identity, historical DS18B20 `temperature` compatibility, and the unchanged Relative Moisture Index formula. Hosted Device selection appears before the status and interpretation path, while Window selection remains associated with the trend chart.

`Garden Reading Quality` reports Reading Age, Sensor Availability, Reading History, and Latest Reading Checks independently. `MBG Diagnostics` independently reports Device Reporting, Wi-Fi Connection, and Hosted Reporting. Garden Reading cards use explicit evidence states rather than generic trust prose. M01, M02, and M03 each derive an independent, unclamped Relative Moisture Index; raw ADC remains supporting evidence. Reservoir presentation requires current usable exact `0` or `1` evidence.

The trend chart displays one compatible family at a time in exact Light, Moisture, Temperature, Humidity, and Pressure order, defaulting to Moisture. Compound chart identity keeps same-name physical sensors separate. Responsive layout was corrected across mobile, tablet, desktop, and wide desktop.

Frontend lint passed, the TypeScript/Vite production build passed, and both final `git diff --check` runs passed. Local public `/demo` returned HTTP `200`; hosted DOM checks found every required title, section, family, and Window label in frozen order and found no Water Now. Microsoft Edge screenshots were captured and independently visually reviewed at `360`, `460`, `820`, and `1280` pixels. The visible hosted layout passed at all four widths without page-level horizontal overflow or overlapping panels. The public demo had no usable Moisture series, so its factual empty state was reviewed rather than a populated chart frame; the closed status disclosures meant their internal grids were confirmed by source/CSS and build validation rather than visible screenshot content.

The original local validation attempt launched Vite in its default legacy mode. That was a validation-command configuration issue, not a source defect. The successful rerun used `VITE_MBG_DASHBOARD_MODE=hosted-readonly` only in the child Vite process. No `.env`, parent/system environment, source, or Vite configuration was changed.

No production deployment validation or customer/support credentialed browser validation occurred. No SQL, schema, Supabase, firmware, upload, device, watering-policy, or control-authority change occurred. No commit or push has occurred yet, and legacy local-dashboard retirement remains a separate unapproved future slice.

## Locked implementation boundaries

Do not change:

- hardware pins;
- installed sensors;
- installed sensor assignments;
- electrical values;
- I2C or provider channels;
- GPIO modes or polarity;
- watering thresholds;
- watering duration;
- cooldown behavior;
- control cadence;
- pump-interlock behavior;
- current variable names except coordinated external JSON contract names;
- unchanged code comments;
- local firmware ownership of watering;
- hosted read-only behavior.

Do not introduce automatic SEN0308 watering.

Do not use `device_role` as a control gate.

## Endpoint responsibility matrix

| Endpoint | Responsibility | Must not contain or perform |
| --- | --- | --- |
| `/measurements` | Sensor observations at one measurement time | Static wiring, pinout, inventory health claims, control authority, installed/uninstalled slots, prove-out notes, nested diagnostics |
| `/capabilities` | Static configured/installed/intended firmware manifest | Sensor reads, GPIO health reads, I2C scans, mux scans, live detection, provider conversions, prove-out health fields |
| `/status` | Current runtime operation and recovery evidence | Environmental measurements, configured inventory, static pinout, mux configuration, permanent watering authority, historical prove-out notes |

# `/measurements` contract

## Top-level envelope

The top-level envelope remains:

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "measured_at": "2026-07-15T21:45:00Z",
  "records": []
}
```

The envelope is the only authority for batch device identity and batch measurement time.

## Record shape

Every new measurement record uses this ordered logical shape:

```json
{
  "sensor_key": "...",
  "sensor_type": "...",
  "physical_sensor_id": "...",
  "measurement_name": "...",
  "measurement_value": 0,
  "measurement_unit": "...",
  "valid": true,
  "quality": "good",
  "reason": "read_ok"
}
```

`physical_sensor_id` is optional and is omitted entirely when no physical identity is defined.

Do not emit `physical_sensor_id:null`.

Remove from every new record:

```text
device_id
measured_at
details
control_eligible
```

Do not emit `details:{}`.

## Quality and reason

Allowed coarse `quality` values:

```text
good
diagnostic
missing
failed
```

`reason` is the most specific available cause.

Examples of specific provider reasons that must not be hidden under generic `read_failed` include:

```text
mux_not_detected
channel_select_failed
ads1115_not_detected_on_selected_channel
ads1115_conversion_read_failed
sensor_not_detected_on_selected_channel
bh1750_lux_read_failed
upstream_address_conflict
```

Use `read_failed` only when no more specific reason exists.

## Successful Balcony02 record order

The successful response contains exactly 11 records in this order:

1. BME280 `air_temperature`
2. BME280 `relative_humidity`
3. BME280 `barometric_pressure`
4. DS18B20 `soil temp`
5. SEN0308 M01 `raw_adc`
6. SEN0308 M02 `raw_adc`
7. SEN0308 M03 `raw_adc`
8. SEN0562 L01 `ambient_light`
9. SEN0562 L02 `ambient_light`
10. SEN0562 L03 `ambient_light`
11. SEN0204 WL01 `reservoir_liquid_detected`

SEN0308 M04 is not emitted as a measurement.

## BME280 records

BME280 emits three records with:

```text
sensor_key: bme280_air
sensor_type: BME280
```

The records are:

```text
air_temperature / F
relative_humidity / %
barometric_pressure / hPa
```

BME280 records omit `physical_sensor_id`.

## DS18B20 record

The stable identity remains:

```text
sensor_key: ds18b20_temperature
sensor_type: DS18B20
```

The external measurement name changes:

```text
temperature -> soil temp
```

The unit remains:

```text
F
```

DS18B20 records omit `physical_sensor_id`.

Hosted consumers must recognize both:

- canonical new `soil temp`;
- historical legacy `temperature` for DS18B20 rows.

New firmware emits only `soil temp`.

## SEN0308 records

Only installed M01, M02, and M03 are emitted.

Each record includes the matching physical identity:

```text
sen0308_m01 -> SEN0308-M01
sen0308_m02 -> SEN0308-M02
sen0308_m03 -> SEN0308-M03
```

All retain:

```text
sensor_type: sen0308
measurement_name: raw_adc
measurement_unit: count
```

M04 remains configured expansion inventory in `/capabilities` only.

## SEN0562 records

All three installed light modules are emitted:

```text
sen0562_l01 -> SEN0562-L01
sen0562_l02 -> SEN0562-L02
sen0562_l03 -> SEN0562-L03
```

All retain:

```text
sensor_type: sen0562
measurement_name: ambient_light
measurement_unit: lux
```

Runtime records do not contain voltage, vendor-supply, controlled-test, bench-proof, or wiring notes.

## SEN0204 record

The record uses:

```text
sensor_key: sen0204_wl01
sensor_type: sen0204
physical_sensor_id: WL01
measurement_name: reservoir_liquid_detected
measurement_unit: state
```

Numeric state remains:

```text
1 = liquid detected
0 = liquid not detected
```

Do not change GPIO26, input mode, polarity, or pump-interlock behavior.

## Successful example

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "measured_at": "2026-07-15T21:45:00Z",
  "records": [
    {
      "sensor_key": "bme280_air",
      "sensor_type": "BME280",
      "measurement_name": "air_temperature",
      "measurement_value": 77.86,
      "measurement_unit": "F",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "bme280_air",
      "sensor_type": "BME280",
      "measurement_name": "relative_humidity",
      "measurement_value": 58.21,
      "measurement_unit": "%",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "bme280_air",
      "sensor_type": "BME280",
      "measurement_name": "barometric_pressure",
      "measurement_value": 1014.32,
      "measurement_unit": "hPa",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "ds18b20_temperature",
      "sensor_type": "DS18B20",
      "measurement_name": "soil temp",
      "measurement_value": 74.75,
      "measurement_unit": "F",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0308_m01",
      "sensor_type": "sen0308",
      "physical_sensor_id": "SEN0308-M01",
      "measurement_name": "raw_adc",
      "measurement_value": 12480,
      "measurement_unit": "count",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0308_m02",
      "sensor_type": "sen0308",
      "physical_sensor_id": "SEN0308-M02",
      "measurement_name": "raw_adc",
      "measurement_value": 12610,
      "measurement_unit": "count",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0308_m03",
      "sensor_type": "sen0308",
      "physical_sensor_id": "SEN0308-M03",
      "measurement_name": "raw_adc",
      "measurement_value": 12542,
      "measurement_unit": "count",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0562_l01",
      "sensor_type": "sen0562",
      "physical_sensor_id": "SEN0562-L01",
      "measurement_name": "ambient_light",
      "measurement_value": 18432.5,
      "measurement_unit": "lux",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0562_l02",
      "sensor_type": "sen0562",
      "physical_sensor_id": "SEN0562-L02",
      "measurement_name": "ambient_light",
      "measurement_value": 17650.83,
      "measurement_unit": "lux",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0562_l03",
      "sensor_type": "sen0562",
      "physical_sensor_id": "SEN0562-L03",
      "measurement_name": "ambient_light",
      "measurement_value": 19005.0,
      "measurement_unit": "lux",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0204_wl01",
      "sensor_type": "sen0204",
      "physical_sensor_id": "WL01",
      "measurement_name": "reservoir_liquid_detected",
      "measurement_value": 1,
      "measurement_unit": "state",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    }
  ]
}
```

# Measurement batch and Supabase contract

The firmware POST to `sensor_measurement_batches` keeps batch-level fields:

```text
device_id
measured_at
device_role
firmware_version
build_profile
schema_version
record_count
records
source_endpoint
batch_details
```

The raw batch stores the exact cleaned `records[]` array.

`public.sensor_measurements_flat` restores these values to every derived row:

```text
device_id <- batch.device_id
measured_at <- batch.measured_at
```

The flat view also extracts optional `physical_sensor_id` from each record.

Historical rows are not rewritten. Older records may retain legacy fields and the legacy DS18B20 name.

# `/capabilities` contract

## Top-level shape

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "reported_at": "2026-07-15T21:45:00Z",
  "can_water": true,
  "control_authority": "local_firmware",
  "pinout": {
    "pump_relay": 25,
    "physical_button": 32,
    "reservoir_level": 26,
    "soil_temperature": 27,
    "i2c_sda": 21,
    "i2c_scl": 22
  },
  "control_configuration": {
    "pump_relay_active_state": "HIGH",
    "physical_button_active_state": "LOW",
    "reservoir_liquid_detected_state": "HIGH"
  },
  "i2c": {
    "mux_address": "0x70",
    "ads1115_address": "0x48",
    "ads1115_mux_channel": 0
  },
  "modules": []
}
```

`can_water` externally collapses the existing separate internal compile-time gates. The internal gates remain separate.

## Module field rules

Use these fields where applicable:

```text
sensor_key
sensor_type
installed
physical_sensor_id
connection
control_role
```

Omit fields that do not apply rather than emitting diagnostic nulls.

Do not emit:

```text
enabled
present
quality
reason
control_eligible
details
```

## Balcony02 modules

```json
[
  {
    "sensor_key": "bme280_air",
    "sensor_type": "BME280",
    "installed": true,
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 4,
      "address": "0x76"
    }
  },
  {
    "sensor_key": "ds18b20_temperature",
    "sensor_type": "DS18B20",
    "installed": true,
    "connection": {
      "bus": "onewire"
    }
  },
  {
    "sensor_key": "sen0308_m01",
    "sensor_type": "SEN0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M01",
    "connection": {
      "provider": "ads1115",
      "channel": "A0"
    }
  },
  {
    "sensor_key": "sen0308_m02",
    "sensor_type": "SEN0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M02",
    "connection": {
      "provider": "ads1115",
      "channel": "A1"
    }
  },
  {
    "sensor_key": "sen0308_m03",
    "sensor_type": "SEN0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M03",
    "connection": {
      "provider": "ads1115",
      "channel": "A2"
    }
  },
  {
    "sensor_key": "sen0308_m04",
    "sensor_type": "SEN0308",
    "installed": false,
    "physical_sensor_id": "SEN0308-M04",
    "connection": {
      "provider": "ads1115",
      "channel": "A3"
    }
  },
  {
    "sensor_key": "sen0562_l01",
    "sensor_type": "SEN0562",
    "installed": true,
    "physical_sensor_id": "SEN0562-L01",
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 1,
      "address": "0x23"
    }
  },
  {
    "sensor_key": "sen0562_l02",
    "sensor_type": "SEN0562",
    "installed": true,
    "physical_sensor_id": "SEN0562-L02",
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 2,
      "address": "0x23"
    }
  },
  {
    "sensor_key": "sen0562_l03",
    "sensor_type": "SEN0562",
    "installed": true,
    "physical_sensor_id": "SEN0562-L03",
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 3,
      "address": "0x23"
    }
  },
  {
    "sensor_key": "sen0204_wl01",
    "sensor_type": "SEN0204",
    "installed": true,
    "physical_sensor_id": "WL01",
    "connection": {
      "gpio": 26
    },
    "control_role": "watering_interlock"
  }
]
```

## Removed top-level capability fields

Remove:

```text
gen2_enabled
pump_control_available
device_can_water
watering_simulation_available
local_http_watering_endpoint_available
relay_test_output_pin
supabase_command_control
i2c.enabled
i2c_scan
live mux-detection and scan fields
```

## Static-manifest proof requirement

A request to `/capabilities` must not call any function that performs:

```text
Wire.beginTransmission for scan/detection purposes
analogRead
digitalRead for live capability proof
DS18B20 conversion/read
BME280 read/detection retry
ADS1115 conversion
BH1750 conversion
mux channel scan
full address scan
```

Normal string construction and reading compile-time/profile constants are allowed.

# `/status` contract

## Top-level shape

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "reported_at": "2026-07-15T21:45:00Z",
  "uptime_seconds": 0,
  "network": {},
  "cloud_reporting": {},
  "watering": {},
  "system": {}
}
```

## Network object

```json
{
  "wifi_connected": true,
  "wifi_rssi": -57,
  "wifi_status_code": 3,
  "wifi_status_label": "connected",
  "ip_address": "192.168.1.84",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "last_wifi_disconnect_reason": null,
  "last_wifi_disconnect_reason_label": "not_recorded",
  "wifi_reconnect_attempts_since_boot": 0,
  "wifi_full_recovery_attempts_since_boot": 0,
  "wifi_disconnects_since_boot": 0,
  "wifi_ip_acquisitions_since_boot": 1,
  "last_wifi_disconnect_uptime_seconds": null,
  "last_wifi_ip_acquired_uptime_seconds": 4,
  "last_wifi_activity": "ip_acquired"
}
```

Use Arduino/ESP-IDF constants for code-to-label mappings.

Safe label fallbacks:

```text
unknown
not_recorded
```

Do not infer a disconnect reason from current connection state.

Allowed normalized `last_wifi_activity` values:

```text
none
connected
ip_acquired
disconnected
disconnect_detected
reconnect_requested
full_recovery_started
```

Null behavior:

- `wifi_rssi` is null when unavailable/disconnected;
- `ip_address` is null when no valid local address is held;
- disconnect reason and uptime are null before a disconnect is recorded;
- IP-acquired uptime is null before an IP acquisition is recorded.

Remove duplicate `last_wifi_status_code`.

## Cloud-reporting object

```json
{
  "last_http_status": 201,
  "last_http_status_label": "created",
  "consecutive_failures": 0,
  "last_error_category": "none",
  "last_successful_measurement_post_at": "2026-07-15T21:45:00Z",
  "last_successful_measurement_post_uptime_seconds": 0,
  "last_successful_status_post_at": "2026-07-15T21:45:00Z",
  "last_successful_status_post_uptime_seconds": 0
}
```

Terminology changes:

```text
telemetry -> measurement
diagnostics -> status
Supabase-specific external field names -> cloud-reporting names
```

Never-recorded behavior:

```text
last_http_status: null
last_http_status_label: not_recorded
success timestamps: null
success uptime values: null
```

## Watering object

```json
{
  "currently_watering": false,
  "active_trigger_source": null,
  "last_watering_at": null,
  "last_watering_duration_seconds": null
}
```

Allowed active trigger values:

```text
physical_button
automatic
manual_local
firmware_safety
```

`active_trigger_source` is null while idle.

`last_watering_at` represents the most recent watering start time.

`last_watering_duration_seconds` remains null until a completed watering duration exists.

Remove static capability duplication:

```text
pump_control_available
device_can_water
```

Do not change watering behavior.

## System object

```json
{
  "free_heap_bytes": 0,
  "minimum_free_heap_bytes": 0
}
```

Remove:

```text
hasLastGoodDht
free_heap
min_free_heap
```

The internal DHT cache may remain where still required by legacy profiles, but it is not part of generic `/status`.

# Cloud heartbeat alignment

The heartbeat is the flattened cloud representation of the same runtime semantics.

The heartbeat must align with local status names and meanings for:

```text
uptime
Wi-Fi connection/status/recovery
cloud reporting
watering runtime state
heap state
```

Local-only fields that must not be exposed through hosted-safe diagnostics:

```text
ip_address
mac_address
SSID
raw heartbeat details
command/control endpoints
```

The hosted dashboard remains read-only.

# Historical compatibility

## Measurements

Historical Supabase rows may contain:

```text
record-level device_id
record-level measured_at
control_eligible
details
DS18B20 measurement_name: temperature
```

Those rows remain valid evidence.

The frontend must display both legacy DS18B20 `temperature` and canonical new `soil temp` as soil temperature.

No historical batch rewrite is part of this phase.

## Heartbeats

Historical heartbeat rows may retain old column names and details keys.

The migration should be additive and hosted views may use compatibility `coalesce(...)` expressions where old and new meanings are genuinely equivalent.

New firmware writes the new active field names only after the database accepts them.

# Required implementation slices

## Slice 1 — contract freeze

- create ADR 0022;
- create this implementation contract;
- update architecture, ADR index, and active digest;
- no firmware, SQL, or frontend edits.

## Slice 2 — measurements and ingestion

- preserve the working firmware sketch as the required plain-text `.bak`;
- clean all Gen2 record serializers;
- omit M04 measurements;
- preserve specific provider reasons;
- add `physical_sensor_id` flattening;
- update DS18B20 hosted/local consumers;
- build all relevant profiles;
- validate local and hosted measurement behavior.

## Slice 3 — static capabilities

- replace live capability probing with static profile manifests;
- update local capability types/display;
- prove no scans or reads occur;
- validate generic manifests for other profiles.

## Slice 4 — status, heartbeat, SQL, and hosted diagnostics

- add database fields/views first;
- implement nested local `/status`;
- align flattened heartbeat payload;
- update hosted API types and diagnostics display;
- validate connected, disconnected, success, failure, idle, active, and never-recorded states.

## Slice 5 — watering regression and closeout

- prove unchanged relay, button, reservoir, OneWire, and I2C pins;
- prove physical-button watering;
- prove reservoir block and cutoff;
- prove no automatic SEN0308 watering;
- prove offline local watering and best-effort cloud behavior;
- update operational and schema documentation after evidence exists.

# Validation checklist

## Measurements

- [x] Exactly 11 Balcony02 records, including explicit L01 missing evidence.
- [x] Record order matches the frozen order.
- [x] No M04 measurement.
- [x] No `details`.
- [x] No `control_eligible`.
- [x] No record-level `device_id`.
- [x] No record-level `measured_at`.
- [x] Correct physical sensor IDs.
- [x] BME280 and DS18B20 omit `physical_sensor_id`.
- [x] DS18B20 uses `soil temp`.
- [x] SEN0204 uses `reservoir_liquid_detected`.
- [x] Reservoir values remain 0/1 with unchanged meaning.
- [x] Specific provider failures appear directly in `reason`.
- [x] Flattened rows retain batch device ID and time.
- [x] Hosted Support View works and the local `/measurements` endpoint validates.
- [x] Historical DS18B20 `temperature` rows display correctly.

## Capabilities

- [x] No sensor reads.
- [x] No GPIO health read.
- [x] No I2C scan.
- [x] No mux detection scan.
- [x] Correct pins.
- [x] Correct channels and addresses.
- [x] M04 is configured but uninstalled.
- [x] Only SEN0204 declares `watering_interlock`.
- [x] No old diagnostic/prove-out fields.
- [x] Other profiles produce valid generic manifests.

## Status and heartbeat

- [x] Connected state.
- [ ] Disconnected state.
- [x] Readable Wi-Fi status labels.
- [x] Readable disconnect labels.
- [x] Never-recorded null behavior.
- [ ] Lightweight reconnect counting.
- [ ] Full recovery counting.
- [x] IP acquisition counting.
- [x] Successful cloud post.
- [ ] Failed cloud post.
- [x] Idle watering state.
- [x] Active watering state.
- [x] Correct active trigger.
- [x] Last watering time and duration evidence.
- [x] Heap evidence.
- [x] Local status and hosted heartbeat alignment.
- [x] Local IP/MAC are not exposed through hosted-safe views.

Deferred: controlled disconnected state, nonzero lightweight reconnect counting, full recovery, and failed cloud-post evidence.

## Watering regression

- [x] Relay remains GPIO25.
- [x] Physical button remains GPIO32.
- [x] Reservoir input remains GPIO26.
- [x] DS18B20 remains GPIO27.
- [x] I2C SDA/SCL remain GPIO21/GPIO22.
- [x] Physical-button watering still works.
- [ ] Reservoir absence still blocks watering.
- [ ] Reservoir loss still stops watering.
- [x] No automatic SEN0308 watering is introduced.
- [ ] Wi-Fi loss does not block local watering.
- [ ] Cloud failures remain best-effort.

Deferred: reservoir-absence blocking, reservoir-loss cutoff, Wi-Fi-loss watering, and cloud-failure watering regression evidence.

# Review and commit discipline

After each implementation slice:

1. show exact changed files;
2. run and show `git diff --check`;
3. show relevant build/test results;
4. show endpoint samples;
5. show `git status`;
6. do not commit until Jeremy approves the slice;
7. do not push until Jeremy explicitly approves the commit and push.
