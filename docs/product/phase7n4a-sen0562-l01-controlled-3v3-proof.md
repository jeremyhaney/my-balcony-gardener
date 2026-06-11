# Phase 7N.4A - SEN0562-L01 Controlled 3.3V Proof

## Status

Runtime validated / complete pending review and commit.

Phase 7N.4A adds bench-only firmware support for one DFRobot SEN0562 IP68 I2C ambient light sensor on Prototype01 behind MUX01 channel 1.

This is a controlled 3.3V bench proof. DFRobot documents the finished SEN0562 module supply as 5V, but Jeremy approved testing whether the actual SEN0562-L01 module can function at 3.3V only. This phase does not claim vendor-supported 3.3V operation.

Phase 7N.4A proved one DFRobot SEN0562-L01 can operate at 3.3V on Prototype01 when wired behind MUX01 channel 1. The proof remains diagnostic-only and does not claim vendor-supported 3.3V operation, calibration, PAR conversion, sunlight scoring, plant recommendations, or watering control authority.

A later `not_detected` episode was traced to hardware wiring and connection faults, including a bad SCL crimp and a temporary reversed-polarity rewiring mistake. After correcting the wiring and polarity, SEN0562-L01 returned to valid `read_ok` operation at 3.3V.

## Scope

Approved implementation scope:

- Add `gen2_bh1750` as the low-level BH1750 I2C provider.
- Add `gen2_sen0562` as the physical SEN0562 sensor-family module.
- Enable SEN0562 only in the `bench-proto-gen2` build profile.
- Target `SEN0562-L01` behind MUX01 channel 1 at expected address `0x23`.
- Preserve ADS1115 on MUX01 channel 0.
- Preserve SEN0308-M01/M02/M03/M04 records from ADS1115 A0/A1/A2/A3.
- Preserve GPIO34 `moisture_index` and `raw_adc` as separate legacy/reference evidence.
- Preserve BME280 and DS18B20 records.
- Keep VEML6030 disconnected and out of the proof path.

Out of scope:

- 5V wiring or fallback.
- Light calibration, PAR conversion, sun exposure scoring, plant recommendations, or alerting.
- Watering behavior or `control_eligible:true`.
- SEN0308 calibration or GPIO34 replacement.
- VEML6030 mux routing.
- SQL, deploy, field-unit upload, commit, or push.

## Target Topology

```text
ESP32 GPIO21/GPIO22 upstream I2C
MUX01 at 0x70
MUX01 channel 0 -> ADS1115 at 0x48 -> SEN0308-M01/M02/M03/M04 on A0/A1/A2/A3
MUX01 channel 1 -> SEN0562-L01 at expected address 0x23
BME280 remains upstream/direct at 0x76
DS18B20 remains on GPIO27
GPIO34 analog moisture remains separate
VEML6030 remains intentionally disconnected
```

## Firmware Shape

`gen2_bh1750` is the low-level provider. It:

- Selects the configured mux channel.
- Checks that the expected sensor address is not already visible upstream.
- Verifies the sensor address on the selected mux channel.
- Uses a minimal BH1750 one-time high-resolution read.
- Converts raw light count to lux with `raw / 1.2`.
- Disables all mux channels after the read.

`gen2_sen0562` owns physical sensor identity and record shape. It emits one configured sensor:

```text
sensor_key: sen0562_l01
sensor_type: sen0562
physical_sensor_id: SEN0562-L01
measurement_name: ambient_light
measurement_unit: lux
control_eligible: false
```

Valid SEN0562 readings use:

```text
quality: diagnostic
reason: read_ok
```

Missing or disconnected SEN0562-L01 emits non-breaking evidence:

```text
present: false
measurement_value: null
valid: false
quality: missing
reason: not_detected
```

## Diagnostic Details

SEN0562 records include:

```json
{
  "physical_sensor_id": "SEN0562-L01",
  "digital_provider": "bh1750",
  "bus": "i2c",
  "mux_address": "0x70",
  "mux_channel": 1,
  "sensor_address": "0x23",
  "electrical_boundary": "3.3V_only",
  "no_5v": true,
  "module_supply_documented_by_vendor": "5V",
  "bench_proof_supply": "3.3V",
  "voltage_note": "controlled_3v3_functional_test"
}
```

The capability `present` value reflects the runtime read result. It is not hard-coded.

## Runtime Validation

Runtime validation is complete.

Pre-upload build validation passed:

```text
pio run -e bench-proto-gen2
```

The first upload attempt to Prototype01 on COM5 failed mid-flash with `Serial data stream stopped`. The second upload to Prototype01 on COM5 succeeded and hard-reset the ESP32.

Only Prototype01 / `bench-proto-gen2` was uploaded. No Balcony01 or Scout01 upload occurred.

### Disconnected Sensor Check

With SEN0562-L01 disconnected, `/status`, `/capabilities`, and `/measurements` responded. SEN0562-L01 appeared as configured optional hardware and emitted non-breaking missing evidence:

```text
sensor_key: sen0562_l01
sensor_type: sen0562
measurement_name: ambient_light
measurement_value: null
valid: false
quality: missing
reason: not_detected
control_eligible: false
```

Existing SEN0308, GPIO34, BME280, and DS18B20 records stayed present. `/status` reported `currently_watering:false`.

### Initial Wired Guardrail

The first wired attempt accidentally landed SEN0562-L01 on the upstream breadboard SDA/SCL path instead of the mux channel pins.

Firmware correctly refused to treat this as a MUX01 channel 1 proof and reported:

```text
quality: failed
reason: read_failed
read_failure_detail: upstream_address_conflict
```

The upstream I2C scan showed `0x23`. This was a guardrail success and prevented a false mux-channel proof.

### Corrected Wiring

Jeremy corrected the wiring:

```text
SEN0562 green -> MUX01 channel 1 SDA / SD1
SEN0562 yellow -> MUX01 channel 1 SCL / SC1
SEN0562 red -> 3.3V only
SEN0562 blue -> GND
No 5V used
```

### Successful Wired Proof

After corrected wiring, `/measurements` at `2026-06-10T23:27:38Z` included:

```text
sensor_key: sen0562_l01
sensor_type: sen0562
measurement_name: ambient_light
measurement_value: 78.33
measurement_unit: lux
valid: true
quality: diagnostic
reason: read_ok
control_eligible: false
mux_address: 0x70
mux_channel: 1
sensor_address: 0x23
electrical_boundary: 3.3V_only
no_5v: true
module_supply_documented_by_vendor: 5V
bench_proof_supply: 3.3V
voltage_note: controlled_3v3_functional_test
mux_detected: true
disable_before_read_ok: true
channel_select_ok: true
post_read_all_channels_disabled: true
upstream_expected_address_present: false
selected_channel_expected_address_present: true
```

### Cover / Uncover Check

Cover/uncover behavior moved in the expected direction:

```text
Covered at 2026-06-10T23:30:01Z:
  SEN0562-L01 ambient_light: 0.00 lux
  valid: true
  quality: diagnostic
  reason: read_ok

Uncovered at 2026-06-10T23:30:28Z:
  SEN0562-L01 ambient_light: 50.00 lux
  valid: true
  quality: diagnostic
  reason: read_ok
```

This is functional diagnostic evidence only. It is not a calibration claim, PAR claim, sunlight/exposure score, plant recommendation, or watering-control input.

### Later Hardware Fault Isolation

After the initial successful proof, SEN0562-L01 later reported missing / `not_detected` after several hours while the rest of the bench stack remained healthy.

Jeremy investigated the hardware and found:

```text
Bad crimp on the SEN0562 yellow SCL wire.
After replacing that connection, a temporary reversed-polarity wiring mistake produced confusing low voltage.
After correcting polarity, Jeremy measured:
  ESP32 3.3V to GND: 3.282V
  SEN0562 connector VCC/GND: 3.17V
```

After the corrected wiring and polarity, SEN0562-L01 validated again. `/measurements` at `2026-06-11T16:20:58Z` included:

```text
sensor_key: sen0562_l01
sensor_type: sen0562
measurement_name: ambient_light
measurement_value: 238.33
measurement_unit: lux
valid: true
quality: diagnostic
reason: read_ok
control_eligible: false
mux_address: 0x70
mux_channel: 1
sensor_address: 0x23
electrical_boundary: 3.3V_only
no_5v: true
module_supply_documented_by_vendor: 5V
bench_proof_supply: 3.3V
voltage_note: controlled_3v3_functional_test
mux_detected: true
disable_before_read_ok: true
channel_select_ok: true
post_read_all_channels_disabled: true
upstream_expected_address_present: false
selected_channel_expected_address_present: true
```

Correct interpretation: the later missing episode was a hardware wiring/connection fault, not an unresolved firmware or 3.3V functional-proof failure. This still does not prove field installation readiness, long-cable behavior, waterproof connector readiness, calibrated lux, PAR, sun scoring, plant recommendations, or watering authority.

### Electrical-Fault Chart Interval Note

During Phase 7N.4A troubleshooting, the SEN0562-L01 branch briefly had a reversed-polarity wiring fault after the bad yellow SCL crimp was replaced. Jeremy measured approximately `1.6V` at the SEN0562 branch during the fault, then corrected the polarity and later measured approximately `3.17V` at the SEN0562 connector and `3.282V` at the ESP32 3.3V/GND reference.

The reversed-polarity fault appears to have affected multiple plotted readings in the surrounding hosted 24-hour chart interval, likely around the June 11 late-morning local readings, roughly between the `11:00` and `11:15` readings based on visual review. Treat that chart interval as electrical troubleshooting evidence only, not valid environmental, calibration, dry-down, watering-response, sensor-comparison, or control-quality data.

After correcting the wiring fault, SEN0562-L01 returned to valid diagnostic operation behind MUX01 channel 1 with a `238.33 lux` reading. That `238.33 lux` value should be interpreted as bright indoor workbench lighting, not outdoor daylight or sunlight-level intensity.

Recommended follow-up, as a separately approved manual operator step: add a Supabase `sensor_events` operational note documenting this electrical troubleshooting interval. Do not insert this note through firmware or automation.

Suggested `sensor_events` note text:

```text
Phase 7N.4A SEN0562-L01 bench troubleshooting: DFRobot SEN0562-L01 was tested at 3.3V behind MUX01 channel 1 on Prototype01. Initial read_ok and cover/uncover lux response passed. Later not_detected was traced to hardware wiring faults: bad yellow SCL crimp and a temporary reversed-polarity rewiring mistake. During the reversed-polarity fault, the SEN0562 branch measured about 1.6V and the hosted chart showed abnormal behavior across multiple readings around the surrounding June 11 late-morning local interval. Treat that interval as electrical troubleshooting evidence only, not valid calibration, sensor-comparison, watering-response, or control-quality data. After correction, SEN0562-L01 returned to read_ok at 238.33 lux with 3.17V measured at the SEN0562 connector.
```

### Existing Record Preservation

During runtime validation:

- BME280 `air_temperature`, `relative_humidity`, and `barometric_pressure` remained valid.
- DS18B20 `temperature` remained valid.
- VEML6030 remained missing / `not_detected` and out of the proof path.
- GPIO34 `moisture_index` and `raw_adc` remained present and separate.
- SEN0308-M01/M02/M03/M04 all emitted diagnostic `raw_adc` through ADS1115 on MUX01 channel 0.
- No `/water-now` call occurred.
- No relay activity was observed.
- No SQL, deploy, field-unit upload, commit, or push occurred.

## Build Validation

Build validation passed:

```text
pio run -e bench-proto-gen2          SUCCESS
pio run -e balcony-installed-gen2    SUCCESS
pio run -e balcony-sensor-scout-01   SUCCESS
```

The builds emitted existing `OneWire.cpp` dependency warnings about extra tokens at the end of `#undef` directives. No SEN0562 firmware warnings or errors were observed.

After build validation, Prototype01 was uploaded for runtime validation. No SQL, deploy, commit, push, Balcony01 upload, Scout01 upload, or field-unit change occurred.
