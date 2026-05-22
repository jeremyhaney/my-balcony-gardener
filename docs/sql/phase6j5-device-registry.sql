-- Phase 6J.5 - Supabase Device Registry / Table-Driven Provisioned Device Allowlist
--
-- Supabase-side provisioned-device registry for MBG telemetry and diagnostics inserts.
-- Registry flags authorize inserts only. They are not command/control.

create table if not exists public.device_registry (
  device_id text primary key,
  device_key text unique not null,
  device_label text not null,
  device_role text not null,
  active boolean not null default true,
  telemetry_insert_enabled boolean not null default true,
  heartbeat_insert_enabled boolean not null default true,
  hosted_visible boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint device_registry_device_id_not_blank
    check (btrim(device_id) <> ''),
  constraint device_registry_device_key_not_blank
    check (btrim(device_key) <> ''),
  constraint device_registry_device_label_not_blank
    check (btrim(device_label) <> ''),
  constraint device_registry_device_role_not_blank
    check (btrim(device_role) <> ''),
  constraint device_registry_device_role_valid
    check (device_role in ('controller', 'bench', 'sensor-scout'))
);

create or replace function public.set_device_registry_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_device_registry_updated_at
  on public.device_registry;

create trigger set_device_registry_updated_at
  before update on public.device_registry
  for each row
  execute function public.set_device_registry_updated_at();

insert into public.device_registry (
  device_id,
  device_key,
  device_label,
  device_role,
  active,
  telemetry_insert_enabled,
  heartbeat_insert_enabled,
  hosted_visible,
  notes
)
values
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'balcony',
    'Installed Balcony Unit',
    'controller',
    true,
    true,
    true,
    true,
    'Phase 6J.5 initial registry seed'
  ),
  (
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    'bench',
    'Bench Prototype Unit',
    'bench',
    true,
    true,
    true,
    true,
    'Phase 6J.5 initial registry seed'
  ),
  (
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    'scout01',
    'Balcony Sensor Scout 01',
    'sensor-scout',
    true,
    true,
    true,
    true,
    'Phase 6J.5 initial registry seed'
  )
on conflict (device_id) do update
set
  device_key = excluded.device_key,
  device_label = excluded.device_label,
  device_role = excluded.device_role,
  active = excluded.active,
  telemetry_insert_enabled = excluded.telemetry_insert_enabled,
  heartbeat_insert_enabled = excluded.heartbeat_insert_enabled,
  hosted_visible = excluded.hosted_visible,
  notes = excluded.notes;

alter table public.device_registry enable row level security;

-- Intentionally no anon SELECT, INSERT, UPDATE, or DELETE policies are added
-- for public.device_registry in Phase 6J.5.

create or replace function public.is_device_telemetry_insert_enabled(
  input_device_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.device_registry
    where device_id = input_device_id
      and active is true
      and telemetry_insert_enabled is true
  );
$$;

create or replace function public.is_device_heartbeat_insert_enabled(
  input_device_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.device_registry
    where device_id = input_device_id
      and active is true
      and heartbeat_insert_enabled is true
  );
$$;

revoke all on function public.is_device_telemetry_insert_enabled(text)
  from public;
revoke all on function public.is_device_heartbeat_insert_enabled(text)
  from public;

grant execute on function public.is_device_telemetry_insert_enabled(text)
  to anon;
grant execute on function public.is_device_heartbeat_insert_enabled(text)
  to anon;

-- Policy inspection query for review before and after this script:
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('sensor_logs', 'device_heartbeats', 'device_registry')
-- order by tablename, policyname;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('sensor_logs', 'device_heartbeats')
      and cmd = 'INSERT'
      and ('anon' = any(roles) or 'public' = any(roles))
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy "Registry active devices can insert sensor logs"
  on public.sensor_logs
  for insert
  to anon
  with check (
    public.is_device_telemetry_insert_enabled(device_id)
  );

create policy "Registry active devices can insert device heartbeats"
  on public.device_heartbeats
  for insert
  to anon
  with check (
    public.is_device_heartbeat_insert_enabled(device_id)
  );

-- Manual validation SQL, intentionally commented out.
--
-- Review registry rows for the three known provisioned devices:
--
-- select device_id, device_key, device_label, device_role, active,
--   telemetry_insert_enabled, heartbeat_insert_enabled, hosted_visible
-- from public.device_registry
-- where device_id in (
--   '550e8400-e29b-41d4-a716-446655440000',
--   '318fab98-89ad-4f36-9100-3134a04e0be5',
--   '28f4e6e3-5979-4af4-9753-34e185d8e47e'
-- )
-- order by device_key;
--
-- Review resulting policies:
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('sensor_logs', 'device_heartbeats', 'device_registry')
-- order by tablename, policyname;
--
-- Safe known-device insert validation guidance:
-- Use the anon REST API, or explicitly test under anon role where available,
-- to insert one sensor_logs row for a known device_id and one device_heartbeats
-- row for a known device_id. The SQL Editor often runs with elevated
-- privileges, so SQL Editor inserts alone do not prove anon REST/RLS behavior.
--
-- Fake unknown-device rejection guidance:
-- Use the anon REST API, or explicitly test under anon role where available,
-- to attempt sensor_logs and device_heartbeats inserts with a fake unknown
-- device_id such as '00000000-0000-0000-0000-000000000000'. The inserts should
-- be rejected by RLS.
--
-- No anon read of public.device_registry is expected in Phase 6J.5.
