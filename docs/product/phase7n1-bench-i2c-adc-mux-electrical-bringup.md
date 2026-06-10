# Phase 7N.1 - Bench I2C/ADC/MUX Electrical Bring-Up and Topology Proof

## Status

Phase 7N.1 is runtime validated / complete. Prototype01 proved the 3.3V-only MUX01 and ADC01 detection topology on the bench. ADS1115 raw reads, moisture sensor ADC channel testing, muxed light sensor bring-up, liquid-level review, push, and later sensor calibration remain future work.

## Electrical Boundary

Phase 7N.1 is 3.3V-only.
5V is not an option.
No board, sensor, mux, ADC, pull-up, or I2C segment may be powered from 5V.
Any module that cannot operate safely at 3.3V is rejected for this bench proof.
If onboard pull-ups are tied to 5V, the board is out of scope unless physically modified and separately approved.
Use 3.3V only.
Do not use 5V.
Do not design for 5V fallback.

## Intended Bench Wiring

| From | To | Purpose |
| --- | --- | --- |
| ESP32 3.3V | mux VIN | 3.3V-only mux power |
| ESP32 GND | mux GND | common ground |
| ESP32 GPIO21 | mux SDA | upstream I2C SDA |
| ESP32 GPIO22 | mux SCL | upstream I2C SCL |
| mux A0 | GND | mux address bit low |
| mux A1 | GND | mux address bit low |
| mux A2 | GND | mux address bit low |
| mux RST | 3.3V if reset is active-low and no onboard pull-up evidence is confirmed | keep mux out of reset |
| mux SD0 | ADS1115 SDA | channel 0 downstream SDA |
| mux SC0 | ADS1115 SCL | channel 0 downstream SCL |
| ESP32 3.3V | ADS1115 VDD | 3.3V-only ADC power |
| ESP32 GND | ADS1115 GND | common ground |
| ADS1115 ADDR | GND | deterministic ADS1115 address 0x48 |
| ADS1115 ALRT | unconnected | interrupt unused |
| ADS1115 A0-A3 | unconnected | first proof is detection-only |

Expected mux address is `0x70`. Expected ADS1115 address is `0x48`.

## Firmware Boundary

The Phase 7N.1 firmware slice adds bench-only `/capabilities` diagnostics for a TCA9548A/PCA9548A-style mux and ADS1115 address detection behind mux channel 0.

ADS1115 evidence is diagnostic-only. No ADS1115 value replaces GPIO34 analog soil moisture, affects watering, changes moisture mapping, or changes `control_eligible` behavior.

The first implementation is detection-only and does not add an ADS1115 library or raw ADC reads.

ADS1115 detection is confirmed only when the expected `0x48` address appears on the selected mux channel scan and was not already present on the upstream scan. If upstream `0x48` is already present, the ADS1115 detection status is `ambiguous` rather than detected, because the existing direct VEML6030 path may already own that upstream address.

## Runtime Validation

Runtime validation used `Prototype01` with the `bench-proto-gen2` profile at local IP `10.0.0.192`. The MUX01-only firmware upload used COM5. No Balcony01 or Scout01 upload was part of Phase 7N.1.

### MUX01-Only Proof

- MUX01 was detected at `0x70`.
- Upstream scan with MUX01 only found `0x48`, `0x70`, and `0x76`.
- Existing direct I2C devices remained visible on the upstream bus.
- `/capabilities` reported `i2c_mux.enabled = true`, `i2c_mux.detected = true`, and `i2c_mux.detected_address = 0x70`.
- `/capabilities` reported `voltage_boundary = 3.3V_only`, `no_5v = true`, and `post_scan_all_channels_disabled = true`.
- ADS1115 was not wired yet and was not confirmed.

### ADC01 Ambiguous-Path Proof

- ADC01 / ADS1115 was wired to MUX01 channel 0.
- Existing VEML6030 remained direct/upstream at `0x48`.
- Upstream scan found `0x48`, `0x70`, and `0x76`.
- Channel 0 scan found `0x48`, `0x70`, and `0x76`.
- `/capabilities` reported `upstream_expected_address_present = true` and `selected_channel_expected_address_present = true`.
- `/capabilities` reported `ads1115_detected = false`, `ads1115_detection_status = ambiguous`, and `ads1115_detection_reason = expected_address_already_present_on_upstream_scan`.
- This was correct behavior: firmware refused to fake-confirm ADS1115 while upstream `0x48` ambiguity existed.

### Clean ADS1115 Confirmation Proof

- Existing direct/upstream VEML6030 was temporarily disconnected.
- Upstream scan found `0x70` and `0x76`; it did not include `0x48`.
- Channel 0 scan found `0x48`, `0x70`, and `0x76`.
- `/capabilities` reported `upstream_expected_address_present = false` and `selected_channel_expected_address_present = true`.
- `/capabilities` reported `ads1115_detected = true`, `ads1115_detection_status = confirmed`, and `ads1115_detection_reason = expected_address_seen_only_after_selected_channel_scan`.
- `/capabilities` reported `post_scan_all_channels_disabled = true`.
- Clean ADS1115 detection through MUX01 channel 0 passed.

### VEML6030 Restoration Proof

- VEML6030 was reconnected to the normal upstream I2C bus.
- Upstream scan restored to `0x48`, `0x70`, and `0x76`.
- VEML6030 measurement returned valid `read_ok` light evidence again.
- ADS1115 detection returned to `ambiguous` instead of falsely confirming.
- Restoration sample after reconnect: BME280 temperature `76.23 F`, humidity `53.80 %`, pressure `1020.92 hPa`; DS18B20 temperature `75.87 F`; VEML6030 light `0.00 lux`; soil moisture index `56.0`; soil raw ADC `2299`.

### Non-Blocking Diagnostics Note

When VEML6030 was intentionally disconnected, `/capabilities` still listed the VEML6030 module as present/configured while `/measurements` correctly showed `read_failed`. This is not a Phase 7N.1 blocker. Future diagnostics polish should distinguish configured/enabled from physically detected where practical.

## Non-Changes

Phase 7N.1 changed no watering behavior, thresholds, durations, cooldowns, telemetry cadence, device IDs, firmware metadata wording, hosted frontend behavior, Supabase command/control boundaries, Remote Water Now, hosted Water Now, SQL, deployment, field-unit firmware, ADS1115 raw reads, ADS1115 values replacing GPIO34, or `control_eligible` behavior.

## Deferred Work

- ADS1115 raw channel diagnostics.
- SEN0308 moisture sensor comparison on ADS1115 A0-A3.
- SEN0562 muxed light sensor bring-up.
- SEN0204 liquid-level electrical review before wiring.
- Future diagnostics polish for configured/enabled versus physically detected sensor capability reporting.
