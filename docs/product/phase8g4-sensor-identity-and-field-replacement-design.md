# Phase 8G.4 Sensor Identity and Field Replacement Design

Status: design approved and complete; production schema and MS02 digital-QR asset-only pilot approved and complete

## Decision

Separate durable logical sensor identity from physical asset identity. Keep
`device_capabilities` as the positive commissioned logical topology and add the
smallest normalized service model: `sensor_assets` plus
`sensor_installations`. Do not add `sensor_asset_id` to routine measurements or
directly to `device_capabilities`.

The review package is:

- [`../sql/phase8g4-sensor-asset-installation-contract-proposal.sql`](../sql/phase8g4-sensor-asset-installation-contract-proposal.sql)
- [`../sql/phase8g4-sensor-asset-installation-contract-validation.sql`](../sql/phase8g4-sensor-asset-installation-contract-validation.sql)
- [`../sql/phase8g4-sensor-asset-installation-contract-rollback.sql`](../sql/phase8g4-sensor-asset-installation-contract-rollback.sql)
- [`../../scripts/validate-phase8g4-sensor-identity-contract.py`](../../scripts/validate-phase8g4-sensor-identity-contract.py)

The schema proposal was executed after separate approval; the rollback and
validation files remain operational evidence rather than production actions.
The separately approved MS02 pilot proposal created one asset row and no
installation row.

## Current production evidence

The approved read-only audit ran on 2026-08-26 against PostgreSQL 17.6. It
confirmed 14 current `device_capabilities` rows: nine for Balcony02 and five for
Prototype02. The later approved additive execution created `sensor_assets` and
`sensor_installations`; the MS02 pilot subsequently created one asset and left
installation history empty.

Balcony02 has 20,424 stored records containing firmware-reported physical
labels across the seven labeled logical sensors. Prototype02 has 588 across
four sensors. These are retained raw evidence, not verified inventory.

Over the observed recent window, Balcony02 had 669 batches with 4,683 repeated
identity fields; removing those fields saves about 252 bytes per batch in the
database JSON text representation. Prototype02 had 147 batches with 588 fields
and about 134 bytes per batch. Removing `physical_sensor_id` from flattened
hosted projections saves about 33 bytes per Balcony02 row and 31 bytes per
Prototype02 row. The bounded 24-hour Support plan width fell from 430 to 398
bytes when the field was omitted, while scan cost remained unchanged.

The existing half-open as-of lookup used the `device_capabilities` GiST index
directly with estimated cost `0.14..2.36`. The installation model reuses this
proven range/index pattern. Routine measurement queries must not join
installation history.

## Identity boundaries

| Identity | Meaning and authority |
| --- | --- |
| `sensor_key` | Durable device-local logical role, such as `sen0308_m01`; firmware and commissioned topology authority. |
| `sensor_asset_id` | MBG UUID for one physical piece; QR encodes this UUID or an opaque service URL containing it. |
| `asset_tag` | Short MBG human-readable label associated with the QR; never a logical channel. |
| `manufacturer_serial` | Optional exact manufacturer marking; not assumed present or globally unique. |
| `hardware_uid` | Optional genuinely readable UID plus scheme, such as `ds18b20_rom64`. |
| Connection | GPIO, ADC channel, mux channel, I2C address, or OneWire bus; topology rather than asset identity. |

Existing values such as `ST04`, `M1`, `SEN0308-M01`, `L01`, and `WL01` remain
legacy labels until physically verified and tagged. No automatic backfill is
authorized. Support must show `Asset not yet tagged` rather than converting an
ambiguous label into an asset.

## Relational model

`sensor_assets` stores the MBG UUID/tag, family, optional manufacturer/model and
serial, and an optional paired hardware UID scheme/value. A partial unique
index prevents reuse of one genuine discoverable UID.

`sensor_installations` links one asset to `(device_id, logical_sensor_key)` over
an inclusive-start/exclusive-end interval. GiST exclusion constraints prevent
both logical-slot overlap and simultaneous installation of one asset in two
places. Current partial indexes support service lookup. Verification provenance
is stored without a foreign key to append-only telemetry so later retention or
archival cannot erase service history.

Family compatibility with the commissioned capability is checked by the
validation package and must be enforced atomically by the later authenticated
service workflow. The initial additive migration intentionally creates no
browser write function.

## Endpoint decisions

### `/measurements`

New firmware retains `sensor_key` and measurement evidence but omits manually
maintained physical identity from every routine sample. It does not add asset
UUID, QR tag, manufacturer serial, or hardware UID. Historical batches remain
byte-for-byte unchanged.

Frontend fingerprints must use package/time and logical measurement identity,
not `physical_sensor_id`. Ordinary public, customer, and Support measurement
projections later omit the legacy field. Privileged compatibility evidence may
retain it under an explicitly legacy name.

### `/capabilities`

The endpoint retains stable configured topology, family, installed state,
connection, and local control role. It removes compile-time service labels. It
may expose a hardware UID only when firmware genuinely discovers and caches it.

DS18B20's 64-bit ROM is genuine hardware identity. SEN0308, SEN0562/BH1750,
SEN0204, BME280, ADS1115 channels, mux channels, and ordinary I2C addresses do
not provide an equivalent unique component identity. Address and channel remain
connection evidence.

## Same-family field replacement

1. Authenticate Support and load the current logical capability/installation.
2. Scan outgoing and incoming MBG QR tags; register a new asset if required.
3. Confirm unchanged family, interface, channel/address, voltage, and role.
4. Capture the last pre-service measurement and prevent sampling during swap.
5. Replace the sensor on the same connection without a firmware rebuild or
   hosted command.
6. Capture the first post-replacement `/measurements` package, valid or failed.
7. Use that package's top-level `measured_at` as `cutover_at`.
8. Verify topology, expected measurement, plausibility, and discoverable UID.
9. Atomically close the old interval at `cutover_at` and open the new interval
   at the same instant with actor and verification evidence.
10. Verify `< cutover_at` resolves old and `>= cutover_at` resolves new.

Delayed uploads remain truthful because resolution uses measurement time, not
database insertion time. Measurements are never rewritten.

## Authorization

Both base tables have RLS enabled, zero browser policies, and all browser grants
revoked. Authenticated Support reads only the two `security_barrier` views.
There is no anon/customer view and no mutation path in this package.

A later separately approved workflow may permit active Support admins to invoke
one atomic server-side replacement transaction. It must lock the current row,
validate family/topology and interval boundaries, record the authenticated
actor, and expose no service secret to the browser. `support_read_only` remains
read-only.

## Compatibility

- Preserve all append-only measurement packages and their incorrect or
  ambiguous labels.
- Retain `device_capabilities.physical_sensor_id` initially as deprecated legacy
  provisioning evidence; do not rewrite the 14 current rows in this phase.
- Add no inferred asset or installation rows.
- Later frontend tests must cover legacy batches with the field and new batches
  without it.
- Replace measurement fingerprints before firmware stops emitting the field.
- Keep installation/as-of joins outside recurring measurement refreshes.

## Changes that require configuration or firmware review

Different sensor family, interface, ADC provider/channel, mux channel, I2C
address, GPIO/polarity, multiple-device OneWire binding, installed topology, or
safety/control role requires separate review. A same-model replacement on the
same electrical channel does not. DS18B20 replacement on the current single
device bus remains rebuild-free; multiple ROM-bound sensors would not.

## Acceptance and staged rollout

1. Design and read-only audit: approved and complete.
2. Local proposal/validation/rollback/static-test package: approved and
   complete.
3. Local isolated migration, constraint/RLS tests, query plans, rollback, and
   clean reapply: approved and complete.
4. Additive production schema execution: approved and complete; see
   `phase8g4-sensor-identity-production-execution-evidence.md`.
5. MS02 digital-QR asset-only pilot: approved and complete. P02 remains a bench
   simulation, so no installation verification or interval is required.
6. Frontend compatibility and Support presentation: separate implementation and
   deployment approval.
7. Firmware contract/build/bench work and each upload: separate approval.
8. Legacy hosted-projection cleanup: separate destructive approval after an
   observation period; raw historical evidence remains.

## Isolated execution evidence

On 2026-08-26, the exact proposal and rollback artifacts were exercised in a
disposable, network-disabled PostgreSQL 17.6 Docker container using ephemeral
database storage and a read-only repository mount. No Supabase project was a
test target.

The isolated harness verified:

- both new base tables begin empty and have RLS enabled with zero policies;
- browser roles lack base-table access, anon lacks Support-view access, an
  active Support identity sees the expected rows, and an unassigned identity
  sees none;
- asset tags and discoverable hardware UIDs are case-insensitively unique, and
  incomplete hardware UID pairs are rejected;
- adjacent half-open installation intervals succeed, while logical-slot
  overlap and simultaneous asset reuse are rejected;
- the last pre-cutover instant resolves the outgoing asset and the exact
  cutover instant resolves the incoming asset;
- the family/capability audit returns no mismatch for valid test data;
- the as-of lookup is eligible for and uses the
  `sensor_installations_device_key_no_overlap` GiST index; and
- the exact rollback removes all four objects, after which the exact proposal
  reapplies cleanly and the full behavioral suite passes again.

The final isolated rollback also succeeded. The container was then removed;
no local test database or production schema mutation remained.

## Production execution evidence

On 2026-08-26, the exact additive proposal artifact with SHA-256
`27D14B8EBDF832A6135E6A7CB6025FDC8483ECB478C9996091947EDC124CC809`
was executed in the `my-balcony-gardener` production Supabase project after a
fresh prerequisite and object-absence preflight. The transaction committed
successfully. Read-only catalog and role-context validation completed at
`2026-08-26T22:02:52.259273Z`.

Production contains both empty base tables and both protected Support views.
All validation flags passed: RLS enabled, zero base policies, base-table browser
access denied, authenticated Support view access granted, anon view access
denied, both exclusion constraints present, both `security_barrier` options
present, and no unapproved asset view. Transaction-scoped probes proved active
Support access, unassigned isolation, anon denial, and direct base-table denial.
Dependencies are limited to the new identity tables plus the established
Support membership/device views; telemetry, watering, firmware, and control
objects are absent.

The Supabase generic security linter reports the two new views as
`Security Definer View`, alongside ten existing owner-executed protected views.
This is a deliberate tested exception in the approved architecture: the base
tables have no browser grants or policies, and authorization is performed by
explicit `auth.uid()` Support membership filters in the protected views. A
conversion to `security_invoker` would require a separately approved redesign
of base-table grants and RLS policies.

The schema execution seeded no rows. A later separately approved transaction
registered the MS02 pilot asset only; installation history remains empty. No
historical evidence was rewritten, and no firmware, frontend, watering
authority, or command path changed.

## Boundaries preserved

Supabase remains telemetry/history/diagnostics/service evidence, not
command/control. Local ESP32 firmware retains watering and safety authority.
No RMI watering threshold is claimed or presented. Watering-event chart label
containment remains a separate frontend slice. The complete design remains
3.3V-only and introduces no 5V proposal.
