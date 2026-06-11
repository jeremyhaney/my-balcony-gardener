# Supabase Schema Snapshot

Status: Phase 7S.1 documentation-only live schema snapshot.
Snapshot date: 2026-06-11.
Source: Approved read-only Supabase catalog result sets pasted by Jeremy on 2026-06-11.
Scope: Live Supabase `public` schema inventory only.
Important warning: This is an observed live Supabase public-schema snapshot based on approved read-only catalog result sets pasted by Jeremy on 2026-06-11. It is documentation, not a migration, not a schema-change script, and not proof that every REST/client access path was separately exercised.
Maintenance rule: This snapshot must be updated whenever an approved SQL/schema phase changes public tables, views, functions, RLS policies, grants, indexes, constraints, or triggers.

## Purpose

This snapshot records the observed live Supabase `public` schema so future documentation and operational notes can use live field names, object names, RLS posture, policy posture, grants, functions, triggers, indexes, and constraints instead of guessing from repo SQL artifacts alone.

Repo SQL files are source evidence, but they are not the same thing as live Supabase state. This snapshot distinguishes live base tables, views, functions, policies, grants, indexes, constraints, analysis SQL, and repo-artifact mapping.

## How This Snapshot Was Generated

Jeremy ran approved read-only catalog inspection queries and pasted the result sets into the project chat. Result sets included:

- `01_public_objects_inventory`
- `02_public_columns_inventory` / focused table column inventories
- `03_public_constraints_inventory`
- `04_public_indexes_inventory`
- `06_public_rls_policies_inventory`
- `07b_public_browser_access_matrix`
- `07c_public_function_execute_matrix`
- `08_public_views_inventory`
- `09_public_functions_inventory`
- `10_public_triggers_inventory`
- `11_public_event_triggers_inventory`

No SQL in this document was run by Codex. No SQL/schema/data/runtime/firmware/frontend/hosted behavior changed in this documentation phase.

## Object Summary

Observed live public base tables:

- `device_heartbeats`
- `device_registry`
- `garden_devices`
- `garden_memberships`
- `gardens`
- `profiles`
- `sensor_events`
- `sensor_logs`
- `sensor_measurement_batches`
- `support_memberships`
- `watering_events`

Observed live public views:

- `customer_garden_devices`
- `customer_hosted_device_diagnostics`
- `customer_hosted_gen2_measurements`
- `customer_watering_events`
- `hosted_device_diagnostics`
- `hosted_gen2_measurements`
- `sensor_measurements_flat`
- `support_garden_devices`
- `support_hosted_device_diagnostics`
- `support_hosted_gen2_measurements`
- `support_watering_events`

Observed live public functions:

- `is_device_heartbeat_insert_enabled(input_device_id text)`
- `is_device_telemetry_insert_enabled(input_device_id text)`
- `rls_auto_enable()`
- `set_device_registry_updated_at()`

Observed live user/event triggers:

- `set_device_registry_updated_at`
- `ensure_rls`

All observed public base tables have RLS enabled.

## Public Tables

### device_heartbeats

- Purpose: Append-only device diagnostics and heartbeat evidence.
- Related repo artifacts: `phase6j3-device-heartbeats.sql`, `phase6j5-device-registry.sql`, `phase6j6-hosted-device-diagnostics-view.sql`, `phase7k6-hosted-runtime-diagnostics-view.sql`, `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Evidence storage only. Not command/control and not watering authority.
- Primary key: `id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: Primary-key uniqueness on `id`.
- Check rules: `device_id`, `device_role`, and `heartbeat_reason` must not be blank; numeric counters/durations must be null or nonnegative; `details` must be a JSON object.
- Indexes: `device_heartbeats_pkey`, `device_heartbeats_heartbeat_at_desc_idx`, `device_heartbeats_device_id_heartbeat_at_desc_idx`, `device_heartbeats_heartbeat_reason_idx`, `device_heartbeats_device_role_idx`, `device_heartbeats_created_at_desc_idx`.
- RLS: Enabled.
- Policies: Anon INSERT only through `is_device_heartbeat_insert_enabled(device_id)`; no SELECT/UPDATE/DELETE policy observed.
- Grants/access notes: Object grants alone do not define effective access; RLS narrows browser-role access.
- Notes: Phase 6J.3 hardcoded-device insert behavior appears superseded by Phase 6J.5 registry helpers.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `heartbeat_at` | `timestamp with time zone` | no | `now()` |  |  |
| `device_id` | `text` | no | `` |  | Registry-gated heartbeat identity. |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | no | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `heartbeat_reason` | `text` | no | `` |  | Must not be blank. |
| `uptime_seconds` | `integer` | yes | `` |  | Null or nonnegative. |
| `boot_count` | `integer` | yes | `` |  | Null or nonnegative. |
| `reset_reason` | `text` | yes | `` |  |  |
| `free_heap` | `integer` | yes | `` |  | Null or nonnegative. |
| `min_free_heap` | `integer` | yes | `` |  | Null or nonnegative. |
| `wifi_connected` | `boolean` | yes | `` |  |  |
| `wifi_rssi` | `integer` | yes | `` |  |  |
| `wifi_reconnect_attempt_count` | `integer` | yes | `` |  | Null or nonnegative. |
| `last_supabase_http_status` | `integer` | yes | `` |  |  |
| `consecutive_supabase_failures` | `integer` | yes | `` |  | Null or nonnegative. |
| `last_supabase_error_category` | `text` | yes | `` |  |  |
| `last_successful_telemetry_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_successful_diagnostics_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_sensor_read_at` | `timestamp with time zone` | yes | `` |  |  |
| `dht_fresh_read_ok` | `boolean` | yes | `` |  |  |
| `dht_using_cached_values` | `boolean` | yes | `` |  |  |
| `dht_failure_count` | `integer` | yes | `` |  | Null or nonnegative. |
| `soil_raw_adc_last` | `integer` | yes | `` |  | Null or nonnegative. |
| `currently_watering` | `boolean` | yes | `` |  | Diagnostic evidence only. |
| `last_watering_started_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_watering_completed_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_watering_duration` | `integer` | yes | `` |  | Null or nonnegative. |
| `pump_control_available` | `boolean` | yes | `` |  | Diagnostic evidence only; not command/control. |
| `device_can_water` | `boolean` | yes | `` |  | Diagnostic evidence only; not command/control. |
| `details` | `jsonb` | no | `'{}'::jsonb` |  | JSON object. |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### device_registry

- Purpose: Provisioned-device registry and insert-authorization source for telemetry/diagnostics/evidence rows.
- Related repo artifacts: `phase6j5-device-registry.sql`, plus downstream hosted/customer/support view artifacts.
- Command/control status: Registry evidence and authorization metadata only. Registry flags do not grant watering authority.
- Primary key: `device_id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: `device_key`.
- Check rules: `device_id`, `device_key`, `device_label`, and `device_role` must not be blank; `device_role` must be one of `controller`, `bench`, `sensor-scout`.
- Indexes: `device_registry_pkey`, `device_registry_device_key_key`.
- RLS: Enabled.
- Policies: No browser-role SELECT policy observed.
- Grants/access notes: Helper functions read registry state for insert authorization. Base table is not intended as a broad browser-readable surface.
- Notes: `set_device_registry_updated_at` maintains `updated_at` on update.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | no | `` |  | Primary key. |
| `device_key` | `text` | no | `` |  | Unique; must not be blank. |
| `device_label` | `text` | no | `` |  | Must not be blank. |
| `device_role` | `text` | no | `` |  | Allowed values: controller, bench, sensor-scout. |
| `active` | `boolean` | no | `true` |  | Registry eligibility flag. |
| `telemetry_insert_enabled` | `boolean` | no | `true` |  | Registry-gated insert flag; not command/control. |
| `heartbeat_insert_enabled` | `boolean` | no | `true` |  | Registry-gated insert flag; not command/control. |
| `hosted_visible` | `boolean` | no | `true` |  | Controls public/demo hosted visibility. |
| `notes` | `text` | yes | `` |  |  |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |
| `updated_at` | `timestamp with time zone` | no | `now()` |  | Maintained by trigger. |

### garden_devices

- Purpose: Assign provisioned devices to gardens/sites with customer/support visibility metadata.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Read/access metadata only, not firmware identity authority and not watering authority.
- Primary key: `id`.
- Foreign keys: `device_id` references `device_registry(device_id)`; `garden_id` references `gardens(id)` with delete cascade.
- Unique rules: `(garden_id, device_id)`.
- Check rules: `display_name` must not be blank; `garden_device_role` must be one of `primary_controller`, `telemetry_readings_sensor`, `support_bench`; `sort_order` must be nonnegative.
- Indexes: `garden_devices_pkey`, `garden_devices_garden_device_unique`, `garden_devices_garden_id_sort_order_idx`, `garden_devices_device_id_idx`, `garden_devices_customer_visible_idx`, `garden_devices_support_visible_idx`.
- RLS: Enabled.
- Policies: Authenticated SELECT policies are membership/support filtered.
- Grants/access notes: Protected views are the intended browser-readable surface, not broad direct base-table reads.
- Notes: Device display role is distinct from local firmware watering capability.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `garden_id` | `uuid` | no | `` |  | Foreign key to public.gardens.id; delete cascade. |
| `device_id` | `text` | no | `` |  | Foreign key to public.device_registry.device_id. |
| `display_name` | `text` | no | `` |  | Must not be blank. |
| `garden_device_role` | `text` | no | `` |  | Allowed values: primary_controller, telemetry_readings_sensor, support_bench. |
| `customer_visible` | `boolean` | no | `true` |  | Customer protected-view visibility flag. |
| `support_visible` | `boolean` | no | `true` |  | Support protected-view visibility flag. |
| `active` | `boolean` | no | `true` |  |  |
| `sort_order` | `integer` | no | `100` |  | Nonnegative. |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### garden_memberships

- Purpose: Authenticated customer membership linking users to gardens.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Access metadata only.
- Primary key: `id`.
- Foreign keys: `garden_id` references `gardens(id)` with delete cascade; `user_id` references `auth.users(id)` with delete cascade.
- Unique rules: `(garden_id, user_id)`.
- Check rules: `role` must be one of `customer_owner`, `customer_viewer`.
- Indexes: `garden_memberships_pkey`, `garden_memberships_garden_user_unique`, `garden_memberships_user_id_idx`, `garden_memberships_garden_id_idx`, `garden_memberships_active_user_id_idx`.
- RLS: Enabled.
- Policies: Authenticated users can read their own active garden memberships.
- Grants/access notes: Protected customer views apply membership filters through `auth.uid()`.
- Notes: Membership authorizes read visibility, not command/control.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `garden_id` | `uuid` | no | `` |  | Foreign key to public.gardens.id; delete cascade. |
| `user_id` | `uuid` | no | `` |  | Foreign key to auth.users.id; delete cascade. |
| `role` | `text` | no | `` |  | Allowed values: customer_owner, customer_viewer. |
| `active` | `boolean` | no | `true` |  |  |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### gardens

- Purpose: Customer/site/garden metadata.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Read/access metadata only.
- Primary key: `id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: `garden_key`.
- Check rules: `garden_key` and `garden_name` must not be blank; `location_label` must be null or nonblank; `sort_order` must be nonnegative.
- Indexes: `gardens_pkey`, `gardens_garden_key_key`, `gardens_active_sort_order_idx`.
- RLS: Enabled.
- Policies: Authenticated garden members can read assigned gardens; support/admin users can read active gardens.
- Grants/access notes: Intended browser access is through protected views.
- Notes: Garden identity is separate from firmware telemetry identity.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `garden_key` | `text` | no | `` |  | Unique; must not be blank. |
| `garden_name` | `text` | no | `` |  | Must not be blank. |
| `location_label` | `text` | yes | `` |  | Null or nonblank. |
| `active` | `boolean` | no | `true` |  |  |
| `sort_order` | `integer` | no | `100` |  | Nonnegative. |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### profiles

- Purpose: Auth user profile metadata.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Account/profile metadata only.
- Primary key: `user_id`.
- Foreign keys: `user_id` references `auth.users(id)` with delete cascade.
- Unique rules: Primary-key uniqueness on `user_id`.
- Check rules: `display_name` must be null or nonblank.
- Indexes: `profiles_pkey`, `profiles_active_idx`.
- RLS: Enabled.
- Policies: Authenticated users can read their own active profile.
- Grants/access notes: No broad browser base-table read posture is intended.
- Notes: This snapshot does not inspect auth internals beyond observed public-schema references.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `user_id` | `uuid` | no | `` |  | Primary key; foreign key to auth.users.id; delete cascade. |
| `display_name` | `text` | yes | `` |  | Null or nonblank. |
| `active` | `boolean` | no | `true` |  |  |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### sensor_events

- Purpose: Manual operational context for interpreting telemetry, such as sensor swaps, moves, cleaning, calibration/reference notes, maintenance, plant/container changes, experiments, and notes.
- Related repo artifacts: No clear current tracked SQL creation artifact in the inspected `docs/sql` source pack. ADR 0005 and current docs describe the concept.
- Command/control status: Manual operational context only. Not firmware telemetry, not watering command/control, not hosted Water Now.
- Primary key: `id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: Primary-key uniqueness on `id`.
- Check rules: `summary` and `changed_by` must not be blank; `event_type` must be one of `sensor_swap`, `sensor_move`, `sensor_cleaning`, `sensor_calibration`, `reference_reading`, `maintenance`, `plant_move`, `container_change`, `experiment_start`, `experiment_stop`, or `note`.
- Indexes: `sensor_events_pkey`, `sensor_events_event_timestamp_idx`, `sensor_events_event_type_idx`, `sensor_events_sensor_type_idx`, `sensor_events_device_id_idx`, `sensor_events_container_id_idx`, `sensor_events_location_label_idx`.
- RLS: Enabled.
- Policies: No browser-role policies were observed in the pasted result set.
- Grants/access notes: With RLS enabled and no observed browser-role policies, this remains effectively operator/admin manual context rather than normal anon/auth REST telemetry.
- Notes: Uses `event_timestamp`, not `event_at`, `event_time`, or only `created_at`.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `event_timestamp` | `timestamp with time zone` | no | `now()` |  | Live event time column; not event_at/event_time. |
| `device_id` | `text` | yes | `` |  |  |
| `event_type` | `text` | no | `` |  | Allowed operational event values. |
| `summary` | `text` | no | `` |  | Must not be blank. |
| `details` | `jsonb` | no | `'{}'::jsonb` |  | JSON object. |
| `sensor_type` | `text` | yes | `` |  |  |
| `sensor_id` | `text` | yes | `` |  |  |
| `previous_sensor_id` | `text` | yes | `` |  |  |
| `container_id` | `text` | yes | `` |  |  |
| `location_label` | `text` | yes | `` |  |  |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |
| `changed_by` | `text` | no | `'Jeremy'::text` |  | Must not be blank. |

Future manual note shape, documentation-only and not executed in Phase 7S.1:

```sql
insert into public.sensor_events (
  event_type,
  summary,
  details,
  device_id,
  sensor_type,
  sensor_id,
  container_id,
  location_label,
  changed_by
)
values (
  'note',
  'Short operational note here.',
  '{"phase":"7S.1","source":"manual_sql_editor"}'::jsonb,
  'device-id-if-relevant',
  null,
  null,
  null,
  null,
  'Jeremy'
);
```

### sensor_logs

- Purpose: Legacy/current `SensorLogRow` telemetry history and historical watering-marker compatibility.
- Related repo artifacts: No clear current tracked SQL creation artifact in the inspected `docs/sql` source pack; later policy behavior is affected by `phase6j5-device-registry.sql`.
- Command/control status: Telemetry/history evidence only. Not command/control.
- Primary key: `id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: Primary-key uniqueness on `id`.
- Check rules: No check rules beyond the primary key were observed in the Phase 7S.1 constraints result set.
- Indexes: `sensor_logs_pkey`, `sensor_logs_timestamp_idx`.
- RLS: Enabled.
- Policies: Anon/authenticated SELECT is observed. Anon INSERT is registry-gated through `is_device_telemetry_insert_enabled(device_id)`. No UPDATE/DELETE policy observed.
- Grants/access notes: Public/demo history read posture is intentional legacy/current read evidence, constrained by RLS.
- Notes: Gen2 expanded measurements remain outside this table.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `device_id` | `text` | no | `` |  | Registry-gated telemetry identity. |
| `timestamp` | `timestamp with time zone` | no | `` |  | Firmware-written telemetry timestamp. |
| `data` | `jsonb` | no | `` |  | Canonical SensorLogRow JSON object. |

### sensor_measurement_batches

- Purpose: Append-only raw Gen2 `/measurements` package storage.
- Related repo artifacts: `phase7d-sensor-measurement-batches.sql`, `phase7f-hosted-gen2-measurements-view.sql`, `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Measurement evidence only. Storage does not mean usable for watering control.
- Primary key: `id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: Primary-key uniqueness on `id`.
- Check rules: `device_id` and `source_endpoint` must not be blank; optional role/version/profile values must be null or nonblank; `measured_at` must be between 2026-01-01 and 2100-01-01; `schema_version` must be positive; `record_count` must be nonnegative and match `jsonb_array_length(records)`; `records` must be a JSON array; `batch_details` must be a JSON object.
- Indexes: `sensor_measurement_batches_pkey`, `sensor_measurement_batches_measured_at_desc_idx`, `sensor_measurement_batches_device_id_measured_at_desc_idx`, `sensor_measurement_batches_device_id_created_at_desc_idx`, `sensor_measurement_batches_created_at_desc_idx`.
- RLS: Enabled.
- Policies: Anon INSERT is registry-gated through `is_device_telemetry_insert_enabled(device_id)`. No SELECT/UPDATE/DELETE policy observed.
- Grants/access notes: Base table is not the browser read surface; hosted/protected views project safe fields.
- Notes: `control_eligible` in records is local firmware evidence, not command/control.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `device_id` | `text` | no | `` |  | Registry-gated telemetry identity. |
| `measured_at` | `timestamp with time zone` | no | `` |  | Sane range: 2026-01-01 to 2100-01-01. |
| `device_role` | `text` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `schema_version` | `integer` | no | `1` |  | Positive. |
| `record_count` | `integer` | no | `` |  | Nonnegative; must match records length. |
| `records` | `jsonb` | no | `` |  | JSON array. |
| `source_endpoint` | `text` | no | `'/measurements'::text` |  | Must not be blank. |
| `batch_details` | `jsonb` | no | `'{}'::jsonb` |  | JSON object. |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### support_memberships

- Purpose: Authenticated support/admin membership metadata.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Access metadata only.
- Primary key: `id`.
- Foreign keys: `user_id` references `auth.users(id)` with delete cascade.
- Unique rules: `user_id`.
- Check rules: `role` must be one of `support_read_only`, `admin`.
- Indexes: `support_memberships_pkey`, `support_memberships_user_unique`, `support_memberships_user_id_idx`, `support_memberships_active_user_id_idx`.
- RLS: Enabled.
- Policies: Authenticated support users can read their own active support membership.
- Grants/access notes: Support protected views are the intended browser-readable surface.
- Notes: Support visibility remains read-only.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `user_id` | `uuid` | no | `` |  | Foreign key to auth.users.id; delete cascade; unique. |
| `role` | `text` | no | `` |  | Allowed values: support_read_only, admin. |
| `active` | `boolean` | no | `true` |  |  |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

### watering_events

- Purpose: Append-only device-originated watering event evidence.
- Related repo artifacts: `phase7o1-watering-events.sql`.
- Command/control status: Device-originated event evidence only. Not command/control, not hosted Water Now, not watering authority.
- Primary key: `id`.
- Foreign keys: None observed in the public constraint inventory.
- Unique rules: Primary-key uniqueness on `id`.
- Check rules: `device_id` must not be blank; `event_at` must be between 2026-01-01 and 2100-01-01; `event_type` must be one of `watering_started`, `watering_completed`, `watering_blocked`, `watering_safety_cutoff`; `trigger_source` must be one of `manual_local`, `automatic`, `physical_button`, `firmware_safety`; `duration_seconds` must be null or nonnegative; optional reason/version/profile/label values must be null or nonblank; `details` must be a JSON object.
- Indexes: `watering_events_pkey`, `watering_events_event_at_desc_idx`, `watering_events_device_id_event_at_desc_idx`, `watering_events_device_id_created_at_desc_idx`, `watering_events_event_type_idx`, `watering_events_trigger_source_idx`, `watering_events_created_at_desc_idx`.
- RLS: Enabled.
- Policies: Anon INSERT is registry-gated through `is_device_telemetry_insert_enabled(device_id)`. No base-table SELECT/UPDATE/DELETE policy observed.
- Grants/access notes: Customer/support reads go through protected views.
- Notes: Customer/support watering views redact sensitive network/local fields from `details`, including local IP, MAC, SSID, and endpoint-style keys.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` |  | Primary key. |
| `device_id` | `text` | no | `` |  | Registry-gated event identity. |
| `event_at` | `timestamp with time zone` | no | `` |  | Watering event time; sane range: 2026-01-01 to 2100-01-01. |
| `event_type` | `text` | no | `` |  | Allowed values: watering_started, watering_completed, watering_blocked, watering_safety_cutoff. |
| `trigger_source` | `text` | no | `` |  | Allowed values: manual_local, automatic, physical_button, firmware_safety. |
| `duration_seconds` | `integer` | yes | `` |  | Null or nonnegative. |
| `reason` | `text` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `details` | `jsonb` | no | `'{}'::jsonb` |  | JSON object. |
| `created_at` | `timestamp with time zone` | no | `now()` |  |  |

## Public Views

### customer_garden_devices

- Purpose: Authenticated customer garden/device metadata filtered by membership.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Read-only metadata view. Not command/control.
- Source objects: `gardens`, `garden_devices`, `device_registry`, `garden_memberships`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Authorization comes from `auth.uid()` membership filtering.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `garden_id` | `uuid` | yes | `` |  |  |
| `garden_key` | `text` | yes | `` |  |  |
| `garden_name` | `text` | yes | `` |  |  |
| `location_label` | `text` | yes | `` |  |  |
| `garden_sort_order` | `integer` | yes | `` |  |  |
| `garden_device_id` | `uuid` | yes | `` |  |  |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `display_name` | `text` | yes | `` |  |  |
| `garden_device_role` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `device_sort_order` | `integer` | yes | `` |  |  |

### customer_hosted_device_diagnostics

- Purpose: Authenticated customer diagnostics view over hosted-safe device heartbeat fields.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`, `phase7k6-hosted-runtime-diagnostics-view.sql`.
- Command/control status: Read-only diagnostics view. Not command/control.
- Source objects: `device_registry`, latest `device_heartbeats`, `customer_garden_devices`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Does not expose raw local network details or command/control endpoints.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `hosted_visible` | `boolean` | yes | `` |  |  |
| `last_heartbeat_at` | `timestamp with time zone` | yes | `` |  |  |
| `heartbeat_age_seconds` | `integer` | yes | `` |  |  |
| `heartbeat_reason` | `text` | yes | `` |  |  |
| `uptime_seconds` | `integer` | yes | `` |  |  |
| `wifi_connected` | `boolean` | yes | `` |  |  |
| `wifi_rssi` | `integer` | yes | `` |  |  |
| `free_heap` | `integer` | yes | `` |  |  |
| `min_free_heap` | `integer` | yes | `` |  |  |
| `currently_watering` | `boolean` | yes | `` |  |  |
| `last_watering_duration` | `integer` | yes | `` |  |  |
| `wifi_reconnect_attempt_count` | `integer` | yes | `` |  |  |
| `last_supabase_http_status` | `integer` | yes | `` |  |  |
| `consecutive_supabase_failures` | `integer` | yes | `` |  |  |
| `last_supabase_error_category` | `text` | yes | `` |  |  |
| `last_successful_telemetry_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_successful_diagnostics_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `pump_control_available` | `boolean` | yes | `` |  |  |
| `device_can_water` | `boolean` | yes | `` |  |  |
| `wifi_begin_recovery_attempt_count` | `integer` | yes | `` |  |  |
| `wifi_disconnect_event_count` | `integer` | yes | `` |  |  |
| `wifi_got_ip_event_count` | `integer` | yes | `` |  |  |
| `last_wifi_status_code` | `integer` | yes | `` |  |  |
| `last_wifi_disconnect_reason` | `integer` | yes | `` |  |  |
| `last_wifi_disconnected_uptime_seconds` | `integer` | yes | `` |  |  |
| `last_wifi_reconnected_uptime_seconds` | `integer` | yes | `` |  |  |
| `last_network_recovery_action` | `text` | yes | `` |  |  |

### customer_hosted_gen2_measurements

- Purpose: Authenticated customer Gen2 measurement display view filtered by garden membership.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`, `phase7f-hosted-gen2-measurements-view.sql`.
- Command/control status: Read-only measurement view. Not command/control.
- Source objects: `sensor_measurements_flat`, `device_registry`, `customer_garden_devices`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: `control_eligible` remains evidence, not command/control.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `measured_at` | `timestamp with time zone` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `record_index` | `integer` | yes | `` |  |  |
| `sensor_key` | `text` | yes | `` |  |  |
| `sensor_type` | `text` | yes | `` |  |  |
| `measurement_name` | `text` | yes | `` |  |  |
| `measurement_value` | `double precision` | yes | `` |  |  |
| `measurement_unit` | `text` | yes | `` |  |  |
| `valid` | `boolean` | yes | `` |  |  |
| `quality` | `text` | yes | `` |  |  |
| `reason` | `text` | yes | `` |  |  |
| `control_eligible` | `boolean` | yes | `` |  | Local firmware evidence; not command/control. |
| `batch_created_at` | `timestamp with time zone` | yes | `` |  |  |

### customer_watering_events

- Purpose: Authenticated customer watering event evidence view.
- Related repo artifacts: `phase7o1-watering-events.sql`.
- Command/control status: Read-only watering event evidence. Not command/control.
- Source objects: `watering_events`, `customer_garden_devices`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Redacts sensitive network/local keys from `details`.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | yes | `` |  |  |
| `garden_id` | `uuid` | yes | `` |  |  |
| `garden_key` | `text` | yes | `` |  |  |
| `garden_name` | `text` | yes | `` |  |  |
| `location_label` | `text` | yes | `` |  |  |
| `garden_sort_order` | `integer` | yes | `` |  |  |
| `garden_device_id` | `uuid` | yes | `` |  |  |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `garden_device_display_name` | `text` | yes | `` |  |  |
| `garden_device_role` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `device_sort_order` | `integer` | yes | `` |  |  |
| `event_at` | `timestamp with time zone` | yes | `` |  | Watering event time. |
| `event_type` | `text` | yes | `` |  |  |
| `trigger_source` | `text` | yes | `` |  |  |
| `duration_seconds` | `integer` | yes | `` |  |  |
| `reason` | `text` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `details` | `jsonb` | yes | `` |  | Sensitive network/local fields redacted. |
| `created_at` | `timestamp with time zone` | yes | `` |  |  |

### hosted_device_diagnostics

- Purpose: Public/demo hosted-safe diagnostics view.
- Related repo artifacts: `phase6j6-hosted-device-diagnostics-view.sql`, superseded/expanded by `phase7k6-hosted-runtime-diagnostics-view.sql`.
- Command/control status: Public/demo read-only diagnostics. Not command/control.
- Source objects: `device_registry`, latest `device_heartbeats`.
- Security barrier: Not identified as customer/support `security_barrier=true` view.
- Access notes: Anon/authenticated SELECT observed as public/demo read-only surface.
- Notes: Read-only evidence; not command/control.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `hosted_visible` | `boolean` | yes | `` |  |  |
| `last_heartbeat_at` | `timestamp with time zone` | yes | `` |  |  |
| `heartbeat_age_seconds` | `integer` | yes | `` |  |  |
| `heartbeat_reason` | `text` | yes | `` |  |  |
| `uptime_seconds` | `integer` | yes | `` |  |  |
| `wifi_connected` | `boolean` | yes | `` |  |  |
| `wifi_rssi` | `integer` | yes | `` |  |  |
| `free_heap` | `integer` | yes | `` |  |  |
| `min_free_heap` | `integer` | yes | `` |  |  |
| `currently_watering` | `boolean` | yes | `` |  |  |
| `last_watering_duration` | `integer` | yes | `` |  |  |
| `wifi_reconnect_attempt_count` | `integer` | yes | `` |  |  |
| `last_supabase_http_status` | `integer` | yes | `` |  |  |
| `consecutive_supabase_failures` | `integer` | yes | `` |  |  |
| `last_supabase_error_category` | `text` | yes | `` |  |  |
| `last_successful_telemetry_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_successful_diagnostics_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `pump_control_available` | `boolean` | yes | `` |  |  |
| `device_can_water` | `boolean` | yes | `` |  |  |
| `wifi_begin_recovery_attempt_count` | `integer` | yes | `` |  |  |
| `wifi_disconnect_event_count` | `integer` | yes | `` |  |  |
| `wifi_got_ip_event_count` | `integer` | yes | `` |  |  |
| `last_wifi_status_code` | `integer` | yes | `` |  |  |
| `last_wifi_disconnect_reason` | `integer` | yes | `` |  |  |
| `last_wifi_disconnected_uptime_seconds` | `integer` | yes | `` |  |  |
| `last_wifi_reconnected_uptime_seconds` | `integer` | yes | `` |  |  |
| `last_network_recovery_action` | `text` | yes | `` |  |  |

### hosted_gen2_measurements

- Purpose: Public/demo hosted-safe Gen2 measurement display view.
- Related repo artifacts: `phase7f-hosted-gen2-measurements-view.sql`.
- Command/control status: Public/demo read-only measurement view. Not command/control.
- Source objects: `sensor_measurements_flat`, `device_registry`.
- Security barrier: Not identified as customer/support `security_barrier=true` view.
- Access notes: Anon/authenticated SELECT observed as public/demo read-only surface.
- Notes: Does not grant direct public read on Gen2 base storage or registry.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `measured_at` | `timestamp with time zone` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `record_index` | `integer` | yes | `` |  |  |
| `sensor_key` | `text` | yes | `` |  |  |
| `sensor_type` | `text` | yes | `` |  |  |
| `measurement_name` | `text` | yes | `` |  |  |
| `measurement_value` | `double precision` | yes | `` |  |  |
| `measurement_unit` | `text` | yes | `` |  |  |
| `valid` | `boolean` | yes | `` |  |  |
| `quality` | `text` | yes | `` |  |  |
| `reason` | `text` | yes | `` |  |  |
| `control_eligible` | `boolean` | yes | `` |  | Local firmware evidence; not command/control. |
| `batch_created_at` | `timestamp with time zone` | yes | `` |  |  |

### sensor_measurements_flat

- Purpose: Derived flat Gen2 measurement query view over `sensor_measurement_batches.records`.
- Related repo artifacts: `phase7d-sensor-measurement-batches.sql`.
- Command/control status: Derived read evidence. Not command/control.
- Source objects: `sensor_measurement_batches`.
- Security barrier: Not identified as `security_barrier=true`.
- Access notes: Not the intended public/browser read surface.
- Notes: Used by hosted/protected projection views.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `batch_id` | `uuid` | yes | `` |  |  |
| `device_id` | `text` | yes | `` |  |  |
| `measured_at` | `timestamp with time zone` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `schema_version` | `integer` | yes | `` |  |  |
| `record_index` | `integer` | yes | `` |  |  |
| `sensor_key` | `text` | yes | `` |  |  |
| `sensor_type` | `text` | yes | `` |  |  |
| `measurement_name` | `text` | yes | `` |  |  |
| `measurement_value` | `double precision` | yes | `` |  |  |
| `measurement_unit` | `text` | yes | `` |  |  |
| `valid` | `boolean` | yes | `` |  |  |
| `quality` | `text` | yes | `` |  |  |
| `reason` | `text` | yes | `` |  |  |
| `control_eligible` | `boolean` | yes | `` |  | Local firmware evidence; not command/control. |
| `details` | `jsonb` | yes | `` |  |  |
| `source_endpoint` | `text` | yes | `` |  |  |
| `batch_details` | `jsonb` | yes | `` |  |  |
| `batch_created_at` | `timestamp with time zone` | yes | `` |  |  |

### support_garden_devices

- Purpose: Authenticated support/admin garden/device metadata filtered by support membership.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`.
- Command/control status: Read-only support metadata. Not command/control.
- Source objects: `gardens`, `garden_devices`, `device_registry`, `support_memberships`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Support visibility remains read-only.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `garden_id` | `uuid` | yes | `` |  |  |
| `garden_key` | `text` | yes | `` |  |  |
| `garden_name` | `text` | yes | `` |  |  |
| `location_label` | `text` | yes | `` |  |  |
| `garden_sort_order` | `integer` | yes | `` |  |  |
| `garden_device_id` | `uuid` | yes | `` |  |  |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `display_name` | `text` | yes | `` |  |  |
| `garden_device_role` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `customer_visible` | `boolean` | yes | `` |  |  |
| `support_visible` | `boolean` | yes | `` |  |  |
| `device_sort_order` | `integer` | yes | `` |  |  |

### support_hosted_device_diagnostics

- Purpose: Authenticated support/admin diagnostics view.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`, `phase7k6-hosted-runtime-diagnostics-view.sql`.
- Command/control status: Read-only support diagnostics. Not command/control.
- Source objects: `device_registry`, latest `device_heartbeats`, `support_garden_devices`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Read-only support evidence.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `hosted_visible` | `boolean` | yes | `` |  |  |
| `last_heartbeat_at` | `timestamp with time zone` | yes | `` |  |  |
| `heartbeat_age_seconds` | `integer` | yes | `` |  |  |
| `heartbeat_reason` | `text` | yes | `` |  |  |
| `uptime_seconds` | `integer` | yes | `` |  |  |
| `wifi_connected` | `boolean` | yes | `` |  |  |
| `wifi_rssi` | `integer` | yes | `` |  |  |
| `free_heap` | `integer` | yes | `` |  |  |
| `min_free_heap` | `integer` | yes | `` |  |  |
| `currently_watering` | `boolean` | yes | `` |  |  |
| `last_watering_duration` | `integer` | yes | `` |  |  |
| `wifi_reconnect_attempt_count` | `integer` | yes | `` |  |  |
| `last_supabase_http_status` | `integer` | yes | `` |  |  |
| `consecutive_supabase_failures` | `integer` | yes | `` |  |  |
| `last_supabase_error_category` | `text` | yes | `` |  |  |
| `last_successful_telemetry_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `last_successful_diagnostics_post_at` | `timestamp with time zone` | yes | `` |  |  |
| `pump_control_available` | `boolean` | yes | `` |  |  |
| `device_can_water` | `boolean` | yes | `` |  |  |
| `wifi_begin_recovery_attempt_count` | `integer` | yes | `` |  |  |
| `wifi_disconnect_event_count` | `integer` | yes | `` |  |  |
| `wifi_got_ip_event_count` | `integer` | yes | `` |  |  |
| `last_wifi_status_code` | `integer` | yes | `` |  |  |
| `last_wifi_disconnect_reason` | `integer` | yes | `` |  |  |
| `last_wifi_disconnected_uptime_seconds` | `integer` | yes | `` |  |  |
| `last_wifi_reconnected_uptime_seconds` | `integer` | yes | `` |  |  |
| `last_network_recovery_action` | `text` | yes | `` |  |  |

### support_hosted_gen2_measurements

- Purpose: Authenticated support/admin Gen2 measurement view.
- Related repo artifacts: `phase7l4-customer-auth-garden-membership-rls.sql`, `phase7f-hosted-gen2-measurements-view.sql`.
- Command/control status: Read-only support measurement view. Not command/control.
- Source objects: `sensor_measurements_flat`, `device_registry`, `support_garden_devices`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Read-only support evidence.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `measured_at` | `timestamp with time zone` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `record_index` | `integer` | yes | `` |  |  |
| `sensor_key` | `text` | yes | `` |  |  |
| `sensor_type` | `text` | yes | `` |  |  |
| `measurement_name` | `text` | yes | `` |  |  |
| `measurement_value` | `double precision` | yes | `` |  |  |
| `measurement_unit` | `text` | yes | `` |  |  |
| `valid` | `boolean` | yes | `` |  |  |
| `quality` | `text` | yes | `` |  |  |
| `reason` | `text` | yes | `` |  |  |
| `control_eligible` | `boolean` | yes | `` |  | Local firmware evidence; not command/control. |
| `batch_created_at` | `timestamp with time zone` | yes | `` |  |  |

### support_watering_events

- Purpose: Authenticated support/admin watering event evidence view.
- Related repo artifacts: `phase7o1-watering-events.sql`.
- Command/control status: Read-only support watering event evidence. Not command/control.
- Source objects: `watering_events`, `support_garden_devices`.
- Security barrier: `true`.
- Access notes: SELECT to `authenticated`; no anon access intended.
- Notes: Redacts sensitive network/local keys from `details`.

| column | type | nullable | default | identity/generated | notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | yes | `` |  |  |
| `garden_id` | `uuid` | yes | `` |  |  |
| `garden_key` | `text` | yes | `` |  |  |
| `garden_name` | `text` | yes | `` |  |  |
| `location_label` | `text` | yes | `` |  |  |
| `garden_sort_order` | `integer` | yes | `` |  |  |
| `garden_device_id` | `uuid` | yes | `` |  |  |
| `device_id` | `text` | yes | `` |  |  |
| `device_key` | `text` | yes | `` |  |  |
| `device_label` | `text` | yes | `` |  |  |
| `garden_device_display_name` | `text` | yes | `` |  |  |
| `garden_device_role` | `text` | yes | `` |  |  |
| `device_role` | `text` | yes | `` |  |  |
| `device_sort_order` | `integer` | yes | `` |  |  |
| `event_at` | `timestamp with time zone` | yes | `` |  | Watering event time. |
| `event_type` | `text` | yes | `` |  |  |
| `trigger_source` | `text` | yes | `` |  |  |
| `duration_seconds` | `integer` | yes | `` |  |  |
| `reason` | `text` | yes | `` |  |  |
| `firmware_version` | `text` | yes | `` |  |  |
| `build_profile` | `text` | yes | `` |  |  |
| `details` | `jsonb` | yes | `` |  | Sensitive network/local fields redacted. |
| `created_at` | `timestamp with time zone` | yes | `` |  |  |

## Public Functions

### is_device_heartbeat_insert_enabled(input_device_id text)

- Purpose: Registry-backed helper for device heartbeat insert authorization checks.
- Security definer/invoker: `SECURITY DEFINER`.
- Search path: `public`.
- Related policies/views/triggers: Used by `device_heartbeats` anon INSERT policy.
- Notes: This helper authorizes evidence inserts only. It is not command/control.

### is_device_telemetry_insert_enabled(input_device_id text)

- Purpose: Registry-backed helper for telemetry/evidence insert authorization checks.
- Security definer/invoker: `SECURITY DEFINER`.
- Search path: `public`.
- Related policies/views/triggers: Used by `sensor_logs`, `sensor_measurement_batches`, and `watering_events` anon INSERT policies.
- Notes: This helper authorizes evidence inserts only. It is not watering authority.

### rls_auto_enable()

- Purpose: Event-trigger helper that automatically enables RLS for newly created public tables covered by the trigger.
- Security definer/invoker: `SECURITY DEFINER`.
- Search path: `pg_catalog`.
- Related policies/views/triggers: Invoked by event trigger `ensure_rls`.
- Notes: Live database governance safety net only. Not a product command/control path.

### set_device_registry_updated_at()

- Purpose: Trigger helper that updates `device_registry.updated_at`.
- Security definer/invoker: Default invoker behavior; not `SECURITY DEFINER` in the live function inventory.
- Search path: `public`.
- Related policies/views/triggers: Invoked by user trigger `set_device_registry_updated_at`.
- Notes: Metadata maintenance only.

## Triggers and Event Triggers

- `set_device_registry_updated_at`: User trigger. Runs `BEFORE UPDATE ON public.device_registry` and invokes `set_device_registry_updated_at()`.
- `ensure_rls`: Event trigger. Enabled on `ddl_command_end`, invokes `public.rls_auto_enable()`, and applies to `CREATE TABLE`, `CREATE TABLE AS`, and `SELECT INTO`.
- Other trigger rows in the pasted result set are internal foreign-key constraint triggers.

`ensure_rls` / `rls_auto_enable()` is a live database governance safety net. It is not a product command/control path, not watering authority, and not hosted/local device behavior.

## RLS / Policy Summary

All observed public base tables have RLS enabled.

Observed effective policy posture:

- `device_heartbeats`: anon INSERT only through `is_device_heartbeat_insert_enabled(device_id)`; no SELECT/UPDATE/DELETE policy observed.
- `sensor_logs`: anon/authenticated SELECT; anon INSERT only through `is_device_telemetry_insert_enabled(device_id)`; no UPDATE/DELETE policy observed.
- `sensor_measurement_batches`: anon INSERT only through `is_device_telemetry_insert_enabled(device_id)`; no SELECT/UPDATE/DELETE policy observed.
- `watering_events`: anon INSERT only through `is_device_telemetry_insert_enabled(device_id)`; no SELECT/UPDATE/DELETE policy observed on the base table.
- `sensor_events`: RLS enabled; no browser-role policies observed; effectively operator/admin manual context.
- `device_registry`: RLS enabled; no browser-role SELECT policy observed; helper functions are used for insert authorization checks.
- `gardens`, `garden_devices`, `garden_memberships`, `profiles`, and `support_memberships`: authenticated SELECT policies are membership-filtered or self-filtered.

## Grants / Effective Access Summary

Object-level grants alone do not represent effective browser access because all live public base tables in this snapshot have RLS enabled. Effective access is determined by grants plus RLS policies together. Several evidence tables show broad object-level grants, but the observed RLS policies narrow effective browser-role access.

Effective browser-role posture from the pasted result sets:

- Public/demo read-only views `hosted_device_diagnostics` and `hosted_gen2_measurements` are anon-selectable.
- Customer/support protected views are authenticated-selectable and filtered by membership/support rules.
- `sensor_logs` remains anon/authenticated selectable for legacy/current history.
- Device-originated writes for heartbeat, telemetry batch, legacy telemetry, and watering-event evidence are registry-gated INSERT paths, not command/control paths.
- `sensor_events` has no observed browser-role policy and remains manual/operator/admin context.

## Repo SQL Artifact Mapping

| SQL artifact | Creates/changes | Tables | Views | Functions | Policies | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `phase6j3-device-heartbeats.sql` | Initial heartbeat table/RLS MVP | `device_heartbeats` | none | none | hardcoded anon INSERT allowlist | Policy behavior appears superseded by Phase 6J.5 registry helpers. |
| `phase6j5-device-registry.sql` | Device registry and registry-backed insert helpers | `device_registry` | none | `set_device_registry_updated_at`, `is_device_telemetry_insert_enabled`, `is_device_heartbeat_insert_enabled` | registry-backed INSERT policies for `sensor_logs` and `device_heartbeats` | Maps clearly to live registry/helper/policy posture. |
| `phase6j6-hosted-device-diagnostics-view.sql` | Initial hosted diagnostics view | none | `hosted_device_diagnostics` | none | none | Appears superseded/expanded by Phase 7K.6. |
| `phase7d-sensor-measurement-batches.sql` | Gen2 batch storage and flat view | `sensor_measurement_batches` | `sensor_measurements_flat` | none | registry-backed anon INSERT | Maps clearly to live Gen2 batch/flat objects. |
| `phase7f-hosted-gen2-measurements-view.sql` | Public/demo Gen2 hosted view | none | `hosted_gen2_measurements` | none | none | Maps clearly to live public/demo Gen2 read view. |
| `phase7g1-control-validation-readonly-queries.sql` | Analysis-only SQL | none | none | none | none | Not schema. |
| `phase7k6-hosted-runtime-diagnostics-view.sql` | Expanded hosted diagnostics view | none | `hosted_device_diagnostics` | none | none | Maps to live expanded diagnostics view. |
| `phase7l4-customer-auth-garden-membership-rls.sql` | Auth/customer/support metadata and protected views | `profiles`, `gardens`, `garden_devices`, `garden_memberships`, `support_memberships` | customer/support protected measurement, diagnostics, and garden-device views | none | membership/self/support SELECT policies | File header may say draft, but live catalog evidence shows objects are applied. |
| `phase7o1-watering-events.sql` | Watering event evidence path and protected views | `watering_events` | `customer_watering_events`, `support_watering_events` | none | registry-backed anon INSERT | File header may say proposal, but live catalog evidence shows objects are applied. |

## Live-vs-Repo Gaps

- `sensor_logs`, `sensor_events`, `rls_auto_enable()`, and `ensure_rls` do not have clear current tracked SQL creation artifacts in the inspected `docs/sql` source pack.
- `phase6j3` policy behavior appears superseded by `phase6j5` registry-backed helpers.
- `phase6j6` hosted diagnostics view appears superseded/expanded by `phase7k6`.
- `phase7l4` and `phase7o1` file headers may say draft/proposal, but live catalog evidence shows those objects are applied.
- `phase7g1` is analysis-only SQL, not schema.

## Command/Control Boundary Notes

- Supabase remains telemetry, history, diagnostics, evidence storage, and read-only hosted data source.
- Supabase is not command/control, not remote watering authority, not hosted Water Now backend, and not local pump-control authority.
- Local ESP32 firmware owns watering decisions and pump shutoff.
- `control_eligible` remains local firmware evidence only.
- `sensor_events` is manual operational context only, not firmware telemetry and not command/control.
- `watering_events` is device-originated event evidence only, not watering authority.
- `ensure_rls` / `rls_auto_enable()` is database governance, not product command/control.

## Follow-Up Questions / Later Cleanup Candidates

These are future candidates only and are out of scope for Phase 7S.1:

- Broad object-level grants on several evidence tables should be reviewed in a future access-hardening phase.
- No browser-role policy was observed for `sensor_events`, which is acceptable for manual/operator context but should be intentional.
- Consider future dedicated REST/RLS validation tests for anon/auth effective access if needed.

Do not implement any cleanup from this section without separate inspection, proposal, approval, and validation.
