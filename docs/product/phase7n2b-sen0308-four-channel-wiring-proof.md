# Phase 7N.2B - SEN0308-M02/M03/M04 Four-Channel Wiring Proof

## Status

Phase 7N.2B is runtime validated on Prototype01 and is in documentation closeout pending commit.

This phase proves the bench four-channel SEN0308-to-ADS1115 measurement path. It does not calibrate SEN0308 readings, select wet/dry thresholds, or approve any SEN0308 value for watering control.

## Purpose

Phase 7N.2B extends the Phase 7N.2A SEN0308-M01 proof from one ADS1115 input to all four ADS1115 single-ended inputs:

| Physical sensor | ADS1115 channel |
| --- | --- |
| SEN0308-M01 | A0 |
| SEN0308-M02 | A1 |
| SEN0308-M03 | A2 |
| SEN0308-M04 | A3 |

The key distinction for this phase:

- Four-channel firmware/provider read proof: firmware can explicitly read ADS1115 A0, A1, A2, and A3 through the existing muxed ADS1115 provider path.
- Four-channel physical SEN0308 wiring proof: Jeremy physically wired and powered all four SEN0308 sensors, and current Prototype01 runtime evidence shows all four as valid diagnostic reads.
- Hosted 24h display artifacts: hosted support/dashboard history can temporarily show stale old rows from earlier Phase 7N.2A evidence and should not be treated as the primary proof.
- Future calibration / measurement-system evaluation: Phase 7N.3 remains responsible for interpreting behavior, variation, wetting response, dry-down response, and control-quality suitability.

## Starting Baseline

Preflight before implementation matched the expected baseline:

- Branch: `main`
- Working tree: clean before implementation
- Latest commit: `9c7de30 Add SEN0308 diagnostic module for ADS1115 A0`

Phase 7N.2A had already established the provider/sensor split:

- `gen2_ads1115` is the low-level analog provider.
- `gen2_sen0308` is the physical SEN0308 sensor-family module.
- SEN0308-M01 emitted diagnostic raw ADC records from ADS1115 A0.
- GPIO34 legacy/reference moisture records remained separate.

## Approved Scope

Approved firmware files changed:

- `src/gen2_ads1115.cpp`
- `src/gen2_ads1115.h`
- `src/gen2_sen0308.cpp`

Documentation closeout files changed:

- `docs/product/phase7n2b-sen0308-four-channel-wiring-proof.md`
- `docs/CURRENT_STATE.md`
- `docs/PHASE_BACKLOG.md`

Out of scope for this phase:

- SQL/RLS changes
- Frontend or hosted code changes
- Cloudflare deploy
- Balcony01 firmware upload
- Scout01 firmware upload
- Calibration
- Wet/dry threshold claims
- SEN0308 control approval

## Hardware State

Jeremy physically wired and powered all four SEN0308 sensors for the accepted runtime proof:

| SEN0308 wire | Destination |
| --- | --- |
| M01 red | 3.3V |
| M01 both black wires | GND |
| M01 yellow | ADS1115 A0 |
| M02 red | 3.3V |
| M02 both black wires | GND |
| M02 yellow | ADS1115 A1 |
| M03 red | 3.3V |
| M03 both black wires | GND |
| M03 yellow | ADS1115 A2 |
| M04 red | 3.3V |
| M04 both black wires | GND |
| M04 yellow | ADS1115 A3 |

GPIO34 legacy/reference moisture wiring remains installed and separate.

VEML6030 remains intentionally disconnected for the clean ADS1115 proof.

The entire Phase 7N bench proof remains 3.3V-only. No 5V fallback was introduced.

## Firmware Changes

`gen2_ads1115` now supports explicit single-ended reads for ADS1115 A0-A3. The implementation preserves the previous ADS1115 behavior except the ADS1115 mux/channel bits:

| Channel | Config |
| --- | --- |
| A0 | `0xC383` |
| A1 | `0xD383` |
| A2 | `0xE383` |
| A3 | `0xF383` |

The existing mux address, mux channel, ADS1115 address, gain, data rate, single-shot mode, comparator settings, delay behavior, and 3.3V-only assumptions were preserved.

`gen2_sen0308` now maps four physical SEN0308 identities to ADS1115 provider channels:

| Sensor key | Physical sensor ID | Provider channel |
| --- | --- | --- |
| `sen0308_m01` | `SEN0308-M01` | `A0` |
| `sen0308_m02` | `SEN0308-M02` | `A1` |
| `sen0308_m03` | `SEN0308-M03` | `A2` |
| `sen0308_m04` | `SEN0308-M04` | `A3` |

All SEN0308 records remain diagnostic-only and `control_eligible:false`.

## Build Validation

Build validation passed:

```text
pio run -e bench-proto-gen2          SUCCESS
pio run -e balcony-installed-gen2    SUCCESS
pio run -e balcony-sensor-scout-01   SUCCESS
```

`git diff --check` passed with only Git line-ending warnings for the already-touched source files.

## Upload Validation

Prototype01 only was uploaded:

```text
pio run -e bench-proto-gen2 -t upload --upload-port COM5
```

Upload succeeded on COM5. The upload target was ESP32-D0WD-V3, MAC `ec:e3:34:79:c6:e0`; firmware was written, hashes were verified, and the board hard-reset via RTS.

No Balcony01 upload occurred.

No Scout01 upload occurred.

## Runtime Evidence

Codex shell HTTP checks to Prototype01 failed from the execution environment, but Jeremy provided current Prototype01 `/measurements` runtime JSON captured after physically wiring and powering all four SEN0308 sensors. This Jeremy-provided latest `/measurements` JSON is the accepted runtime evidence for the physical four-channel wiring proof.

Runtime identity evidence:

```text
device_label: Prototype01
device_id: 318fab98-89ad-4f36-9100-3134a04e0be5
device_role: bench
firmware_version: phase7e-gen2-compat
build_profile: bench-proto-gen2
measured_at: 2026-06-10T21:27:55Z
```

Current SEN0308 four-channel evidence:

| Sensor key | Physical sensor ID | ADS1115 channel | Raw count |
| --- | --- | --- | ---: |
| `sen0308_m01` | `SEN0308-M01` | A0 | 15552 |
| `sen0308_m02` | `SEN0308-M02` | A1 | 18178 |
| `sen0308_m03` | `SEN0308-M03` | A2 | 17891 |
| `sen0308_m04` | `SEN0308-M04` | A3 | 18286 |

All four current SEN0308 records have:

```text
sensor_type: sen0308
measurement_name: raw_adc
measurement_unit: count
valid: true
quality: diagnostic
reason: read_ok
control_eligible: false
analog_provider: ads1115
mux_address: 0x70
mux_channel: 0
ads1115_address: 0x48
electrical_boundary: 3.3V_only
no_5v: true
selected_channel_expected_address_present: true
post_read_all_channels_disabled: true
```

GPIO34 preservation evidence:

- `soil_moisture_analog` `moisture_index` remained present at `67.0`.
- `soil_moisture_analog` `raw_adc` remained present at `2019`.
- Details still show `analog_pin:34`.
- GPIO34 remains the legacy/reference moisture path.
- No SEN0308 value replaces GPIO34.

Other runtime evidence:

- BME280 records remain present.
- DS18B20 record remains present.
- VEML6030 `ambient_light` remains missing / `not_detected` because VEML6030 is intentionally disconnected for the clean ADS1115 proof.
- No `/water-now` call was made.
- No relay activity was reported.
- No watering behavior changed.

## Hosted Dashboard Interpretation

The hosted 24h dashboard may temporarily show six Raw ADC cards after this phase because the selected 24h history window can include old 7N.2A-era rows plus current 7N.2B rows.

Current `/measurements` evidence contains five current raw-ADC-style records:

1. GPIO34 legacy/reference `soil_moisture_analog` `raw_adc`
2. SEN0308-M01 `raw_adc` from ADS1115 A0
3. SEN0308-M02 `raw_adc` from ADS1115 A1
4. SEN0308-M03 `raw_adc` from ADS1115 A2
5. SEN0308-M04 `raw_adc` from ADS1115 A3

The apparent sixth Raw ADC card is an older 7N.2A historical record in the selected 24h window using the old sensor_type `sen0308_ads1115`. It is not a current sixth sensor and not a current firmware record shape.

Current SEN0308 records use sensor_type `sen0308`.

The old `sen0308_ads1115` rows should age out of short hosted windows naturally. No fake cleanup, SQL deletion, or hosted filtering was performed in Phase 7N.2B.

The hosted dashboard behavior observed during this historical proof came from an obsolete generic raw-ADC display rule associated with a failed prior moisture path. That rule has no Gen2 compatibility requirement and is not product authority for ADS1115-backed SEN0308 measurements. Phase 8C.5A supersedes it with a provider-specific boundary and requires obsolete trust handling to be removed rather than adapted.

## Boundaries Preserved

Phase 7N.2B did not change:

- Watering behavior
- Relay behavior
- `/water-now` behavior
- Automatic watering
- `control_eligible` behavior
- `MOISTURE_THRESHOLD`
- `WATERING_DURATION_MS`
- `WATERING_COOLDOWN_MS`
- `LOG_INTERVAL_MS`
- `GEN2_MEASUREMENT_POST_INTERVAL_MS`
- `HEARTBEAT_INTERVAL_MS`
- Moisture mapping
- Device IDs
- Firmware metadata wording
- Frontend/hosted code
- SQL/RLS
- Cloudflare deploy
- Balcony01 firmware
- Scout01 firmware

All SEN0308 records remain diagnostic-only.

All SEN0308 records remain `control_eligible:false`.

No SEN0308 reading is calibrated.

No SEN0308 reading is approved for watering control.

No wet/dry threshold was selected.

No moisture mapping was created.

## What This Phase Proves

Phase 7N.2B proves:

- ADS1115 A0-A3 can be read through the existing bench MUX01 / ADC01 topology.
- `gen2_sen0308` can emit four physical SEN0308 diagnostic records.
- SEN0308-M01, M02, M03, and M04 map to ADS1115 A0, A1, A2, and A3 respectively.
- The four current SEN0308 records use sensor_type `sen0308`.
- GPIO34 legacy/reference moisture records remain present and separate.
- VEML6030 can remain disconnected for clean ADS1115 proof without hiding that status.
- The 3.3V-only boundary remains intact.

## What This Phase Does Not Prove

Phase 7N.2B does not prove:

- Calibrated soil moisture
- Wet/dry thresholds
- Control-quality moisture evidence
- Sensor-to-sensor agreement
- Long-term stability
- Humidity/proximity immunity
- Inserted-media behavior
- Wetting response
- Dry-down response
- That any SEN0308-derived value should control watering
- That a hosted SEN0308 measurement-quality boundary was implemented

## Follow-Up Work

Phase 7N.3 should evaluate SEN0308 measurement behavior, sensor-to-sensor variation, air/hand/proximity response, inserted-media behavior, wetting response, dry-down response, and whether any SEN0308-derived value can ever become control-quality evidence.

Future hosted trust/display work should remove the obsolete generic raw-ADC rule and design any measurement-quality boundary directly for the commissioned ADS1115-backed SEN0308 system.
