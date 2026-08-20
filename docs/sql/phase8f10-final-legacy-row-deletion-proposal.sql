-- Phase 8F.10 final legacy-row deletion proposal.
-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL OF THIS EXACT FILE HASH.
-- Scope: exactly three esp32-dev-01 sensor_logs rows and exactly three
-- mbg_esp32_001 sensor_events sample-validation rows. No DDL or access change.
-- Rollback: any exception before COMMIT aborts the transaction; an operator may
-- issue ROLLBACK before COMMIT. After COMMIT, restore only from the verified
-- Phase 8F.10 full-column JSONL export after checking all artifact hashes.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';
set local idle_in_transaction_session_timeout = '60s';

lock table public.sensor_events, public.sensor_logs
  in share row exclusive mode;

do $phase8f10_preflight$
declare
  actual_sensor_logs jsonb;
  actual_sensor_events jsonb;
begin
  if current_setting('transaction_read_only') <> 'off' then
    raise exception 'Phase 8F.10 aborted: deletion transaction is read only';
  end if;

  if to_regclass('public.sensor_logs') is null
     or to_regclass('public.sensor_events') is null then
    raise exception 'Phase 8F.10 aborted: expected legacy tables are missing';
  end if;

  if (select count(*) from public.sensor_logs) <> 3
     or (select count(*) from public.sensor_events) <> 3 then
    raise exception 'Phase 8F.10 aborted: expected exactly 3 rows in each legacy table';
  end if;

  select jsonb_agg(to_jsonb(source_row) order by source_row.id::text)
  into actual_sensor_logs
  from public.sensor_logs as source_row;

  if actual_sensor_logs <> $expected$[
    {
      "id":"5fca2bd4-80dc-4913-a435-86eea8f1c1bc",
      "device_id":"esp32-dev-01",
      "timestamp":"2026-03-28T02:59:08.517271+00:00",
      "data":{"humidity":47.8,"lastWateredTime":"2026-03-27 19:35:00","lastWateringDuration":15,"moisture":602,"temperature":72.9,"watering":false}
    },
    {
      "id":"a0b8a92d-edd0-4ace-9f27-ac321dddb68b",
      "device_id":"esp32-dev-01",
      "timestamp":"2026-03-28T02:54:08.517271+00:00",
      "data":{"humidity":48.2,"lastWateredTime":"2026-03-27 19:35:00","lastWateringDuration":15,"moisture":615,"temperature":72.4,"watering":false}
    },
    {
      "id":"d162ca26-c7c2-4171-b710-4921a5ff9b67",
      "device_id":"esp32-dev-01",
      "timestamp":"2026-03-28T03:04:08.517271+00:00",
      "data":{"humidity":47.1,"lastWateredTime":"2026-03-27 19:45:00","lastWateringDuration":12,"moisture":590,"temperature":73.3,"watering":true}
    }
  ]$expected$::jsonb then
    raise exception 'Phase 8F.10 aborted: sensor_logs rows do not match the protected export';
  end if;

  select jsonb_agg(to_jsonb(source_row) order by source_row.id::text)
  into actual_sensor_events
  from public.sensor_events as source_row;

  if actual_sensor_events <> $expected$[
    {
      "id":"880bc635-2287-44e5-823d-079a8153d47e",
      "event_timestamp":"2026-05-07T18:46:16.571701+00:00",
      "device_id":"mbg_esp32_001",
      "event_type":"sensor_move",
      "summary":"Moisture sensor moved from basket_03_left to basket_03_right.",
      "details":{"notes":"Sample Phase 5B validation event","reason":"probe placement test"},
      "sensor_type":"moisture",
      "sensor_id":"MS001",
      "previous_sensor_id":null,
      "container_id":"basket_03",
      "location_label":"basket_03_right",
      "created_at":"2026-05-07T18:46:16.571701+00:00",
      "changed_by":"Jeremy"
    },
    {
      "id":"980ad863-64d3-48bf-9ecf-f1dc8342bfcb",
      "event_timestamp":"2026-05-07T18:46:16.571701+00:00",
      "device_id":"mbg_esp32_001",
      "event_type":"sensor_swap",
      "summary":"Humidity sensor HS001 swapped out for HS002.",
      "details":{"notes":"Sample Phase 5B validation event","reason":"same-model comparison setup"},
      "sensor_type":"humidity",
      "sensor_id":"HS002",
      "previous_sensor_id":"HS001",
      "container_id":null,
      "location_label":"esp32_box",
      "created_at":"2026-05-07T18:46:16.571701+00:00",
      "changed_by":"Jeremy"
    },
    {
      "id":"c3f02e41-aea8-4379-abb6-39f4a7ea4d9b",
      "event_timestamp":"2026-05-07T18:46:16.571701+00:00",
      "device_id":"mbg_esp32_001",
      "event_type":"reference_reading",
      "summary":"Moisture sensor wiped dry for air reference reading.",
      "details":{"condition":"wiped dry","notes":"Sample Phase 5B validation event","reference_type":"air_dry"},
      "sensor_type":"moisture",
      "sensor_id":"MS001",
      "previous_sensor_id":null,
      "container_id":null,
      "location_label":"workbench",
      "created_at":"2026-05-07T18:46:16.571701+00:00",
      "changed_by":"Jeremy"
    }
  ]$expected$::jsonb then
    raise exception 'Phase 8F.10 aborted: sensor_events rows do not match the protected export';
  end if;

  if (select count(*) from public.sensor_logs
      where device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813') <> 0
     or (select count(*) from public.sensor_events
         where device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813') <> 0 then
    raise exception 'Phase 8F.10 aborted: Balcony02 unexpectedly appears in a legacy table';
  end if;

  if (select count(*) from public.device_registry
      where device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
        and device_key = 'balcony02') <> 1 then
    raise exception 'Phase 8F.10 aborted: protected Balcony02 registry row is not intact';
  end if;

  if (select count(*)
      from public.sensor_measurement_batches as source_row
      where source_row.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
        and to_jsonb(source_row)::text ilike '%reservoir_liquid_state%') <> 95 then
    raise exception 'Phase 8F.10 aborted: protected reservoir_liquid_state count is not 95';
  end if;
end
$phase8f10_preflight$;

do $phase8f10_delete$
declare
  sensor_event_delete_count integer;
  sensor_log_delete_count integer;
begin
  delete from public.sensor_events
  where id in (
    '880bc635-2287-44e5-823d-079a8153d47e'::uuid,
    '980ad863-64d3-48bf-9ecf-f1dc8342bfcb'::uuid,
    'c3f02e41-aea8-4379-abb6-39f4a7ea4d9b'::uuid
  )
    and device_id = 'mbg_esp32_001';
  get diagnostics sensor_event_delete_count = row_count;

  delete from public.sensor_logs
  where id in (
    '5fca2bd4-80dc-4913-a435-86eea8f1c1bc'::uuid,
    'a0b8a92d-edd0-4ace-9f27-ac321dddb68b'::uuid,
    'd162ca26-c7c2-4171-b710-4921a5ff9b67'::uuid
  )
    and device_id = 'esp32-dev-01';
  get diagnostics sensor_log_delete_count = row_count;

  if sensor_event_delete_count <> 3 or sensor_log_delete_count <> 3 then
    raise exception
      'Phase 8F.10 aborted: expected 3 sensor_events and 3 sensor_logs deletes, got % and %',
      sensor_event_delete_count, sensor_log_delete_count;
  end if;
end
$phase8f10_delete$;

do $phase8f10_postcheck$
begin
  if (select count(*) from public.sensor_logs) <> 0
     or (select count(*) from public.sensor_events) <> 0 then
    raise exception 'Phase 8F.10 aborted: a legacy row remains after exact deletion';
  end if;

  if (select count(*) from public.device_registry
      where device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
        and device_key = 'balcony02') <> 1
     or (select count(*)
         from public.sensor_measurement_batches as source_row
         where source_row.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
           and to_jsonb(source_row)::text ilike '%reservoir_liquid_state%') <> 95 then
    raise exception 'Phase 8F.10 aborted: protected Balcony02 boundary changed';
  end if;

  if (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'sensor_logs') <> 2
     or (select count(*) from pg_policies
         where schemaname = 'public' and tablename = 'sensor_events') <> 0 then
    raise exception 'Phase 8F.10 aborted: policy structure changed during row deletion';
  end if;
end
$phase8f10_postcheck$;

commit;
