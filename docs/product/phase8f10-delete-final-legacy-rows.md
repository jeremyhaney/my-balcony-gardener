# Phase 8F.10 — Delete Final Legacy Rows

Date: 2026-08-20

Status: Complete. The exact approved six-row DML artifact committed once and the complete independent read-only post-verification passed. The separate schema/access proposal remains unapproved and unexecuted.

## Outcome

The assertion-guarded transaction in [`../sql/phase8f10-final-legacy-row-deletion-proposal.sql`](../sql/phase8f10-final-legacy-row-deletion-proposal.sql) was executed from the exact 7,860-byte artifact with SHA-256 `6b4d8c2e1852ddb08ef7437ac0d7716b7c453ab7de081f668219ba1ae304495b`.

It deleted only:

- three exported `esp32-dev-01` rows from `public.sensor_logs`; and
- three exported `mbg_esp32_001` rows from `public.sensor_events`.

Both tables still exist and now contain zero rows. No table, view, function, trigger, index, constraint, policy, grant, RLS setting, publication, subscription, authentication record, frontend, firmware, deployment, or physical-device state was changed.

## Execution controls

Immediately before execution, the protected export directory and ZIP matched their manifests byte-for-byte. The live repeatable-read preflight reconfirmed:

- exact counts of three rows in each table;
- exact row hashes `76d1b3774e9d8d40be5fa343db292cfa66fb53a97457e571fb630a261c0030e3` and `0d2dc274af8aa62e257c8cd23ea3a99ed546196ace67720c817ba131781af93d`;
- complete metadata fingerprint `9d0400c2c4b73b42cdc932584cd45cba8a860cbbd768aa214d5ba4961c1b13a2`;
- zero Balcony02 rows in either legacy table;
- the exact Balcony02 registry-row hash; and
- all 95 protected `reservoir_liquid_state` batches and their exact ordered-row hash.

The approved SQL then acquired `SHARE ROW EXCLUSIVE` locks on both target tables and asserted the complete exported row identities/content, delete counts, empty post-state, Balcony02 registry identity, 95 protected batches, and unchanged target policy counts before `COMMIT`.

The execution client submitted the SQL once. It initially surfaced the first multi-statement result status (`BEGIN`) rather than advancing to the final result status. The SQL was not retried. A fresh independent read-only connection proved the commit outcome, and a reconciliation receipt records the one-submission/no-retry boundary.

## Independent post-verification

Every post-verification gate passed in a new repeatable-read, read-only transaction:

| Check | Result |
| --- | --- |
| `sensor_logs` exists / total rows | yes / `0` |
| `sensor_events` exists / total rows | yes / `0` |
| Six exact primary keys remain | `0` |
| Legacy identifiers remain | `0` |
| Complete metadata fingerprint | unchanged: `9d0400c2c4b73b42cdc932584cd45cba8a860cbbd768aa214d5ba4961c1b13a2` |
| Target schema/access/dependency snapshot | unchanged: `ec2a40cd8f234a242d477aef6ae1eb80d7aac1b1fb88d92d5a69f86131044af8` |
| Shared telemetry-helper dependencies | unchanged: `3` |
| Balcony02 registry row | unchanged; SHA-256 `cba7c5fa390447705e3cd7e6306c507f4fc4d06f2c8640dd73708154c497db4c` |
| Balcony02 protected reservoir batches | unchanged: `95`; SHA-256 `031600f2bba9e37e4dd8d9f131a0a26c907a54642defe6b513fffa61361e8360` |
| Publication/subscription membership | unchanged: none |
| Schema/access changes executed | no |

External support evidence:

- final frozen read-only preflight: `phase8f10_post_discovery_verification_20260820T191444Z.json`, SHA-256 `cb0d888968197aa5d06b2bfed565ce1b56cd5c3b76996538c5287b01dfd3c635`;
- independent post-verification: `phase8f10_post_execution_verification_20260820T191808Z.json`, SHA-256 `0128e54a9032c9ce811ed74d76500f27877d68a4d534ef33ca7c79b6be7a25ab`; and
- one-submission reconciliation: `phase8f10_row_deletion_execution_reconciliation_20260820T191905Z.json`, SHA-256 `9cdfce83e6aa9d9ee9b3a018598bd073f62770bf6e46dbac528c3a63bae80a08`.

## Remaining approval boundary

The schema/access proposal at [`../sql/phase8f10-legacy-schema-access-retirement-proposal.sql`](../sql/phase8f10-legacy-schema-access-retirement-proposal.sql), SHA-256 `1100d1e6edb2a73a1a88a24fe52cb55297b22bd1ddd6e944f0217e8443c7ca83`, remains proposal-only and unexecuted. It requires separate explicit approval. This row-deletion approval did not authorize dropping `sensor_logs`, changing `sensor_events` grants, changing RLS, or altering the shared helper or any other schema object.
