# Phase 7N.1 - Bench I2C/ADC/MUX Electrical Bring-Up

## Status

Phase 7N.1 bench-only diagnostic firmware is implemented, reviewed, and build-validated as an engineering checkpoint. Physical wiring, firmware upload, runtime proof, push, and phase closeout remain pending Jeremy approval.

## Electrical Boundary

Phase 7N.1 is 3.3V-only.

5V is not an option. No board, sensor, mux, ADC, pull-up, or I2C segment may be powered from 5V. Any module that cannot operate safely at 3.3V is rejected for this bench proof. If onboard pull-ups are tied to 5V, the board is out of scope unless physically modified and separately approved.

Use 3.3V only. Do not use 5V. Do not design for 5V fallback.

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

## Runtime Proof Still Pending

Validation still requires separately approved physical wiring and a separately approved upload to `Prototype01` / `bench-proto-gen2`. No Balcony01 or Scout01 upload is part of Phase 7N.1.

Expected later evidence:

- Upstream flat I2C scan before mux channel selection.
- Mux detected at `0x70`.
- Mux channel 0 scan reports downstream `0x48` when ADS1115 is wired.
- Mux channels are disabled after diagnostic scanning.
- Direct/upstream `0x48` ambiguity from the existing VEML6030 path is visible and not hidden.
- ADS1115 detection status reports `confirmed`, `ambiguous`, `not_detected`, or `mux_not_detected` from the upstream and selected-channel scan evidence.

## Non-Changes

Phase 7N.1 does not change watering behavior, thresholds, durations, cooldowns, telemetry cadence, device IDs, firmware metadata wording, hosted frontend behavior, Supabase command/control boundaries, Remote Water Now, hosted Water Now, SQL, deployment, or field-unit firmware.
