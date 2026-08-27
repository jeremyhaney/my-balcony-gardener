-- LOCAL ISOLATED TEST HARNESS ONLY — NEVER RUN IN SUPABASE PRODUCTION.
-- Run after the bootstrap and exact Phase 8G.4 proposal in a disposable DB.

\set ON_ERROR_STOP on

begin;

do $$
begin
  if (select count(*) from public.sensor_assets) <> 0 then
    raise exception 'proposal unexpectedly seeded sensor_assets';
  end if;
  if (select count(*) from public.sensor_installations) <> 0 then
    raise exception 'proposal unexpectedly seeded sensor_installations';
  end if;
  if (
    select count(*)
    from pg_class
    where oid in (
      'public.sensor_assets'::regclass,
      'public.sensor_installations'::regclass
    )
      and relrowsecurity is true
  ) <> 2 then
    raise exception 'base-table RLS is not enabled on both identity tables';
  end if;
  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('sensor_assets', 'sensor_installations')
  ) <> 0 then
    raise exception 'proposal unexpectedly created a base-table RLS policy';
  end if;
  if (
    select count(*)
    from pg_class
    where oid in (
      'public.support_sensor_assets'::regclass,
      'public.support_sensor_installations'::regclass
    )
      and reloptions @> array['security_barrier=true']
  ) <> 2 then
    raise exception 'support views are missing security_barrier=true';
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
  hardware_uid
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'MBG-ST-0001',
    'DS18B20',
    'Maxim',
    'DS18B20',
    'MFG-001',
    'ds18b20-rom64',
    '28-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'MBG-ST-0002',
    'DS18B20',
    'Maxim',
    'DS18B20',
    'MFG-002',
    'ds18b20-rom64',
    '28-000000000002'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'MBG-M-0001',
    'SEN0308',
    'DFRobot',
    'SEN0308',
    null,
    null,
    null
  );

do $$
begin
  begin
    insert into public.sensor_assets (asset_tag, sensor_family)
    values ('mbg-st-0001', 'DS18B20');
    raise exception 'case-insensitive asset tag uniqueness was not enforced';
  exception when unique_violation then
    null;
  end;

  begin
    insert into public.sensor_assets (
      asset_tag,
      sensor_family,
      hardware_uid_scheme
    ) values ('MBG-ST-BADPAIR', 'DS18B20', 'ds18b20-rom64');
    raise exception 'hardware UID pair completeness was not enforced';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.sensor_assets (
      asset_tag,
      sensor_family,
      hardware_uid_scheme,
      hardware_uid
    ) values (
      'MBG-ST-BADUID',
      'DS18B20',
      'DS18B20-ROM64',
      '28-000000000001'
    );
    raise exception 'case-insensitive hardware UID uniqueness was not enforced';
  exception when unique_violation then
    null;
  end;
end
$$;

insert into public.sensor_installations (
  id,
  sensor_asset_id,
  device_id,
  logical_sensor_key,
  effective_from,
  effective_to,
  verified_at,
  verification_measured_at
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'device-a',
    'soil_temperature_01',
    '2026-08-26T12:00:00Z',
    '2026-08-26T13:00:00Z',
    '2026-08-26T13:02:00Z',
    '2026-08-26T13:00:00Z'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'device-a',
    'soil_temperature_01',
    '2026-08-26T13:00:00Z',
    null,
    '2026-08-26T13:02:00Z',
    '2026-08-26T13:00:00Z'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'device-b',
    'soil_temperature_01',
    '2026-08-26T13:00:00Z',
    null,
    '2026-08-26T13:03:00Z',
    '2026-08-26T13:00:00Z'
  );

do $$
declare
  resolved_asset uuid;
begin
  select sensor_asset_id
    into resolved_asset
  from public.sensor_installations
  where device_id = 'device-a'
    and logical_sensor_key = 'soil_temperature_01'
    and tstzrange(
      effective_from,
      coalesce(effective_to, 'infinity'::timestamptz),
      '[)'
    ) @> '2026-08-26T12:59:59.999999Z'::timestamptz;

  if resolved_asset <> '10000000-0000-0000-0000-000000000001'::uuid then
    raise exception 'pre-cutover as-of lookup resolved the wrong asset';
  end if;

  select sensor_asset_id
    into resolved_asset
  from public.sensor_installations
  where device_id = 'device-a'
    and logical_sensor_key = 'soil_temperature_01'
    and tstzrange(
      effective_from,
      coalesce(effective_to, 'infinity'::timestamptz),
      '[)'
    ) @> '2026-08-26T13:00:00Z'::timestamptz;

  if resolved_asset <> '10000000-0000-0000-0000-000000000002'::uuid then
    raise exception 'cutover as-of lookup resolved the wrong asset';
  end if;

  begin
    insert into public.sensor_installations (
      sensor_asset_id,
      device_id,
      logical_sensor_key,
      effective_from,
      effective_to
    ) values (
      '10000000-0000-0000-0000-000000000003',
      'device-a',
      'soil_temperature_01',
      '2026-08-26T12:30:00Z',
      '2026-08-26T12:45:00Z'
    );
    raise exception 'logical slot overlap was not rejected';
  exception when exclusion_violation then
    null;
  end;

  begin
    insert into public.sensor_installations (
      sensor_asset_id,
      device_id,
      logical_sensor_key,
      effective_from,
      effective_to
    ) values (
      '10000000-0000-0000-0000-000000000002',
      'device-a',
      'soil_moisture_01',
      '2026-08-26T13:30:00Z',
      '2026-08-26T14:00:00Z'
    );
    raise exception 'simultaneous asset reuse was not rejected';
  exception when exclusion_violation then
    null;
  end;
end
$$;

do $$
begin
  if has_table_privilege('anon', 'public.sensor_assets', 'select') then
    raise exception 'anon unexpectedly has sensor_assets SELECT';
  end if;
  if has_table_privilege('authenticated', 'public.sensor_assets', 'select') then
    raise exception 'authenticated unexpectedly has sensor_assets SELECT';
  end if;
  if not has_table_privilege(
    'authenticated',
    'public.support_sensor_assets',
    'select'
  ) then
    raise exception 'authenticated lacks support_sensor_assets SELECT';
  end if;
  if has_table_privilege('anon', 'public.support_sensor_assets', 'select') then
    raise exception 'anon unexpectedly has support_sensor_assets SELECT';
  end if;
end
$$;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
begin
  begin
    perform 1 from public.sensor_assets limit 1;
    raise exception 'authenticated role read the sensor_assets base table';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform 1 from public.sensor_installations limit 1;
    raise exception 'authenticated role read sensor_installations base table';
  exception when insufficient_privilege then
    null;
  end;
  if (select count(*) from public.support_sensor_assets) <> 3 then
    raise exception 'support user cannot see expected asset inventory';
  end if;
  if (select count(*) from public.support_sensor_installations) <> 3 then
    raise exception 'support user cannot see expected installation history';
  end if;
end
$$;

reset role;
set local role anon;

do $$
begin
  begin
    perform 1 from public.support_sensor_assets limit 1;
    raise exception 'anon role read the Support asset view';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform 1 from public.support_sensor_installations limit 1;
    raise exception 'anon role read the Support installation view';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
begin
  if exists (select from public.support_sensor_assets) then
    raise exception 'unassigned user can see support asset inventory';
  end if;
  if exists (select from public.support_sensor_installations) then
    raise exception 'unassigned user can see support installation history';
  end if;
end
$$;

reset role;

do $$
begin
  if exists (
    select 1
    from public.sensor_installations as installation
    join public.sensor_assets as asset
      on asset.id = installation.sensor_asset_id
    left join public.device_capabilities as capability
      on capability.device_id = installation.device_id
      and capability.logical_sensor_key = installation.logical_sensor_key
      and tstzrange(
        capability.effective_from,
        coalesce(capability.effective_to, 'infinity'::timestamptz),
        '[)'
      ) @> installation.effective_from
    where capability.id is null
       or lower(capability.sensor_family) <> lower(asset.sensor_family)
  ) then
    raise exception 'family/capability audit found an unexpected mismatch';
  end if;
end
$$;

set local enable_seqscan = off;
explain (costs off)
select installation.id, installation.sensor_asset_id
from public.sensor_installations as installation
where installation.device_id = 'device-a'
  and installation.logical_sensor_key = 'soil_temperature_01'
  and tstzrange(
    installation.effective_from,
    coalesce(installation.effective_to, 'infinity'::timestamptz),
    '[)'
  ) @> '2026-08-26T13:00:00Z'::timestamptz
limit 1;

rollback;

select 'PHASE8G4_ISOLATED_TESTS_PASS' as result;
