# Phase 7N.2A - SEN0308-M01 ADS1115 A0 Diagnostic Proof

## Status

Phase 7N.2A is runtime validated / complete pending push. Prototype01 proved a diagnostic-only raw read path from SEN0308-M01 through ADS1115 A0 behind MUX01 channel 0.

## Architecture Boundary

ADS1115 is a low-level analog input provider, not the moisture sensor.

SEN0308 is the physical moisture sensor-family module.

SEN0308-M01 is currently wired to ADS1115 A0 on Prototype01. MUX01 is at `0x70`. ADS1115 is at `0x48` behind MUX channel 0.

The implementation uses a minimal direct I2C ADS1115 read. No ADS1115 dependency was added.

The read refuses to produce a raw count if upstream `0x48` is present, to avoid VEML6030/ADS1115 address ambiguity. VEML6030 is temporarily disconnected from upstream I2C for clean ADS1115/SEN0308 reads.

## Runtime Proof

Runtime validation used `Prototype01` with the `bench-proto-gen2` profile at local IP `10.0.0.192`.

After the provider/sensor refactor, `/measurements` reported the SEN0308-M01 diagnostic record:

```text
sensor_key: sen0308_m01
sensor_type: sen0308
measurement_name: raw_adc
measurement_value: 15642
measurement_unit: count
valid: true
quality: diagnostic
reason: read_ok
control_eligible: false
```

Provider details included:

```text
physical_sensor_id: SEN0308-M01
analog_provider: ads1115
provider_channel: A0
mux_address: 0x70
mux_channel: 0
ads1115_address: 0x48
electrical_boundary: 3.3V_only
```

## Early Diagnostic Raw Sequence

Before the provider/sensor refactor, a quick raw-response sequence showed:

| Condition | SEN0308-M01 raw count |
| --- | ---: |
| Air / not inserted | 18263 |
| Hand grip near probe body | 4911 |
| Dry mix | 16892 |
| Moist soil | 14581 |
| Lightly watered top soil | 15691 |

These values prove the read path responds, but they are not calibration evidence. Humidity/proximity sensitivity and soil calibration move to a later measurement-system phase.

## Hard Boundaries

- 3.3V only.
- 5V is not an option.
- No SEN0308 value replaces GPIO34.
- GPIO34 remains the separate legacy/reference moisture path.
- All SEN0308 records remain `control_eligible:false`.
- No watering behavior changed.
- No thresholds, durations, or cooldowns changed.
- No SQL.
- No frontend changes.
- No field-unit uploads.
- No push yet.

## Future Work

- SEN0308-M02/M03/M04 four-channel wiring proof.
- SEN0308 measurement-system/calibration phase.
- SEN0308 humidity/proximity sensitivity test phase.
- VEML6030 reconnection or muxed light-sensor path decision.
- SEN0562 muxed light sensor bring-up.
- SEN0204 electrical feasibility review.
