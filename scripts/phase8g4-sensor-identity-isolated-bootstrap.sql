-- LOCAL ISOLATED TEST HARNESS ONLY — NEVER RUN IN SUPABASE PRODUCTION.
-- Supplies the minimum existing authority contract required by the Phase 8G.4
-- proposal. The disposable PostgreSQL container is the only intended target.

\set ON_ERROR_STOP on

create extension if not exists btree_gist;

create role anon nologin;
create role authenticated nologin;

create schema auth;

create table auth.users (
  id uuid primary key
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table public.device_registry (
  device_id text primary key
);

create table public.device_capabilities (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.device_registry(device_id),
  logical_sensor_key text not null,
  sensor_family text not null,
  effective_from timestamptz not null,
  effective_to timestamptz null
);

create table public.support_memberships (
  user_id uuid primary key references auth.users(id),
  active boolean not null,
  role text not null
);

create table public.support_garden_device_rows (
  garden_id uuid not null,
  garden_key text not null,
  garden_name text not null,
  device_id text not null references public.device_registry(device_id),
  device_key text not null,
  display_name text not null
);

create view public.support_garden_devices
with (security_barrier = true)
as
select support_device.*
from public.support_garden_device_rows as support_device
where (select auth.uid()) is not null
  and exists (
    select 1
    from public.support_memberships as support
    where support.user_id = (select auth.uid())
      and support.active is true
      and support.role in ('support_read_only', 'admin')
  );

revoke all on public.support_garden_devices
  from public, anon, authenticated;
grant select on public.support_garden_devices to authenticated;

create table public.sensor_measurement_batches (
  id uuid primary key default gen_random_uuid()
);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.support_memberships (user_id, active, role) values
  ('11111111-1111-1111-1111-111111111111', true, 'support_read_only');

insert into public.device_registry (device_id) values
  ('device-a'),
  ('device-b');

insert into public.support_garden_device_rows (
  garden_id,
  garden_key,
  garden_name,
  device_id,
  device_key,
  display_name
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'garden-a',
    'Test Garden',
    'device-a',
    'device-a',
    'Test Device A'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'garden-a',
    'Test Garden',
    'device-b',
    'device-b',
    'Test Device B'
  );

insert into public.device_capabilities (
  device_id,
  logical_sensor_key,
  sensor_family,
  effective_from
) values
  ('device-a', 'soil_temperature_01', 'DS18B20', '2026-01-01T00:00:00Z'),
  ('device-a', 'soil_moisture_01', 'SEN0308', '2026-01-01T00:00:00Z'),
  ('device-b', 'soil_temperature_01', 'DS18B20', '2026-01-01T00:00:00Z');
