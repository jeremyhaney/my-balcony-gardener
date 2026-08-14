# Phase 8C Hosted Device-Capability Contract Design

Status: design and SQL proposal only; not executed, deployed, or provisioned
Authority: ADR 0024

## Decision summary

Use one positive `public.device_capabilities` lifecycle row per commissioned logical sensor. The durable logical identity is `(device_id, logical_sensor_key)`. The row UUID identifies one service interval; it is not the logical sensor identity. A device can therefore retire and later recommission the same logical channel without losing history.

One row carries a nonempty array of expected stored measurement names. This preserves sensor-to-measurement cardinality without turning each BME280 observation into a separate commissioned sensor. It also prevents stored or experimental measurements from becoming commissioning authority.

The initial migration proposes only `device_capabilities`,
`customer_device_capabilities`, `support_device_capabilities`, and the table's
constraints/indexes. The review package is:

- `docs/sql/phase8c-hosted-device-capability-contract-proposal.sql`;
- `docs/sql/phase8c-balcony02-capability-provisioning-proposal.sql`;
- `docs/sql/phase8c-hosted-device-capability-contract-validation.sql`; and
- `docs/sql/phase8c-hosted-device-capability-contract-rollback.sql`.

All are proposals. No SQL has been executed.

## Current-state evidence

- `device_registry.device_id` is the stable hosted device identity. Balcony02 is `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, key `balcony02`.
- `garden_devices`, `garden_memberships`, and `support_memberships` separate device assignment, customer access, and Support access.
- Protected views use explicit `auth.uid()` membership filtering, `security_barrier`, authenticated-only grants, and no browser grants on base metadata/telemetry tables.
- Gen2 stores one append-only `sensor_measurement_batches` row per package. `sensor_measurements_flat` expands records with `sensor_key`, `sensor_type`, optional `physical_sensor_id`, and `measurement_name`.
- ADR 0022 fixes current external names: DS18B20 uses `soil temp`; SEN0204 uses `reservoir_liquid_detected`; BME280 emits `air_temperature`, `relative_humidity`, and `barometric_pressure`.
- The current frontend keys cards by sensor plus measurement, maps DS18B20 legacy `temperature` to `soil temp`, and derives `moisture_index` from SEN0308 `raw_adc`. That frontend catalog is transitional presentation logic, not provisioning authority.
- The Balcony02 commissioning record separates physical markings, stable firmware/telemetry identity, and customer label. It proves nine installed logical sensors and explicitly says `sen0308_m04` is uninstalled accommodation.
- No relational table currently stores firmware `/capabilities`. Runtime/provisioning mismatch diagnostics cannot yet compare that manifest in hosted SQL.

The checked-in schema snapshot and executable migrations agree on these relevant contracts. Production metadata was not introspected; no authenticated read-only database connection was used.

## Selected relational model

### `public.device_capabilities`

| Column | Purpose |
| --- | --- |
| `id uuid` | Immutable identifier for one service interval. |
| `device_id text` | Foreign key to `device_registry`; authorization follows existing device assignment. |
| `logical_sensor_key text` | Stable device-local logical sensor identity, matching the established telemetry key such as `sen0308_m01`. |
| `logical_channel text` | Human/serviceable logical position such as `M01`, `L03`, `AIR`, `ST`, or `WL01`; not independently unique. |
| `sensor_family text` | Hardware/measurement family such as `SEN0308` or `BME280`; not identity by itself. |
| `expected_measurement_names text[]` | Nonempty stored-observation contract for this logical sensor. It does not authorize unknown names and does not include frontend-derived values. |
| `physical_sensor_id text null` | Optional installed-piece identity or physical marking when useful. It can change across service intervals without renaming the logical channel. |
| `friendly_name text null` | Installation-specific ordinary customer name. |
| `location_label text null` | Installation-specific placement, separate from the friendly name and garden location. |
| `effective_from timestamptz` | Inclusive start of commissioning/service. |
| `effective_to timestamptz null` | Exclusive retirement instant; null means open-ended/current. |
| `provisioning_note text null` | Concise Support provenance or service note; not customer-facing. |
| `created_at timestamptz` | Database record creation evidence, not the commissioning instant. |

Generic units, formatting, ordering, charts, thresholds, condition wording, colors, and generic family labels remain frontend responsibilities. No logical ordering override is required by the current requirement; stable frontend definitions can order known presentation types, while installation labels remain provisioned.

### Identity examples

- M01/M02/M03 are distinct because their logical keys are `sen0308_m01`, `sen0308_m02`, and `sen0308_m03`, even though all emit `raw_adc`.
- L01/L02/L03 are distinct logical keys even though all emit `ambient_light`.
- `bme280_air` is one logical sensor with three expected measurements.
- `ds18b20_temperature` is one logical sensor expecting `soil temp`; legacy `temperature` remains an adapter alias, not a second capability.
- `sen0204_wl01` is one logical sensor expecting `reservoir_liquid_detected`.
- A same-family physical replacement at M01 retains `sen0308_m01`, retains logical channel `M01`, retires the old interval, and opens a new interval. Its optional `physical_sensor_id` can change.
- Cross-family replacement identity remains a later reviewed decision because current repository logical keys embed sensor family. This slice does not assume that a cross-family replacement preserves the old key.
- Display labels and physical identifiers never define durable logical identity.

## Sensor, measurement, and presentation boundaries

| Concept | Authority |
| --- | --- |
| Commissioned logical sensor | `device_capabilities` positive lifecycle row |
| Expected stored measurements | `expected_measurement_names` on that row |
| Raw stored observation | `sensor_measurement_batches` / `sensor_measurements_flat` |
| Frontend-derived value | Frontend adapter/presentation logic, for example Relative Moisture Index |
| Optional physical identity | Provisioning interval and/or measurement evidence; never the logical key |
| Runtime/build declaration | Firmware `/capabilities`; diagnostic evidence only |

Unknown future measurement names remain stored evidence. They do not mutate the expected array, create a capability, or create a customer card.

## Lifecycle invariants

The `expected_measurement_names` column is `not null`. Database constraints reject an empty array, null members, and exact zero-length members. They do not claim to reject every whitespace-only string. Database constraints also enforce nonblank scalar identifiers, `effective_to > effective_from`, and no overlap for the same `(device_id, logical_sensor_key)`. Intervals use inclusive start/exclusive end semantics. The `btree_gist` exclusion constraint is proportionate here because it makes the most important lifecycle invariant race-safe; simpler timestamps remain the stored columns.

Provisioning workflow validation must reject whitespace-only entries, duplicates, and noncanonical names; require a replacement to close the old interval and open the next at the same boundary; prevent incorrect physical-identity reuse; and approve friendly/location labels. Recommissioning is a new row; history is never overwritten.

## Authorization model

The base table has RLS enabled and all browser privileges revoked. No browser role receives a base-table policy or grant. RLS with no browser policy is deny-by-default defense against accidental direct browser access; the proposed views do not rely on `device_capabilities` RLS to filter rows.

Authenticated read surfaces are owner-executed protected views with `security_barrier = true` and mandatory joins through `customer_garden_devices` or `support_garden_devices`. Customer and Support row isolation comes from those membership-filtered joins and the explicit `auth.uid()` checks embedded in the existing membership views. The capability views are granted only to `authenticated`; `public` and `anon` are revoked. No `security_invoker` conversion or underlying browser grant is introduced in this slice. Owners must not remove the membership joins or grant browser access to the base table.

There are no INSERT/UPDATE/DELETE browser grants, no device insert policy, no watering columns, and no control function.

## Read contracts

### Customer

`customer_device_capabilities` returns only current declarations (`effective_from <= now()` and `effective_to is null or > now()`) for devices already authorized and customer-visible. It supplies device/garden context, logical identity, sensor family/channel, expected measurement names, and installation friendly/location labels. It omits physical identity, notes, row UUID, and retired history.

Customer cards later start from this view and left-join best available measurement state in frontend/adapters. They must not start from measurements, so missing, stale, invalid, or never-reported capabilities remain visible.

### Support initial migration

- `support_device_capabilities` exposes authorized lifecycle history and provisioning metadata.

### Deferred Support diagnostics

The intended later contracts remain a current-capability/expected-measurement status surface and an undeclared-measurement surface, but neither diagnostic view is included in the initial migration. The current `sensor_measurements_flat` JSON-flattening path may cause expensive measurement-batch expansion. Production read-only `EXPLAIN` and a bounded device/time query contract are required before either diagnostic is implemented. Stored firmware `/capabilities` evidence remains unavailable, so firmware/provisioning mismatch comparison also remains deferred. Any later evidence or diagnostic view must remain Support-only and must never update provisioning.

Gen1 `sensor_logs` remains intact. A later frontend adapter must define Gen1-to-logical-capability measurement aliases without turning Gen1 history into commissioning authority.

## Demo boundary

No public capability view is proposed. The current public Demo containment remains unchanged and continues using its existing public measurement/diagnostic surfaces. Deterministic Demo capability data belongs to the separate Demo phase.

## Balcony02 later provisioning plan

The separate proposal contains exactly nine positive rows using the existing device UUID. Jeremy explicitly accepted `2026-08-12T17:03:41Z` as Balcony02's administrative commissioning-effective instant because it represents the final successful commissioning verification of the complete installed sensor complement. This is a deliberate provisioning decision, not automatic inference from telemetry, and measurements remain evidence rather than provisioning authority.

| Logical key | Channel | Family | Expected stored measurements | Friendly name / location |
| --- | --- | --- | --- | --- |
| `bme280_air` | `AIR` | `BME280` | `air_temperature`, `relative_humidity`, `barometric_pressure` | Balcony Air Conditions / Near controller, house side |
| `ds18b20_temperature` | `ST` | `DS18B20` | `soil temp` | Basket 3 Soil Temperature / Basket 3 |
| `sen0308_m01` | `M01` | `SEN0308` | `raw_adc` | Basket 1 Soil Moisture / Basket 1 |
| `sen0308_m02` | `M02` | `SEN0308` | `raw_adc` | Basket 3 Soil Moisture / Basket 3 |
| `sen0308_m03` | `M03` | `SEN0308` | `raw_adc` | Basket 6 Soil Moisture / Basket 6 |
| `sen0562_l01` | `L01` | `SEN0562` | `ambient_light` | Basket 1 Sunlight / Basket 1 |
| `sen0562_l02` | `L02` | `SEN0562` | `ambient_light` | Basket 3 Sunlight / Basket 3 |
| `sen0562_l03` | `L03` | `SEN0562` | `ambient_light` | Basket 6 Sunlight / Basket 6 |
| `sen0204_wl01` | `WL01` | `SEN0204` | `reservoir_liquid_detected` | Reservoir Water Available / Reservoir |

`sen0308_m04` is absent. No `LUX04` row exists. Prototype01, Balcony01, and Scout01 are not guessed or provisioned.

## Alternatives rejected

1. One positive table per logical sensor was selected; it is the smallest model satisfying lifecycle, identity, and cardinality.
2. Normalized global definitions add premature catalog governance and risk moving presentation metadata into SQL.
3. One commissioning row per measurement misrepresents BME280 as three sensors and duplicates lifecycle/location data.
4. JSON on `device_registry` weakens constraints, interval history, authorization projection, and diagnostics joins.
5. Firmware capabilities are runtime/build evidence and can drift.
6. Measurement-derived commissioning hides missing sensors and lets retained/experimental data alter presentation.
7. Positive and negative inventory rows create meaningless absence catalogs; M04 accommodation is not commissioning.
8. Build-profile fallback creates a second production authority and hides incomplete provisioning.
9. One broad customer/Support view leaks physical/provenance and diagnostic detail.
10. Public Demo sharing protected surfaces either breaks authentication boundaries or broadens public exposure.

## Performance

The exclusion constraint's GiST index supports device/key interval enforcement and history. A partial B-tree index supports current device lookups. Membership views already index device and membership keys. Customer and Support capability reads do not scan measurements.

Deferred Support diagnostic joins over the existing flattened JSON path may still expand many measurement batches. They require production read-only `EXPLAIN`, a bounded device/time query contract, and review of the corrected long polling cadence before implementation. No new JSON GIN index is proposed without evidence. The initial migration never scans measurements to determine or read capabilities, which avoids adding to the existing Disk IO concern.

## Migration sequence

1. Reconfirm production metadata and object-name absence read-only; run the read-only extension preflight against `pg_extension` and `pg_available_extensions`.
2. If `btree_gist` is absent and permitted, obtain explicit approval for a prerequisite extension-install action in the later execution slice. The main migration does not install extensions.
3. Apply the forward proposal in one transaction: empty table, constraints/indexes, RLS/revokes, then two views/grants.
4. Run catalog/grant/isolation validation before provisioning.
5. After separate SQL-execution approval, apply the accepted Balcony02 administrative effective instant and provisioning rows in their own transaction.
6. Validate exact rows, M04 absence, lifecycle selection, customer isolation, and Support lifecycle access without telemetry scans.
7. Only after production proof, approve a frontend dependency slice. Do not add a build-profile fallback.

No historical measurement or runtime manifest is imported.

## Rollback

Before provisioning or frontend dependency, drop the two views in dependency order, then the table, in the supplied transaction. Extension removal is excluded: the main migration does not install `btree_gist`, and any separately approved prerequisite extension action may be shared.

After provisioning or frontend dependency, do not run the simple rollback. First remove frontend dependency, export/preserve lifecycle evidence, and approve a dedicated migration. Do not delete capability history merely to restore an older UI.

## Deferred work

- SQL execution, Supabase changes, and Balcony02 provisioning;
- production read-only metadata verification and JWT/API isolation proof;
- frontend capability types, Gen1/Gen2 adapters, current cards, history controls, names, formatting, ordering, and styling;
- runtime `/capabilities` evidence storage and firmware/provisioning mismatch SQL/UI;
- firmware changes or reconciliation;
- public deterministic Demo;
- assignments and route changes;
- physical-identity inventory governance; and
- any watering, cadence, retention, or cleanup change.

## Pre-execution question

Before SQL execution, confirm through the proposed read-only preflight whether `btree_gist` is installed and available in the production Supabase project. If absent and permitted, installation requires an explicit prerequisite action in the later execution slice. If unavailable, replace the exclusion constraint with a separately reviewed trigger/locking design; do not weaken overlap protection silently. Jeremy has accepted `2026-08-12T17:03:41Z` as the administrative commissioning-effective instant, but provisioning still requires separate explicit SQL-execution approval.
