-- Phase 7L.4 - Customer Auth, Garden Membership, and RLS Implementation
--
-- Draft artifact only until explicitly approved and run by Jeremy.
--
-- Approved strategy:
-- - Use protected views with explicit auth.uid() membership filters.
-- - Grant protected customer/support views to authenticated only.
-- - Do not grant anon access to protected customer/support views.
-- - Do not grant broad browser access to raw/base telemetry tables.
-- - Keep Supabase as telemetry/history/diagnostics storage only.
-- - Do not introduce command/control, Remote Water Now, or hosted local ESP32 calls.
--
-- Hosted-safe projection choice:
-- This artifact duplicates the explicit hosted-safe display projections instead
-- of selecting raw sensor_measurements_flat.*. Customer/support measurement
-- views project only the same display-safe Gen2 fields exposed by
-- public.hosted_gen2_measurements, then add auth.uid() + membership filtering.
-- Diagnostics views duplicate the already hosted-safe diagnostics surface and
-- do not expose local IPs, MACs, SSIDs, registry notes, raw heartbeat details
-- JSON, service/admin fields, or command/control endpoints.
--
-- Public demo exposure review:
-- Public demo views remain public for now. Protected customer/support routes
-- must use the protected views in this artifact, not public demo-safe views.
-- Before any external customer device is added, public demo exposure must be
-- confirmed demo-safe. Devices that should not appear in the public demo should
-- not remain broadly exposed through public hosted/demo views.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint profiles_display_name_not_blank
    check (display_name is null or btrim(display_name) <> '')
);

create table if not exists public.gardens (
  id uuid primary key default gen_random_uuid(),
  garden_key text unique not null,
  garden_name text not null,
  location_label text null,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),

  constraint gardens_garden_key_not_blank
    check (btrim(garden_key) <> ''),
  constraint gardens_garden_name_not_blank
    check (btrim(garden_name) <> ''),
  constraint gardens_location_label_not_blank
    check (location_label is null or btrim(location_label) <> ''),
  constraint gardens_sort_order_nonnegative
    check (sort_order >= 0)
);

create table if not exists public.garden_devices (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens(id) on delete cascade,
  device_id text not null references public.device_registry(device_id),
  display_name text not null,
  garden_device_role text not null,
  customer_visible boolean not null default true,
  support_visible boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),

  constraint garden_devices_garden_device_unique
    unique (garden_id, device_id),
  constraint garden_devices_display_name_not_blank
    check (btrim(display_name) <> ''),
  constraint garden_devices_role_valid
    check (
      garden_device_role in (
        'primary_controller',
        'telemetry_readings_sensor',
        'support_bench'
      )
    ),
  constraint garden_devices_sort_order_nonnegative
    check (sort_order >= 0)
);

create table if not exists public.garden_memberships (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint garden_memberships_garden_user_unique
    unique (garden_id, user_id),
  constraint garden_memberships_role_valid
    check (role in ('customer_owner', 'customer_viewer'))
);

create table if not exists public.support_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint support_memberships_user_unique
    unique (user_id),
  constraint support_memberships_role_valid
    check (role in ('support_read_only', 'admin'))
);

create index if not exists profiles_active_idx
  on public.profiles (active);

create index if not exists gardens_active_sort_order_idx
  on public.gardens (active, sort_order, garden_name);

create index if not exists garden_devices_garden_id_sort_order_idx
  on public.garden_devices (garden_id, sort_order, display_name);

create index if not exists garden_devices_device_id_idx
  on public.garden_devices (device_id);

create index if not exists garden_devices_customer_visible_idx
  on public.garden_devices (customer_visible)
  where customer_visible is true and active is true;

create index if not exists garden_devices_support_visible_idx
  on public.garden_devices (support_visible)
  where support_visible is true and active is true;

create index if not exists garden_memberships_user_id_idx
  on public.garden_memberships (user_id);

create index if not exists garden_memberships_garden_id_idx
  on public.garden_memberships (garden_id);

create index if not exists garden_memberships_active_user_id_idx
  on public.garden_memberships (user_id)
  where active is true;

create index if not exists support_memberships_user_id_idx
  on public.support_memberships (user_id);

create index if not exists support_memberships_active_user_id_idx
  on public.support_memberships (user_id)
  where active is true;

alter table public.profiles enable row level security;
alter table public.gardens enable row level security;
alter table public.garden_devices enable row level security;
alter table public.garden_memberships enable row level security;
alter table public.support_memberships enable row level security;

revoke all on table public.profiles
  from public, anon, authenticated;
revoke all on table public.gardens
  from public, anon, authenticated;
revoke all on table public.garden_devices
  from public, anon, authenticated;
revoke all on table public.garden_memberships
  from public, anon, authenticated;
revoke all on table public.support_memberships
  from public, anon, authenticated;

-- Phase 7L.4 intentionally does not grant browser roles direct SELECT on
-- these base metadata tables. RLS policies below remain as defense-in-depth
-- and for future slices, but the browser-readable customer/support surface is
-- the protected views granted later in this artifact.

drop policy if exists "Users can read own profile"
  on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and active is true
  );

drop policy if exists "Users can read own garden memberships"
  on public.garden_memberships;

create policy "Users can read own garden memberships"
  on public.garden_memberships
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and active is true
  );

drop policy if exists "Support users can read own support membership"
  on public.support_memberships;

create policy "Support users can read own support membership"
  on public.support_memberships
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and active is true
  );

drop policy if exists "Garden members can read assigned gardens"
  on public.gardens;

create policy "Garden members can read assigned gardens"
  on public.gardens
  for select
  to authenticated
  using (
    active is true
    and exists (
      select 1
      from public.garden_memberships as membership
      where membership.garden_id = gardens.id
        and membership.user_id = (select auth.uid())
        and membership.active is true
    )
  );

drop policy if exists "Support admins can read active gardens"
  on public.gardens;

create policy "Support admins can read active gardens"
  on public.gardens
  for select
  to authenticated
  using (
    active is true
    and exists (
      select 1
      from public.support_memberships as support
      where support.user_id = (select auth.uid())
        and support.active is true
        and support.role in ('support_read_only', 'admin')
    )
  );

drop policy if exists "Garden members can read assigned garden devices"
  on public.garden_devices;

create policy "Garden members can read assigned garden devices"
  on public.garden_devices
  for select
  to authenticated
  using (
    active is true
    and customer_visible is true
    and exists (
      select 1
      from public.garden_memberships as membership
      where membership.garden_id = garden_devices.garden_id
        and membership.user_id = (select auth.uid())
        and membership.active is true
    )
  );

drop policy if exists "Support admins can read support visible garden devices"
  on public.garden_devices;

create policy "Support admins can read support visible garden devices"
  on public.garden_devices
  for select
  to authenticated
  using (
    active is true
    and support_visible is true
    and exists (
      select 1
      from public.support_memberships as support
      where support.user_id = (select auth.uid())
        and support.active is true
        and support.role in ('support_read_only', 'admin')
    )
  );

drop view if exists public.customer_hosted_device_diagnostics;
drop view if exists public.customer_hosted_gen2_measurements;
drop view if exists public.customer_garden_devices;
drop view if exists public.support_hosted_device_diagnostics;
drop view if exists public.support_hosted_gen2_measurements;
drop view if exists public.support_garden_devices;

create view public.customer_garden_devices
with (security_barrier = true)
as
select
  garden.id as garden_id,
  garden.garden_key,
  garden.garden_name,
  garden.location_label,
  garden.sort_order as garden_sort_order,
  garden_device.id as garden_device_id,
  garden_device.device_id,
  registry.device_key,
  garden_device.display_name,
  garden_device.garden_device_role,
  registry.device_role,
  garden_device.sort_order as device_sort_order
from public.gardens as garden
inner join public.garden_devices as garden_device
  on garden_device.garden_id = garden.id
inner join public.device_registry as registry
  on registry.device_id = garden_device.device_id
where (select auth.uid()) is not null
  and garden.active is true
  and garden_device.active is true
  and garden_device.customer_visible is true
  and registry.active is true
  and exists (
    select 1
    from public.garden_memberships as membership
    where membership.garden_id = garden.id
      and membership.user_id = (select auth.uid())
      and membership.active is true
      and membership.role in ('customer_owner', 'customer_viewer')
  );

create view public.support_garden_devices
with (security_barrier = true)
as
select
  garden.id as garden_id,
  garden.garden_key,
  garden.garden_name,
  garden.location_label,
  garden.sort_order as garden_sort_order,
  garden_device.id as garden_device_id,
  garden_device.device_id,
  registry.device_key,
  garden_device.display_name,
  garden_device.garden_device_role,
  registry.device_role,
  garden_device.customer_visible,
  garden_device.support_visible,
  garden_device.sort_order as device_sort_order
from public.gardens as garden
inner join public.garden_devices as garden_device
  on garden_device.garden_id = garden.id
inner join public.device_registry as registry
  on registry.device_id = garden_device.device_id
where (select auth.uid()) is not null
  and garden.active is true
  and garden_device.active is true
  and garden_device.support_visible is true
  and registry.active is true
  and exists (
    select 1
    from public.support_memberships as support
    where support.user_id = (select auth.uid())
      and support.active is true
      and support.role in ('support_read_only', 'admin')
  );

create view public.customer_hosted_gen2_measurements
with (security_barrier = true)
as
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
inner join public.customer_garden_devices as customer_device
  on customer_device.device_id = flat.device_id
where registry.active is true;

create view public.support_hosted_gen2_measurements
with (security_barrier = true)
as
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
inner join public.support_garden_devices as support_device
  on support_device.device_id = flat.device_id
where registry.active is true;

create view public.customer_hosted_device_diagnostics
with (security_barrier = true)
as
select
  registry.device_id,
  registry.device_key,
  registry.device_label,
  registry.device_role,
  true as hosted_visible,
  latest_heartbeat.heartbeat_at as last_heartbeat_at,
  case
    when latest_heartbeat.heartbeat_at is null then null
    else greatest(
      0,
      floor(extract(epoch from (now() - latest_heartbeat.heartbeat_at)))::integer
    )
  end as heartbeat_age_seconds,
  latest_heartbeat.heartbeat_reason,
  latest_heartbeat.uptime_seconds,
  latest_heartbeat.wifi_connected,
  latest_heartbeat.wifi_rssi,
  latest_heartbeat.free_heap,
  latest_heartbeat.min_free_heap,
  latest_heartbeat.currently_watering,
  latest_heartbeat.last_watering_duration,
  latest_heartbeat.wifi_reconnect_attempt_count,
  latest_heartbeat.last_supabase_http_status,
  latest_heartbeat.consecutive_supabase_failures,
  latest_heartbeat.last_supabase_error_category,
  latest_heartbeat.last_successful_telemetry_post_at,
  latest_heartbeat.last_successful_diagnostics_post_at,
  latest_heartbeat.pump_control_available,
  latest_heartbeat.device_can_water,
  case
    when latest_heartbeat.details ->> 'wifi_begin_recovery_attempt_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_begin_recovery_attempt_count')::integer
    else null
  end as wifi_begin_recovery_attempt_count,
  case
    when latest_heartbeat.details ->> 'wifi_disconnect_event_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_disconnect_event_count')::integer
    else null
  end as wifi_disconnect_event_count,
  case
    when latest_heartbeat.details ->> 'wifi_got_ip_event_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_got_ip_event_count')::integer
    else null
  end as wifi_got_ip_event_count,
  case
    when latest_heartbeat.details ->> 'last_wifi_status_code' ~ '^-?[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_status_code')::integer
    else null
  end as last_wifi_status_code,
  case
    when latest_heartbeat.details ->> 'last_wifi_disconnect_reason' ~ '^-?[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_disconnect_reason')::integer
    else null
  end as last_wifi_disconnect_reason,
  case
    when latest_heartbeat.details ->> 'last_wifi_disconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_disconnected_uptime_seconds')::integer
    else null
  end as last_wifi_disconnected_uptime_seconds,
  case
    when latest_heartbeat.details ->> 'last_wifi_reconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_reconnected_uptime_seconds')::integer
    else null
  end as last_wifi_reconnected_uptime_seconds,
  nullif(latest_heartbeat.details ->> 'last_network_recovery_action', '')
    as last_network_recovery_action
from public.device_registry as registry
inner join public.customer_garden_devices as customer_device
  on customer_device.device_id = registry.device_id
left join lateral (
  select
    heartbeat_at,
    heartbeat_reason,
    uptime_seconds,
    wifi_connected,
    wifi_rssi,
    free_heap,
    min_free_heap,
    currently_watering,
    last_watering_duration,
    wifi_reconnect_attempt_count,
    last_supabase_http_status,
    consecutive_supabase_failures,
    last_supabase_error_category,
    last_successful_telemetry_post_at,
    last_successful_diagnostics_post_at,
    pump_control_available,
    device_can_water,
    details
  from public.device_heartbeats
  where device_id = registry.device_id
  order by heartbeat_at desc
  limit 1
) as latest_heartbeat on true
where registry.active is true;

create view public.support_hosted_device_diagnostics
with (security_barrier = true)
as
select
  registry.device_id,
  registry.device_key,
  registry.device_label,
  registry.device_role,
  true as hosted_visible,
  latest_heartbeat.heartbeat_at as last_heartbeat_at,
  case
    when latest_heartbeat.heartbeat_at is null then null
    else greatest(
      0,
      floor(extract(epoch from (now() - latest_heartbeat.heartbeat_at)))::integer
    )
  end as heartbeat_age_seconds,
  latest_heartbeat.heartbeat_reason,
  latest_heartbeat.uptime_seconds,
  latest_heartbeat.wifi_connected,
  latest_heartbeat.wifi_rssi,
  latest_heartbeat.free_heap,
  latest_heartbeat.min_free_heap,
  latest_heartbeat.currently_watering,
  latest_heartbeat.last_watering_duration,
  latest_heartbeat.wifi_reconnect_attempt_count,
  latest_heartbeat.last_supabase_http_status,
  latest_heartbeat.consecutive_supabase_failures,
  latest_heartbeat.last_supabase_error_category,
  latest_heartbeat.last_successful_telemetry_post_at,
  latest_heartbeat.last_successful_diagnostics_post_at,
  latest_heartbeat.pump_control_available,
  latest_heartbeat.device_can_water,
  case
    when latest_heartbeat.details ->> 'wifi_begin_recovery_attempt_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_begin_recovery_attempt_count')::integer
    else null
  end as wifi_begin_recovery_attempt_count,
  case
    when latest_heartbeat.details ->> 'wifi_disconnect_event_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_disconnect_event_count')::integer
    else null
  end as wifi_disconnect_event_count,
  case
    when latest_heartbeat.details ->> 'wifi_got_ip_event_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_got_ip_event_count')::integer
    else null
  end as wifi_got_ip_event_count,
  case
    when latest_heartbeat.details ->> 'last_wifi_status_code' ~ '^-?[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_status_code')::integer
    else null
  end as last_wifi_status_code,
  case
    when latest_heartbeat.details ->> 'last_wifi_disconnect_reason' ~ '^-?[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_disconnect_reason')::integer
    else null
  end as last_wifi_disconnect_reason,
  case
    when latest_heartbeat.details ->> 'last_wifi_disconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_disconnected_uptime_seconds')::integer
    else null
  end as last_wifi_disconnected_uptime_seconds,
  case
    when latest_heartbeat.details ->> 'last_wifi_reconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_reconnected_uptime_seconds')::integer
    else null
  end as last_wifi_reconnected_uptime_seconds,
  nullif(latest_heartbeat.details ->> 'last_network_recovery_action', '')
    as last_network_recovery_action
from public.device_registry as registry
inner join public.support_garden_devices as support_device
  on support_device.device_id = registry.device_id
left join lateral (
  select
    heartbeat_at,
    heartbeat_reason,
    uptime_seconds,
    wifi_connected,
    wifi_rssi,
    free_heap,
    min_free_heap,
    currently_watering,
    last_watering_duration,
    wifi_reconnect_attempt_count,
    last_supabase_http_status,
    consecutive_supabase_failures,
    last_supabase_error_category,
    last_successful_telemetry_post_at,
    last_successful_diagnostics_post_at,
    pump_control_available,
    device_can_water,
    details
  from public.device_heartbeats
  where device_id = registry.device_id
  order by heartbeat_at desc
  limit 1
) as latest_heartbeat on true
where registry.active is true;

revoke all on public.customer_garden_devices
  from public, anon, authenticated;
revoke all on public.customer_hosted_gen2_measurements
  from public, anon, authenticated;
revoke all on public.customer_hosted_device_diagnostics
  from public, anon, authenticated;
revoke all on public.support_garden_devices
  from public, anon, authenticated;
revoke all on public.support_hosted_gen2_measurements
  from public, anon, authenticated;
revoke all on public.support_hosted_device_diagnostics
  from public, anon, authenticated;

grant select on public.customer_garden_devices
  to authenticated;
grant select on public.customer_hosted_gen2_measurements
  to authenticated;
grant select on public.customer_hosted_device_diagnostics
  to authenticated;
grant select on public.support_garden_devices
  to authenticated;
grant select on public.support_hosted_gen2_measurements
  to authenticated;
grant select on public.support_hosted_device_diagnostics
  to authenticated;

-- Manual seed section.
--
-- Replace these placeholders before running the seed statements:
--
--   <jeremy_auth_user_uuid>
--   <optional_pilot_customer_user_uuid>
--
-- Auth users should be created manually in Supabase Auth first.
-- Do not invent Auth UUIDs in this SQL artifact.

-- insert into public.profiles (user_id, display_name)
-- values
--   ('<jeremy_auth_user_uuid>'::uuid, 'Jeremy Haney')
-- on conflict (user_id) do update
-- set
--   display_name = excluded.display_name,
--   active = true;

-- insert into public.gardens (
--   garden_key,
--   garden_name,
--   location_label,
--   active,
--   sort_order
-- )
-- values
--   (
--     'jeremy-balcony-pilot',
--     'Jeremy Balcony Pilot',
--     'Jeremy''s Balcony',
--     true,
--     10
--   ),
--   (
--     'mbg-support-bench',
--     'MBG Support Bench',
--     'Jeremy support bench / internal validation',
--     true,
--     900
--   )
-- on conflict (garden_key) do update
-- set
--   garden_name = excluded.garden_name,
--   location_label = excluded.location_label,
--   active = excluded.active,
--   sort_order = excluded.sort_order;

-- insert into public.garden_devices (
--   garden_id,
--   device_id,
--   display_name,
--   garden_device_role,
--   customer_visible,
--   support_visible,
--   active,
--   sort_order
-- )
-- select
--   garden.id,
--   '550e8400-e29b-41d4-a716-446655440000',
--   'Balcony01',
--   'primary_controller',
--   true,
--   true,
--   true,
--   10
-- from public.gardens as garden
-- where garden.garden_key = 'jeremy-balcony-pilot'
-- on conflict (garden_id, device_id) do update
-- set
--   display_name = excluded.display_name,
--   garden_device_role = excluded.garden_device_role,
--   customer_visible = excluded.customer_visible,
--   support_visible = excluded.support_visible,
--   active = excluded.active,
--   sort_order = excluded.sort_order;

-- insert into public.garden_devices (
--   garden_id,
--   device_id,
--   display_name,
--   garden_device_role,
--   customer_visible,
--   support_visible,
--   active,
--   sort_order
-- )
-- select
--   garden.id,
--   '28f4e6e3-5979-4af4-9753-34e185d8e47e',
--   'Scout01',
--   'telemetry_readings_sensor',
--   true,
--   true,
--   true,
--   20
-- from public.gardens as garden
-- where garden.garden_key = 'jeremy-balcony-pilot'
-- on conflict (garden_id, device_id) do update
-- set
--   display_name = excluded.display_name,
--   garden_device_role = excluded.garden_device_role,
--   customer_visible = excluded.customer_visible,
--   support_visible = excluded.support_visible,
--   active = excluded.active,
--   sort_order = excluded.sort_order;

-- insert into public.garden_devices (
--   garden_id,
--   device_id,
--   display_name,
--   garden_device_role,
--   customer_visible,
--   support_visible,
--   active,
--   sort_order
-- )
-- select
--   garden.id,
--   '318fab98-89ad-4f36-9100-3134a04e0be5',
--   'Bench01',
--   'support_bench',
--   false,
--   true,
--   true,
--   10
-- from public.gardens as garden
-- where garden.garden_key = 'mbg-support-bench'
-- on conflict (garden_id, device_id) do update
-- set
--   display_name = excluded.display_name,
--   garden_device_role = excluded.garden_device_role,
--   customer_visible = excluded.customer_visible,
--   support_visible = excluded.support_visible,
--   active = excluded.active,
--   sort_order = excluded.sort_order;

-- insert into public.garden_memberships (
--   garden_id,
--   user_id,
--   role,
--   active
-- )
-- select
--   garden.id,
--   '<jeremy_auth_user_uuid>'::uuid,
--   'customer_owner',
--   true
-- from public.gardens as garden
-- where garden.garden_key = 'jeremy-balcony-pilot'
-- on conflict (garden_id, user_id) do update
-- set
--   role = excluded.role,
--   active = excluded.active;

-- Optional separate customer validation user:
--
-- insert into public.profiles (user_id, display_name)
-- values
--   ('<optional_pilot_customer_user_uuid>'::uuid, 'Pilot Customer')
-- on conflict (user_id) do update
-- set
--   display_name = excluded.display_name,
--   active = true;
--
-- insert into public.garden_memberships (
--   garden_id,
--   user_id,
--   role,
--   active
-- )
-- select
--   garden.id,
--   '<optional_pilot_customer_user_uuid>'::uuid,
--   'customer_viewer',
--   true
-- from public.gardens as garden
-- where garden.garden_key = 'jeremy-balcony-pilot'
-- on conflict (garden_id, user_id) do update
-- set
--   role = excluded.role,
--   active = excluded.active;

-- insert into public.support_memberships (
--   user_id,
--   role,
--   active
-- )
-- values
--   ('<jeremy_auth_user_uuid>'::uuid, 'admin', true)
-- on conflict (user_id) do update
-- set
--   role = excluded.role,
--   active = excluded.active;

-- Manual validation SQL, intentionally commented out.
--
-- Policy inspection:
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in (
--     'profiles',
--     'gardens',
--     'garden_devices',
--     'garden_memberships',
--     'support_memberships'
--   )
-- order by tablename, policyname;
--
-- Grants inspection:
--
-- select grantee, table_schema, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in (
--     'profiles',
--     'gardens',
--     'garden_devices',
--     'garden_memberships',
--     'support_memberships',
--     'customer_garden_devices',
--     'customer_hosted_gen2_measurements',
--     'customer_hosted_device_diagnostics',
--     'support_garden_devices',
--     'support_hosted_gen2_measurements',
--     'support_hosted_device_diagnostics',
--     'hosted_gen2_measurements',
--     'hosted_device_diagnostics'
--   )
-- order by table_name, grantee, privilege_type;
--
-- Base metadata table direct-access checks:
--
-- select
--   has_table_privilege('anon', 'public.profiles', 'select')
--     as anon_can_select_profiles,
--   has_table_privilege('anon', 'public.gardens', 'select')
--     as anon_can_select_gardens,
--   has_table_privilege('anon', 'public.garden_devices', 'select')
--     as anon_can_select_garden_devices,
--   has_table_privilege('anon', 'public.garden_memberships', 'select')
--     as anon_can_select_garden_memberships,
--   has_table_privilege('anon', 'public.support_memberships', 'select')
--     as anon_can_select_support_memberships,
--   has_table_privilege('authenticated', 'public.profiles', 'select')
--     as authenticated_can_select_profiles,
--   has_table_privilege('authenticated', 'public.gardens', 'select')
--     as authenticated_can_select_gardens,
--   has_table_privilege('authenticated', 'public.garden_devices', 'select')
--     as authenticated_can_select_garden_devices,
--   has_table_privilege('authenticated', 'public.garden_memberships', 'select')
--     as authenticated_can_select_garden_memberships,
--   has_table_privilege('authenticated', 'public.support_memberships', 'select')
--     as authenticated_can_select_support_memberships;
--
-- Expected for Phase 7L.4: all false. Protected views are the
-- authenticated browser-readable surface, not these base metadata tables.
--
-- Anon protected-view denial checks:
--
-- select
--   has_table_privilege('anon', 'public.customer_garden_devices', 'select')
--     as anon_can_select_customer_garden_devices,
--   has_table_privilege('anon', 'public.customer_hosted_gen2_measurements', 'select')
--     as anon_can_select_customer_hosted_gen2_measurements,
--   has_table_privilege('anon', 'public.customer_hosted_device_diagnostics', 'select')
--     as anon_can_select_customer_hosted_device_diagnostics,
--   has_table_privilege('anon', 'public.support_garden_devices', 'select')
--     as anon_can_select_support_garden_devices,
--   has_table_privilege('anon', 'public.support_hosted_gen2_measurements', 'select')
--     as anon_can_select_support_hosted_gen2_measurements,
--   has_table_privilege('anon', 'public.support_hosted_device_diagnostics', 'select')
--     as anon_can_select_support_hosted_device_diagnostics;
--
-- Expected: all false.
--
-- Authenticated protected-view grant checks:
--
-- select
--   has_table_privilege('authenticated', 'public.customer_garden_devices', 'select')
--     as authenticated_can_select_customer_garden_devices,
--   has_table_privilege('authenticated', 'public.customer_hosted_gen2_measurements', 'select')
--     as authenticated_can_select_customer_hosted_gen2_measurements,
--   has_table_privilege('authenticated', 'public.customer_hosted_device_diagnostics', 'select')
--     as authenticated_can_select_customer_hosted_device_diagnostics,
--   has_table_privilege('authenticated', 'public.support_garden_devices', 'select')
--     as authenticated_can_select_support_garden_devices,
--   has_table_privilege('authenticated', 'public.support_hosted_gen2_measurements', 'select')
--     as authenticated_can_select_support_hosted_gen2_measurements,
--   has_table_privilege('authenticated', 'public.support_hosted_device_diagnostics', 'select')
--     as authenticated_can_select_support_hosted_device_diagnostics;
--
-- Expected: all true. Row visibility is still restricted by auth.uid()
-- membership filters inside the protected views.
--
-- Public demo still works checks:
--
-- select
--   has_table_privilege('anon', 'public.hosted_gen2_measurements', 'select')
--     as anon_can_select_public_demo_measurements,
--   has_table_privilege('anon', 'public.hosted_device_diagnostics', 'select')
--     as anon_can_select_public_demo_diagnostics;
--
-- Expected for current demo posture: both true.
--
-- Authenticated customer checks using a REST client or SQL session that can set
-- authenticated JWT claims:
--
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<optional_pilot_customer_user_uuid>';
--
-- select *
-- from public.customer_garden_devices
-- order by garden_sort_order, device_sort_order;
--
-- Expected: Balcony01 and Scout01 only.
--
-- select *
-- from public.customer_garden_devices
-- where device_key = 'bench';
--
-- Expected: zero rows.
--
-- select *
-- from public.support_garden_devices;
--
-- Expected for non-support customer: zero rows.
--
-- rollback;
--
-- Authenticated support/admin check:
--
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<jeremy_auth_user_uuid>';
--
-- select *
-- from public.support_garden_devices
-- order by garden_sort_order, device_sort_order;
--
-- Expected: Balcony01, Scout01, and Bench01 support-visible metadata.
--
-- select *
-- from public.customer_garden_devices
-- where device_key = 'bench';
--
-- Expected: zero rows, because Bench01 is support-only.
--
-- rollback;
--
-- SQL Editor caveat:
-- Supabase SQL Editor often runs with elevated privileges. For final proof,
-- validate protected-view access through authenticated and anon REST/API
-- clients, not SQL Editor owner/admin access alone.

-- Rollback / inspection notes, intentionally commented out.
--
-- Review dependent objects before dropping:
--
-- select dependent_ns.nspname as dependent_schema,
--   dependent_view.relname as dependent_view,
--   source_ns.nspname as source_schema,
--   source_table.relname as source_object
-- from pg_depend
-- join pg_rewrite on pg_depend.objid = pg_rewrite.oid
-- join pg_class as dependent_view on pg_rewrite.ev_class = dependent_view.oid
-- join pg_class as source_table on pg_depend.refobjid = source_table.oid
-- join pg_namespace as dependent_ns on dependent_ns.oid = dependent_view.relnamespace
-- join pg_namespace as source_ns on source_ns.oid = source_table.relnamespace
-- where source_ns.nspname = 'public'
--   and source_table.relname in (
--     'profiles',
--     'gardens',
--     'garden_devices',
--     'garden_memberships',
--     'support_memberships',
--     'customer_garden_devices',
--     'support_garden_devices'
--   )
-- order by dependent_schema, dependent_view, source_object;
--
-- If rollback is explicitly approved later, drop protected views before tables:
--
-- drop view if exists public.customer_hosted_device_diagnostics;
-- drop view if exists public.customer_hosted_gen2_measurements;
-- drop view if exists public.customer_garden_devices;
-- drop view if exists public.support_hosted_device_diagnostics;
-- drop view if exists public.support_hosted_gen2_measurements;
-- drop view if exists public.support_garden_devices;
-- drop table if exists public.support_memberships;
-- drop table if exists public.garden_memberships;
-- drop table if exists public.garden_devices;
-- drop table if exists public.gardens;
-- drop table if exists public.profiles;
