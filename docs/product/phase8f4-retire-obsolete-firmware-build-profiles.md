# Phase 8F.4 — Retire Obsolete Firmware Build Profiles

Date: 2026-08-20

Status: Implemented and locally validated, with the hosted-readonly frontend build noted separately below.

## Outcome

Phase 8F.4 removes obsolete executable firmware environments for retired Balcony01, Scout01, and Prototype01/Bench01 devices. `balcony02-gen2` is now the single selectable supported PlatformIO device environment. Future numbered devices must receive new explicit profiles, identities, and UUIDs rather than inheriting retired identity.

PlatformIO's shared ESP32 board/framework, monitor, and upload-port mechanics remain in the non-selectable `[env]` section. That section contains no device identity, firmware provenance, sensor, watering, endpoint, interlock, or telemetry behavior flags. There is no `default_envs` selection and no generic ESP32 device environment.

## Authority and pre-change baseline

The active Phase 8 roadmap and Phase 8F.1–8F.3 implementation/evidence records were read before modification. They preserved firmware profiles for a later separately approved bounded slice. The clean pre-change repository was:

- path `C:\AIProjects\projects\my-balcony-gardener`;
- branch `main`;
- `HEAD` `db429c7cb06ca46d7039fad9ad79b6ad0de3cb9c`;
- exactly equal to `origin/main` and the configured upstream; and
- clean, with no staged, unstaged, or untracked changes.

Inspection covered PlatformIO inheritance/default selection, upload and monitor selection, resolved build flags, device identities, profile libraries, source conditionals/defaults, the Balcony02 contract validator, current build instructions, current-state documentation, and repository-wide profile/UUID references.

## Pre-change all-environment compile baseline

Every selectable environment defined at the baseline compiled successfully in one explicit PlatformIO invocation:

| Environment | Result | RAM used | Flash used |
| --- | --- | ---: | ---: |
| `esp32doit-devkit-v1` | Success | 48,044 bytes | 980,893 bytes |
| `balcony-installed` | Success | 48,044 bytes | 981,493 bytes |
| `balcony-installed-gen2` | Success | 48,220 bytes | 1,012,993 bytes |
| `bench-prototype` | Success | 48,044 bytes | 981,493 bytes |
| `bench-proto-gen2` | Success | 48,660 bytes | 1,049,361 bytes |
| `balcony02-gen2` | Success | 48,660 bytes | 1,058,125 bytes |
| `balcony-sensor-scout-01` | Success | 48,660 bytes | 1,041,001 bytes |

The baseline Balcony02 `firmware.bin` was 1,064,704 bytes with SHA-256 `E42EF2141CC11DDE914966643B39F40E092E018ABE348657216090F57B2987E0`.

## Removed

- `[platformio] default_envs = balcony-installed`;
- the directly selectable generic `[env:esp32doit-devkit-v1]` environment;
- `balcony-installed`;
- `balcony-installed-gen2`;
- `bench-prototype`;
- `bench-proto-gen2`;
- `balcony-sensor-scout-01`;
- all identity, behavior flags, dependencies, comments, and aliases owned only by those environment definitions;
- the retired Balcony01 UUID fallback in `src/device_identity.h` and `src/config.h.example`; and
- generic fallback firmware profile/version and device label/role behavior. Missing explicit profile identity or provenance is now a compile-time error.

No removed environment owned a library required only by that environment and absent from Balcony02. The surviving profile still requires and retains Adafruit BME280 Library 2.3.0, DallasTemperature 4.0.6, and OneWire 2.3.8.

## Retained shared configuration and explicit device boundary

The non-selectable `[env]` section retains exactly:

- Espressif32 platform and `esp32doit-devkit-v1` board;
- Arduino framework;
- 115200 monitor speed;
- the existing explicit COM5 upload/monitor setting and monitor filters.

`[env:balcony02-gen2]` inherits those ordinary PlatformIO defaults implicitly. It remains the only selectable build and upload environment and owns all identity and behavior flags.

## Exact Balcony02 flag comparison

An ordered pre/post extraction from baseline `HEAD:platformio.ini` and the modified file reported `baseline_count=52`, `post_count=52`, and `exact_ordered_match=True`. The exact retained list is:

```text
-DMBG_FIRMWARE_VERSION=\"phase8b4-gen2-status-contract\"
-DMBG_BUILD_PROFILE=\"balcony02-gen2\"
-DMBG_DEVICE_LABEL=\"Balcony02\"
-DMBG_DEVICE_ID=\"7e5bd328-ad68-4389-a71a-fa5cd01b3813\"
-DMBG_DEVICE_ROLE=\"controller\"
-DMBG_GEN2_ENABLED=1
-DMBG_HAS_DHT11=0
-DMBG_HAS_BME280=1
-DMBG_BME280_USE_I2C_MUX=1
-DMBG_BME280_MUX_CHANNEL=4
-DMBG_HAS_DS18B20=1
-DMBG_HAS_VEML6030=0
-DMBG_HAS_SOIL_MOISTURE=0
-DMBG_HAS_SEN0204=1
-DMBG_SEN0204_PIN=26
-DMBG_SEN0204_PUMP_INTERLOCK_ENABLED=1
-DMBG_I2C_SDA_PIN=21
-DMBG_I2C_SCL_PIN=22
-DMBG_DS18B20_PIN=27
-DMBG_RELAY_PIN=25
-DMBG_PUMP_CONTROL_AVAILABLE=1
-DMBG_DEVICE_CAN_WATER=1
-DMBG_WATERING_SIMULATION_AVAILABLE=0
-DMBG_HTTP_WATERING_ENDPOINT_ENABLED=0
-DMBG_CAPABILITIES_INCLUDE_DHT11_ALIAS=0
-DMBG_PHYSICAL_BUTTON_ENABLED=1
-DMBG_PHYSICAL_BUTTON_PIN=32
-DMBG_PHYSICAL_BUTTON_ACTIVE_LOW=1
-DMBG_PHYSICAL_BUTTON_DEBOUNCE_MS=50
-DMBG_PHYSICAL_BUTTON_MAX_HOLD_MS=15000
-DMBG_HAS_I2C_MUX=1
-DMBG_I2C_MUX_ADDRESS=0x70
-DMBG_HAS_ADS1115=1
-DMBG_ADS1115_MUX_CHANNEL=0
-DMBG_ADS1115_ADDRESS=0x48
-DMBG_SEN0308_A0_INSTALLED=1
-DMBG_SEN0308_A1_INSTALLED=1
-DMBG_SEN0308_A2_INSTALLED=1
-DMBG_SEN0308_A3_INSTALLED=0
-DMBG_SEN0308_A0_PHYSICAL_SENSOR_ID=\"SEN0308-M01\"
-DMBG_SEN0308_A1_PHYSICAL_SENSOR_ID=\"SEN0308-M02\"
-DMBG_SEN0308_A2_PHYSICAL_SENSOR_ID=\"SEN0308-M03\"
-DMBG_PHASE7N1_3V3_ONLY=1
-DMBG_HAS_SEN0562=1
-DMBG_SEN0562_ADDRESS=0x23
-DMBG_SEN0562_L01_MUX_CHANNEL=1
-DMBG_SEN0562_L02_MUX_CHANNEL=2
-DMBG_SEN0562_L03_MUX_CHANNEL=3
-DMBG_SEN0562_L01_INSTALLED=1
-DMBG_SEN0562_L02_INSTALLED=1
-DMBG_SEN0562_L03_INSTALLED=1
-DMBG_PHASE7N4A_CONTROLLED_3V3_SEN0562_PROOF=1
```

This exact match preserves Balcony02 identity, installed sensor configuration, pins, I2C/mux topology, reservoir interlock, pump and device watering gates, physical-button semantics, HTTP endpoint gate, legacy alias gate, and firmware provenance. Source, thresholds, durations, cooldowns, cadence, Supabase behavior, and telemetry behavior were not edited.

## Firmware and contract validation

- `pio project config --json-output` resolves one selectable environment, `env:balcony02-gen2`, plus non-selectable shared `env` configuration.
- `pio run -e balcony02-gen2` succeeds at 48,660 bytes RAM and 1,058,125 bytes flash, exactly equal to baseline.
- Post-change `firmware.bin` remains 1,064,704 bytes with the exact baseline SHA-256 `E42EF2141CC11DDE914966643B39F40E092E018ABE348657216090F57B2987E0`.
- An attempted retired build, `pio run -e balcony-installed`, fails before build with `UnknownEnvNamesError`; PlatformIO lists only `balcony02-gen2` as valid.
- `scripts/validate-balcony02-gen2-contracts.ps1` parses successfully without `BaseUrl` and explicitly skips live `/measurements`, `/capabilities`, and `/status` validation.
- No upload or serial-monitor action was performed.

## Proportional repository validation

- Frontend tests: 59/59 passed.
- ESLint: passed with no warnings.
- Ordinary TypeScript/Vite production build: passed and emitted the unchanged Phase 8F.3 main assets (`index-DFGupKnI.js`, `index-DwqZiYrA.css`, and `browser-B0azeLnE.js`).
- Hosted-readonly TypeScript/Vite production build: the first sandboxed attempt was blocked before Vite loaded by Windows `spawn EPERM`; the automatic out-of-sandbox retry was unavailable because the approval service reported a usage-limit block. This is not claimed as a passing hosted build in this record.
- Bundle guards: no retired firmware profile name, retired local device IP, or `/water-now` string appears in the generated bundle; expected hosted Gen2 measurement, garden-device, and watering-event view strings remain. Retired UUIDs remain in the bundle through the unchanged frontend device registry, which is an explicit non-goal of this slice.
- Executable firmware/configuration retirement scan: no retired environment name, retired UUID, or retired device label remains in `platformio.ini`, `src`, `include`, `lib`, `test`, `scripts`, or `tools`.
- `platformio.ini` environment scan: exactly one `[env:...]` section, `[env:balcony02-gen2]`.
- `git diff --check`: passed. The only message was Git's informational CRLF-to-LF working-copy warning for the edited tracked example file.

## Remaining Gen1 source branches for Phase 8F.5

This slice intentionally does not remove shared implementation branches. The remaining review boundary includes:

- Gen1 DHT/soil globals, reads, fallback handling, and `sensor_logs` telemetry posting in `src/main.cpp`;
- Gen1 immediate watering-start and watering-completion telemetry blocks guarded by `#ifndef MBG_GEN2_ENABLED`;
- Gen1 regular sensor logging and moisture-triggered automatic-watering loop guarded by `#ifndef MBG_GEN2_ENABLED`;
- `/logs` handler/compatibility implementation and its `!MBG_GEN2_ENABLED || MBG_GEN2_ENABLE_LEGACY_LOGS` registration gate;
- conditional Gen1/Gen2 `/status`, heartbeat, cloud-post, endpoint, and initialization branches; and
- now-unselected compatibility defaults and feature gates in `src/profile_overrides.h`, including DHT/analog-soil and legacy endpoint paths.

Those branches are unreachable through the sole supported environment but remain source-level historical/compatibility implementation. Their removal requires the separately scoped Phase 8F.5 source-branch proof and regression boundary.

## Proof limits

This evidence proves that the seven pre-change environments compiled, obsolete device environments and generic retired identity selection are absent from executable configuration, only Balcony02 remains selectable, shared board/framework mechanics are non-selectable, all 52 Balcony02 flags are unchanged, and the rebuilt Balcony02 binary is size- and hash-identical. It also proves local contract-validator parsing, frontend tests/lint/ordinary build, retirement searches, and diff hygiene at the recorded state.

It does not prove a firmware upload, device boot, serial output, live endpoint response, live reservoir/pump/button behavior, live telemetry/Supabase posting, sensor accuracy, hosted deployment, database/registry retirement, deletion of historical data, removal of remaining Gen1 source branches, or a passing hosted-readonly build while the recorded Windows sandbox/approval limitation remains.
