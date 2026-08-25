# Phase 8G.3 - Prototype02 Firmware Update to Gen2 and Commissioning

## Status

Complete and runtime validated on 2026-08-25. Jeremy approved Stage 9 commit and push after reviewing the Stage 8 outcome. This record does not claim a frontend deployment or B02 upload.

## Outcome

Phase 8G.3 adds `Prototype02` / `P02` as a genuinely new supported Gen2 bench unit:

- device UUID `a5c59d97-5687-483c-8773-86c9e6a84aea`;
- role `bench`;
- PlatformIO environment and build profile `prototype02-gen2`;
- firmware provenance `phase8g3-prototype02-gen2-r1`;
- Support-only assignment, customer-hidden, and Demo-hidden;
- telemetry, heartbeat, and watering-event insert permission;
- no hosted or Supabase command/control.

P02 does not reuse retired Prototype01/Bench01 identity, UUID, profiles, provisioning, capability rows, or Gen1 behavior.

## Approved Electrical And Hardware Contract

The MBG Gen2 system remains 3.3V-only. P01 proved this boundary, B02 operates on it, and P02 intentionally matches it. There is no 5V rail, device supply, or fallback.

| Function | P02 contract |
| --- | --- |
| ESP32 | USB-powered bench controller |
| Relay simulation | GPIO25, active HIGH, LED/click confirmation, no contact load, no pump |
| Button | GPIO32, active LOW, `INPUT_PULLUP` |
| WL01 | SEN0204 on GPIO26, liquid detected HIGH, local interlock |
| ST01 | DS18B20 on GPIO27 |
| I2C | GPIO21 SDA / GPIO22 SCL |
| Mux | Physical MUX03 at `0x70` after failed MUX02 was discarded |
| ADC01 | ADS1115 at `0x48` behind mux channel 0 |
| M02 | Physical `SEN0308-M02`, logical `sen0308_m01`, ADC01 A0 |
| L04 | Physical `SEN0562-L04`, logical `sen0562_l01`, mux channel 1, address `0x23` |
| BME280 | Mux channel 4, address `0x76` |

Only one moisture sensor and one lux sensor are installed. Uninstalled logical M02/M03/M04 and L02/L03 modules are omitted from the P02 manifest and measurement list.

## Honest Watering-Simulation Semantics

P02 is watering capable for physical and software controller-path testing, including future customer/login/frontend/control work, while remaining physically pump-free. The profile therefore declares:

- controller capability and watering output available;
- relay output is a simulation;
- pump control unavailable;
- physical water delivery unavailable;
- local firmware remains the only control authority.

Every simulated event records `simulation:true`, `watering_mode:simulated_watering`, `output_type:relay_led`, `pump_present:false`, and `water_delivery:false`. The frontend adapter distinguishes P02's new event evidence as a simulated button cycle in the changed local source. That frontend change is validated locally but is not claimed deployed.

## Firmware And Endpoint Contract

Phase 8G.3 adds an explicit `prototype02-gen2` environment and static P02 capability manifest while preserving the physical pump-backed B02 profile. Supported routes remain exactly:

- `GET /`;
- `GET /status`;
- `GET /capabilities`;
- `GET /measurements`.

No `/logs`, `/water-now`, Gen1 module, moisture-triggered automatic watering, threshold, cooldown, hosted control, or retired identity was restored. The local controller evaluates button cancellation, programmed completion, and continuously LOW 20 ms WL01 loss qualification before any synchronous network work. The relay is LOW at boot and is shut off before terminal evidence/network delivery.

## Commissioning

The approved commissioning SQL is [`docs/sql/phase8g3-prototype02-commissioning.sql`](../sql/phase8g3-prototype02-commissioning.sql), SHA-256 `877b09fe698b03c52187f4fa5458f368752a14e2e17007684ed5cf84ad896a32`.

Execution created the new active registry row, five capability rows covering seven measurement names, and a Support bench assignment. P02 remains customer-hidden, Demo-hidden, and not hosted-public. Full pre/post metadata fingerprints matched: no schema, grant, RLS, policy, view, or function changed.

The protected execution receipt is outside the repository at `C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8g3_p02_commissioning_20260825T050703Z.json`, SHA-256 `60714bd6c1d77073b8b18432ebb5337baa2aa25edc9b09df48244dfe30d2bf14`.

## Build, Upload, And Deterministic Validation

Before upload:

- `pio run -e balcony02-gen2` passed, RAM 14.9%, flash 79.0%;
- `pio run -e prototype02-gen2` passed, RAM 14.9%, flash 79.0%;
- parameterized static contract validation passed for both profiles;
- dashboard tests passed 67/67;
- dashboard lint and production build passed;
- `git diff --check` passed;
- firmware Supabase configuration/resolver guards passed.

After explicit Stage 7 approval, only `prototype02-gen2` was uploaded to P02 on BJ3 COM5. The upload verified all hashes and hard-reset the ESP32. B02 was not uploaded.

## Runtime Evidence

Clean boot confirmed the exact P02 label, UUID, role, profile, firmware provenance, Wi-Fi connection, safe relay initialization, DS18B20, WL01, and local server startup. The first physical MUX02 remained absent at `0x70`, so BME280, ADC01/M02, and L04 correctly emitted missing `mux_not_detected` records while ST01 and WL01 continued reporting.

Electrical isolation used a Fluke 179 and found a stable `3.294V` at ESP32 3.3V/GND, `3.285V` at the mux, and `3.282V` at ADC01. MUX02 remained undetected with all downstream sensors removed, verified upstream SDA/SCL continuity, and no SDA/SCL short. Jeremy discarded MUX02 and installed newly soldered MUX03.

MUX03 passed at `0x70`. ADC01/M02 passed on channel 0, L04 on channel 1, and BME280 on channel 4. The first scheduled post-replacement batch measured at `2026-08-25T17:07:59Z` contained exactly seven valid `read_ok` records:

| Measurement | Stored value |
| --- | ---: |
| BME280 air temperature | `79.48 F` |
| BME280 humidity | `54.12%` |
| BME280 pressure | `1017.12 hPa` |
| ST01 soil temperature | `78.35 F` |
| M02 raw ADC | `17021` |
| L04 ambient light | `30.0 lux` |
| WL01 liquid state | `1` |

The paired heartbeat arrived at `17:08:03Z`, uptime `902`, Wi-Fi connected at RSSI `-47`, and watering idle. The full live `/measurements`, `/capabilities`, and `/status` validator passed after replacement.

## Watering-Path Proof

P02's pump-free relay/LED made uninterrupted timing tests safe after explicit user approval. Runtime and stored evidence proved:

| Case | Result |
| --- | --- |
| Short selection | Paired 30-second start/completion |
| Long selection | Paired 60-second start/completion |
| Second accepted press | Immediate compatible cancellation terminal |
| WL01 absent at start | Relay stayed off; two `watering_blocked` / `reservoir_liquid_not_detected` rows |
| WL01 lost while active | Two paired `watering_safety_cutoff` / `firmware_safety` / `reservoir_liquid_lost` terminals after one second |
| Active network boundary | Local endpoints unavailable only while relay active; immediate recovery without reboot |
| WL01 stability after MUX03 | Indicator stayed continuously on throughout uninterrupted 30- and 60-second cycles |

No duplicate start/terminal evidence was found. Every start requiring a terminal has the expected compatible terminal. Blocked starts correctly have no start row because the relay never energized.

## Retired Identity Boundary

Historical documentation continues to mention Prototype01, Bench01, `bench-prototype`, `bench-proto-gen2`, and retired UUID `318fab98-89ad-4f36-9100-3134a04e0be5` as accurate history. Current firmware, build configuration, validators, scripts, and frontend source use none of those identities. The executed commissioning SQL contains the retired UUID once only as a negative precondition that aborts if the retired registry row exists; it does not insert, alias, restore, or depend on that identity. P02 has its own UUID, profile, static manifest, commissioned registry/capability rows, and evidence provenance.

## Closeout Boundary

Stage 8 runtime validation and documentation are complete. B02 retains its Phase 8G.2 firmware and was not uploaded, cycled, or otherwise mutated during Phase 8G.3. P02 frontend wording changes are not claimed deployed. Jeremy separately approved Stage 9 commit and push on 2026-08-25.
