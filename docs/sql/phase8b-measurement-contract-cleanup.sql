-- Phase 8B measurement-contract cleanup.
-- Review and apply manually; this file is not executed by repository validation.
-- Dependency order: protected/public projections -> flat view, then flat -> projections.

begin;

drop view if exists public.customer_hosted_gen2_measurements;
drop view if exists public.support_hosted_gen2_measurements;
drop view if exists public.hosted_gen2_measurements;
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
  coalesce(
    nullif(record.value ->> 'physical_sensor_id', ''),
    nullif(record.value #>> '{details,physical_sensor_id}', '')
  ) as physical_sensor_id,
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
  case when jsonb_typeof(record.value -> 'valid') = 'boolean'
    then (record.value ->> 'valid')::boolean else null end as valid,
  record.value ->> 'quality' as quality,
  record.value ->> 'reason' as reason,
  case when jsonb_typeof(record.value -> 'control_eligible') = 'boolean'
    then (record.value ->> 'control_eligible')::boolean else null end as control_eligible,
  case when jsonb_typeof(record.value -> 'details') = 'object'
    then record.value -> 'details' else '{}'::jsonb end as details,
  batch.source_endpoint,
  batch.batch_details,
  batch.created_at as batch_created_at
from public.sensor_measurement_batches as batch
cross join lateral jsonb_array_elements(batch.records)
  with ordinality as record(value, ordinality);

create view public.hosted_gen2_measurements as
select
  flat.device_id, registry.device_key,
  coalesce(nullif(flat.batch_details ->> 'device_label', ''), registry.device_label) as device_label,
  registry.device_role, flat.measured_at, flat.firmware_version, flat.build_profile,
  flat.record_index, flat.sensor_key, flat.sensor_type, flat.physical_sensor_id,
  flat.measurement_name, flat.measurement_value, flat.measurement_unit,
  flat.valid, flat.quality, flat.reason, flat.batch_created_at
from public.sensor_measurements_flat as flat
inner join public.device_registry as registry on registry.device_id = flat.device_id
where registry.active is true and registry.hosted_visible is true;

create view public.customer_hosted_gen2_measurements
with (security_barrier = true) as
select
  flat.device_id, registry.device_key,
  coalesce(nullif(flat.batch_details ->> 'device_label', ''), registry.device_label) as device_label,
  registry.device_role, flat.measured_at, flat.firmware_version, flat.build_profile,
  flat.record_index, flat.sensor_key, flat.sensor_type, flat.physical_sensor_id,
  flat.measurement_name, flat.measurement_value, flat.measurement_unit,
  flat.valid, flat.quality, flat.reason, flat.batch_created_at
from public.sensor_measurements_flat as flat
inner join public.device_registry as registry on registry.device_id = flat.device_id
inner join public.customer_garden_devices as customer_device on customer_device.device_id = flat.device_id
where registry.active is true;

create view public.support_hosted_gen2_measurements
with (security_barrier = true) as
select
  flat.device_id, registry.device_key,
  coalesce(nullif(flat.batch_details ->> 'device_label', ''), registry.device_label) as device_label,
  registry.device_role, flat.measured_at, flat.firmware_version, flat.build_profile,
  flat.record_index, flat.sensor_key, flat.sensor_type, flat.physical_sensor_id,
  flat.measurement_name, flat.measurement_value, flat.measurement_unit,
  flat.valid, flat.quality, flat.reason, flat.batch_created_at
from public.sensor_measurements_flat as flat
inner join public.device_registry as registry on registry.device_id = flat.device_id
inner join public.support_garden_devices as support_device on support_device.device_id = flat.device_id
where registry.active is true;

revoke all on public.sensor_measurements_flat from public, anon, authenticated;
revoke all on public.hosted_gen2_measurements from public, anon, authenticated;
revoke all on public.customer_hosted_gen2_measurements from public, anon, authenticated;
revoke all on public.support_hosted_gen2_measurements from public, anon, authenticated;
grant select on public.hosted_gen2_measurements to anon, authenticated;
grant select on public.customer_hosted_gen2_measurements to authenticated;
grant select on public.support_hosted_gen2_measurements to authenticated;

commit;
