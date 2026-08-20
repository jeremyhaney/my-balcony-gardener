-- Phase 8F.9 — Retired-device row deletion
-- STATUS: PROPOSED FOR EXPLICIT HASH-BOUND APPROVAL; DO NOT EXECUTE YET.
--
-- Deletes only the three exact retired UUIDs and four exact null-device
-- sensor-event IDs verified by the protected Phase 8F.9 safety export.
-- No schema, policy, grant, RLS, function, view, index, constraint,
-- authentication, frontend, or firmware change is included.

begin;
set transaction isolation level repeatable read;
set local lock_timeout = '5s';
set local statement_timeout = '120s';
set local idle_in_transaction_session_timeout = '60s';
set local row_security = off;

-- Prevent concurrent inserts, updates, or deletes from racing the assertions.
-- SELECT remains available while the transaction is open.
lock table
  public.device_capabilities,
  public.device_heartbeats,
  public.device_registry,
  public.garden_devices,
  public.sensor_events,
  public.sensor_logs,
  public.sensor_measurement_batches,
  public.watering_events
in share row exclusive mode;

-- Frozen Stage A preconditions. Any mismatch raises an exception and leaves
-- the transaction aborted, so the final COMMIT cannot take effect.
do $phase8f9_preflight$
declare
  retired_ids constant text[] := array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ];
  protected_id constant text := '7e5bd328-ad68-4389-a71a-fa5cd01b3813';
  null_event_ids constant text[] := array[
    '13ad8e69-61c6-4865-b2f3-d96f5a4b2930',
    '174ff90f-30b2-4d55-b72f-4484ef035536',
    '793aceb7-b98b-444b-9b07-4e890e05f75b',
    'b11e47f2-33ec-43c7-93bc-5dfd93b4e759'
  ];
begin
  if (select count(*) from public.device_capabilities where device_id::text = any(retired_ids)) <> 0 then
    raise exception 'Phase 8F.9 aborted: expected 0 retired device_capabilities rows';
  end if;
  if (select count(*) from public.garden_devices where device_id::text = any(retired_ids)) <> 3 then
    raise exception 'Phase 8F.9 aborted: expected 3 retired garden_devices rows';
  end if;
  if (select count(*) from public.device_heartbeats where device_id::text = any(retired_ids)) <> 21763 then
    raise exception 'Phase 8F.9 aborted: expected 21763 retired device_heartbeats rows';
  end if;
  if (select count(*) from public.sensor_measurement_batches where device_id::text = any(retired_ids)) <> 21203 then
    raise exception 'Phase 8F.9 aborted: expected 21203 retired sensor_measurement_batches rows';
  end if;
  if (select count(*) from public.watering_events where device_id::text = any(retired_ids)) <> 354 then
    raise exception 'Phase 8F.9 aborted: expected 354 retired watering_events rows';
  end if;
  if (
    select count(*)
    from public.sensor_events
    where device_id::text = any(retired_ids)
       or id::text = any(null_event_ids)
  ) <> 45 then
    raise exception 'Phase 8F.9 aborted: expected 45 retired sensor_events rows';
  end if;
  if (
    select count(*)
    from public.sensor_events
    where id::text = any(null_event_ids) and device_id is null
  ) <> 4 then
    raise exception 'Phase 8F.9 aborted: four exact null-device sensor_events are not intact';
  end if;
  if (select count(*) from public.sensor_logs where device_id::text = any(retired_ids)) <> 38204 then
    raise exception 'Phase 8F.9 aborted: expected 38204 retired sensor_logs rows';
  end if;
  if (select count(*) from public.device_registry where device_id::text = any(retired_ids)) <> 3 then
    raise exception 'Phase 8F.9 aborted: expected 3 retired device_registry rows';
  end if;

  -- Frozen protected/current and explicitly unproven boundaries.
  if (select count(*) from public.device_capabilities where device_id::text = protected_id) <> 9 then
    raise exception 'Phase 8F.9 aborted: expected 9 protected Balcony02 capability rows';
  end if;
  if (select count(*) from public.garden_devices where device_id::text = protected_id) <> 1 then
    raise exception 'Phase 8F.9 aborted: expected 1 protected Balcony02 assignment row';
  end if;
  if (select count(*) from public.device_heartbeats where device_id::text = protected_id) < 2431 then
    raise exception 'Phase 8F.9 aborted: protected Balcony02 heartbeat history regressed below the Stage A floor';
  end if;
  if (select count(*) from public.sensor_measurement_batches where device_id::text = protected_id) < 2431 then
    raise exception 'Phase 8F.9 aborted: protected Balcony02 measurement history regressed below the Stage A floor';
  end if;
  if (select count(*) from public.watering_events where device_id::text = protected_id) <> 98 then
    raise exception 'Phase 8F.9 aborted: expected 98 protected Balcony02 watering events';
  end if;
  if (select count(*) from public.sensor_events where device_id::text = protected_id) <> 0 then
    raise exception 'Phase 8F.9 aborted: expected 0 Balcony02 sensor_events rows';
  end if;
  if (select count(*) from public.sensor_logs where device_id::text = protected_id) <> 0 then
    raise exception 'Phase 8F.9 aborted: expected 0 Balcony02 sensor_logs rows';
  end if;
  if (select count(*) from public.device_registry where device_id::text = protected_id) <> 1 then
    raise exception 'Phase 8F.9 aborted: protected Balcony02 registry row is not intact';
  end if;
  if (
    select count(*)
    from public.sensor_measurement_batches as batch
    where batch.device_id::text = protected_id
      and to_jsonb(batch)::text ilike '%reservoir_liquid_state%'
  ) <> 95 then
    raise exception 'Phase 8F.9 aborted: expected 95 protected reservoir_liquid_state rows';
  end if;
  if (select count(*) from public.sensor_logs where device_id::text = 'esp32-dev-01') <> 3 then
    raise exception 'Phase 8F.9 aborted: expected 3 excluded esp32-dev-01 sensor_logs rows';
  end if;
  if (select count(*) from public.sensor_events where device_id::text = 'mbg_esp32_001') <> 3 then
    raise exception 'Phase 8F.9 aborted: expected 3 excluded mbg_esp32_001 sensor_events rows';
  end if;

  -- Assert the only foreign-key children of device_registry are the two
  -- dependency-ordered tables handled before the parent deletion.
  if (
    select count(*)
    from pg_constraint
    where contype = 'f'
      and confrelid = 'public.device_registry'::regclass
      and conrelid in (
        'public.device_capabilities'::regclass,
        'public.garden_devices'::regclass
      )
  ) <> 2 or (
    select count(*)
    from pg_constraint
    where contype = 'f'
      and confrelid = 'public.device_registry'::regclass
  ) <> 2 then
    raise exception 'Phase 8F.9 aborted: device_registry foreign-key dependency set changed';
  end if;
end
$phase8f9_preflight$;

-- Record transaction-local fingerprints of every protected row subset. These
-- are recomputed after deletion and must match before COMMIT.
select set_config(
  'phase8f9.protected_fingerprint',
  md5(concat_ws('|',
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.device_capabilities as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.device_heartbeats as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.device_id::text), '')) from public.device_registry as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.garden_devices as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_measurement_batches as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.watering_events as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_logs as row_data where row_data.device_id::text = 'esp32-dev-01'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_events as row_data where row_data.device_id::text = 'mbg_esp32_001'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_measurement_batches as row_data where row_data.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813' and to_jsonb(row_data)::text ilike '%reservoir_liquid_state%')
  )),
  true
);
select set_config(
  'phase8f9.protected_heartbeat_count',
  (select count(*)::text from public.device_heartbeats where device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
  true
);
select set_config(
  'phase8f9.protected_measurement_batch_count',
  (select count(*)::text from public.sensor_measurement_batches where device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'),
  true
);

-- Dependency-ordered deletion. Every predicate is an explicit UUID/row-ID set.
with deleted as (
  delete from public.device_capabilities
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.device_capabilities', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.garden_devices
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.garden_devices', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.device_heartbeats
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.device_heartbeats', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.sensor_measurement_batches
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.sensor_measurement_batches', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.watering_events
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.watering_events', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.sensor_events
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
     or id::text = any(array[
       '13ad8e69-61c6-4865-b2f3-d96f5a4b2930',
       '174ff90f-30b2-4d55-b72f-4484ef035536',
       '793aceb7-b98b-444b-9b07-4e890e05f75b',
       'b11e47f2-33ec-43c7-93bc-5dfd93b4e759'
     ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.sensor_events', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.sensor_logs
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.sensor_logs', (select count(*)::text from deleted), true);

with deleted as (
  delete from public.device_registry
  where device_id::text = any(array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ]::text[])
  returning 1
)
select set_config('phase8f9.deleted.device_registry', (select count(*)::text from deleted), true);

-- Post-delete assertions run before COMMIT. Any failure aborts the transaction.
do $phase8f9_postdelete$
declare
  retired_ids constant text[] := array[
    '28f4e6e3-5979-4af4-9753-34e185d8e47e',
    '318fab98-89ad-4f36-9100-3134a04e0be5',
    '550e8400-e29b-41d4-a716-446655440000'
  ];
  protected_id constant text := '7e5bd328-ad68-4389-a71a-fa5cd01b3813';
  remaining bigint;
  exposed bigint;
  view_name text;
  protected_fingerprint text;
begin
  if current_setting('phase8f9.deleted.device_capabilities')::bigint <> 0
     or current_setting('phase8f9.deleted.garden_devices')::bigint <> 3
     or current_setting('phase8f9.deleted.device_heartbeats')::bigint <> 21763
     or current_setting('phase8f9.deleted.sensor_measurement_batches')::bigint <> 21203
     or current_setting('phase8f9.deleted.watering_events')::bigint <> 354
     or current_setting('phase8f9.deleted.sensor_events')::bigint <> 45
     or current_setting('phase8f9.deleted.sensor_logs')::bigint <> 38204
     or current_setting('phase8f9.deleted.device_registry')::bigint <> 3 then
    raise exception 'Phase 8F.9 aborted: an exact deleted-row count mismatched';
  end if;
  if current_setting('phase8f9.deleted.device_capabilities')::bigint
     + current_setting('phase8f9.deleted.garden_devices')::bigint
     + current_setting('phase8f9.deleted.device_heartbeats')::bigint
     + current_setting('phase8f9.deleted.sensor_measurement_batches')::bigint
     + current_setting('phase8f9.deleted.watering_events')::bigint
     + current_setting('phase8f9.deleted.sensor_events')::bigint
     + current_setting('phase8f9.deleted.sensor_logs')::bigint
     + current_setting('phase8f9.deleted.device_registry')::bigint <> 81575 then
    raise exception 'Phase 8F.9 aborted: expected exactly 81575 total deleted rows';
  end if;

  select
    (select count(*) from public.device_capabilities where device_id::text = any(retired_ids)) +
    (select count(*) from public.garden_devices where device_id::text = any(retired_ids)) +
    (select count(*) from public.device_heartbeats where device_id::text = any(retired_ids)) +
    (select count(*) from public.sensor_measurement_batches where device_id::text = any(retired_ids)) +
    (select count(*) from public.watering_events where device_id::text = any(retired_ids)) +
    (select count(*) from public.sensor_events where device_id::text = any(retired_ids)) +
    (select count(*) from public.sensor_logs where device_id::text = any(retired_ids)) +
    (select count(*) from public.device_registry where device_id::text = any(retired_ids))
  into remaining;
  if remaining <> 0 then
    raise exception 'Phase 8F.9 aborted: % exact-UUID retired rows remain', remaining;
  end if;
  if (
    select count(*)
    from public.sensor_events
    where id::text = any(array[
      '13ad8e69-61c6-4865-b2f3-d96f5a4b2930',
      '174ff90f-30b2-4d55-b72f-4484ef035536',
      '793aceb7-b98b-444b-9b07-4e890e05f75b',
      'b11e47f2-33ec-43c7-93bc-5dfd93b4e759'
    ]::text[])
  ) <> 0 then
    raise exception 'Phase 8F.9 aborted: an exact null-device retired sensor_event remains';
  end if;

  if (select count(*) from public.device_capabilities where device_id::text = protected_id) <> 9
     or (select count(*) from public.garden_devices where device_id::text = protected_id) <> 1
     or (select count(*) from public.watering_events where device_id::text = protected_id) <> 98
     or (select count(*) from public.sensor_events where device_id::text = protected_id) <> 0
     or (select count(*) from public.sensor_logs where device_id::text = protected_id) <> 0
     or (select count(*) from public.device_registry where device_id::text = protected_id) <> 1 then
    raise exception 'Phase 8F.9 aborted: a protected Balcony02 count changed';
  end if;
  if (select count(*) from public.device_heartbeats where device_id::text = protected_id)
       <> current_setting('phase8f9.protected_heartbeat_count')::bigint
     or (select count(*) from public.sensor_measurement_batches where device_id::text = protected_id)
       <> current_setting('phase8f9.protected_measurement_batch_count')::bigint then
    raise exception 'Phase 8F.9 aborted: protected Balcony02 live telemetry counts changed inside the transaction';
  end if;

  if (select count(*) from public.sensor_logs where device_id::text = 'esp32-dev-01') <> 3
     or (select count(*) from public.sensor_events where device_id::text = 'mbg_esp32_001') <> 3
     or (select count(*) from public.sensor_measurement_batches as batch where batch.device_id::text = protected_id and to_jsonb(batch)::text ilike '%reservoir_liquid_state%') <> 95 then
    raise exception 'Phase 8F.9 aborted: an excluded/protected row count changed';
  end if;

  select md5(concat_ws('|',
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.device_capabilities as row_data where row_data.device_id::text = protected_id),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.device_heartbeats as row_data where row_data.device_id::text = protected_id),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.device_id::text), '')) from public.device_registry as row_data where row_data.device_id::text = protected_id),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.garden_devices as row_data where row_data.device_id::text = protected_id),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_measurement_batches as row_data where row_data.device_id::text = protected_id),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.watering_events as row_data where row_data.device_id::text = protected_id),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_logs as row_data where row_data.device_id::text = 'esp32-dev-01'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_events as row_data where row_data.device_id::text = 'mbg_esp32_001'),
    (select md5(coalesce(string_agg(to_jsonb(row_data)::text, E'\n' order by row_data.id::text), '')) from public.sensor_measurement_batches as row_data where row_data.device_id::text = protected_id and to_jsonb(row_data)::text ilike '%reservoir_liquid_state%')
  )) into protected_fingerprint;
  if protected_fingerprint is distinct from current_setting('phase8f9.protected_fingerprint') then
    raise exception 'Phase 8F.9 aborted: protected/unproven row fingerprint changed';
  end if;

  for view_name in
    select relation.relname
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    join pg_attribute as attribute
      on attribute.attrelid = relation.oid
     and attribute.attname = 'device_id'
     and not attribute.attisdropped
    where namespace.nspname = 'public'
      and relation.relkind in ('v', 'm')
    order by relation.relname
  loop
    execute format(
      'select count(*) from public.%I where device_id::text = any($1)',
      view_name
    ) into exposed using retired_ids;
    if exposed <> 0 then
      raise exception 'Phase 8F.9 aborted: view % still exposes % retired rows', view_name, exposed;
    end if;
  end loop;
end
$phase8f9_postdelete$;

commit;
