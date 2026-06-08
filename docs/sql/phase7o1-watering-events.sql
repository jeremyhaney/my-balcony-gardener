-- Phase 7O.1 - Watering Events SQL/RLS Proposal
--
-- Proposed append-only device-originated watering event evidence path.
--
-- This table is evidence only. It is not command/control.
-- Local ESP32 firmware remains the owner of watering decisions and pump
-- shutoff. Supabase stores event evidence only and must never command
-- watering. Protected views redact known local/network keys from details.
--
-- Hybrid model preserved:
-- - sensor_logs remains legacy/current compatibility and historical markers.
-- - watering_events becomes the proposed future canonical watering event path.
-- - sensor_measurement_batches remains Gen2 measurement package evidence.
-- - device_heartbeats remains diagnostics/latest health evidence.
-- - sensor_events remains manual operational context.
--
-- This artifact is a proposal for later review/execution approval. Do not run
-- it until Jeremy explicitly approves the SQL execution slice.

create extension if not exists pgcrypto;

create table if not exists public.watering_events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  event_at timestamptz not null,
  event_type text not null,
  trigger_source text not null,
  duration_seconds integer null,
  reason text null,
  firmware_version text null,
  build_profile text null,
  device_label text null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint watering_events_device_id_not_blank
    check (btrim(device_id) <> ''),
  constraint watering_events_event_at_sane
    check (
      event_at >= '2026-01-01T00:00:00Z'::timestamptz
      and event_at < '2100-01-01T00:00:00Z'::timestamptz
    ),
  constraint watering_events_event_type_valid
    check (
      event_type in (
        'watering_started',
        'watering_completed',
        'watering_blocked',
        'watering_safety_cutoff'
      )
    ),
  constraint watering_events_trigger_source_valid
    check (
      trigger_source in (
        'manual_local',
        'automatic',
        'physical_button',
        'firmware_safety'
      )
    ),
  constraint watering_events_duration_seconds_nonnegative
    check (
      duration_seconds is null
      or duration_seconds >= 0
    ),
  constraint watering_events_reason_not_blank
    check (reason is null or btrim(reason) <> ''),
  constraint watering_events_firmware_version_not_blank
    check (firmware_version is null or btrim(firmware_version) <> ''),
  constraint watering_events_build_profile_not_blank
    check (build_profile is null or btrim(build_profile) <> ''),
  constraint watering_events_device_label_not_blank
    check (device_label is null or btrim(device_label) <> ''),
  constraint watering_events_details_object
    check (jsonb_typeof(details) = 'object')
);

create index if not exists watering_events_event_at_desc_idx
  on public.watering_events (event_at desc);

create index if not exists watering_events_device_id_event_at_desc_idx
  on public.watering_events (device_id, event_at desc);

create index if not exists watering_events_device_id_created_at_desc_idx
  on public.watering_events (device_id, created_at desc);

create index if not exists watering_events_event_type_idx
  on public.watering_events (event_type);

create index if not exists watering_events_trigger_source_idx
  on public.watering_events (trigger_source);

create index if not exists watering_events_created_at_desc_idx
  on public.watering_events (created_at desc);

alter table public.watering_events enable row level security;

revoke all on table public.watering_events
  from public, anon, authenticated;

grant insert on table public.watering_events
  to anon;

drop policy if exists "Registry active devices can insert watering events"
  on public.watering_events;

create policy "Registry active devices can insert watering events"
  on public.watering_events
  for insert
  to anon
  with check (
    public.is_device_telemetry_insert_enabled(device_id)
  );

drop view if exists public.customer_watering_events;
drop view if exists public.support_watering_events;

create view public.customer_watering_events
with (security_barrier = true)
as
select
  watering_event.id,
  customer_device.garden_id,
  customer_device.garden_key,
  customer_device.garden_name,
  customer_device.location_label,
  customer_device.garden_sort_order,
  customer_device.garden_device_id,
  watering_event.device_id,
  customer_device.device_key,
  coalesce(
    nullif(watering_event.device_label, ''),
    customer_device.display_name
  ) as device_label,
  customer_device.display_name as garden_device_display_name,
  customer_device.garden_device_role,
  customer_device.device_role,
  customer_device.device_sort_order,
  watering_event.event_at,
  watering_event.event_type,
  watering_event.trigger_source,
  watering_event.duration_seconds,
  watering_event.reason,
  watering_event.firmware_version,
  watering_event.build_profile,
  watering_event.details
    - 'local_ip'
    - 'ip_address'
    - 'mac_address'
    - 'wifi_ssid'
    - 'ssid'
    - 'local_endpoint'
    - 'local_url'
    - 'endpoint_url'
    - 'wifi_network'
    - 'wifi_name'
    - 'network_ssid'
    as details,
  watering_event.created_at
from public.watering_events as watering_event
inner join public.customer_garden_devices as customer_device
  on customer_device.device_id = watering_event.device_id;

create view public.support_watering_events
with (security_barrier = true)
as
select
  watering_event.id,
  support_device.garden_id,
  support_device.garden_key,
  support_device.garden_name,
  support_device.location_label,
  support_device.garden_sort_order,
  support_device.garden_device_id,
  watering_event.device_id,
  support_device.device_key,
  coalesce(
    nullif(watering_event.device_label, ''),
    support_device.display_name
  ) as device_label,
  support_device.display_name as garden_device_display_name,
  support_device.garden_device_role,
  support_device.device_role,
  support_device.device_sort_order,
  watering_event.event_at,
  watering_event.event_type,
  watering_event.trigger_source,
  watering_event.duration_seconds,
  watering_event.reason,
  watering_event.firmware_version,
  watering_event.build_profile,
  watering_event.details
    - 'local_ip'
    - 'ip_address'
    - 'mac_address'
    - 'wifi_ssid'
    - 'ssid'
    - 'local_endpoint'
    - 'local_url'
    - 'endpoint_url'
    - 'wifi_network'
    - 'wifi_name'
    - 'network_ssid'
    as details,
  watering_event.created_at
from public.watering_events as watering_event
inner join public.support_garden_devices as support_device
  on support_device.device_id = watering_event.device_id;

revoke all on public.customer_watering_events
  from public, anon, authenticated;
revoke all on public.support_watering_events
  from public, anon, authenticated;

grant select on public.customer_watering_events
  to authenticated;
grant select on public.support_watering_events
  to authenticated;

-- Manual validation SQL, intentionally commented out.
--
-- Review table existence:
--
-- select table_schema, table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name = 'watering_events';
--
-- Review columns:
--
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'watering_events'
-- order by ordinal_position;
--
-- Review constraints:
--
-- select conname, contype, pg_get_constraintdef(oid) as definition
-- from pg_constraint
-- where conrelid = 'public.watering_events'::regclass
-- order by conname;
--
-- Review indexes:
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'watering_events'
-- order by indexname;
--
-- Review policies:
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'watering_events'
-- order by policyname;
--
-- Review view existence:
--
-- select table_schema, table_name
-- from information_schema.views
-- where table_schema = 'public'
--   and table_name in (
--     'customer_watering_events',
--     'support_watering_events'
--   )
-- order by table_name;
--
-- Review grants:
--
-- select grantee, table_schema, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in (
--     'watering_events',
--     'customer_watering_events',
--     'support_watering_events'
--   )
-- order by table_name, grantee, privilege_type;
--
-- Confirm registry helper behavior for known/fake devices:
--
-- select
--   public.is_device_telemetry_insert_enabled(
--     '550e8400-e29b-41d4-a716-446655440000'
--   ) as balcony_watering_event_insert_allowed,
--   public.is_device_telemetry_insert_enabled(
--     '00000000-0000-0000-0000-000000000000'
--   ) as fake_watering_event_insert_allowed;
--
-- Owner/admin insert validation example: Balcony01 watering_started.
--
-- insert into public.watering_events (
--   device_id,
--   event_at,
--   event_type,
--   trigger_source,
--   reason,
--   firmware_version,
--   build_profile,
--   device_label,
--   details
-- )
-- values (
--   '550e8400-e29b-41d4-a716-446655440000',
--   now(),
--   'watering_started',
--   'manual_local',
--   'manual_sql_validation_only',
--   'phase7o1-validation',
--   'balcony-installed-gen2',
--   'Balcony01',
--   '{"phase":"7O.1","source":"manual_sql_validation"}'::jsonb
-- );
--
-- Owner/admin insert validation example: Balcony01 watering_completed.
--
-- insert into public.watering_events (
--   device_id,
--   event_at,
--   event_type,
--   trigger_source,
--   duration_seconds,
--   reason,
--   firmware_version,
--   build_profile,
--   device_label,
--   details
-- )
-- values (
--   '550e8400-e29b-41d4-a716-446655440000',
--   now(),
--   'watering_completed',
--   'manual_local',
--   60,
--   'manual_sql_validation_only',
--   'phase7o1-validation',
--   'balcony-installed-gen2',
--   'Balcony01',
--   '{"phase":"7O.1","source":"manual_sql_validation"}'::jsonb
-- );
--
-- Fake device helper check should be false:
--
-- select public.is_device_telemetry_insert_enabled(
--   '00000000-0000-0000-0000-000000000000'
-- ) as fake_device_allowed;
--
-- Authenticated protected-view grant checks:
--
-- select
--   has_table_privilege(
--     'authenticated',
--     'public.customer_watering_events',
--     'select'
--   ) as authenticated_can_select_customer_watering_events,
--   has_table_privilege(
--     'authenticated',
--     'public.support_watering_events',
--     'select'
--   ) as authenticated_can_select_support_watering_events;
--
-- Anon protected-view denial checks:
--
-- select
--   has_table_privilege(
--     'anon',
--     'public.customer_watering_events',
--     'select'
--   ) as anon_can_select_customer_watering_events,
--   has_table_privilege(
--     'anon',
--     'public.support_watering_events',
--     'select'
--   ) as anon_can_select_support_watering_events,
--   has_table_privilege(
--     'anon',
--     'public.watering_events',
--     'select'
--   ) as anon_can_select_watering_events;
--
-- SQL Editor caveat:
-- Supabase SQL Editor often runs with elevated privileges. Final proof should
-- validate anon device INSERT and authenticated customer/support SELECT
-- through REST/API clients with the intended roles and JWT claims.
