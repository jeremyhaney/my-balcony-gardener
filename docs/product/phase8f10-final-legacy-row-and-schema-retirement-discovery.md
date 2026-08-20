# Phase 8F.10 — Final Legacy Rows and Schema Retirement Boundary

Date: 2026-08-20

Status: Discovery complete. The exact six-row proposal was separately approved and executed on 2026-08-20; its [execution record](./phase8f10-delete-final-legacy-rows.md) proves both tables remain present and empty. The separate schema/access proposal remains unapproved and unexecuted. The discovery details below preserve the pre-execution live snapshot.

## Outcome

The final six legacy rows are disposable development/validation data, not physical-device evidence:

- the three `public.sensor_logs` rows identified as `esp32-dev-01` are one manually seeded Phase 4 history-UI test set;
- the three `public.sensor_events` rows identified as `mbg_esp32_001` explicitly identify themselves as `Sample Phase 5B validation event` rows; and
- neither identifier is Balcony02, a known retired UUID, or an early Balcony02 identity.

At the discovery snapshot, the live schema had exactly three rows in each legacy table. The separately approved exact deletion later removed those six rows without changing schema or access. `sensor_logs` has no supported current or future Gen2 consumer and can be dropped only under the remaining separate schema/access proposal. `sensor_events` has no software consumer, but ADRs 0005, 0017, and 0021 still approve it as an isolated manual operational-context log; retain the table, constraints, indexes, and RLS while removing its unnecessary Data API role grants only if separately approved. The shared `is_device_telemetry_insert_enabled(text)` function must remain because current Gen2 measurement-batch and watering-event insert policies depend on it.

Prepared artifacts and current execution state:

- [`../sql/phase8f10-final-legacy-row-deletion-proposal.sql`](../sql/phase8f10-final-legacy-row-deletion-proposal.sql): executed once under separate exact-hash approval; exact six-row DML only; 7,860 bytes; SHA-256 `6b4d8c2e1852ddb08ef7437ac0d7716b7c453ab7de081f668219ba1ae304495b`;
- [`../sql/phase8f10-legacy-schema-access-retirement-proposal.sql`](../sql/phase8f10-legacy-schema-access-retirement-proposal.sql): unapproved and unexecuted; requires both legacy tables to be empty, removes the `sensor_logs` schema/access surface, and revokes obsolete API grants from retained `sensor_events`; 9,783 bytes; SHA-256 `1100d1e6edb2a73a1a88a24fe52cb55297b22bd1ddd6e944f0217e8443c7ca83`.

The row slice and schema/access slice require separate explicit approvals. Approval and execution of the row slice did not authorize the schema/access slice.

## Repository and authority baseline

Discovery began from:

- repository `C:\AIProjects\projects\my-balcony-gardener`;
- branch `main`;
- `HEAD` `330e00a802c9187f7c1ff3b2a3def01c37a083e1`;
- upstream and `origin/main` at the same commit;
- ahead/behind `0/0`; and
- clean working tree.

The complete Supabase skill was read before database work. The active schema digest, June/August live schema snapshot, ADR digest, relevant raw ADRs, Phase 8F.3/8F.5/8F.7/8F.8/8F.9 records, protected export manifests, repository source, support captures, and complete Git history were inspected. Database access used only repeatable-read, read-only PostgreSQL transactions except that no destructive proposal was submitted at all.

## Current official Supabase guidance reviewed

The 2026-08-20 review used current official guidance:

- [Supabase changelog breaking changes](https://supabase.com/changelog?types=breaking-change), including the 2026-04-28 change that new tables will stop receiving automatic Data/GraphQL API exposure by default. Existing tables keep their current grants, so the live grants below remain authoritative until explicitly revoked.
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api): grants decide whether a role can reach an object; RLS decides which rows it can access. Both layers must be audited.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): exposed tables require intentional RLS policies; service roles can bypass RLS.
- [Tables, grants, and view security](https://supabase.com/docs/guides/database/tables): views default to creator privileges unless configured as security-invoker; no view depends on either target table.
- [Deleting data and dropping objects safely](https://supabase.com/docs/guides/database/postgres/data-deletion): verify backups and dependencies, use transactions and timeouts, drop dependencies explicitly, treat `DROP TABLE` as an access-exclusive operation, and use `CASCADE` only with extreme caution. The proposals use no `CASCADE`.
- [Using custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas): `public` is the default exposed schema; live role grants therefore remain part of the Data API surface.

No reviewed breaking change invalidates this proposal. The automatic-grant change does not remove grants from these existing tables.

## Protected export and unchanged-state proof

Authoritative protected export directory:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f10_final_legacy_rows_20260820T184221Z`

ZIP:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f10_final_legacy_rows_20260820T184221Z.zip`

- manifest SHA-256: `7b60f175502b9890286f8a6794471c7da46c43eabf2d9d4d77cc7c3b0fc65ee5`;
- ZIP SHA-256: `1b74dfd19ec0a6719e7998ca8486b7e4756118a57f08c6257be38475642119b0`;
- ZIP bytes: `7,461`;
- `sensor_logs` JSONL: 3 database rows = 3 written = 3 parsed, 785 bytes, SHA-256 `76d1b3774e9d8d40be5fa343db292cfa66fb53a97457e571fb630a261c0030e3`;
- `sensor_events` JSONL: 3 database rows = 3 written = 3 parsed, 1,537 bytes, SHA-256 `0d2dc274af8aa62e257c8cd23ea3a99ed546196ace67720c817ba131781af93d`;
- the two row hashes reproduce the exact Phase 8F.9 excluded-row fingerprints;
- every primary key, identifier, timestamp, payload field, null, and metadata column is preserved;
- credential/token values are absent;
- ZIP integrity passed; and
- the complete per-file list is in the protected manifest and the committed [manifest summary](./phase8f10-final-legacy-row-export-manifest-summary.md).

The export transaction recorded identical target-table state before and after and identical complete public-schema metadata SHA-256 values before and after: `9d0400c2c4b73b42cdc932584cd45cba8a860cbbd768aa214d5ba4961c1b13a2`.

An independent later read-only transaction reproduced the row counts, both row hashes, the complete metadata fingerprint, zero Balcony02 legacy rows, and all 95 protected `reservoir_liquid_state` batches. Receipt:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f10_post_discovery_verification_20260820T184337Z.json`

SHA-256: `095cb4dde9adddf6b6c2e9dec4d09c6cf53feb5c879a8db3898e2deae51e26bc`.

## Six-row attribution

### `esp32-dev-01` in `sensor_logs`

Exact evidence:

- three and only three rows exist;
- timestamps are `2026-03-28T02:54:08.517271Z`, `02:59:08.517271Z`, and `03:04:08.517271Z`: exact five-minute steps sharing the same microsecond value;
- the rows vary temperature, humidity, moisture, watering state, watering duration, and last-watered values across the small set, exercising the complete then-current chart/list contract;
- they were inserted between commit `5acd4e8f` at 2026-03-27 22:10 EDT (`Phase 4B: make Supabase history path fail gracefully`) and commit `f5b94cd9` at 2026-03-28 00:01 EDT (`Phase 4C: refine read-only history UI behavior`);
- Phase 4C added history loading, empty/error handling, chart presentation, and the same payload fields the three rows exercise;
- no repository or support-capture file contains this identifier or its exact payload before the Phase 8F inventory records;
- complete Git-history searches found no configured firmware identity, profile, registry seed, assignment, or physical commissioning record using this identifier; and
- the protected retired-UUID `sensor_logs` export starts on 2026-05-06 and ends on 2026-05-29, 39 days after the development seed; its rows use exact provisioned UUIDs and the historical firmware path rather than the generic three-row seed identity; and
- production identity authority later required stable UUIDs. The installed retired Balcony01 UUID was `550e8400-e29b-41d4-a716-446655440000`; Balcony02 is a different UUID first registered months later.

Conclusion: **temporary development/test identity**. The identity name is corroborating evidence only; the batch timestamp pattern, commit bracket, payload coverage, three-row lifetime, and absence from every identity/provisioning source establish the test attribution. It is not attributed to a physical device and is not treated as an early retired-device identity.

### `mbg_esp32_001` in `sensor_events`

Exact evidence:

- all three rows have the identical event and creation timestamp `2026-05-07T18:46:16.571701Z`;
- every row contains `details.notes = "Sample Phase 5B validation event"`;
- the three rows deliberately cover `sensor_move`, `sensor_swap`, and `reference_reading`, including `MS001`, `HS001`, `HS002`, `basket_03_right`, `esp32_box`, and `workbench` sample fields;
- commit `3cfc0f95` at 2026-05-07 15:14 EDT documented that `sensor_events` had just been “validated with manual sample events”; the rows were created 28 minutes earlier; and
- the protected retired-device event export begins on 2026-05-14 and uses exact retired UUIDs or separately proven retired aliases; these three explicit fixtures predate that physical-device context by seven days; and
- no firmware, frontend, validator, fixture, profile, registry row, assignment, capture, or Git-history source uses this identifier as physical identity.

Conclusion: **temporary development/test identity** and the exact Phase 5B manual schema-validation fixture. It is not physical sensor-installation authority and is not an early identity of a known device.

### Repository, Git-history, and capture search coverage

Current-tree, all-commit-history, and protected-support searches covered both identifiers; all six primary keys and timestamps; the three `sensor_logs` payloads and watering fields; `MS001`, `HS001`, `HS002`, container/location values, summaries, event types, and Phase 5B note text; `SensorLogRow`, `fetchHistoryLogs`, `sendDataToSupabase`, table names, Data API paths, registry helpers, device UUIDs/keys/labels, build profiles, firmware names, and historical aliases.

Results:

- exact row content occurs only in the protected Phase 8F.10 export;
- exact identifiers occur only in Phase 8F.7–8F.10 inventory/assertion evidence and the protected support verifiers;
- the three event details are not an operational capture: their own note text and the Phase 5B commit identify them as the one-time validation set;
- the three log values match the historical row shape but no physical capture, firmware identity, or device registry source; their timing and payload variation align only with the Phase 4 history UI test window;
- current executable source contains no table consumer. The only current `sensor_logs` source occurrence is the negative Balcony02 contract guard; `sensor_events` has none; and
- historical source confirms one firmware writer and one frontend reader for `sensor_logs`, both retired, and only manual editor entry for `sensor_events`.

## Balcony02 exclusion proof

The exclusion does not rely on similar names:

- Balcony02's stable device UUID is `7e5bd328-ad68-4389-a71a-fa5cd01b3813`; neither legacy identifier equals it.
- The live Balcony02 registry row was created `2026-07-02T22:14:12.425367Z`.
- Balcony02's first live heartbeat and measurement batch are `2026-07-02T22:28:03.766341Z` and `2026-07-02T22:27:58Z`; first watering event is `2026-07-03T14:56:41Z`.
- The exact Balcony02 firmware UUID first appears in Git at commit `15258a44` on 2026-07-15.
- Physical commissioning completed 2026-08-12, with the accepted capability-effective instant `2026-08-12T17:03:41Z`.
- The final legacy rows end on 2026-03-28 and 2026-05-07, 56 and 85 days before the Balcony02 registry row.
- Live queries return zero Balcony02 UUID rows in both legacy tables.
- The protected export contains one Balcony02 registry row, nine capability rows, current heartbeat/batch/watering ranges, and all 95 historical `reservoir_liquid_state` batches; their boundaries remained unchanged.

Therefore no final legacy row can be Balcony02 evidence.

## Live schema, access, and dependency inventory

### `public.sensor_logs`

- Rows/range: 3 rows, `2026-03-28T02:54:08.517271Z` through `03:04:08.517271Z`.
- Columns: `id uuid not null default gen_random_uuid()`; `device_id text not null`; `timestamp timestamptz not null`; `data jsonb not null`.
- Constraint: `sensor_logs_pkey` on `id`.
- Indexes: `sensor_logs_pkey`; `sensor_logs_timestamp_idx` on `timestamp desc`.
- Table triggers: none.
- Foreign keys: none incoming or outgoing.
- RLS: enabled; forced RLS false.
- Policies:
  - permissive `SELECT` policy `Public read sensor logs` to `anon, authenticated`, `USING (true)`;
  - permissive `INSERT` policy `Registry active devices can insert sensor logs` to `anon`, `WITH CHECK (is_device_telemetry_insert_enabled(device_id))`.
- Explicit ACL: `anon`, `authenticated`, `service_role`, and owner `postgres` each have `DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`; `authenticator` has schema usage but no direct table privilege.
- Effective Data API exposure:
  - `anon` and `authenticated` can select every row;
  - `anon` can insert a row for any registry identity whose active/telemetry flags pass the helper;
  - no anon/authenticated update or delete policy exists despite broad object grants;
  - `service_role` has full privileges and bypasses RLS;
  - `public` is the exposed schema and no authenticator `pgrst.db_schemas` override was found.
- Dependent views: none.
- Functions containing/depending on the table: none.
- Table triggers: none.
- Publications/subscriptions: none, including no all-table publication.
- External dependencies: none; only table-owned defaults, primary key/indexes, policies, and toast storage.
- Current frontend/firmware/scripts/fixtures/validators: no reader or writer. The one current source occurrence is a negative Balcony02 firmware guard requiring the legacy string to remain absent.
- Historical writer: ESP32 `sendDataToSupabase()` until Phase 8F.5.
- Historical reader: frontend `fetchHistoryLogs()`/Sensor History/Demo until Phase 8F.3.
- Approved future Gen2 use: none. ADR 0016 kept compatibility while Gen1 existed; the only supported firmware and frontend have now retired both sides. Current Gen2 uses `sensor_measurement_batches`, `device_heartbeats`, and `watering_events`.

Dropping `sensor_logs` affects no current Customer, Support, Demo, auth, measurement-batch, heartbeat, watering-event, capability, registry, assignment, or hosted-view path.

### `public.sensor_events`

- Rows/range: 3 rows; all at `2026-05-07T18:46:16.571701Z`.
- Columns: 13 columns exactly documented in ADR 0005 and the live schema snapshot: UUID/timestamps, nullable device/sensor/container/location context, required type/summary/details/changed-by fields.
- Constraints: primary key plus three checks for the event-type allowlist, nonblank summary, and nonblank changed-by.
- Indexes: primary key plus six indexes on event timestamp, event type, sensor type, device ID, container ID, and location label.
- Table triggers: none.
- Foreign keys: none incoming or outgoing.
- RLS: enabled; forced RLS false.
- Policies: none.
- Explicit ACL: the same full table privileges are granted to `anon`, `authenticated`, `service_role`, and owner `postgres`; `authenticator` has no direct table privilege.
- Effective Data API exposure:
  - `anon` and `authenticated` have object grants but no RLS policy, so ordinary row select/insert/update/delete is denied;
  - `service_role` has full access and bypasses RLS;
  - the table remains an unnecessary reachable API object until grants are revoked.
- Views/functions/table triggers/foreign keys/publications/subscriptions: none.
- Current frontend/firmware/scripts/fixtures/validators: none.
- Historical writer: manual Table Editor/SQL Editor validation and later manual operational notes. Phase 8F.9 deleted 45 proven retired-device notes, leaving only the three Phase 5B fixtures.
- Historical reader: operator review and protected support-directory context exports; no application reader.
- Approved future Gen2 use: manual operational context remains approved by ADR 0005 and is explicitly preserved by ADRs 0017 and 0021, but it is not physical-sensor inventory, telemetry, watering evidence, or command/control.

The table is retained as isolated manual compatibility. The schema proposal removes all grants from `anon`, `authenticated`, and `service_role`; operator access through Table Editor/SQL Editor remains. A future Admin/API consumer must receive a separately reviewed explicit grant and RLS policy.

### Shared helper and governance objects

`public.is_device_telemetry_insert_enabled(text)` is `STABLE SECURITY DEFINER` with fixed `search_path=public`. It is executable by `anon`, `authenticated`, `service_role`, and `postgres`. Live dependency inspection found exactly three policy consumers before any proposal:

1. legacy `sensor_logs` anon insert;
2. current Gen2 `sensor_measurement_batches` anon insert; and
3. current Gen2 `watering_events` anon insert.

The schema proposal removes only dependency 1 and asserts dependencies 2 and 3 remain. The function and its grants are **Required current Gen2**. The `ensure_rls` event trigger and `rls_auto_enable()` governance function are unrelated to either table and remain **Required current Gen2** governance.

## Exact classification

| Object | Classification | Disposition |
| --- | --- | --- |
| Three `esp32-dev-01` `sensor_logs` rows | Obsolete—delete rows only | Delete only by three exact UUID primary keys after explicit row-slice approval. |
| Three `mbg_esp32_001` `sensor_events` rows | Obsolete—delete rows only | Delete only by three exact UUID primary keys after explicit row-slice approval. |
| `sensor_logs` base table, primary-key constraint, two indexes, two policies, and table grants | Obsolete—drop schema/access object | Drop after the independently approved row slice leaves both tables empty and schema preflight still matches. |
| Historical `sensor_logs` ADRs, phase records, applied SQL, Git history, and protected exports | Required historical evidence | Preserve. Update current-authority wording without rewriting history. |
| `sensor_events` table, columns, checks, indexes, and RLS state | Isolated compatibility | Retain for the still-approved manual operational-log use. |
| `sensor_events` grants to `anon`, `authenticated`, and `service_role` | Obsolete—drop schema/access object | Revoke all; no approved Data API consumer exists. |
| Historical `sensor_events` ADR/phase records and protected six-row export | Required historical evidence | Preserve even after sample-row deletion. |
| `is_device_telemetry_insert_enabled(text)` and its current Gen2 execute grants | Required current Gen2 | Retain; two current Gen2 policies continue to depend on it. |
| `sensor_measurement_batches`, `device_heartbeats`, `watering_events`, device registry/assignments/capabilities, hosted views, auth/RLS, and Balcony02 evidence | Required current Gen2 | Protected; neither proposal alters them. |
| Compatibility functions/views/triggers/FKs/publications/subscriptions for either legacy table | Uncertain—proof missing | None exist; no uncertain live object remains. |

## Dependency-ordered recommendation

1. **Row slice, separately approved:** verify the export/ZIP/SQL hashes and current exact six-row payload; lock only the two legacy tables; delete the three event fixture IDs and three log fixture IDs; assert exact counts, policy structure, Balcony02 registry, and all 95 reservoir batches; commit only if every assertion passes.
2. **Read-only gate:** repeat target counts/hashes, Balcony02 boundaries, and structural inventory. Do not infer row-slice approval as schema approval.
3. **Schema/access slice, separately approved:** require both legacy tables to contain zero rows; acquire bounded locks; confirm no external table dependency appeared; revoke unused `sensor_events` grants; revoke `sensor_logs` grants; drop its two policies, timestamp index, primary-key constraint/index, and table with `RESTRICT`; retain the shared helper; assert its two current Gen2 policy dependencies remain.
4. **Post-change verification:** confirm `sensor_logs` is absent; `sensor_events` is present, empty, RLS-enabled, and has no browser/server-role ACL; all current Gen2 tables/views/helpers remain; Balcony02 and 95 reservoir batches remain intact; rerun application/firmware guards and credential scans.
5. **Current-authority closeout only after execution:** change active digests/snapshot from “proposed” to “applied,” recording the executed SQL hashes and result. Historical ADRs and completed phase records remain unchanged.

No step uses `CASCADE`. Row and schema/access retirement remain independently approvable.

## Proposal assertions, timeouts, and rollback

Both proposals use one explicit transaction, `lock_timeout = 5s`, `statement_timeout = 60s`, and `idle_in_transaction_session_timeout = 60s`.

The row proposal:

- compares every live row as JSONB to the exact protected full-column payload;
- asserts exactly 3 + 3 total rows before deletion and 0 + 0 afterward;
- uses six exact primary keys plus the exact expected identifier;
- verifies delete counts are exactly 3 + 3;
- asserts the Balcony02 registry row, zero Balcony02 legacy rows, all 95 reservoir batches, and unchanged policy counts; and
- performs no DDL, grant, policy, function, view, trigger, index, constraint, or publication action.

The schema/access proposal:

- refuses to run unless both legacy tables are empty;
- fingerprints `sensor_logs` columns, RLS, policies, indexes, and constraint;
- aborts if any external view/function/trigger/FK/publication/subscription dependency appears;
- asserts the shared telemetry helper has exactly three policy dependents before and two current Gen2 dependents after;
- revokes `sensor_events` and `sensor_logs` API-role privileges explicitly;
- drops `sensor_logs` owned objects without `CASCADE`;
- retains `sensor_events`, the shared helper, current Gen2 tables, and protected evidence; and
- verifies the final ACL and protected boundary before commit.

Before either `COMMIT`, any exception aborts the transaction and PostgreSQL rollback restores all changes. After a committed slice, restoration requires a new explicit approval.

## Restore instructions

### After a committed row deletion only

1. Verify ZIP SHA-256 `1b74dfd19ec0a6719e7998ca8486b7e4756118a57f08c6257be38475642119b0`, manifest SHA-256 `7b60f175502b9890286f8a6794471c7da46c43eabf2d9d4d77cc7c3b0fc65ee5`, and both row-file hashes.
2. Confirm the live columns/defaults/types match `metadata/schema_access_dependencies.json`.
3. Begin one explicit transaction with the same timeouts and lock order.
4. Insert every JSONL column explicitly. Do not use upsert; primary-key conflicts must abort rather than overwrite current data.
5. Assert 3 + 3 restored rows and reproduce both row-file hashes from a new export.
6. Reconfirm zero Balcony02 legacy rows, one Balcony02 registry row, all 95 reservoir batches, and unchanged structural metadata before commit.

### After a committed schema/access retirement

1. Verify all protected hashes and inspect current compatibility before recreating anything.
2. Recreate `public.sensor_logs` under owner `postgres` with the exact four columns/defaults from metadata.
3. Recreate `sensor_logs_pkey` and `sensor_logs_timestamp_idx`, enable RLS without forcing it, and recreate the exact two policies from metadata. The shared helper should already exist; do not replace it.
4. If restoring the prior access posture, grant all table privileges to `anon`, `authenticated`, and `service_role`; understand that this intentionally restores the legacy public-select and registry-gated insert exposure.
5. If restoring `sensor_events` API access, grant only the explicitly approved privileges. `GRANT ALL` reproduces the old ACL but is not the recommended future posture.
6. Reinsert the protected JSONL rows using the row-restore procedure, re-export, hash, and verify.
7. Recheck every current Gen2 policy dependency, hosted view, auth path, Balcony02 count/range, and reservoir fingerprint before commit.

The protected metadata contains the exact table columns/defaults, constraints, indexes, policies, grants, RLS flags, helper definition/grants/dependencies, and absence of external dependencies. The raw export is a restore source, not restore authorization.

## Application, firmware, proposal, and repository validation

- Frontend tests: 60/60 pass.
- ESLint: pass.
- Ordinary and hosted-readonly TypeScript/Vite builds: pass and byte-identical. The first sandboxed hosted build hit the known local bundler process-spawn restriction; the authorized retry passed.
- Main JS: 815,960 bytes; SHA-256 `59bcd4c23722edef78ece1b495795b48420abf4377d4f0a701709a50f8de9ffb`.
- Browser JS: 340 bytes; SHA-256 `e5d9d77c7348a684f5a3c192faa352fc44c60a58f6f7ac0e61f91aaf026b4960`.
- CSS: 47,420 bytes; SHA-256 `7129f93a9419e53f5b66ff51b1840c4cfb297f9237e40a127de49282a9300169`.
- Hosted bundle guards: 15 forbidden legacy/control/retired-identity strings absent and 13 required Balcony02/current-view strings present.
- Frontend source/configuration guards: 58 source/test/configuration files checked; 11 retired identity/environment/local-endpoint/table patterns absent.
- `balcony02-gen2` firmware build: pass; RAM 48,580 bytes; flash 1,035,753 bytes.
- Firmware Supabase root/configuration guard, resolver self-tests, and negative configuration tests: pass without printing credentials.
- Static Balcony02 route/profile/sensor/order/safety contract validator: pass; live device checks intentionally skipped because no physical request was authorized.
- Proposal guard: 33/33 static checks pass, including exact hashes and IDs, independent row/schema scope, no `CASCADE`, no function drop, protected table exclusions, and dependency assertions.
- Final live SQL preflight: pass in a read-only repeatable-read transaction; both exact `DELETE` statements parsed under `EXPLAIN` without execution, both row hashes/counts and exact `sensor_logs` column/policy assumptions matched, the shared helper had three expected policy dependencies, and view/function/FK/publication/subscription counts remained zero.
- Protected-value and credential-pattern scan across every tracked addition and untracked proposal/evidence file: pass.
- `git diff --check`: pass.

The unchanged Vite main-chunk advisory remains non-fatal. No frontend or firmware source changed in this slice.

## Proof limits and next approvals

- The row classification is proven as development/validation data; it does not assign either generic identifier to a physical device.
- No live Data API request was necessary: catalog grants, RLS, policies, dependencies, and current consumer searches establish the exposure and ownership boundary. No credential was printed or committed.
- The active garden member/support-member overlap remains unrelated to this slice; no protected view definition or auth row changes.
- No physical device request, firmware upload, serial monitor, watering action, deployment, or database mutation occurred.

The first of the two originally required approvals—the exact hash-bound six-row deletion—was later granted, executed once, and independently post-verified. One explicit approval remains: separate approval to execute the exact hash-bound schema/access-retirement proposal.

Any schema/access approval must name the exact artifact hash current at execution time. The completed row approval grants no schema/access authority.
