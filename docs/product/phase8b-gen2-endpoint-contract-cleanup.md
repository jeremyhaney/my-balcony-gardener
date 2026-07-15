# Phase 8B Gen2 Endpoint Contract Cleanup

- Status: Approved contract freeze
- Date: 2026-07-15
- Device profile under primary validation: `balcony02-gen2`
- Device label: `Balcony02`
- Device UUID: `7e5bd328-ad68-4389-a71a-fa5cd01b3813`
- Firmware version: `phase8b-balcony02-proveout`
- Governing ADR: [`0022-gen2-endpoint-responsibility-and-contract-cleanup.md`](../adr/0022-gen2-endpoint-responsibility-and-contract-cleanup.md)

## Purpose

This document freezes the approved external contracts and coordinated cloud/frontend semantics for the Gen2 endpoint cleanup before implementation begins.

It is the implementation specification for this phase. It does not authorize unrelated refactoring, pin changes, sensor changes, timing changes, watering changes, or control-policy changes.

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
  "firmware_version": "phase8b-balcony02-proveout",
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
  "firmware_version": "phase8b-balcony02-proveout",
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
  "firmware_version": "phase8b-balcony02-proveout",
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
    "sensor_type": "sen0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M01",
    "connection": {
      "provider": "ads1115",
      "provider_channel": "A0"
    }
  },
  {
    "sensor_key": "sen0308_m02",
    "sensor_type": "sen0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M02",
    "connection": {
      "provider": "ads1115",
      "provider_channel": "A1"
    }
  },
  {
    "sensor_key": "sen0308_m03",
    "sensor_type": "sen0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M03",
    "connection": {
      "provider": "ads1115",
      "provider_channel": "A2"
    }
  },
  {
    "sensor_key": "sen0308_m04",
    "sensor_type": "sen0308",
    "installed": false,
    "physical_sensor_id": "SEN0308-M04",
    "connection": {
      "provider": "ads1115",
      "provider_channel": "A3"
    }
  },
  {
    "sensor_key": "sen0562_l01",
    "sensor_type": "sen0562",
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
    "sensor_type": "sen0562",
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
    "sensor_type": "sen0562",
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
    "sensor_type": "sen0204",
    "installed": true,
    "physical_sensor_id": "WL01",
    "connection": {
      "bus": "gpio",
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
  "firmware_version": "phase8b-balcony02-proveout",
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

- [ ] Exactly 11 successful Balcony02 records.
- [ ] Record order matches the frozen order.
- [ ] No M04 measurement.
- [ ] No `details`.
- [ ] No `control_eligible`.
- [ ] No record-level `device_id`.
- [ ] No record-level `measured_at`.
- [ ] Correct physical sensor IDs.
- [ ] BME280 and DS18B20 omit `physical_sensor_id`.
- [ ] DS18B20 uses `soil temp`.
- [ ] SEN0204 uses `reservoir_liquid_detected`.
- [ ] Reservoir values remain 0/1 with unchanged meaning.
- [ ] Specific provider failures appear directly in `reason`.
- [ ] Flattened rows retain batch device ID and time.
- [ ] Hosted and local displays still work.
- [ ] Historical DS18B20 `temperature` rows still display correctly.

## Capabilities

- [ ] No sensor reads.
- [ ] No GPIO health read.
- [ ] No I2C scan.
- [ ] No mux detection scan.
- [ ] Correct pins.
- [ ] Correct channels and addresses.
- [ ] M04 is configured but uninstalled.
- [ ] Only SEN0204 declares `watering_interlock`.
- [ ] No old diagnostic/prove-out fields.
- [ ] Other profiles produce valid generic manifests.

## Status and heartbeat

- [ ] Connected state.
- [ ] Disconnected state.
- [ ] Readable Wi-Fi status labels.
- [ ] Readable disconnect labels.
- [ ] Never-recorded null behavior.
- [ ] Lightweight reconnect counting.
- [ ] Full recovery counting.
- [ ] IP acquisition counting.
- [ ] Successful cloud post.
- [ ] Failed cloud post.
- [ ] Idle watering state.
- [ ] Active watering state.
- [ ] Correct active trigger.
- [ ] Last watering time and duration evidence.
- [ ] Heap evidence.
- [ ] Local status and hosted heartbeat alignment.
- [ ] Local IP/MAC are not exposed through hosted-safe views.

## Watering regression

- [ ] Relay remains GPIO25.
- [ ] Physical button remains GPIO32.
- [ ] Reservoir input remains GPIO26.
- [ ] DS18B20 remains GPIO27.
- [ ] I2C SDA/SCL remain GPIO21/GPIO22.
- [ ] Physical-button watering still works.
- [ ] Reservoir absence still blocks watering.
- [ ] Reservoir loss still stops watering.
- [ ] No automatic SEN0308 watering is introduced.
- [ ] Wi-Fi loss does not block local watering.
- [ ] Cloud failures remain best-effort.

# Review and commit discipline

After each implementation slice:

1. show exact changed files;
2. run and show `git diff --check`;
3. show relevant build/test results;
4. show endpoint samples;
5. show `git status`;
6. do not commit until Jeremy approves the slice;
7. do not push until Jeremy explicitly approves the commit and push.
