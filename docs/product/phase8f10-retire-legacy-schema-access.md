# Phase 8F.10 — Retire Legacy Schema and Access

Date: 2026-08-20

Status: Complete. The exact approved schema/access artifact committed once, and independent read-only verification proved the complete expected catalog delta, effective API denial, surviving helper dependencies, and protected Balcony02 boundary.

## Outcome

The assertion-guarded transaction in [`../sql/phase8f10-legacy-schema-access-retirement-proposal.sql`](../sql/phase8f10-legacy-schema-access-retirement-proposal.sql) was executed exactly once from the approved 9,783-byte artifact with SHA-256 `1100d1e6edb2a73a1a88a24fe52cb55297b22bd1ddd6e944f0217e8443c7ca83`.

The transaction:

- revoked the specified `anon`, `authenticated`, and `service_role` table privileges from retained `public.sensor_events`;
- retained `sensor_events` as an empty, RLS-enabled/not-forced table with its columns, constraints, indexes, owner grants, and zero policies unchanged;
- removed the empty obsolete `public.sensor_logs` table with `RESTRICT` after explicitly removing its two policies, timestamp index, primary-key constraint/index, and specified API-role grants; and
- retained `public.is_device_telemetry_insert_enabled(text)` unchanged with its two surviving current Gen2 policy dependencies.

No data rows were deleted. No unrelated table, view, function, trigger, extension, dependency, grant, policy, RLS setting, publication, subscription, authentication record, frontend, firmware, deployment, or physical-device state changed.

## Execution controls

The immediate read-only pre-change snapshot reconfirmed:

- both legacy tables existed and were empty;
- complete metadata SHA-256 `9d0400c2c4b73b42cdc932584cd45cba8a860cbbd768aa214d5ba4961c1b13a2`;
- normalized metadata SHA-256 `3fe86508b79730ee931e6a68fa528c6b108dd981aa968f13f2cdbc076ff91688`;
- exact schema/access snapshot SHA-256 `ec2a40cd8f234a242d477aef6ae1eb80d7aac1b1fb88d92d5a69f86131044af8`;
- three helper-policy dependencies before execution;
- the exact Balcony02 registry and protected-table fingerprints; and
- all 95 `reservoir_liquid_state` batches with ordered-row SHA-256 `031600f2bba9e37e4dd8d9f131a0a26c907a54642defe6b513fffa61361e8360`.

The transaction completed with the ordered client statuses `BEGIN`, three `SET` statements, two table locks, preflight `DO`, two `REVOKE` statements, two policy drops, index drop, constraint drop, table drop, post-check `DO`, and `COMMIT`. It was submitted once and was not retried.

## Independent post-verification

A fresh repeatable-read, read-only connection proved:

| Check | Result |
| --- | --- |
| `public.sensor_logs` | absent |
| `public.sensor_events` | present, empty, RLS enabled/not forced, zero policies |
| `sensor_events` API-role ACL rows | none for `anon`, `authenticated`, or `service_role` |
| Effective API table privileges | all seven checked privileges false for all three roles |
| Direct role SELECT probes | denied for all three roles with SQLSTATE `42501` |
| Shared telemetry helper definition | byte-for-byte metadata match |
| Helper dependencies | exact expected `3 → 2` transition |
| Surviving dependencies | measurement-batch insert policy; watering-event insert policy |
| Complete normalized post-schema SHA-256 | exact expected `22a27b38484d03304d3c1ea81fba604f2703c9ab840ea57d4166547bc5f11a5c` |
| Complete full post-metadata SHA-256 | `98e30003b29b60a7a609f3872915930bb8c2d478dda88896f374ad216136d16a` |
| Hosted views / functions / dependencies / extensions | unchanged |
| Balcony02 registry, capabilities, assignment, heartbeats, batches, watering events | every pre-existing row unchanged |
| Protected reservoir batches | `95`, exact ordered-row hash unchanged |

The exact catalog-count delta was:

| Component | Before | After |
| --- | ---: | ---: |
| Relations | 26 | 25 |
| Columns | 487 | 483 |
| Constraints | 89 | 88 |
| Indexes | 53 | 51 |
| Policies | 12 | 10 |
| Grants | 1,213 | 1,164 |
| Dependencies | 35 | 35 |
| Functions | 192 | 192 |
| Views | 14 | 14 |
| Extensions | 7 | 7 |

Every normalized component hash matched the precomputed expected-after snapshot. The 49-grant reduction is exactly the dropped table's 28 relation grants plus the 21 revoked `sensor_events` grants; all unrelated grants are unchanged.

External support evidence:

- pre-change capture: `phase8f10_schema_prechange_capture_20260820T194021Z.json`, SHA-256 `ce6035b3db6f2563fd7423fe0147e35d71ed9839b7f8090a0db298d0895bc2cc`;
- execution receipt: `phase8f10_schema_execution_20260820T194203Z.json`, SHA-256 `32fa238003faabb3b3b59455441afc6b3a6ab0af52db54b813dfe5e39928ebc7`; and
- independent post-verification: `phase8f10_schema_postverification_20260820T194528Z.json`, SHA-256 `32c9e351cbdf17e295f95406d17256a5e15d359de0e5704f71dc81694436f0d4`.

The local Supabase CLI and advisor command were unavailable. The exact live catalog delta, privilege checks, direct role probes, dependency verification, static proposal checks, application tests, and firmware guards provide the recorded verification boundary; this record does not claim a Supabase Dashboard advisor run.

## Recovery boundary

The protected Phase 8F.10 export remains the recovery source for the retired table schema and its historical six rows. Recreating `sensor_logs` or restoring API grants would require a new, separately reviewed change. The shared helper must remain while either surviving Gen2 policy depends on it.
