# Phase 8F.7 — Retired Device Registry Inventory and Safety Export

Date: 2026-08-20

Status: Read-only discovery and verified safety export complete. No database deletion, update, schema change, grant change, RLS change, deployment, firmware action, or frontend behavior change was performed.

## Outcome

Phase 8F.7 established current live database truth for retired Balcony01, Scout01, and Prototype01/Bench01 identities and created a complete, parsed, hashed, recoverable local export of every row proposed for later deletion.

The live registry is not retired-safe yet. All three retired registry rows remain `active`, `telemetry_insert_enabled`, `heartbeat_insert_enabled`, and `hosted_visible`; all three garden assignments remain active and Support-visible. Balcony01 and Scout01 remain customer-visible. Public hosted views currently expose all three retired devices, and protected views expose them according to the live assignments.

This record is discovery and planning evidence only. It does not authorize deletion.

## Repository and access baseline

The clean baseline was:

- repository: `C:\AIProjects\projects\my-balcony-gardener`;
- branch: `main`;
- `HEAD`: `9852869c726030a182ab16ce039859d8a6994ae8`;
- configured upstream: the same commit;
- working tree: clean; and
- repository `AGENTS.md`: absent.

The complete Supabase skill was read. The current Supabase breaking-change changelog and official guidance for [Data API security](https://supabase.com/docs/guides/api/securing-your-api), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [view security](https://supabase.com/docs/guides/database/tables), and [database backups](https://supabase.com/docs/guides/platform/backups) were reviewed.

Relevant current guidance:

- Data API reachability is controlled by Postgres object grants; RLS separately controls rows.
- Supabase is moving new public-schema objects toward explicit opt-in Data API grants.
- ordinary Postgres views execute with owner privileges unless `security_invoker=true`; `security_barrier=true` is a different property;
- RLS should protect every exposed base table; and
- a logical backup/export is distinct from the platform's physical backup/PITR facilities.

No Supabase MCP/database tool, Supabase CLI, `psql`, or `pg_dump` client was available. The signed-in browser route was also unavailable. The approved access method was the existing protected direct PostgreSQL connection record in the separate support repository. The credential was consumed in memory only. Every transaction was forced to `repeatable read, read only`; preflight confirmed `transaction_read_only=on`, SELECT access to the registry, and permission to test the `anon` and `authenticated` roles. No credential value is present in this document, the tracked diff, or the protected export.

## Identity authority

Repository and live-registry authority agree on these identities:

| Disposition | Device | Device key | UUID |
| --- | --- | --- | --- |
| Retired | Balcony01 / Installed Balcony Unit | `balcony` | `550e8400-e29b-41d4-a716-446655440000` |
| Retired | Scout01 / Balcony Sensor Scout 01 | `scout01` | `28f4e6e3-5979-4af4-9753-34e185d8e47e` |
| Retired | Prototype01 / Bench01 / Bench Prototype Unit | `bench` | `318fab98-89ad-4f36-9100-3134a04e0be5` |
| Protected current | Balcony02 | `balcony02` | `7e5bd328-ad68-4389-a71a-fa5cd01b3813` |

Exact UUID predicates, not friendly names, define the proposed deletion boundary. The only alias-based addition is four `sensor_events` rows whose `device_id` is null and whose row content matches retired identity aliases. Balcony02's UUID is excluded from every predicate and export.

Two additional live identifiers have no mapping in repository authority:

- `esp32-dev-01`: three `sensor_logs` rows;
- `mbg_esp32_001`: three `sensor_events` rows.

They are `Uncertain—proof required`, are not included in the deletion proposal, and block a safe proposal to drop `sensor_logs` or delete all remaining `sensor_events` history.

## Live registry and assignment truth

All four registry rows are active, insert-enabled, heartbeat-enabled, and hosted-visible. The assignments are:

| Garden | Device | Assignment role | Customer | Support | Active |
| --- | --- | --- | --- | --- | --- |
| customer pilot garden | Balcony01 | `primary_controller` | visible | visible | yes |
| customer pilot garden | Scout01 | `telemetry_readings_sensor` | visible | visible | yes |
| customer pilot garden | Balcony02 | `support_bench` | hidden | visible | yes |
| Support bench garden | Prototype01/Bench01 | `support_bench` | hidden | visible | yes |

There is one active garden membership and one active Support membership. They belong to the same identity. No auth-user identifier was exported or recorded.

## Base-row inventory

All timestamps below are exact instants emitted with the database session's `-04:00` offset. The JSONL files preserve full timestamps and values.

| Base table | Total rows | Proposed retired export | Balcony02 protected | Other/unproven | Retired min → max | Approx selected row bytes | Total relation bytes | Classification |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- |
| `device_capabilities` | 9 | 0 | 9 | 0 | — | 0 | 73,728 | Retain for Balcony02/current Gen2 |
| `device_heartbeats` | 24,191 | 21,763 | 2,428 | 0 | 2026-05-22 17:00:12.357414 → 2026-08-19 22:55:20.664495 | 12,555,948 | 20,611,072 | Delete retired rows only |
| `device_registry` | 4 | 3 | 1 | 0 | 2026-05-22 18:35:39.499879 | 472 | 49,152 | Delete retired rows only |
| `garden_devices` | 4 | 3 | 1 | 0 | 2026-06-07 15:41:30.861079 | 432 | 114,688 | Delete retired rows only |
| `sensor_events` | 48 | 45 | 0 | 3 `mbg_esp32_001` | 2026-05-14 15:52:16 → 2026-06-05 14:49:33.390312 | 50,715 | 221,184 | Delete retired rows only |
| `sensor_logs` | 38,207 | 38,204 | 0 | 3 `esp32-dev-01` | 2026-05-06 19:30:11 → 2026-05-29 18:20:12 | 10,103,344 | 13,631,488 | Delete retired rows only |
| `sensor_measurement_batches` | 23,631 | 21,203 | 2,428 | 0 | 2026-05-29 11:48:44.334403 → 2026-08-19 22:55:15 | 27,784,584 | 41,197,568 | Delete retired rows only |
| `watering_events` | 452 | 354 | 98 | 0 | 2026-06-08 08:54:40 → 2026-08-04 18:13:07 | 103,728 | 466,944 | Delete retired rows only |
| `gardens` | 2 | 0 | not device-keyed | 0 | — | — | 65,536 | Retain for Balcony02/current Gen2 |
| `garden_memberships` | 1 | 0 | not device-keyed | 0 | — | — | 98,304 | Retain for Balcony02/current Gen2 |
| `profiles` | 1 | 0 | not device-keyed | 0 | — | — | 49,152 | Retain for Balcony02/current Gen2 |
| `support_memberships` | 1 | 0 | not device-keyed | 0 | — | — | 81,920 | Retain for Balcony02/current Gen2 |

The proposed row total is 81,575. That includes the three registry rows, three assignments, 81,565 exact-UUID evidence rows, and four alias-matched `sensor_events` rows with null `device_id`. It includes zero Balcony02 rows.

Retired per-identity counts are recorded in the protected manifest. Important totals are:

- device heartbeats: Scout01 6,722; Prototype01 8,312; Balcony01 6,729;
- Gen2 batches: Scout01 6,722; Prototype01 7,753; Balcony01 6,728;
- legacy sensor logs: Scout01 1,049; Prototype01 1,284; Balcony01 35,871;
- watering events: Prototype01 214; Balcony01 140; Scout01 0; and
- exact-UUID sensor events: Scout01 10; Prototype01 15; Balcony01 16, plus four null-ID alias rows.

## Historical alias findings

- `Bench01`, `Prototype01`, `Balcony01`, and `Scout01` occur in the expected retired registry, assignment, heartbeat, measurement, watering, and manual-event records.
- `reservoir_liquid_state` occurs in 95 Balcony02 measurement batches and zero retired-device batches. Those 95 rows are protected and are not in any export or deletion predicate.
- the current commissioned capability name remains `reservoir_liquid_detected`.

## Views, exposure, and storage behavior

All 14 discovered public views are ordinary non-materialized views with zero independent relation storage. They derive their rows dynamically from base tables. None has `security_invoker=true`. The customer/support views have `security_barrier=true` and enforce explicit `auth.uid()` membership joins; the public and internal views do not have that barrier option.

| View | Sources | Current retired exposure | Classification |
| --- | --- | --- | --- |
| `sensor_measurements_flat` | `sensor_measurement_batches` | 140,415 derived rows; base/internal grant denies anon/authenticated | Retain for Balcony02/current Gen2 |
| `hosted_gen2_measurements` | flat view + registry | 140,415 rows to `anon` and `authenticated` | Retain for Balcony02/current Gen2 |
| `device_diagnostics_normalized_internal` | registry + latest heartbeat | 3 rows; browser roles denied | Retain for Balcony02/current Gen2 |
| `hosted_device_diagnostics` | normalized diagnostics + registry | 3 rows to `anon` and `authenticated` | Retain for Balcony02/current Gen2 |
| `customer_garden_devices` | gardens + assignments + registry + garden membership | 2 retired devices for the live overlapping member | Retain for Balcony02/current Gen2 |
| `customer_hosted_gen2_measurements` | customer devices + flat view + registry | 73,367 retired rows for the live overlapping member | Retain for Balcony02/current Gen2 |
| `customer_hosted_device_diagnostics` | customer devices + normalized diagnostics | 2 retired devices for the live overlapping member | Retain for Balcony02/current Gen2 |
| `customer_watering_events` | customer devices + watering events | 140 retired events for the live overlapping member | Retain for Balcony02/current Gen2 |
| `customer_device_capabilities` | customer devices + capabilities | 0 retired capability rows | Retain for Balcony02/current Gen2 |
| `support_garden_devices` | gardens + assignments + registry + Support membership | 3 retired devices for the live Support member | Retain for Balcony02/current Gen2 |
| `support_hosted_gen2_measurements` | Support devices + flat view + registry | 140,415 retired rows for the live Support member | Retain for Balcony02/current Gen2 |
| `support_hosted_device_diagnostics` | Support devices + normalized diagnostics | 3 retired devices for the live Support member | Retain for Balcony02/current Gen2 |
| `support_watering_events` | Support devices + watering events | 354 retired events for the live Support member | Retain for Balcony02/current Gen2 |
| `support_device_capabilities` | Support devices + capabilities | 0 retired capability rows | Retain for Balcony02/current Gen2 |

`anon` was denied on every protected/internal view and succeeded on only the two intended public hosted views. The frontend currently consumes the public/customer/Support measurement and diagnostics views, the protected garden-device and watering views, and `support_device_capabilities`. The current Demo UI selects only Balcony02, so removing retired rows should not change its visible fixed-device presentation; it will remove the retired public Data API surface. The customer route will lose Balcony01 and Scout01 and will have no current customer-visible device because Balcony02 remains customer-hidden. The Support route will retain Balcony02 and lose all three retired devices.

Because the only active garden member is also the active Support member, this slice does not prove customer-only isolation with an identity that lacks Support membership. It does prove the exact live result for the currently configured account.

## RLS, grants, policies, functions, and dependencies

All 12 base tables have RLS enabled and forced RLS disabled.

Relevant live policies:

- `device_heartbeats`: anon registry-gated INSERT;
- `sensor_measurement_batches`: anon registry-gated INSERT;
- `watering_events`: anon registry-gated INSERT;
- `sensor_logs`: anon/authenticated SELECT plus anon registry-gated INSERT;
- `garden_devices`: authenticated customer-membership SELECT and Support-membership SELECT;
- `gardens`: authenticated customer-membership SELECT and Support-membership SELECT;
- `garden_memberships`, `support_memberships`, and `profiles`: authenticated self SELECT; and
- `device_registry`, `device_capabilities`, and `sensor_events`: zero browser-role policies.

The catalog contains broad default object grants on several RLS-protected base tables. Effective browser access is narrower because RLS has no matching UPDATE/DELETE/TRUNCATE policies. Exact grant rows are preserved in `metadata/grants.json`. Public hosted views grant SELECT to `anon` and `authenticated`; protected views grant SELECT only to `authenticated`; the two internal views grant neither browser role.

Relevant application/governance functions are:

| Function | Role in deletion boundary | Classification |
| --- | --- | --- |
| `is_device_heartbeat_insert_enabled(text)` | reads registry flags for heartbeat INSERT policy | Retain for Balcony02/current Gen2 |
| `is_device_telemetry_insert_enabled(text)` | reads registry flags for Gen2 batch/watering and historical sensor-log INSERT policies | Retain for Balcony02/current Gen2 |
| `set_device_registry_updated_at()` | registry update trigger helper | Retain for Balcony02/current Gen2 |
| `rls_auto_enable()` | public-table RLS governance event-trigger helper | Retain for Balcony02/current Gen2 |

`btree_gist` 1.7 and its extension-owned public objects are retained because Balcony02 capability lifecycle exclusion depends on them.

Relevant foreign keys are:

- `device_capabilities.device_id → device_registry.device_id`;
- `garden_devices.device_id → device_registry.device_id`;
- `garden_devices.garden_id → gardens.id ON DELETE CASCADE`;
- `garden_memberships.garden_id → gardens.id ON DELETE CASCADE`; and
- public profile/membership user IDs → `auth.users`, which are not part of this deletion boundary.

Telemetry/event tables do not have a foreign key to the registry. Views depend dynamically on the source tables listed above and do not block row deletion. The registry trigger and `ensure_rls` event trigger remain in place.

## Complete object classification

Each discovered live object has exactly one classification below. The protected metadata files retain the complete definitions and individual grant rows.

| Classification | Exact objects | Reason and future action |
| --- | --- | --- |
| Retain for Balcony02/current Gen2 | base tables `device_capabilities`, `gardens`, `garden_memberships`, `profiles`, and `support_memberships`; all 14 views listed above; functions `is_device_heartbeat_insert_enabled`, `is_device_telemetry_insert_enabled`, `set_device_registry_updated_at`, and `rls_auto_enable`; triggers `set_device_registry_updated_at` and `ensure_rls`; extension `btree_gist`; all constraints, indexes, policies, and grants except the separately uncertain `sensor_logs` policy/index surface | Keep these objects and all rows. Constraints, indexes, policies, and grants on tables receiving row deletion continue to serve the retained table and current rows; they are not deletion targets. |
| Delete retired rows only | base tables `device_heartbeats`, `device_registry`, `garden_devices`, `sensor_events`, `sensor_logs`, `sensor_measurement_batches`, and `watering_events` | Delete only the exported UUID/alias row subsets in the dependency order below. Preserve Balcony02 and the six unproven identifier rows. Keep every table after row deletion. |
| Drop after retired-row deletion | none | Every discovered view is dynamic and remains part of current Gen2; no table, view, function, policy, grant, index, constraint, trigger, or extension is proven obsolete solely because retired rows are removed. |
| Retain as historical schema | none among live database objects; applied Phase 7L/8B/8C SQL and schema evidence in Git | The applied SQL and schema snapshots are historical evidence, not live row stores or deletion targets. |
| Uncertain—proof required | the two `sensor_logs` policies, two `sensor_logs` indexes, and its primary-key constraint as a future schema-retirement surface; three `sensor_logs` rows keyed `esp32-dev-01`; three `sensor_events` rows keyed `mbg_esp32_001` | Current application and firmware no longer consume/write `sensor_logs`, but the unproven rows prevent any table/policy/index drop proposal. Map both identifiers before widening deletion or schema-retirement scope. |

The `Delete retired rows only` classification preserves its table object. `sensor_events` remains the operational-note schema after its retired subset is removed. `sensor_logs` likewise remains present; only a later proof-backed slice may decide whether its historical schema surface can be dropped.

Grant classification is object-scoped: every captured relation/sequence/function grant remains with its retained or row-cleaned owning object. No grant is independently proposed for revocation. The two `sensor_logs` policy definitions and its index/constraint surface remain uncertain as future schema-retirement candidates, but they are retained unchanged in the proposed row-deletion slice. Extension-owned `btree_gist` functions, operators, casts, and their grants are collectively `Retain for Balcony02/current Gen2`; they are not application deletion targets. All 89 captured constraints, 53 indexes, 12 policies, 1,213 grant rows, 192 public function rows, 35 dependency edges, and two triggers are accounted for by these object ownership rules.

## Proposed deletion matrix

In this section, **retired UUID set** means exactly:

`28f4e6e3-5979-4af4-9753-34e185d8e47e`, `318fab98-89ad-4f36-9100-3134a04e0be5`, and `550e8400-e29b-41d4-a716-446655440000`.

| Order/object | Exact later predicate and retired identity | Current consumer / dependency | Export and SHA-256 | Expected access/UI effect | Restore / proof still required |
| --- | --- | --- | --- | --- | --- |
| 2. `device_capabilities` child check | `device_id IN (retired UUID set)`; current result 0 | capability lifecycle table and customer/Support capability views; FK child of registry | `rows/device_capabilities.retired.jsonl`; `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | none at current count; policies/grants/views unchanged | no rows to restore; reconfirm zero and nine protected Balcony02 rows |
| 3. `garden_devices` | `device_id IN (retired UUID set)`; all three retired identities | customer/Support garden-device views and every protected evidence view; FK child of registry | `rows/garden_devices.retired.jsonl`; `95ec8b664a431dfb6e350ae4a079618e4b01e0e2b6331736a3437c5f20bccaf2` | customer loses Balcony01/Scout01; Support loses all three; Demo fixed to Balcony02 is unchanged | reinsert after registry parent on restore; reconfirm live account exposure and preserve Balcony02 assignment |
| 4a. `device_heartbeats` | `device_id IN (retired UUID set)` | internal/public/customer/Support diagnostics views; no FK | `rows/device_heartbeats.retired.jsonl`; `532255f954f20c4d130f2c2816a90021479b3a762955b109d606847aaa43537d` | retired diagnostics disappear dynamically; RLS/grants/view definitions unchanged | reinsert original rows after registry restore; refresh count/max timestamp immediately before deletion |
| 4b. `sensor_measurement_batches` | `device_id IN (retired UUID set)` | flat, hosted, customer, and Support measurement views; no FK | `rows/sensor_measurement_batches.retired.jsonl`; `8205de149339e2d38c44fca0ff286fed81259f0dcd2d034d3600f9ac1979c33d` | 140,415 retired flattened rows disappear; protected 95-row `reservoir_liquid_state` alias history remains; Demo stays Balcony02-only | reinsert full JSONB batches after registry restore; refresh count/max timestamp and protected alias count |
| 4c. `watering_events` | `device_id IN (retired UUID set)` | customer/Support watering-event views; no FK | `rows/watering_events.retired.jsonl`; `00fe1ab852b2624103dfd04675e93d6578b51bb31055ba6e02a358fd84d57896` | 140 customer and 354 Support retired rows disappear; Balcony02's 98 rows remain | reinsert original rows after registry restore; refresh count/max timestamp |
| 4d. `sensor_events` | `device_id IN (retired UUID set)` OR `id IN ('13ad8e69-61c6-4865-b2f3-d96f5a4b2930','174ff90f-30b2-4d55-b72f-4484ef035536','793aceb7-b98b-444b-9b07-4e890e05f75b','b11e47f2-33ec-43c7-93bc-5dfd93b4e759')`; exact UUID matches plus four null-ID retired-alias notes | operational-note table; no current frontend consumer, browser policy, or FK | `rows/sensor_events.retired.jsonl`; `b1dafcf4e17c5054f44e28a3be7fd57db060278c0898535ef1f444a427dbe71f` | no current UI effect; schema/grants unchanged | reinsert original rows; preserve three unproven `mbg_esp32_001` rows and reconfirm alias evidence |
| 5. `sensor_logs` | `device_id IN (retired UUID set)` | legacy Data API table; no current application/firmware consumer and no FK, but anon/authenticated SELECT and registry-gated INSERT policies still exist | `rows/sensor_logs.retired.jsonl`; `ed83dc424865756ce9ecdc2c982dd8c38c95a1d7115ec77925f3d1887ea2c971` | removes retired direct Data API history; no current UI change; policies/grants remain | reinsert original rows; preserve three `esp32-dev-01` rows and prove their identity before any schema drop |
| 6. `device_registry` parent | `device_id IN (retired UUID set)` | parent of capabilities/assignments; public hosted joins; heartbeat/telemetry insert-gate functions and policies | `rows/device_registry.retired.jsonl`; `aab79ca94375d3835cdf9577a8b2ca197f0d44a402cfa5c336629b3892aae6ff` | retired devices cease being active, insert-enabled, and hosted-visible; Balcony02 remains the only registry row | restore these parent rows first, then children/evidence; refresh registry flags and prove protected row byte-for-byte before commit |

The later transaction changes no RLS policy, grant, view, function, index, constraint, trigger, or extension. Its view impact is exclusively dynamic: deleted base rows stop appearing through existing definitions. The current overlapping customer/Support account proves the live result for that identity; a customer-only identity remains required only if independent customer isolation is an acceptance condition.

## Exact future deletion proposal

No destructive statement exists in this slice. A later explicitly approved deletion slice should use one transaction and this order:

1. Re-run or reconfirm the export immediately before deletion. Verify the manifest/archive hashes and exact retired/protected counts. Stop if any retired count changed, if Balcony02 appears in a predicate, or if the unknown identifiers have been silently added to scope.
2. Delete zero-or-more retired `device_capabilities` rows using only the three exact retired UUIDs. Current count is zero; this is a foreign-key child check, not authority to touch the nine Balcony02 rows.
3. Delete three `garden_devices` rows using only the three exact retired UUIDs. This removes customer/Support membership-derived device exposure without deleting either garden or any membership/profile row.
4. Delete retired evidence rows from `device_heartbeats`, `sensor_measurement_batches`, `watering_events`, and `sensor_events`. The `sensor_events` predicate is the exact retired UUID set plus the four exported null-ID rows whose retired alias match is recorded in the manifest.
5. Delete exactly 38,204 `sensor_logs` rows using only the three exact retired UUIDs. Preserve the three `esp32-dev-01` rows until their identity is proven. Do not drop the table or its policies/indexes in this slice.
6. Delete the three retired `device_registry` parent rows last. This removes their registry-gated insert eligibility and satisfies the two child foreign keys.
7. Before commit, assert all protected Balcony02 counts, hashes/identity, capability rows, assignment row, and public/protected current-view results are unchanged. Assert every retired predicate and retired view count is zero. Commit only after those checks pass.
8. After commit, repeat the read-only counts and customer/Support/Demo exposure checks. Keep the safety export and this evidence record.

The transaction should not delete `gardens`, memberships, profiles, Balcony02 rows, functions, views, grants, policies, indexes, constraints, or the two unproven identifiers. No schema object is currently classified `Drop after retired-row deletion`.

## Rollback and restore

If the future deletion transaction has not committed, rollback is ordinary transaction rollback.

After a committed deletion, restore from the verified JSONL files only after schema compatibility review:

1. verify the archive, manifest, and per-file SHA-256 values;
2. start a new explicit transaction;
3. reinsert the three `device_registry` parent rows with every original exported column;
4. reinsert `garden_devices` and any nonzero `device_capabilities` child rows;
5. reinsert heartbeat, batch, watering, sensor-event, and sensor-log rows with all original IDs, timestamps, nulls, and JSON/JSONB values;
6. fail on any primary-key conflict rather than overwriting current data;
7. validate counts and view exposure; and
8. commit only after the protected Balcony02 boundary remains unchanged.

The raw export is a safety source, not an executable restore approval.

## Local-source boundary

Current executable residue is limited and separable from historical evidence:

- `mbg_dashboard/src/deviceRegistry.ts` still defines retired keys, labels, roles, and UUIDs alongside Balcony02.
- `mbg_dashboard/src/historyControls.ts` can map any supplied registry key, but the active customer-site/Demo configuration supplies only `balcony02`.
- `mbg_dashboard/src/customerSites.ts` already lists only Balcony02.
- `HostedSiteHeader.tsx` still contains a stale `Balcony01` fallback label.
- no current fixture/test owns a retired UUID; the current watering-cycle fixture uses Balcony02.
- README/current-state/product documents and applied SQL artifacts contain extensive historical references and must remain evidence unless a later documentation cleanup proves a reference is incorrectly presented as current authority.

Recommended sequencing: perform a separate non-destructive local registry cleanup immediately before the live deletion slice, commit and validate it, then run the separately approved database deletion using the frozen UUID predicates from this record. Remove executable registry residue and the stale fallback, but retain historical SQL and phase evidence. Do not combine the local code commit with the destructive database transaction.

## Safety export and verification

Protected directory:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f7_retired_device_safety_export_20260820T170241Z`

Downloadable ZIP:

`C:\AIProjects\projects\my-balcony-gardener_support\exports\phase8f7_retired_device_safety_export_20260820T170241Z.zip`

- ZIP bytes: 6,538,663
- ZIP SHA-256: `8e7ddb7d66ab3f0145a8da0d12720d8d9336703af1824c5527041b7011dfb71d`
- ZIP entries: 26
- ZIP integrity check: pass
- manifest SHA-256: `878ecb7e3b5c7e6bf3af325e5867919e7822708cf898d84e16c094cb1a8b83dc`
- row export files: 8
- metadata/verification files: 16
- database counts = written counts = parsed counts: pass
- Balcony02 UUID absent from every retired-row export: pass
- credential/token values absent from export payloads: pass
- retired, protected, full-table, and schema metadata state unchanged before/after: pass

The export used one consistent repeatable-read snapshot. No snapshot inconsistency was observed. A later deletion slice must still refresh or reconfirm because the live database can change after this timestamp.

See the non-sensitive [manifest summary](./phase8f7-retired-device-safety-export-manifest-summary.md) for per-file counts, sizes, and hashes. Raw production exports are intentionally outside Git.

## Proof still required

- Map `esp32-dev-01` and `mbg_esp32_001` from authoritative historical evidence before deleting their rows or dropping `sensor_logs`.
- Reconfirm the export and counts immediately before any destructive transaction because the retired registry rows remain insert-enabled until deletion.
- Validate a customer-only authenticated identity if future acceptance requires proof independent of the current overlapping customer/Support account.
- Obtain explicit user approval for the exact destructive SQL slice. Export completion is not deletion authorization.
