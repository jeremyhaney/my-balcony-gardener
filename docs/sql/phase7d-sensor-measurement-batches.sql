-- Phase 7D - Gen2 Sensor Measurement Batches SQL/RLS MVP
--
-- Append-only storage for complete Gen2 modular measurement packages emitted
-- by local GET /measurements.
--
-- This table stores measurement package evidence only. It is not
-- command/control. Supabase remains telemetry/history/diagnostics storage only.
--
-- Storage policy:
-- - Store one row per complete Gen2 measurement package/batch.
-- - Store the complete records[] array as jsonb.
-- - Do not store only valid records.
-- - Store valid, invalid, degraded, failed, missing, diagnostic, and
--   control-ineligible records because they are valuable engineering and
--   history evidence.
-- - Storage does not mean a measurement is usable for watering control.
-- - Watering control may only use measurements explicitly marked
--   control_eligible by local firmware logic, and Phase 7D does not approve
--   any new measurement for watering control.
--
-- Cadence note:
-- Short validation cadences such as 15 seconds are for deliberate prove-out
-- only. Committed firmware defaults should use a production-style cadence.

create extension if not exists pgcrypto;

create table if not exists public.sensor_measurement_batches (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  measured_at timestamptz not null,
  device_role text null,
  firmware_version text null,
  build_profile text null,
  schema_version integer not null default 1,
  record_count integer not null,
  records jsonb not null,
  source_endpoint text not null default '/measurements',
  batch_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint sensor_measurement_batches_device_id_not_blank
    check (btrim(device_id) <> ''),
  constraint sensor_measurement_batches_device_role_not_blank
    check (device_role is null or btrim(device_role) <> ''),
  constraint sensor_measurement_batches_firmware_version_not_blank
    check (firmware_version is null or btrim(firmware_version) <> ''),
  constraint sensor_measurement_batches_build_profile_not_blank
    check (build_profile is null or btrim(build_profile) <> ''),
  constraint sensor_measurement_batches_measured_at_sane
    check (
      measured_at >= '2026-01-01T00:00:00Z'::timestamptz
      and measured_at < '2100-01-01T00:00:00Z'::timestamptz
    ),
  constraint sensor_measurement_batches_schema_version_positive
    check (schema_version > 0),
  constraint sensor_measurement_batches_record_count_nonnegative
    check (record_count >= 0),
  constraint sensor_measurement_batches_records_array
    check (jsonb_typeof(records) = 'array'),
  constraint sensor_measurement_batches_record_count_matches_records
    check (jsonb_array_length(records) = record_count),
  constraint sensor_measurement_batches_source_endpoint_not_blank
    check (btrim(source_endpoint) <> ''),
  constraint sensor_measurement_batches_batch_details_object
    check (jsonb_typeof(batch_details) = 'object')
);

create index if not exists sensor_measurement_batches_measured_at_desc_idx
  on public.sensor_measurement_batches (measured_at desc);

create index if not exists sensor_measurement_batches_device_id_measured_at_desc_idx
  on public.sensor_measurement_batches (device_id, measured_at desc);

create index if not exists sensor_measurement_batches_device_id_created_at_desc_idx
  on public.sensor_measurement_batches (device_id, created_at desc);

create index if not exists sensor_measurement_batches_created_at_desc_idx
  on public.sensor_measurement_batches (created_at desc);

-- JSONB/GIN indexing on records is deferred until Phase 7E/7F query patterns
-- prove it is needed.

alter table public.sensor_measurement_batches enable row level security;

drop policy if exists "Registry active devices can insert sensor measurement batches"
  on public.sensor_measurement_batches;

create policy "Registry active devices can insert sensor measurement batches"
  on public.sensor_measurement_batches
  for insert
  to anon
  with check (
    public.is_device_telemetry_insert_enabled(device_id)
  );

drop view if exists public.sensor_measurements_flat;

create view public.sensor_measurements_flat as
select
  batch.id as batch_id,
  batch.device_id,
  batch.measured_at,
  batch.device_role,
  batch.firmware_version,
  batch.build_profile,
  batch.schema_version,
  record.ordinality::integer as record_index,
  record.value ->> 'sensor_key' as sensor_key,
  record.value ->> 'sensor_type' as sensor_type,
  record.value ->> 'measurement_name' as measurement_name,
  case
    when jsonb_typeof(record.value -> 'measurement_value') = 'number'
      then (record.value ->> 'measurement_value')::double precision
    when jsonb_typeof(record.value -> 'measurement_value') = 'string'
      and (record.value ->> 'measurement_value') ~
        '^[+-]?((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$'
      then (record.value ->> 'measurement_value')::double precision
    else null
  end as measurement_value,
  record.value ->> 'measurement_unit' as measurement_unit,
  case
    when jsonb_typeof(record.value -> 'valid') = 'boolean'
      then (record.value ->> 'valid')::boolean
    else null
  end as valid,
  record.value ->> 'quality' as quality,
  record.value ->> 'reason' as reason,
  case
    when jsonb_typeof(record.value -> 'control_eligible') = 'boolean'
      then (record.value ->> 'control_eligible')::boolean
    else null
  end as control_eligible,
  case
    when jsonb_typeof(record.value -> 'details') = 'object'
      then record.value -> 'details'
    else '{}'::jsonb
  end as details,
  batch.source_endpoint,
  batch.batch_details,
  batch.created_at as batch_created_at
from public.sensor_measurement_batches as batch
cross join lateral jsonb_array_elements(batch.records)
  with ordinality as record(value, ordinality);

-- Phase 7D intentionally adds no anon SELECT policy on the base table.
-- Phase 7D intentionally grants no anon SELECT on public.sensor_measurements_flat.
-- Hosted read-only display of Gen2 measurements is deferred to Phase 7E.
--
-- Phase 7D intentionally adds no UPDATE or DELETE policy.
-- Device-originated measurement batch rows are append-only evidence.
--
-- Manual validation SQL, intentionally commented out.
--
-- Review table existence:
--
-- select table_schema, table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name = 'sensor_measurement_batches';
--
-- Review columns:
--
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'sensor_measurement_batches'
-- order by ordinal_position;
--
-- Review constraints:
--
-- select conname, contype, pg_get_constraintdef(oid) as definition
-- from pg_constraint
-- where conrelid = 'public.sensor_measurement_batches'::regclass
-- order by conname;
--
-- Review indexes:
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'sensor_measurement_batches'
-- order by indexname;
--
-- Review policies:
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'sensor_measurement_batches'
-- order by policyname;
--
-- Confirm registry helper behavior:
--
-- select
--   public.is_device_telemetry_insert_enabled(
--     '318fab98-89ad-4f36-9100-3134a04e0be5'
--   ) as bench_measurement_batch_insert_allowed,
--   public.is_device_telemetry_insert_enabled(
--     '00000000-0000-0000-0000-000000000000'
--   ) as fake_measurement_batch_insert_allowed;
--
-- Owner/admin insert validation:
--
-- insert into public.sensor_measurement_batches (
--   device_id,
--   measured_at,
--   device_role,
--   firmware_version,
--   build_profile,
--   schema_version,
--   record_count,
--   records,
--   source_endpoint,
--   batch_details
-- )
-- values (
--   '318fab98-89ad-4f36-9100-3134a04e0be5',
--   now(),
--   'bench',
--   null,
--   null,
--   1,
--   2,
--   '[
--     {
--       "device_id":"318fab98-89ad-4f36-9100-3134a04e0be5",
--       "measured_at":"2026-05-28T18:00:00Z",
--       "sensor_key":"manual_sql_validation",
--       "sensor_type":"manual_validation",
--       "measurement_name":"manual_validation_value",
--       "measurement_value":1.23,
--       "measurement_unit":"test_unit",
--       "valid":true,
--       "quality":"good",
--       "reason":"manual_sql_validation",
--       "control_eligible":false,
--       "details":{"phase":"7D","source":"manual_sql_validation"}
--     },
--     {
--       "device_id":"318fab98-89ad-4f36-9100-3134a04e0be5",
--       "measured_at":"2026-05-28T18:00:00Z",
--       "sensor_key":"manual_sql_validation",
--       "sensor_type":"manual_validation",
--       "measurement_name":"manual_null_value",
--       "measurement_value":null,
--       "measurement_unit":"test_unit",
--       "valid":false,
--       "quality":"failed",
--       "reason":"manual_null_validation",
--       "control_eligible":false,
--       "details":{"phase":"7D","source":"manual_sql_validation"}
--     }
--   ]'::jsonb,
--   '/measurements',
--   '{"phase":"7D","source":"manual_sql_validation"}'::jsonb
-- );
--
-- Select latest raw batches:
--
-- select
--   id,
--   device_id,
--   measured_at,
--   device_role,
--   firmware_version,
--   build_profile,
--   schema_version,
--   record_count,
--   records,
--   source_endpoint,
--   batch_details,
--   created_at
-- from public.sensor_measurement_batches
-- where device_id = '318fab98-89ad-4f36-9100-3134a04e0be5'
-- order by created_at desc
-- limit 5;
--
-- Select flattened rows:
--
-- select
--   batch_id,
--   device_id,
--   measured_at,
--   device_role,
--   firmware_version,
--   build_profile,
--   schema_version,
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
--   details,
--   source_endpoint,
--   batch_details,
--   batch_created_at
-- from public.sensor_measurements_flat
-- where device_id = '318fab98-89ad-4f36-9100-3134a04e0be5'
-- order by batch_created_at desc, record_index
-- limit 30;
