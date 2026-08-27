-- EXECUTED WITH SEPARATE APPROVAL — 2026-08-27 UTC
-- Phase 8G.4 first digital-QR sensor-asset pilot.
-- Registers one user-verified physical asset and creates no installation row.

begin;

do $$
declare
  active_support_actor_count integer;
begin
  if exists (
    select 1
    from public.sensor_assets
    where id = '873bc473-98fc-4b23-beeb-5d80e7bf945a'::uuid
       or lower(asset_tag) = lower('MBG-SA-000001')
  ) then
    raise exception 'MS02 pilot asset UUID or asset tag already exists';
  end if;

  select count(*)
    into active_support_actor_count
  from public.support_memberships
  where active is true
    and role in ('support_read_only', 'admin');

  if active_support_actor_count <> 1 then
    raise exception
      'Expected exactly one active Support actor; found %',
      active_support_actor_count;
  end if;
end
$$;

insert into public.sensor_assets (
  id,
  asset_tag,
  sensor_family,
  manufacturer,
  model,
  manufacturer_serial,
  hardware_uid_scheme,
  hardware_uid,
  asset_note,
  created_by
)
select
  '873bc473-98fc-4b23-beeb-5d80e7bf945a'::uuid,
  'MBG-SA-000001',
  'SEN0308',
  'DFRobot',
  'SEN0308',
  null,
  null,
  null,
  'Phase 8G.4 first digital-QR pilot. Jeremy identified this physical asset as MS02 installed on Prototype02. Repository authority maps physical SEN0308-M02 to logical sen0308_m01 through ADC01 A0. Asset registration only; no installation interval is created.',
  support.user_id
from public.support_memberships as support
where support.active is true
  and support.role in ('support_read_only', 'admin');

commit;
