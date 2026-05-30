-- Phase 7F - Hosted Gen2 Read-Only Measurements View
--
-- Limited hosted read-only view for Gen2 measurement display.
-- This view is display/read evidence only. It is not command/control.
-- Supabase remains telemetry/history/diagnostics storage only.
--
-- Security boundary:
-- - Do not grant anon SELECT on public.sensor_measurement_batches.
-- - Do not grant anon SELECT on public.sensor_measurements_flat.
-- - Do not grant anon SELECT on public.device_registry.
-- - Grant hosted read access only through this limited view.
-- - Do not expose raw details or raw batch_details in this MVP view.
-- - Do not add UPDATE, DELETE, command/control, or Remote Water Now behavior.

drop view if exists public.hosted_gen2_measurements;

create view public.hosted_gen2_measurements as
select
  flat.device_id,
  registry.device_key,
  coalesce(
    nullif(flat.batch_details ->> 'device_label', ''),
    registry.device_label
  ) as device_label,
  registry.device_role,
  flat.measured_at,
  flat.firmware_version,
  flat.build_profile,
  flat.record_index,
  flat.sensor_key,
  flat.sensor_type,
  flat.measurement_name,
  flat.measurement_value,
  flat.measurement_unit,
  flat.valid,
  flat.quality,
  flat.reason,
  flat.control_eligible,
  flat.batch_created_at
from public.sensor_measurements_flat as flat
inner join public.device_registry as registry
  on registry.device_id = flat.device_id
where registry.active is true
  and registry.hosted_visible is true;

revoke all on table public.hosted_gen2_measurements
  from public, anon, authenticated;

grant select on table public.hosted_gen2_measurements
  to anon, authenticated;

-- Preserve the hosted read boundary by explicitly removing broad SELECT
-- access from the underlying Gen2/base registry read paths.
-- Device-originated INSERT on public.sensor_measurement_batches is preserved.
revoke select on table public.sensor_measurement_batches
  from public, anon, authenticated;

revoke select on table public.sensor_measurements_flat
  from public, anon, authenticated;

revoke select on table public.device_registry
  from public, anon, authenticated;

-- Manual validation SQL, intentionally commented out.
--
-- Confirm hosted view returns recent Gen2 rows for Balcony01 and Scout01:
--
-- select
--   device_id,
--   device_key,
--   device_label,
--   device_role,
--   measured_at,
--   firmware_version,
--   build_profile,
--   record_index,
--   sensor_key,
--   sensor_type,
--   measurement_name,
--   measurement_value,
--   measurement_unit,
--   valid,
--   quality,
--   reason,
--   control_eligible,
--   batch_created_at
-- from public.hosted_gen2_measurements
-- where device_id in (
--   '550e8400-e29b-41d4-a716-446655440000',
--   '28f4e6e3-5979-4af4-9753-34e185d8e47e'
-- )
-- order by measured_at desc, record_index
-- limit 40;
--
-- Confirm grants for hosted view and related tables/views:
--
-- select grantee, table_schema, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in (
--     'hosted_gen2_measurements',
--     'sensor_measurement_batches',
--     'sensor_measurements_flat',
--     'device_registry'
--   )
-- order by table_name, grantee, privilege_type;
--
-- Confirm anon has SELECT on the hosted view but not the Gen2 base table,
-- Gen2 flat view, or base registry table:
--
-- select
--   has_table_privilege(
--     'anon',
--     'public.hosted_gen2_measurements',
--     'select'
--   ) as anon_can_select_hosted_gen2_measurements,
--   has_table_privilege(
--     'anon',
--     'public.sensor_measurement_batches',
--     'select'
--   ) as anon_can_select_sensor_measurement_batches,
--   has_table_privilege(
--     'anon',
--     'public.sensor_measurements_flat',
--     'select'
--   ) as anon_can_select_sensor_measurements_flat,
--   has_table_privilege(
--     'anon',
--     'public.device_registry',
--     'select'
--   ) as anon_can_select_device_registry;
