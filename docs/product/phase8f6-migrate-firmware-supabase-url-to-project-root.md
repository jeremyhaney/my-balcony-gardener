# Phase 8F.6 — Migrate Firmware Supabase URL to Project Root

Date: 2026-08-20

Status: Implemented and locally validated; no firmware upload, live device request, cloud write, database query or mutation, schema/policy change, frontend deployment, or physical watering action performed.

## Objective and boundary

Phase 8F.6 retires the final active firmware dependency on a historical table-suffixed Supabase configuration value. The ignored private `SUPABASE_URL` now stores the same project's HTTPS root, and firmware constructs only the three active Gen2 Data API targets:

- `/rest/v1/sensor_measurement_batches`;
- `/rest/v1/device_heartbeats`; and
- `/rest/v1/watering_events`.

The existing private key and every unrelated private setting are preserved. Frontend Supabase configuration, firmware payloads, measurement order, sensing, cadence, identities, local control, physical-button behavior, reservoir interlocks, relay behavior, pump shutoff, schema, RLS, grants, data, and registry entries are outside this change.

## Authority, baseline, and official guidance

The pre-change repository was `C:\AIProjects\projects\my-balcony-gardener` on `main` at Phase 8F.5 commit `56b7d1d0d2ab987f1055923609e580c8c522fdbb`. `HEAD` equaled the configured upstream and `origin/main`, and the working tree was clean. No repository `AGENTS.md` was present. The complete Supabase skill and the complete [Phase 8F.5 implementation/evidence record](./phase8f5-retire-unreachable-gen1-firmware-implementation.md), including its proof limits, were read before implementation.

The current Supabase [breaking-change changelog index](https://supabase.com/changelog?types=breaking-change), [Data REST API guide](https://supabase.com/docs/guides/api), [API route guide](https://supabase.com/docs/guides/api/creating-routes), and [quickstart](https://supabase.com/docs/guides/api/quickstart) were reviewed on 2026-08-20. The official contract continues to use the project URL as the configuration base and `/rest/v1/<table>` for direct table routes.

Two Data API breaking changes were relevant enough to review but do not alter this slice:

- new-table Data API exposure increasingly requires explicit grants, while existing tables retain their current grants; and
- anonymous access to the OpenAPI specification at the `/rest/v1/` root is restricted, while ordinary `/rest/v1/<table>` access continues.

This slice creates no table, changes no grant, requests no OpenAPI document, and makes no Data API request.

## Safe private-configuration evidence

The ignored configuration was inspected and migrated through a validator that emits classifications only. Neither the complete URL nor the key, token, project reference, or another credential was printed, logged, copied into a tracked file, placed in a diff, or recorded in documentation.

| Classification | Before | After |
| --- | --- | --- |
| HTTPS | yes | yes |
| Recognized Supabase project host | yes | yes |
| URL shape | table-suffixed | project-root |
| Key defined and non-placeholder | yes | yes |
| Contains `/rest/v1` | yes, as part of the legacy table suffix | no |
| Ignored by Git | yes | yes |

The migration changed only the private `SUPABASE_URL` macro value by removing the Data API/table path. It preserved the same host, the existing key, file location, and unrelated private settings. No plaintext credential backup was created.

## Implementation

`supabaseTableUrl()` no longer searches for, accepts, or rewrites a configured `/rest/v1/<table>` suffix and no longer accepts a configured `/rest/v1` root. It removes one optional trailing slash from the already-approved project root, then appends `/rest/v1/` and the active table name.

PlatformIO now runs `scripts/validate-firmware-supabase-config.py` before compilation. The guard reads the ignored file but reports only safe classifications. It rejects missing or malformed definitions, placeholders, non-HTTPS URLs, unrecognized project hosts, credentials or ports in the URL authority, query/fragment data, `/rest/v1`, table-suffixed paths, and every other non-root path. Failures do not echo the rejected value.

The tracked example remains a placeholder project-root shape and now states explicitly that firmware appends the table route. The existing Balcony02 contract validator checks the root-only resolver source, exact three active targets, tracked example, build hook, synthetic resolver cases, negative configurations, and safe private classification.

## Resolver and negative proof

Deterministic tests use synthetic values only. For a recognized synthetic project root both without and with a trailing slash, resolution is exactly:

| Table input | Resulting path |
| --- | --- |
| `sensor_measurement_batches` | `/rest/v1/sensor_measurement_batches` |
| `device_heartbeats` | `/rest/v1/device_heartbeats` |
| `watering_events` | `/rest/v1/watering_events` |

Negative tests reject placeholder project hosts, placeholder keys, table-suffixed URLs, the `/rest/v1` root, non-HTTPS URLs, malformed URLs, unrelated paths, unrecognized hosts, and query-bearing URLs. The tests and build guard reveal case classifications and pass/fail only.

## Firmware artifact comparison

The untouched Phase 8F.5 baseline was rebuilt before modification and reproduced its recorded evidence exactly. Post-change evidence is:

| Artifact | Phase 8F.5 baseline | Phase 8F.6 | Difference |
| --- | ---: | ---: | ---: |
| Resolved profile flags | 47 | 47 | unchanged |
| RAM | 48,580 bytes (14.8%) | 48,580 bytes (14.8%) | unchanged |
| Flash | 1,036,185 bytes (79.1%) | 1,035,753 bytes (79.0%) | -432 bytes |
| `firmware.bin` | 1,042,768 bytes | 1,042,336 bytes | -432 bytes |
| SHA-256 | `C8E34B781C8178FEFCF5A4530871093B55AE430F991021D2F512A44B2A788EA1` | `83E0D41DF34E5E296A261D4E472271C2A840A746FD36FAB64E50B2909D3328CE` | changed as expected |

RAM and all Balcony02 flags remain exact. The 432-byte flash/binary reduction is consistent with removing generic URL suffix search/substitution branches and the embedded legacy table-suffixed configuration text. The validation script is a host-side build guard and is not linked into firmware. The final built image contains `sensor_measurement_batches`, `device_heartbeats`, and `watering_events`; it contains no `sensor_logs` string.

## Validation

The following passed locally:

- safe private configuration validation and ignore check;
- synthetic resolver and negative configuration tests;
- the extended Balcony02 contract validator, with live endpoint checks intentionally skipped because no device URL was supplied;
- `pio run -e balcony02-gen2`;
- generic `pio run`;
- firmware binary target/retirement scan;
- frontend tests, 59 of 59;
- frontend lint;
- ordinary production build;
- hosted-readonly production build after the known sandbox process-spawn restriction required an authorized retry;
- hosted bundle and source retirement guards, with the expected hosted Gen2 measurement/diagnostic/watering view names retained;
- tracked secret-pattern and private-file tracking checks; and
- `git diff --check`.

No frontend source or configuration changed. Ordinary and hosted-readonly builds emitted the same asset names and byte sizes as each other at this boundary.

## Proof limits and remaining cleanup

This evidence proves local build-time rejection behavior, safe root-shape classification, deterministic construction of the three active table URLs, removal of arbitrary configured-table suffix compatibility, successful firmware/frontend builds, preservation of source-level Balcony02 contracts, and absence of `sensor_logs` from the built firmware.

It does not prove runtime Wi-Fi/TLS behavior, DNS resolution, live table inserts, API-key authorization, current grants or RLS behavior, event retry, sensor reads, local endpoint responses, reservoir transitions, relay electrical behavior, pump shutoff on hardware, or physical watering. No firmware was uploaded, no serial monitor was opened, no live device request or cloud POST was made, and Supabase was not queried or modified. The built binary changed, but no byte-for-byte runtime-equivalence claim is made; retained behavior is supported by source contracts, validators, and successful compilation rather than hardware execution.

Remaining Phase 8F work is separately bounded registry/database truth and historical cleanup: retired device registry entries, any legacy `sensor_logs` table/schema/row/grant/RLS disposition, and historical references that should remain evidence versus current authority. This phase does not authorize or perform that cleanup.
