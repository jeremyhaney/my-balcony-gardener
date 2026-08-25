-- Phase 8G.3 - Prototype02 firmware update to Gen2 and commissioning
-- Approved for execution by Jeremy on 2026-08-25.
-- Row-only commissioning: no schema, grant, RLS, policy, function, or view change.

begin;

set local lock_timeout = '10s';
set local statement_timeout = '120s';

select pg_advisory_xact_lock(hashtext('mbg-phase8g3-prototype02-commissioning'));

do $$
declare
  target_id constant text := 'a5c59d97-5687-483c-8773-86c9e6a84aea';
begin
  if exists (
    select 1 from public.device_registry
    where device_id = target_id or device_key = 'prototype02'
  ) then
    raise exception 'Prototype02 registry identity already exists';
  end if;

  if exists (
    select 1 from public.device_registry
    where device_id = '318fab98-89ad-4f36-9100-3134a04e0be5'
  ) then
    raise exception 'Retired Prototype01 UUID unexpectedly exists';
  end if;

  if exists (select 1 from public.device_capabilities where device_id = target_id)
     or exists (select 1 from public.garden_devices where device_id = target_id) then
    raise exception 'Prototype02 dependent rows unexpectedly exist';
  end if;

  if (select count(*) from public.gardens where garden_key = 'mbg-support-bench' and active is true) <> 1 then
    raise exception 'Expected exactly one active mbg-support-bench garden';
  end if;

  if (select count(*) from public.support_memberships where active is true) < 1 then
    raise exception 'No active Support membership exists';
  end if;

  if public.is_device_telemetry_insert_enabled(target_id)
     or public.is_device_heartbeat_insert_enabled(target_id) then
    raise exception 'Unregistered Prototype02 unexpectedly passes an insert gate';
  end if;
end
$$;

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
values (
  'a5c59d97-5687-483c-8773-86c9e6a84aea',
  'prototype02',
  'Prototype02',
  'bench',
  true,
  true,
  true,
  false,
  'Phase 8G.3 P02 commissioning; relay-only watering simulation; no pump or physical water delivery'
);

insert into public.garden_devices (
  garden_id,
  device_id,
  display_name,
  garden_device_role,
  customer_visible,
  support_visible,
  active,
  sort_order
)
select
  garden.id,
  'a5c59d97-5687-483c-8773-86c9e6a84aea',
  'Prototype02',
  'support_bench',
  false,
  true,
  true,
  10
from public.gardens as garden
where garden.garden_key = 'mbg-support-bench'
  and garden.active is true;

insert into public.device_capabilities (
  device_id,
  logical_sensor_key,
  logical_channel,
  sensor_family,
  expected_measurement_names,
  physical_sensor_id,
  friendly_name,
  location_label,
  effective_from,
  provisioning_note
)
values
  (
    'a5c59d97-5687-483c-8773-86c9e6a84aea',
    'bme280_air', 'AIR', 'BME280',
    array['air_temperature','relative_humidity','barometric_pressure'], null,
    'Prototype02 Air Conditions', 'BJ3 bench',
    '2026-08-25T05:03:19Z',
    'Phase 8G.3 approved P02 commissioning; BME280 behind MUX channel 4'
  ),
  (
    'a5c59d97-5687-483c-8773-86c9e6a84aea',
    'ds18b20_temperature', 'ST', 'DS18B20',
    array['soil temp'], 'ST01',
    'Prototype02 Soil Temperature', 'BJ3 bench',
    '2026-08-25T05:03:19Z',
    'Phase 8G.3 approved P02 commissioning; physical sensor ST01'
  ),
  (
    'a5c59d97-5687-483c-8773-86c9e6a84aea',
    'sen0308_m01', 'M01', 'SEN0308',
    array['raw_adc'], 'SEN0308-M02',
    'Prototype02 Soil Moisture', 'BJ3 bench',
    '2026-08-25T05:03:19Z',
    'Phase 8G.3 approved P02 commissioning; logical M01 maps to physical M02 on ADC A0'
  ),
  (
    'a5c59d97-5687-483c-8773-86c9e6a84aea',
    'sen0562_l01', 'L01', 'SEN0562',
    array['ambient_light'], 'SEN0562-L04',
    'Prototype02 Ambient Light', 'BJ3 bench',
    '2026-08-25T05:03:19Z',
    'Phase 8G.3 approved P02 commissioning; logical L01 maps to physical L04 on MUX channel 1'
  ),
  (
    'a5c59d97-5687-483c-8773-86c9e6a84aea',
    'sen0204_wl01', 'WL01', 'SEN0204',
    array['reservoir_liquid_detected'], 'WL01',
    'Prototype02 Reservoir Water Available', 'BJ3 bench',
    '2026-08-25T05:03:19Z',
    'Phase 8G.3 approved P02 commissioning; reservoir interlock for simulated watering'
  );

do $$
declare
  target_id constant text := 'a5c59d97-5687-483c-8773-86c9e6a84aea';
begin
  if not exists (
    select 1
    from public.device_registry
    where device_id = target_id
      and device_key = 'prototype02'
      and device_label = 'Prototype02'
      and device_role = 'bench'
      and active is true
      and telemetry_insert_enabled is true
      and heartbeat_insert_enabled is true
      and hosted_visible is false
  ) then
    raise exception 'Prototype02 registry postcondition failed';
  end if;

  if not exists (
    select 1
    from public.garden_devices as assignment
    join public.gardens as garden on garden.id = assignment.garden_id
    where assignment.device_id = target_id
      and garden.garden_key = 'mbg-support-bench'
      and assignment.display_name = 'Prototype02'
      and assignment.garden_device_role = 'support_bench'
      and assignment.customer_visible is false
      and assignment.support_visible is true
      and assignment.active is true
      and assignment.sort_order = 10
  ) then
    raise exception 'Prototype02 support assignment postcondition failed';
  end if;

  if (select count(*) from public.device_capabilities where device_id = target_id) <> 5
     or (
       select coalesce(sum(cardinality(expected_measurement_names)), 0)
       from public.device_capabilities
       where device_id = target_id
     ) <> 7 then
    raise exception 'Prototype02 capability cardinality postcondition failed';
  end if;

  if not public.is_device_telemetry_insert_enabled(target_id)
     or not public.is_device_heartbeat_insert_enabled(target_id) then
    raise exception 'Prototype02 insert-gate postcondition failed';
  end if;

  if exists (
    select 1 from public.garden_devices
    where device_id = target_id and customer_visible is true
  ) then
    raise exception 'Prototype02 unexpectedly became customer-visible';
  end if;
end
$$;

commit;
