# Phase 8F.9 — Delete Retired Device Database Rows

Date: 2026-08-20

Status: Stage A verified safety export complete; exact hash-bound Stage B transaction explicitly approved, committed, and read-only post-verified. No schema object, RLS policy, grant, function, view, index, constraint, authentication record, frontend behavior, firmware configuration, deployment, upload, or physical watering action changed.

## Outcome

Phase 8F.9 deleted exactly 81,575 live database rows proven to belong to retired Balcony01, Scout01, and Prototype01/Bench01 identities. One atomic transaction used the three exact retired UUIDs and four exact null-device `sensor_events` primary keys, acquired the target-table locks in a fixed order, and asserted every pre-count, delete count, protected boundary, fingerprint, dependency, post-count, and dynamic-view result before commit.

Balcony02 remains the sole registry row and sole Support-visible assignment. Its registry row, assignment, nine capability rows, 98 watering events, live heartbeat/batch history, and all 95 historical `reservoir_liquid_state` batches remain intact. The three `esp32-dev-01` `sensor_logs` rows and three `mbg_esp32_001` `sensor_events` rows remain byte-for-byte unchanged and unmapped. No table or other schema object was dropped or altered.

## Repository and approval boundary

The Stage A baseline was:

- repository: `C:\AIProjects\projects\my-balcony-gardener`;
- branch: `main`;
- `HEAD`: `51b15a1b6280517533150e07a9fb4563c58cda21`;
- configured upstream and `origin/main`: the same commit;
- ahead/behind: `0/0`; and
- working tree before the proposed SQL artifact: clean.

The complete Supabase skill and relevant Supabase/PostgreSQL guidance for transactions, deletes, RLS, views, dependencies, locking, and logical backup/restore were reviewed. The complete Phase 8F.7 inventory, manifest summary, protected export metadata, dependency order, and deletion proposal were read before live discovery.

Jeremy explicitly approved Stage B execution of:

- artifact: [`../sql/phase8f9-retired-device-row-deletion.sql`](../sql/phase8f9-retired-device-row-deletion.sql);
- bytes: 19,966;
- SHA-256: `c2147b915dbac1bfae6bf40f1e02575d15a01118f607745c56a03bf16bc5056e`;
- exact total: 81,575 rows; and
- boundary: only the three retired UUIDs and four exact null-device event IDs below.

No earlier approval-in-principle was treated as execution permission. Immediately before execution, the file hash, 52 static SQL safety checks, all eight live expected counts, and read-only `EXPLAIN` plans passed again.

## Exact deletion predicates and result

Retired UUID set:

- Scout01: `28f4e6e3-5979-4af4-9753-34e185d8e47e`;
- Prototype01/Bench01: `318fab98-89ad-4f36-9100-3134a04e0be5`; and
- Balcony01: `550e8400-e29b-41d4-a716-446655440000`.

Exact additional null-device `sensor_events` IDs:

- `13ad8e69-61c6-4865-b2f3-d96f5a4b2930`;
- `174ff90f-30b2-4d55-b72f-4484ef035536`;
- `793aceb7-b98b-444b-9b07-4e890e05f75b`; and
- `b11e47f2-33ec-43c7-93bc-5dfd93b4e759`.

| Dependency order | Table | Approved/asserted before | Verified after |
| ---: | --- | ---: | ---: |
| 1 | `device_capabilities` | 0 | 0 |
| 2 | `garden_devices` | 3 | 0 |
| 3 | `device_heartbeats` | 21,763 | 0 |
| 4 | `sensor_measurement_batches` | 21,203 | 0 |
| 5 | `watering_events` | 354 | 0 |
| 6 | `sensor_events` | 45 | 0 |
| 7 | `sensor_logs` | 38,204 | 0 |
| 8 | `device_registry` | 3 | 0 |
|  | **Total** | **81,575** | **0 remaining** |

Every DELETE used an explicit identity array. No friendly-name, date-range, wildcard, negative/protected-device, or inferred-group predicate exists in the artifact.

## Atomic execution and client-result note

The exact approved SQL was submitted once through a read-write direct PostgreSQL connection. The multi-statement call returned without any database exception. Its transaction acquired `SHARE ROW EXCLUSIVE` locks across the eight target tables, used a five-second lock timeout and 120-second per-statement timeout, captured protected row fingerprints/counts inside the locked transaction, executed dependency-ordered deletes, asserted the exact per-table and total deleted counts, asserted zero retired base/view rows, rechecked protected/unproven fingerprints, and reached its embedded `COMMIT`.

The local execution wrapper initially reported `Approved SQL did not finish with COMMIT: BEGIN` because Psycopg exposes the first result status until the caller advances through `nextset()`. It did not report a database exception. The deletion was not retried. A harmless read-only `select 1; select 2; select 3` probe reproduced the same result-set behavior and returned all three results when advanced. A later independent read-only transaction found the complete asserted committed state: all approved rows absent and every protected boundary intact. This proves the original call committed; it also records the wrapper receipt limitation instead of hiding it.

Protected post-execution evidence is stored outside Git at:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f9_post_execution_verification_20260820T181612Z.json`

SHA-256: `c21b78acd7c4d6714c14eb2cb861682357a0be4b06051989f9ba7720aa132565`.

## Refreshed protected safety export

Export directory:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f9_retired_device_safety_export_20260820T174246Z`

ZIP:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f9_retired_device_safety_export_20260820T174246Z.zip`

| Artifact | Evidence |
| --- | --- |
| Manifest SHA-256 | `f447009620d74d8dacd648bf0f72d2acd87cddec3acaa9fb35531e165937ca1b` |
| ZIP SHA-256 | `239edb2a1eadbd2562b802caf01939b15bcd1e086d8d17e554bb46e5ce7b8e44` |
| ZIP bytes / entries | 6,177,626 / 27 |
| Stage A fingerprints SHA-256 | `8949c34b44bdf300e1e1d9d7c250226a143366cf152ec2a65c198ac4e3be19a6` |
| Row files / parsed rows | 8 / 81,575 |
| Manifest payload | 25 files / 129,004,383 bytes |
| Integrity | database = written = parsed counts; every file byte count and SHA-256 verified; ZIP CRC and payload match passed |

Every retired row-file count and SHA-256 was identical to Phase 8F.7. The refreshed archive hash differs because snapshot/verification metadata and the Stage A fingerprint sidecar are new. Balcony02 contributed zero exported rows. Credentials, auth tokens, protected IDs, and both unproven identifiers were absent from every retired row file.

## Protected and unproven row verification

The first complete post-execution snapshot was `2026-08-20T14:15:49.890437-04:00`:

| Protected/excluded subset | Stage A | Post-execution | Result |
| --- | ---: | ---: | --- |
| Balcony02 registry | 1 | 1 | exact fingerprint unchanged |
| Balcony02 assignment | 1 | 1 | exact fingerprint unchanged |
| Balcony02 capabilities | 9 | 9 | exact fingerprint unchanged |
| Balcony02 heartbeats | 2,431 | 2,433 | all Stage A history hash-preserved; two natural later rows |
| Balcony02 measurement batches | 2,431 | 2,433 | all Stage A history hash-preserved; two natural later rows |
| Balcony02 watering events | 98 | 98 | exact fingerprint unchanged |
| Balcony02 `sensor_events` / `sensor_logs` | 0 / 0 | 0 / 0 | unchanged |
| Balcony02 `reservoir_liquid_state` | 95 | 95 | SHA-256 `ed8c9ccdf43f665e0bf112c25893dc878da31f33b730b4740ad61f38f04a9e14` unchanged |
| `esp32-dev-01` `sensor_logs` | 3 | 3 | SHA-256 `76d1b3774e9d8d40be5fa343db292cfa66fb53a97457e571fb630a261c0030e3` unchanged |
| `mbg_esp32_001` `sensor_events` | 3 | 3 | SHA-256 `0d2dc274af8aa62e257c8cd23ea3a99ed546196ace67720c817ba131781af93d` unchanged |

The two heartbeat/batch pairs are the permitted time-dependent diagnostic advancement: one arrived after Stage A and before execution; one arrived after commit and before the post-verification snapshot. Filtering the post-state to each Stage A maximum timestamp reproduced the exact Stage A count and canonical SHA-256 for both histories.

## Dynamic view result

Every one of the 14 device-keyed public views returns zero retired UUID rows and zero exact retired alias values. Role-specific checks also return zero retired rows for every view the role can query.

Current Balcony02 visibility is:

| Surface | Garden devices | Diagnostics | Flattened measurements | Watering events | Capabilities |
| --- | ---: | ---: | ---: | ---: | ---: |
| Public/anon | — | 1 | 26,858 | — | — |
| Customer | 0 | 0 | 0 | 0 | 0 |
| Support | 1 | 1 | 26,858 | 98 | 9 |

This matches the existing assignment: Balcony02 remains Support-visible and customer-hidden. Customer lost Balcony01 and Scout01. Support lost Balcony01, Scout01, and Prototype01/Bench01. No view definition changed; all result changes are dynamic consequences of the approved base-row deletion.

## Schema and access-control fingerprints

The complete Stage A metadata hash was `b3332389339b6e154f458863495d1889fd7121247f2f277d57a0e0a3b048e87a`. The complete post-deletion inventory hash is `9d0400c2c4b73b42cdc932584cd45cba8a860cbbd768aa214d5ba4961c1b13a2` because the relation inventory intentionally includes planner row estimates and physical relation sizes, which change after row deletion.

After excluding only those three dynamic relation fields, the Stage A and post-execution structural relation SHA-256 values are both:

`a524060f95496388823e99786650b99eeefcddee7ddee080e13d31bef20a8a7c`.

The exact columns, constraints, dependencies, extensions, functions, grants, indexes, policies, triggers, and view definitions each retained their Stage A component SHA-256. RLS enabled/forced state, relation kinds/options/comments, object ownership surface, and all dependency definitions remain structurally unchanged. No schema migration or DDL ran.

## Restore boundary

Before commit, any SQL exception would have aborted the transaction and ordinary rollback would have restored every deletion. The committed restore boundary is the refreshed full-column JSONL export:

1. verify the ZIP, manifest, and per-file SHA-256 values;
2. review current schema compatibility;
3. start one new explicit transaction;
4. insert the three registry parent rows first;
5. insert `garden_devices` and any capability children second;
6. insert heartbeat, batch, watering, sensor-event, and sensor-log evidence with original primary keys, timestamps, nulls, and JSON/JSONB values;
7. fail on primary-key conflicts rather than overwriting live rows;
8. revalidate counts, protected fingerprints, and view exposure; and
9. commit only if the complete boundary passes.

Restore feasibility is proven by the parsed full-column export, primary-key/foreign-key inventory, dependency order, and cryptographic verification. No restore was executed or authorized.

## Application, firmware, and repository validation

- Frontend tests: 60/60 pass.
- ESLint: pass.
- Ordinary and hosted-readonly TypeScript/Vite builds: pass and byte-identical.
- Main JS: 815,960 bytes; SHA-256 `59bcd4c23722edef78ece1b495795b48420abf4377d4f0a701709a50f8de9ffb`.
- Browser JS: 340 bytes; SHA-256 `e5d9d77c7348a684f5a3c192faa352fc44c60a58f6f7ac0e61f91aaf026b4960`.
- CSS: 47,420 bytes; SHA-256 `7129f93a9419e53f5b66ff51b1840c4cfb297f9237e40a127de49282a9300169`.
- Hosted bundle guards: 15 forbidden strings absent and 13 required Balcony02/current-view strings present.
- Frontend source/configuration guards: 60 files checked; retired identity, obsolete environment, local IP, `/logs`, and `/water-now` strings absent.
- `balcony02-gen2` firmware build: pass; RAM 48,580 bytes; flash 1,035,753 bytes.
- Firmware Supabase resolver self-tests and ignored private configuration classification: pass without printing credential values.
- Static Balcony02 route/profile/configuration contract guard: pass; live endpoint checks intentionally skipped because no physical request was authorized.
- Credential-marker scans: pass.
- `git diff --check`: pass.

The non-fatal Vite warning that the main chunk exceeds 500 kB is unchanged from the Phase 8F.8 boundary.

## Proof limits and next decision

- The two legacy identifiers remain unmapped. Their six rows are retained and block any claim that all legacy evidence is disposable.
- The current active garden member is also the active Support member. This proves the exact configured role result but not customer-only isolation using a separate identity without Support membership.
- The export is a targeted logical row restore source, not a replacement for Supabase physical backup/PITR, and no restore rehearsal wrote to a separate database.
- No Cloudflare deployment or served-bundle correspondence was performed or claimed.
- No physical endpoint call, firmware upload, serial monitoring, sensor action, or watering action occurred.
- No historical Markdown or applied SQL evidence was mechanically purged; earlier phase documents remain accurate historical records at their own timestamps.

The next separately approved Phase 8F decision is legacy schema disposition: whether `sensor_logs`, its retained policies/indexes/constraint/grants, and any other historical schema surface can be retired after authoritative mapping or explicit preservation of `esp32-dev-01` and `mbg_esp32_001`. No schema object is approved for deletion by Phase 8F.9.
