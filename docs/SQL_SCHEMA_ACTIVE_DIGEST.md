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

## Tables And Views

### sensor_logs

- Purpose: Legacy/current `SensorLogRow` telemetry history and historical watering markers.
- Source of rows: ESP32 firmware telemetry posts.
- Device-originated inserts: Yes, for provisioned devices. Phase 6J.5 replaces hardcoded UUID insert allowlists with `public.is_device_telemetry_insert_enabled(device_id)`.
- Browser/customer read path: Public/demo Sensor History reads `sensor_logs`; Gen2 customer/support routes use protected Gen2 views instead of this as their main measurement source.
- Anon SELECT: Existing public/anon `sensor_logs` SELECT policy is documented as remaining after Phase 6J.5.
- Authenticated SELECT: Needs verification from applied Supabase state for any direct authenticated base-table access; protected customer/support Gen2 views do not depend on direct browser reads of `sensor_logs`.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0002, 0003, 0004, 0006, 0007, 0009, 0012, 0015, 0016, 0021.
- Related SQL artifacts: `docs/sql/phase6j5-device-registry.sql`; `docs/sql/phase7g1-control-validation-readonly-queries.sql`.
- Notes: `data.soilRawAdc` is optional raw ADC evidence. `data.moisture` is a derived moisture index. Gen2 expanded measurements must not be added to `SensorLogRow.data`.

### sensor_events

- Purpose: Manual operational event/context log for sensor swaps, maintenance, calibration notes, plant/container moves, experiments, and human-entered context.
- Source of rows: Manual Supabase Table Editor or SQL Editor entry for MVP.
- Device-originated inserts: No.
- Browser/customer read path: Not a primary hosted/customer read path in current artifacts.
- Anon SELECT: Phase 7S.1 live catalog inspection found RLS enabled and no browser-role policies observed; treat this as manual/operator/admin context unless a later approved SQL phase changes access.
- Authenticated SELECT: Phase 7S.1 live catalog inspection found RLS enabled and no browser-role policies observed; treat this as manual/operator/admin context unless a later approved SQL phase changes access.
- Command/control: No. Evidence/storage/read path only.
- Related ADRs: ADR 0005, 0014, 0017, 0021.
- Related SQL artifacts: No current `docs/sql` creation artifact found; ADR 0005 contains the validated core schema.
- Notes: Must not become canonical device-originated watering evidence and must not reshape `SensorLogRow`.

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
