# Phase 8G.4 Sensor Identity Production Execution Evidence

Date: 2026-08-26

## Approved scope

Jeremy approved execution of the exact additive Phase 8G.4 production schema
proposal after the same artifact passed isolated PostgreSQL 17.6 constraint,
authorization, query-plan, rollback, and clean-reapply tests.

The production execution was limited to:

- `public.sensor_assets`;
- `public.sensor_installations`;
- `public.support_sensor_assets`; and
- `public.support_sensor_installations`.

No seed/backfill, telemetry rewrite, capability rewrite, firmware change,
frontend deployment, watering change, command/control path, commit, or push was
authorized or performed.

## Exact artifact

Artifact:
`docs/sql/phase8g4-sensor-asset-installation-contract-proposal.sql`

SHA-256:
`27D14B8EBDF832A6135E6A7CB6025FDC8483ECB478C9996091947EDC124CC809`

Target: Supabase project `my-balcony-gardener`, project reference
`nkicadvdjpcjhkoluvwf`, main Production database.

Fresh preflight confirmed PostgreSQL 17.6, `btree_gist` 1.7, compatible
authority-column types, and absence of all four target objects. The exact
203-line, 7,780-character transaction then completed successfully.

## Production validation

Read-only validation completed at `2026-08-26T22:02:52.259273Z`.

| Check | Result |
| --- | --- |
| Exact four approved objects | Pass |
| RLS enabled on both base tables | Pass |
| Base-table RLS policies | Zero, as designed |
| Anon base/view access | Denied |
| Authenticated base-table access | Denied |
| Authenticated Support-view SELECT | Granted |
| Logical-slot and asset exclusion constraints | Both present |
| Support view `security_barrier` options | Both present |
| Asset rows | 0 |
| Installation rows | 0 |
| Unapproved asset views | 0 |
| Existing capability rows | 14 |
| Existing measurement batches | 3,174 |

Transaction-scoped `authenticated` and `anon` probes additionally proved:

- an active Support identity can query the new Support views;
- the unseeded views return no asset or installation evidence;
- an unassigned identity sees no Support-visible devices or new identity rows;
- authenticated direct reads of both base tables fail; and
- anon reads of both Support views fail.

The view dependency catalog contains only `sensor_assets`,
`sensor_installations`, `support_memberships`, and `support_garden_devices`
(plus each view's self-rewrite dependency). No measurement, watering, firmware,
or control object is a dependency.

## Advisor result

Supabase Security Advisor lists twelve existing `Security Definer View`
findings after execution, including one finding for each new Support view. The
new findings are expected for the approved owner-executed protected-view model.
Authorization is explicit and tested through `auth.uid()` Support membership;
the underlying tables remain unavailable to browser roles.

Changing these views to `security_invoker` without also redesigning base-table
grants and RLS would make the Support read contract unusable. Any such redesign
is a separate approval stage and must repeat isolation, role, and production
validation.

## Remaining gates

- Additional physical QR tagging and asset/installation provisioning require
  separate row-data approval. Legacy labels must not be inferred into asset
  records.
- Frontend compatibility and Support workflow implementation remain separate.
- Firmware contract changes and each device upload remain separate.
- Historical measurement projection cleanup remains destructive and separately
  approved; raw append-only evidence must remain preserved.

## First asset-only pilot execution

Jeremy separately approved execution of the reviewed MS02 asset-only proposal:
`docs/sql/phase8g4-ms02-first-asset-proposal.sql`.

The transaction completed successfully against the main Production database.
It registered:

- asset UUID `873bc473-98fc-4b23-beeb-5d80e7bf945a`;
- asset tag `MBG-SA-000001`;
- family/model DFRobot `SEN0308`;
- no manufacturer serial; and
- no firmware-discoverable hardware UID.

A separate read-only production query verified exactly one row matching the
approved UUID, tag, family, manufacturer, model, and null identity fields. It
also verified zero `sensor_installations` rows for the asset. The database
recorded `created_at` as `2026-08-27 03:56:23.910579+00`.

No installation effective time was inferred, no telemetry was rewritten, and
no frontend, firmware, watering, or command/control change was made.

Jeremy confirmed that P02 remains a simulation unit and that installation
verification is not required for this pilot. The MS02 pilot therefore closes
as an intentionally asset-only record. No future installation row is pending
for this simulation use.
