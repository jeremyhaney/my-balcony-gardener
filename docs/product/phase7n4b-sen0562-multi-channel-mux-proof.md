# Phase 7N.4B - SEN0562 Multi-Channel Mux Proof

## Status

Runtime validated / complete pending review and commit.

Phase 7N.4B extends the bench-only SEN0562 proof from one fixed-address light sensor to three fixed-address DFRobot SEN0562 IP68 I2C ambient light sensors behind MUX01 on Prototype01.

Phase 7N.4B proved three DFRobot SEN0562 fixed-address light sensors can coexist behind MUX01 on Prototype01 at 3.3V when isolated on channels 1, 2, and 3. The proof preserved ADS1115/SEN0308 on channel 0, GPIO34 legacy/reference moisture, BME280, DS18B20, and VEML6030-out-of-scope behavior. The proof remains diagnostic-only and does not claim vendor-supported 3.3V operation, calibration, PAR conversion, sun scoring, plant recommendations, final balcony placement labels, field readiness, or watering authority.

This remains a controlled 3.3V bench proof. Phase 7N.4A proved one DFRobot SEN0562-L01 can operate at 3.3V on Jeremy's Prototype01 bench when wired behind MUX01 channel 1. This phase preserves that caution and does not claim vendor-supported 3.3V operation.

## Target Topology

```text
MUX01 channel 0 -> ADS1115 / SEN0308-M01-M04
MUX01 channel 1 -> SEN0562-L01
MUX01 channel 2 -> SEN0562-L02
MUX01 channel 3 -> SEN0562-L03
MUX01 channel 4 -> reserved for future SEN0562-L04 if later approved
Upstream/direct -> MUX01 at 0x70 and BME280 at 0x76
GPIO34 remains separate
GPIO27 DS18B20 remains separate
VEML6030 remains disconnected/out of proof path
```

No SEN0562 is configured on MUX01 channel 0. ADS1115 remains on MUX01 channel 0.

## Firmware Shape

`gen2_sen0562` now uses a fixed three-sensor configuration array:

```text
SEN0562-L01 -> sensor_key sen0562_l01 -> mux_channel 1
SEN0562-L02 -> sensor_key sen0562_l02 -> mux_channel 2
SEN0562-L03 -> sensor_key sen0562_l03 -> mux_channel 3
```

`SEN0562-L04` is reserved and not configured.

The implementation keeps `gen2_bh1750` as the low-level BH1750 provider and does not add an external BH1750 library, runtime config files, or dynamic discovery.

## Record Behavior

Each configured SEN0562 emits one measurement record.

Valid records use:

```text
sensor_type: sen0562
measurement_name: ambient_light
measurement_unit: lux
valid: true
quality: diagnostic
reason: read_ok
control_eligible: false
```

Each details object preserves physical identity, mux address/channel, sensor address, runtime mux/read evidence, and the 3.3V-only proof boundary.

Missing optional sensors emit non-breaking evidence:

```text
measurement_value: null
valid: false
quality: missing
reason: not_detected
control_eligible: false
details.read_failure_detail: sensor_not_detected_on_selected_channel
```

A missing L02 or L03 must not prevent other configured SEN0562 sensors from being read.

## Runtime Validation

Runtime validation is complete.

Pre-upload build validation passed:

```text
pio run -e bench-proto-gen2
```

The first upload to Prototype01 on COM5 failed with serial transport error:

```text
Serial data stream stopped
```

COM5 was confirmed still present. The single approved retry succeeded and hard-reset Prototype01. Only Prototype01 / `bench-proto-gen2` was uploaded. No Balcony01 or Scout01 upload occurred.

### Disconnected / Missing Optional Sensor Proof

Before L02/L03 were wired, `/status`, `/capabilities`, and `/measurements` responded.

`SEN0562-L01` was wired and valid:

```text
sensor_key: sen0562_l01
measurement_value: 144.17 lux
mux_channel: 1
```

`SEN0562-L02` and `SEN0562-L03` were configured but not wired yet and emitted non-breaking missing evidence:

```text
SEN0562-L02:
  mux_channel: 2
  quality: missing
  reason: not_detected
  read_failure_detail: sensor_not_detected_on_selected_channel

SEN0562-L03:
  mux_channel: 3
  quality: missing
  reason: not_detected
  read_failure_detail: sensor_not_detected_on_selected_channel
```

Jeremy then confirmed:

```text
They are wired and you are approved to continue.
```

### Wired Three-SEN0562 Proof

After L02/L03 wiring and restored power, all three SEN0562 sensors validated behind MUX01:

```text
SEN0562-L01:
  sensor_key: sen0562_l01
  measurement_value: 162.50 lux
  physical_sensor_id: SEN0562-L01
  mux_channel: 1

SEN0562-L02:
  sensor_key: sen0562_l02
  measurement_value: 16.67 lux
  physical_sensor_id: SEN0562-L02
  mux_channel: 2

SEN0562-L03:
  sensor_key: sen0562_l03
  measurement_value: 135.00 lux
  physical_sensor_id: SEN0562-L03
  mux_channel: 3
```

Each SEN0562 record had:

```text
sensor_type: sen0562
measurement_name: ambient_light
measurement_unit: lux
valid: true
quality: diagnostic
reason: read_ok
control_eligible: false
sensor_address: 0x23
electrical_boundary: 3.3V_only
no_5v: true
mux_detected: true
selected_channel_expected_address_present: true
upstream_expected_address_present: false
```

### Cover / Uncover Proof

One-at-a-time cover/uncover validation passed:

```text
Baseline:
  L01: 142.50 lux
  L02: 15.00 lux
  L03: 130.00 lux

Cover L01:
  L01: 0.00 lux
  L02: 15.00 lux
  L03: 115.83 lux

Uncover L01:
  L01: 156.67 lux

Cover L02:
  L02: 0.00 lux
  L01: 158.33 lux
  L03: 133.33 lux

Uncover L02:
  L02: 60.83 lux

Cover L03:
  L03: 0.00 lux
  L01: 160.00 lux
  L02: 59.17 lux

Uncover L03:
  L03: 189.17 lux
  L01: 163.33 lux
  L02: 59.17 lux
```

This is functional diagnostic evidence only. It is not a calibration claim, PAR claim, sun exposure scoring claim, plant recommendation, final balcony location claim, field readiness claim, long-cable claim, or watering-control claim.

### Existing Record Preservation

During runtime validation:

- SEN0308-M01/M02/M03/M04 stayed valid through ADS1115 on MUX01 channel 0.
- GPIO34 `moisture_index` and `raw_adc` stayed present and separate.
- BME280 `air_temperature`, `relative_humidity`, and `barometric_pressure` stayed valid.
- DS18B20 `temperature` stayed valid.
- VEML6030 stayed missing / `not_detected` and out of the proof path.
- Final `/status` showed `currently_watering:false`.

## Build Validation

Build validation passed before runtime validation:

```text
pio run -e bench-proto-gen2
pio run -e balcony-installed-gen2
pio run -e balcony-sensor-scout-01
git diff --check
git status --short --branch
```

## Non-Changes

Phase 7N.4B does not change SQL, RLS, Supabase schema snapshot, frontend/hosted behavior, deploy path, field-unit firmware, watering behavior, relay behavior, `/water-now`, device IDs, pins, moisture mapping, cadence constants, `control_eligible`, VEML6030 mux routing, light calibration, PAR conversion, sun exposure scoring, plant recommendations, final balcony placement labels, field installation assumptions, long-cable claims, or 5V behavior.
