# SQL Schema Active Digest

## Purpose

This digest summarizes the current SQL/storage/evidence surfaces represented by repo docs and SQL artifacts so raw SQL files do not need to be loaded unless SQL/RLS is actively in scope.

This is a repo-artifact digest, not proof of the live Supabase state. When a line says an artifact is present, it means the repo contains that design. Applied Supabase state still needs verification unless current docs explicitly say it was manually or runtime validated.

Phase 7S.1 adds a detailed observed live public-schema snapshot at [`docs/sql/SUPABASE_SCHEMA_SNAPSHOT.md`](./sql/SUPABASE_SCHEMA_SNAPSHOT.md). Treat that snapshot as the field-level live-catalog reference from Jeremy's approved read-only result sets on 2026-06-11; keep this digest compact.

## Source Artifacts Inspected

- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`docs/PHASE_BACKLOG.md`](./PHASE_BACKLOG.md)
- [`docs/adr`](./adr)
- [`docs/sql/phase6j3-device-heartbeats.sql`](./sql/phase6j3-device-heartbeats.sql)
- [`docs/sql/phase6j5-device-registry.sql`](./sql/phase6j5-device-registry.sql)
- [`docs/sql/phase6j6-hosted-device-diagnostics-view.sql`](./sql/phase6j6-hosted-device-diagnostics-view.sql)
- [`docs/sql/phase7d-sensor-measurement-batches.sql`](./sql/phase7d-sensor-measurement-batches.sql)
- [`docs/sql/phase7f-hosted-gen2-measurements-view.sql`](./sql/phase7f-hosted-gen2-measurements-view.sql)
- [`docs/sql/phase7g1-control-validation-readonly-queries.sql`](./sql/phase7g1-control-validation-readonly-queries.sql)
- [`docs/sql/phase7k6-hosted-runtime-diagnostics-view.sql`](./sql/phase7k6-hosted-runtime-diagnostics-view.sql)
- [`docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`](./sql/phase7l4-customer-auth-garden-membership-rls.sql)
- [`docs/sql/phase7o1-watering-events.sql`](./sql/phase7o1-watering-events.sql)
- [`docs/sql/phase8b-measurement-contract-cleanup.sql`](./sql/phase8b-measurement-contract-cleanup.sql)
- [`docs/sql/phase8c-hosted-device-capability-contract-proposal.sql`](./sql/phase8c-hosted-device-capability-contract-proposal.sql)
- [`docs/sql/phase8c-balcony02-capability-provisioning-proposal.sql`](./sql/phase8c-balcony02-capability-provisioning-proposal.sql)
- [`docs/product/phase8c-hosted-device-capability-production-execution-evidence.md`](./product/phase8c-hosted-device-capability-production-execution-evidence.md)

## Tables And Views

### sensor_logs

- Purpose: Obsolete live `SensorLogRow` compatibility surface. Historical rows/ADRs remain evidence, but Phase 8F.10 finds no supported current or future Gen2 consumer.
- Source of rows: Historical ESP32 firmware telemetry posts plus the final Phase 4 development seed. Supported firmware no longer writes the table.
- Live rows: Exactly three `esp32-dev-01` development-seed rows from 2026-03-28, protected and proposed for exact deletion. No Balcony02 rows.
- Device-originated inserts: The live anon policy still permits provisioned identities through `public.is_device_telemetry_insert_enabled(device_id)`, but no supported firmware invokes it for `sensor_logs`.
- Browser/customer read path: None in the supported frontend after Phase 8F.3. Public Demo and protected customer/support routes use hosted Gen2 views instead.
- Applied access: RLS enabled/not forced; anon/authenticated `SELECT USING (true)`; anon registry-gated `INSERT`; broad table ACLs for anon/authenticated/service_role; service role bypasses RLS. No update/delete policy.
- Dependencies: No view, function body, table trigger, foreign key, publication, or subscription depends on the table. The insert policy calls the shared telemetry helper, which must remain for current Gen2 measurement-batch and watering-event policies.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0002, 0003, 0004, 0006, 0007, 0009, 0012, 0015, 0016, 0021.
- Related SQL artifacts: `docs/sql/phase6j5-device-registry.sql`; `docs/sql/phase7g1-control-validation-readonly-queries.sql`; proposal-only Phase 8F.10 row and schema/access retirement artifacts.
- Notes: Phase 8F.10 proposes, but has not executed, exact final-row deletion followed by policy/grant/index/constraint/table retirement with `RESTRICT` and no `CASCADE`.

### sensor_events

- Purpose: Manual operational event/context log for sensor swaps, maintenance, calibration notes, plant/container moves, experiments, and human-entered context.
- Source of rows: Manual Supabase Table Editor or SQL Editor entry for MVP.
- Live rows: Exactly three explicit Phase 5B sample-validation rows from 2026-05-07, protected and proposed for exact deletion. No Balcony02 rows.
- Device-originated inserts: No.
- Browser/customer read path: Not a primary hosted/customer read path in current artifacts.
- Applied access: RLS enabled/not forced and zero policies. Anon/authenticated/service_role nevertheless hold broad table ACLs; ordinary anon/authenticated row operations are denied by RLS, while service role bypasses RLS. Phase 8F.10 proposes revoking all three roles' table privileges while retaining operator/editor access.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0005, 0014, 0017, 0021.
- Related SQL artifacts: No current `docs/sql` creation artifact found; ADR 0005 contains the validated core schema.
- Notes: Must not become canonical device-originated watering evidence and must not reshape `SensorLogRow`. No frontend, firmware, script, fixture, view, function, trigger, foreign key, publication, or subscription consumes it. Retain as isolated manual compatibility unless the governing ADRs are separately superseded.

### device_heartbeats

- Purpose: Append-only diagnostics/device health evidence.
- Source of rows: ESP32 firmware heartbeat posts and manual validation inserts.
- Device-originated inserts: Yes. Initial Phase 6J.3 known-device insert policy is superseded by Phase 6J.5 registry-backed insert policy using `public.is_device_heartbeat_insert_enabled(device_id)`.
- Browser/customer read path: Limited hosted diagnostics views, including `public.hosted_device_diagnostics` and protected customer/support variants.
- Anon SELECT: No direct anon SELECT expected on the base table.
- Authenticated SELECT: No broad direct authenticated base-table read is intended by the repo artifacts; read through limited views.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0014, 0015, 0019, 0021.
- Related SQL artifacts: `docs/sql/phase6j3-device-heartbeats.sql`, `docs/sql/phase6j5-device-registry.sql`, `docs/sql/phase6j6-hosted-device-diagnostics-view.sql`, `docs/sql/phase7k6-hosted-runtime-diagnostics-view.sql`, `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Current docs say firmware heartbeat insertion was runtime validated. SQL Editor validation alone does not prove anon REST/RLS behavior unless separately tested.

### device_registry

- Purpose: Provisioned-device registry for device identity metadata and insert allowlist flags.
- Source of rows: SQL seed/maintenance by operator/admin.
- Device-originated inserts: No.
- Browser/customer read path: Not direct base-table reads; limited fields are projected through hosted measurement/diagnostics and customer/support views.
- Anon SELECT: No direct anon SELECT approved for base table.
- Authenticated SELECT: No broad direct authenticated base-table read is intended; protected views project selected safe metadata.
- Command/control: No. Registry flags authorize inserts only and do not grant watering authority.
- Related ADRs: ADR 0010, 0015, 0016, 0020.
- Related SQL artifacts: `docs/sql/phase6j5-device-registry.sql`, `docs/sql/phase7f-hosted-gen2-measurements-view.sql`, `docs/sql/phase7k6-hosted-runtime-diagnostics-view.sql`, `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Seeded device keys include `balcony`, `bench`, and `scout01` in repo artifacts.

### device_capabilities

- Purpose: Positive per-device commissioned logical-sensor lifecycle and hosted provisioning authority. Presence means a hosted consumer may expect the sensor; absence makes no negative assertion.
- Production status: Created and validated on 2026-08-14 from the exact committed Phase 8C forward statement body after installation of `btree_gist` `1.7`. Balcony02 has nine current rows containing eleven expected measurement names.
- Columns: `id uuid not null default gen_random_uuid()`; `device_id text not null`; `logical_sensor_key text not null`; `logical_channel text not null`; `sensor_family text not null`; `expected_measurement_names text[] not null`; nullable `physical_sensor_id`, `friendly_name`, `location_label`, `effective_to`, and `provisioning_note`; `effective_from timestamptz not null`; `created_at timestamptz not null default now()`.
- Primary/foreign keys: Primary key `id`; `device_id` references `device_registry(device_id)`.
- Checks: Required logical key, channel, and family are nonblank; expected measurement arrays are nonempty and contain neither null nor exact empty-string members; optional scalar metadata is null or nonblank; `effective_to` is null or greater than `effective_from`.
- Uniqueness/lifecycle: Unique `(device_id, logical_sensor_key, effective_from)`. A GiST exclusion constraint prevents overlapping `[effective_from, effective_to)` intervals for the same device/logical key, treating null end as infinity.
- Indexes: `device_capabilities_pkey`; `device_capabilities_device_key_start_unique`; `device_capabilities_device_key_no_overlap`; partial `device_capabilities_current_device_idx` on `(device_id, logical_sensor_key)` where `effective_to is null`.
- RLS/policies: RLS enabled, forced RLS false, zero base-table policies. All privileges are revoked from `public`, `anon`, and `authenticated`; no browser reads or writes exist on the base table.
- Read path: Authenticated clients use the separate customer and Support protected views below. No anon/public capability view exists.
- Balcony02: Exactly nine positive current declarations at the accepted administrative effective instant `2026-08-12T17:03:41Z`; `sen0308_m04`, `sen0562_l04`, and `lux04` are absent. Balcony02 is Support-visible and customer-hidden under its unchanged assignment.
- Command/control: No. Commissioning metadata only; it creates no hosted watering authority and cannot alter firmware watering behavior.
- Related ADR/artifacts: ADR 0024; the four Phase 8C SQL package files; Phase 8C production execution evidence. Proposal-only file headers preserve pre-execution provenance while active docs record subsequent execution.

### sensor_measurement_batches

- Purpose: Append-only raw Gen2 `/measurements` package storage; one row equals one complete device measurement package at one measured time.
- Source of rows: ESP32 Gen2 firmware posts.
- Device-originated inserts: Yes, for registry-enabled devices through `public.is_device_telemetry_insert_enabled(device_id)`.
- Browser/customer read path: No direct browser read; flattened and hosted-safe views are the read path.
- Anon SELECT: No direct anon SELECT on base table in Phase 7D/7F artifacts.
- Authenticated SELECT: Needs verification from applied Supabase state; customer/support views read through projections rather than base-table browser grants.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0016, 0017, 0018, 0021.
- Related SQL artifacts: `docs/sql/phase7d-sensor-measurement-batches.sql`, `docs/sql/phase7f-hosted-gen2-measurements-view.sql`, `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`, `docs/sql/phase8b-measurement-contract-cleanup.sql`.
- Notes: Jeremy manually applied the Phase 8B artifact on 2026-07-16. The base table remains append-only at schema version `1`; no base measurement-table columns changed. Stores valid, invalid, degraded, failed, missing, diagnostic, and control-ineligible records as evidence. Storage does not mean usable for watering control.

### sensor_measurements_flat

- Purpose: Derived view that unnests Gen2 batch `records[]` for charting, diagnostics, filtering, and control-quality evaluation.
- Source of rows: View over `public.sensor_measurement_batches`.
- Device-originated inserts: No.
- Browser/customer read path: Not direct public browser read; `hosted_gen2_measurements` and protected customer/support views project limited safe fields.
- Anon SELECT: No direct anon SELECT in Phase 7D/7F artifacts.
- Authenticated SELECT: Needs verification from applied Supabase state; protected views are the browser-readable surface.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0016, 0017, 0018.
- Related SQL artifacts: `docs/sql/phase7d-sensor-measurement-batches.sql`, `docs/sql/phase7f-hosted-gen2-measurements-view.sql`, `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`, `docs/sql/phase8b-measurement-contract-cleanup.sql`.
- Notes: The applied Phase 8B view derives `device_id` and `measured_at` from the batch; exposes `physical_sensor_id` by preferring the top-level record value and falling back to historical `details.physical_sensor_id`; and retains historical `details` plus `control_eligible` as privileged flat evidence. Hosted/client code must not treat control eligibility as command/control.

### hosted_gen2_measurements

- Purpose: Limited hosted-safe public/demo read view for Gen2 measurement display.
- Source of rows: Joins `sensor_measurements_flat` to active, hosted-visible `device_registry` rows.
- Device-originated inserts: No.
- Browser/customer read path: Public/demo hosted-readonly Gen2 display reads this view. Protected customer/support routes use membership-filtered variants.
- Anon SELECT: Yes, granted by Phase 7F artifact.
- Authenticated SELECT: Yes, granted by Phase 7F artifact.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0009, 0015, 0016, 0017, 0020.
- Related SQL artifacts: `docs/sql/phase7f-hosted-gen2-measurements-view.sql`, `docs/sql/phase7g1-control-validation-readonly-queries.sql`, `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`, `docs/sql/phase8b-measurement-contract-cleanup.sql`.
- Notes: The applied Phase 8B view exposes `physical_sensor_id` but not `details` or `control_eligible`; it does not grant anon SELECT on Gen2 base tables or registry. Hosted validation recovered after the coordinated migration and remained read-only.

### hosted_device_diagnostics

- Purpose: Limited hosted-safe public/demo diagnostics view over latest device heartbeat evidence.
- Source of rows: Active, hosted-visible `device_registry` rows joined to latest `device_heartbeats`.
- Device-originated inserts: No.
- Browser/customer read path: Public/demo hosted diagnostics display. Protected customer/support routes use membership-filtered variants.
- Anon SELECT: Yes, granted by Phase 6J.6 and retained/expanded by Phase 7K.6 artifact.
- Authenticated SELECT: Yes, granted by Phase 6J.6 and retained/expanded by Phase 7K.6 artifact.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0009, 0014, 0015, 0019, 0020.
- Related SQL artifacts: `docs/sql/phase6j6-hosted-device-diagnostics-view.sql`, `docs/sql/phase7k6-hosted-runtime-diagnostics-view.sql`, `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Does not expose local IP, MAC, SSID, registry notes, raw heartbeat details, or command/control fields.

### profiles

- Purpose: Auth user profile metadata.
- Source of rows: Operator/admin seed after Supabase Auth user creation.
- Device-originated inserts: No.
- Browser/customer read path: Protected views and future authenticated account surfaces; base table direct browser access is not the intended surface.
- Anon SELECT: No, expected false in Phase 7L.4 validation comments.
- Authenticated SELECT: Direct base-table browser SELECT expected false by grants; RLS includes own-profile policy as defense-in-depth/future support.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Applied Auth user IDs must not be invented in repo docs.

### gardens

- Purpose: Customer/site/garden metadata.
- Source of rows: Operator/admin seed/maintenance.
- Device-originated inserts: No.
- Browser/customer read path: `customer_garden_devices` and `support_garden_devices` protected views.
- Anon SELECT: No, expected false for direct base-table access.
- Authenticated SELECT: Direct base-table browser SELECT expected false by grants; RLS policies exist as defense-in-depth.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Site assignment metadata is separate from firmware device identity.

### garden_devices

- Purpose: Assignment of provisioned devices to gardens/sites with customer/support visibility and display role metadata.
- Source of rows: Operator/admin seed/maintenance.
- Device-originated inserts: No.
- Browser/customer read path: `customer_garden_devices` and `support_garden_devices` protected views.
- Anon SELECT: No, expected false for direct base-table access.
- Authenticated SELECT: Direct base-table browser SELECT expected false by grants; RLS policies exist as defense-in-depth.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0010, 0015, 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: `garden_device_role` describes customer/support display role, not firmware watering authority.

### garden_memberships

- Purpose: Authenticated customer membership linking users to gardens.
- Source of rows: Operator/admin seed/maintenance.
- Device-originated inserts: No.
- Browser/customer read path: Used by protected customer views through `auth.uid()` filters.
- Anon SELECT: No, expected false for direct base-table access.
- Authenticated SELECT: Direct base-table browser SELECT expected false by grants; RLS permits own-membership reads as defense-in-depth/future support.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Authorization must be by membership, not route/query device selection.

### support_memberships

- Purpose: Authenticated support/admin membership metadata.
- Source of rows: Operator/admin seed/maintenance.
- Device-originated inserts: No.
- Browser/customer read path: Used by protected support views through `auth.uid()` filters.
- Anon SELECT: No, expected false for direct base-table access.
- Authenticated SELECT: Direct base-table browser SELECT expected false by grants; RLS permits own support-membership reads as defense-in-depth/future support.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Support/admin visibility is read-only and must not create remote watering authority.

### customer_garden_devices

- Purpose: Authenticated customer read view for garden/device metadata visible to that customer.
- Source of rows: `gardens`, `garden_devices`, `device_registry`, and `garden_memberships`.
- Device-originated inserts: No.
- Browser/customer read path: Protected customer hosted routes.
- Anon SELECT: No.
- Authenticated SELECT: Yes, with row visibility filtered by `auth.uid()` membership.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Bench/support-only devices are expected to be hidden from normal customer rows.

### customer_device_capabilities

- Purpose: Current commissioned capabilities for devices authorized and customer-visible through existing garden membership.
- Source objects: `device_capabilities` joined to `customer_garden_devices`; no measurement, heartbeat, or firmware-manifest dependency.
- Lifecycle behavior: Current-only filter (`effective_from <= now()` and null/future `effective_to`). Physical identity, provisioning notes, capability row UUID, creation time, and retired history are omitted.
- View security: Owner-executed protected view with `security_barrier=true`; mandatory membership filtering is inherited from `customer_garden_devices`.
- Anon SELECT: No.
- Authenticated SELECT: Yes.
- Production result for Balcony02: Zero rows, correctly, because its current assignment has `customer_visible=false`.
- Command/control: No. Read-only commissioned configuration.

### support_device_capabilities

- Purpose: Authorized Support lifecycle history and provisioning metadata.
- Source objects: `device_capabilities` joined to `support_garden_devices`; no measurement, heartbeat, or firmware-manifest dependency.
- Lifecycle behavior: Full authorized lifecycle history, including capability UUID, physical identity, effective interval, provisioning note, and creation time.
- View security: Owner-executed protected view with `security_barrier=true`; mandatory Support membership filtering is inherited from `support_garden_devices`.
- Anon SELECT: No.
- Authenticated SELECT: Yes.
- Production result for the validated Support identity: All nine Balcony02 rows with correct device key and lifecycle values.
- Command/control: No. Read-only commissioned configuration/history.

### support_garden_devices

- Purpose: Authenticated support/admin read view for support-visible garden/device metadata.
- Source of rows: `gardens`, `garden_devices`, `device_registry`, and `support_memberships`.
- Device-originated inserts: No.
- Browser/customer read path: Protected support route.
- Anon SELECT: No.
- Authenticated SELECT: Yes, with row visibility filtered by `auth.uid()` support/admin membership.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Support visibility remains read-only.

### customer_hosted_gen2_measurements

- Purpose: Authenticated membership-filtered customer Gen2 measurement view.
- Source of rows: `sensor_measurements_flat`, `device_registry`, and `customer_garden_devices`.
- Device-originated inserts: No.
- Browser/customer read path: Protected customer hosted measurement display.
- Anon SELECT: No.
- Authenticated SELECT: Yes, with `auth.uid()` membership filtering.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0016, 0017, 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`, `docs/sql/phase8b-measurement-contract-cleanup.sql`.
- Notes: Projects `physical_sensor_id` and other hosted-safe Gen2 fields; does not expose `details` or `control_eligible`. Customer access remains read-only and membership-filtered.

### support_hosted_gen2_measurements

- Purpose: Authenticated support/admin Gen2 measurement view.
- Source of rows: `sensor_measurements_flat`, `device_registry`, and `support_garden_devices`.
- Device-originated inserts: No.
- Browser/customer read path: Protected support route.
- Anon SELECT: No.
- Authenticated SELECT: Yes, with `auth.uid()` support/admin filtering.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0016, 0017, 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`, `docs/sql/phase8b-measurement-contract-cleanup.sql`.
- Notes: Read-only support evidence exposes `physical_sensor_id` but not `details` or `control_eligible`.

### customer_hosted_device_diagnostics

- Purpose: Authenticated membership-filtered customer diagnostics view.
- Source of rows: `device_registry`, latest `device_heartbeats`, and `customer_garden_devices`.
- Device-originated inserts: No.
- Browser/customer read path: Protected customer hosted diagnostics display.
- Anon SELECT: No.
- Authenticated SELECT: Yes, with `auth.uid()` membership filtering.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0014, 0019, 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Duplicates hosted-safe diagnostics projection and avoids local/network/private fields.

### support_hosted_device_diagnostics

- Purpose: Authenticated support/admin diagnostics view.
- Source of rows: `device_registry`, latest `device_heartbeats`, and `support_garden_devices`.
- Device-originated inserts: No.
- Browser/customer read path: Protected support route.
- Anon SELECT: No.
- Authenticated SELECT: Yes, with `auth.uid()` support/admin filtering.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0014, 0019, 0020.
- Related SQL artifacts: `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql`.
- Notes: Read-only support diagnostics evidence.

### watering_events

- Purpose: Dedicated append-only device-originated watering event evidence path.
- Source of rows: Future/current ESP32 firmware event posts per Phase 7O.1 evidence path.
- Device-originated inserts: Yes, proposed/granted through registry-enabled anon insert policy using `public.is_device_telemetry_insert_enabled(device_id)`.
- Browser/customer read path: `customer_watering_events` and `support_watering_events` protected views.
- Anon SELECT: No direct anon SELECT on base table expected in Phase 7O.1 artifact.
- Authenticated SELECT: No broad direct base-table browser SELECT intended; protected views are the read path.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0021, plus ADR 0006, 0015, 0020.
- Related SQL artifacts: `docs/sql/phase7o1-watering-events.sql`.
- Notes: The SQL artifact labels itself as a proposal for later review/execution approval, while current backlog text says Phase 7O.1 backend/firmware evidence path was runtime validated. Phase 7S.1 live catalog inspection observed the live table and protected views; the SQL artifact header/status mismatch remains a repo-history note.

### customer_watering_events

- Purpose: Authenticated customer watering event evidence view.
- Source of rows: `watering_events` joined to `customer_garden_devices`.
- Device-originated inserts: No.
- Browser/customer read path: Protected customer hosted watering history display.
- Anon SELECT: No.
- Authenticated SELECT: Yes per Phase 7O.1 artifact, with membership filtering through `customer_garden_devices`.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020, 0021.
- Related SQL artifacts: `docs/sql/phase7o1-watering-events.sql`.
- Notes: Phase 7S.1 live catalog inspection observed the protected view; effective access still depends on grants plus RLS/view membership filters.

### support_watering_events

- Purpose: Authenticated support/admin watering event evidence view.
- Source of rows: `watering_events` joined to `support_garden_devices`.
- Device-originated inserts: No.
- Browser/customer read path: Protected support watering history display.
- Anon SELECT: No.
- Authenticated SELECT: Yes per Phase 7O.1 artifact, with support/admin filtering through `support_garden_devices`.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0020, 0021.
- Related SQL artifacts: `docs/sql/phase7o1-watering-events.sql`.
- Notes: Phase 7S.1 live catalog inspection observed the protected view; effective access still depends on grants plus RLS/view membership filters.

## Explicit SQL Boundary Summary

- Supabase SQL artifacts create storage, diagnostics, evidence, and read views.
- No SQL artifact authorizes watering commands.
- Registry flags and `control_eligible` are not command/control.
- Browser/customer read access should use limited public/demo views or protected membership-filtered views, not raw base tables.
- Applied live Supabase state can only be proven by Supabase inspection/API validation, not by repo artifacts alone.
- Phase 7S.1 live catalog inspection found all observed public base tables have RLS enabled; object-level grants alone do not describe effective browser access without the observed RLS policies.
- Phase 8C production execution/validation on 2026-08-14 proves the capability table, protected views, `btree_gist` `1.7`, access posture, and Balcony02 provisioning described above. It did not create a public capability view, browser write path, or command/control authority.
