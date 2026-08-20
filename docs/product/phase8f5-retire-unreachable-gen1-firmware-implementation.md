# Phase 8F.5 — Retire Unreachable Gen1 Firmware Implementation

Date: 2026-08-20

Status: Implemented and locally validated; no device upload, live device request, database mutation, deployment, or physical watering action performed.

## Objective and boundary

Phase 8F.5 removes firmware implementation that cannot be reached from the sole supported `balcony02-gen2` environment. The retained boundary is the exact Balcony02 Gen2 sensing, local endpoint, cloud-ingestion, diagnostics, physical-button watering, pump-shutoff, reservoir-interlock, heartbeat, and watering-event behavior. No SQL, database data, frontend behavior, device registry, deployment, upload, serial monitoring, or physical watering action is in scope.

## Authority and clean baseline

The active Phase 8 roadmap and the complete Phase 8F.4 implementation/evidence record were read before modification. After refreshing `origin/main`, the pre-change repository was:

- path `C:\AIProjects\projects\my-balcony-gardener`;
- branch `main`;
- `HEAD`, `main`, configured upstream, and `origin/main` all at `d6ac6ec5093f3e2fcdad903f388e12b63aa8f75b`;
- zero commits ahead or behind; and
- clean, with no staged, unstaged, or untracked changes.

No repository `AGENTS.md` was present.

## Pre-change Balcony02 evidence

`pio run -e balcony02-gen2` succeeded with:

- 52 resolved profile flags, in the exact Phase 8F.4 order;
- RAM: 48,660 bytes of 327,680 bytes (14.8%);
- flash: 1,058,125 bytes of 1,310,720 bytes (80.7%);
- `firmware.bin`: 1,064,704 bytes; and
- SHA-256 `E42EF2141CC11DDE914966643B39F40E092E018ABE348657216090F57B2987E0`.

The local contract validator parsed successfully and skipped live requests because no device URL was supplied. Baseline ELF, map, and relevant object files were preserved outside the repository for deterministic post-change comparison.

The baseline dependency graph still linked the vendored DHT sensor library. Relevant linked/source inventory included the retained Gen2 status, capability, measurement, heartbeat, watering-event, physical-button, reservoir-interlock, and measurement-batch symbols. It also included disabled DHT/direct-soil module stubs and DHT library symbols. The built image contained `/status`, `/capabilities`, `/measurements`, `device_heartbeats`, `sensor_measurement_batches`, and `watering_events`; it did not contain a `/logs` or `/water-now` route string. The private local configuration was inspected without reporting credentials: it uses HTTPS on a Supabase project host and currently ends in a `sensor_logs` table suffix.

## Reachability and classification map

| Flags / entry point | Compile-time or runtime path | Classification before deletion | Phase 8F.5 treatment |
| --- | --- | --- | --- |
| Sole `[env:balcony02-gen2]`; `MBG_GEN2_ENABLED=1` | Selects every Gen2 side and excludes every `#ifndef MBG_GEN2_ENABLED` side | Required Gen2 side; unreachable Gen1 side | Collapse to required Gen2 implementation and fail compilation without explicit Gen2 provisioning |
| `setup()` | Starts Gen2 modules and registers `/`, `/status`, `/capabilities`, `/measurements`, and the not-found handler | Required | Preserve exact registered endpoints and initialization order for installed modules |
| `loop()` pump-shutoff block | Runs before network, HTTP, and telemetry work | Required safety invariant | Preserve ordering, relay LOW shutoff, duration accounting, event evidence, and trigger reset |
| Physical-button flags all enabled; SEN0204 interlock enabled | Debounce, press/release watering, reservoir start block, liquid-loss cutoff, max-hold cutoff, queued event flush | Required | Preserve byte/contract-equivalent retained logic |
| Generic automatic-control gates and automatic start helper | Preserved local-firmware control boundary; the retired direct-analog Balcony02 feed is disabled by `MBG_HAS_SOIL_MOISTURE=0` | Required implementation boundary, but no Balcony02 direct-analog caller at baseline | Preserve thresholds, cooldown, gate logic, relay semantics, and watering-event semantics; remove only retired Gen1/direct-analog loop callers |
| `MBG_HAS_BME280=1`, DS18B20, ADS1115/SEN0308, SEN0562, SEN0204 flags | Installed Balcony02 sensing and ordered measurement records | Required | Preserve modules, pins, channels, IDs, names, units, reads, and ordering |
| Static Balcony02 capability manifest | Runtime profile-name check returns the static contract before the generic aggregation path | Required retained side | Return the same static manifest directly; remove profile-name selection, runtime scan, aliases, and generic aggregation |
| DHT11 flags at 0 plus unconditional legacy DHT global/include | No Balcony02 DHT read; disabled module stub and vendored library still link because of old implementation | Obsolete/unreachable | Remove globals, cache/fallback, module, pins/defaults, includes, flags, and vendored DHT library |
| Direct-soil flag at 0 | Direct `analogRead(SOIL_PIN)` mapping and its Gen1/conditional Gen2 loop are compile-time excluded | Obsolete/unreachable | Remove mapping, module, pin/default, flag, and callers; do not change SEN0308 measurements or create a new control feed |
| VEML6030 flag at 0 | Disabled non-Balcony02 module is called only by generic aggregation/record assembly | Obsolete/unreachable | Remove module and flag while preserving installed SEN0562 light sensing |
| `sendDataToSupabase()` and `#ifndef MBG_GEN2_ENABLED` start/completion/periodic calls | Can only create Gen1 `sensor_logs` rows from excluded branches | Obsolete/unreachable | Remove writer and every immediate/periodic call |
| `/logs` declaration/handler and `!MBG_GEN2_ENABLED || MBG_GEN2_ENABLE_LEGACY_LOGS` gate | Handler exists in source but Balcony02 registers no route | Obsolete/unreachable | Remove implementation, declaration, registration, and feature default |
| HTTP `/water-now` declaration/handler with endpoint flag 0 | Handler exists in source but Balcony02 registers no route | Obsolete/unreachable | Remove handler and flag; preserve physical-button watering and generic automatic watering implementation |
| Heartbeat/status conditional payloads | Gen2 side is selected; legacy flat payload/status shape is excluded | Required Gen2 side; obsolete/unreachable legacy side | Retain the selected Gen2 statements exactly and remove conditional legacy side |
| Cloud URL suffix rewriting | Current private configuration still ends in a legacy table suffix, while active writes target three Gen2 tables | Isolated active configuration compatibility | Replace duplicated table-name branches with one generic `/rest/v1/<table>` suffix normalizer; retain no `sensor_logs` writer or table-specific legacy payload |
| `profile_overrides.h` fallback defaults | Allowed incomplete or hypothetical profiles to compile with implicit hardware behavior | Obsolete compatibility | Replace supported-profile defaults with explicit compile-time requirements and keep legitimate cross-flag/pin safety validation |

This classification was completed before source deletion. Historical documentation remains historical evidence; current authority and implementation records are updated to describe the supported boundary.

## Implementation

The firmware now compiles only the explicitly provisioned Balcony02 Gen2 profile. `profile_overrides.h`, `device_identity.h`, and `firmware_identity.h` fail compilation when the required Gen2 selector, exact device identity, exact build profile, installed-module topology, control flags, or conflict checks are absent or inconsistent. Six redundant disabled-feature flags were removed, and the previously implicit SEN0308 A3 physical sensor ID is now explicit. All other operational, sensing, pin, threshold, and cadence flags retain their Phase 8F.4 values and order.

The following unreachable implementation was removed:

- the Gen1 DHT include/global/cache/fallback path and the vendored DHT library;
- the Gen1 direct-soil ADC mapping and conditional periodic loop;
- the disabled Gen2 DHT11, direct-soil, VEML6030, and generic I2C-mux capability modules;
- runtime profile selection, dynamic capability aggregation, I2C scanning, and legacy DHT capability aliasing;
- the Gen1 `sensor_logs` writer and its immediate, completion, and periodic callers;
- the unregistered `/logs` and disabled HTTP watering handlers, declarations, feature gates, and route registrations;
- legacy status and heartbeat payload branches; and
- ignored firmware backup files that duplicated the retired implementation.

The retained firmware registers exactly `/`, `/status`, `/capabilities`, and `/measurements`, followed by the not-found handler. The static Balcony02 capability manifest is returned directly. Measurement record assembly invokes the five installed module providers in the established order: BME280, DS18B20, SEN0308, SEN0562, and SEN0204. Their pins, channels, physical sensor IDs, names, units, read behavior, record ordering, and payload contracts were not changed.

The active cloud writers still target `watering_events`, `device_heartbeats`, and `sensor_measurement_batches`. A single generic Data API table URL normalizer replaced duplicated suffix-rewriting branches. It accepts the currently configured table-suffixed URL as well as a project-root or `/rest/v1` root, without restoring a `sensor_logs` writer or payload. The private local configuration was not committed or rewritten and no key or full URL is recorded here.

The physical-button watering path, active-low relay semantics, reservoir start interlock, liquid-loss cutoff, maximum-hold cutoff, duration accounting, event queue and retry behavior, and top-of-loop pump-shutoff ordering remain in place. The generic automatic-control quality-gate and start boundary remains in source with its existing thresholds, cooldown, relay, interlock, and event semantics. As at baseline, Balcony02 has no runtime direct-analog moisture caller because that retired feed was disabled; Phase 8F.5 deliberately does not invent a replacement control feed.

## Validation and evidence differences

Both the named environment build and the repository-default build succeeded. Post-change size evidence is:

| Artifact | Pre-change | Post-change | Difference |
| --- | ---: | ---: | ---: |
| RAM | 48,660 bytes (14.8%) | 48,580 bytes (14.8%) | -80 bytes |
| Flash | 1,058,125 bytes (80.7%) | 1,036,185 bytes (79.1%) | -21,940 bytes |
| `firmware.bin` | 1,064,704 bytes | 1,042,768 bytes | -21,936 bytes |
| Resolved profile flags | 52 | 47 | -5 net (six obsolete flags removed, one explicit sensor ID added) |

The post-change binary SHA-256 is `C8E34B781C8178FEFCF5A4530871093B55AE430F991021D2F512A44B2A788EA1`. Its dependency graph contains the active BME280, DallasTemperature, OneWire, Wire, HTTP, web-server, Wi-Fi, and TLS dependencies and no DHT library.

Baseline-to-post-change symbol sizes were stable for the capability handler (238 bytes), measurement handler (238), Gen2 measurement envelope (574), BME280 provider (1,862), DS18B20 provider (634), SEN0308 provider (764), SEN0562 provider (762), SEN0204 provider (283), physical stop path (94), event queue (202), event flush (112), and watering-event wrapper (94). Material decreases are explained by the retired branches and generalized URL handling: flash fell by 21,940 bytes; the watering-event POST body fell from 4,263 to 3,272 bytes; heartbeat POST from 6,287 to 5,954; measurement POST from 3,650 to 2,846; physical start from 150 to 60 after legacy local-time state removal; and `loop()` from 336 to 307. The status handler changed by four bytes (3,818 to 3,814) while retaining its Gen2 payload contract.

Static source and built-image scans found no `/logs`, `/water-now`, `sendDataToSupabase`, DHT implementation, direct-soil ADC path, retired module symbol, legacy environment, or old device identity. The executable contains one table-suffix occurrence from the intentionally unchanged private local configuration; source contains no legacy table writer. Negative compiler probes correctly rejected both an unsupported profile and a missing profile.

The extended contract validator passes every static check and parses its live-check section; live requests correctly skip when no device URL is supplied. It verifies the exact route set, absence of retired source/modules, direct static capability path, installed measurement-provider order, pump-shutoff ordering, physical-button/interlock/max-hold paths, automatic-control source boundary, and compile-time profile guards.

Repository and frontend validation also passed:

- firmware build: `pio run -e balcony02-gen2`;
- repository-default firmware build: `pio run`;
- frontend tests: 59 of 59 passed;
- frontend lint;
- ordinary production build;
- hosted-readonly production build (the first sandboxed attempt hit the known process-spawn restriction; the authorized retry passed with the same assets);
- hosted bundle scans: no retired watering/log endpoint, live-stats, ESP32 URL, watering URL, or legacy table strings, and the expected hosted measurement/watering views remain present; and
- whitespace/error scan with `git diff --check`.

No frontend source changed. Production asset sizes and names remained unchanged between the ordinary and hosted-readonly builds.

## Proof limits

This evidence proves the selected firmware compiles, the retired code and library are absent from source/dependencies/built output, exact compile-time provisioning is enforced, the retained static contracts and safety ordering remain represented, and repository/frontend validation passes locally.

It does not prove runtime sensor reads, Wi-Fi behavior, NTP behavior, live endpoint responses, Supabase authorization/RLS, successful cloud inserts, event retry after a real failure, reservoir transitions, relay electrical behavior, pump shutoff on hardware, or any physical watering result. No firmware was uploaded, no serial monitor was opened, no live device request was sent, no cloud POST was made, and no database query or mutation was performed. The generic automatic-control functions remain a source-level extension boundary, not a claim of a currently linked Balcony02 automatic-watering caller.

Remaining Phase 8F work is intentionally separate: registry/database truth, eventual migration of private device configuration to a project-root Data API URL, historical documentation cleanup where appropriate, any legacy database table/schema/row/RLS disposition, and future-profile support. These items require their own authority and evidence and were not bundled into firmware dead-code retirement.
