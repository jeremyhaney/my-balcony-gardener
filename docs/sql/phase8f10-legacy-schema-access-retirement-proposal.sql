-- Phase 8F.10 legacy schema/access retirement proposal.
-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL OF THIS EXACT FILE HASH.
-- Prerequisite: the separately approved Phase 8F.10 six-row deletion has committed
-- and its post-change verification has passed. This file deliberately refuses to
-- drop sensor_logs while either legacy table contains any row.
-- Scope: remove the obsolete sensor_logs table and its owned policy/index/constraint
-- surface; remove unnecessary Data API grants from the retained sensor_events table.
-- Retain sensor_events itself, all of its constraints/indexes, RLS, and the shared
-- is_device_telemetry_insert_enabled(text) helper used by current Gen2 ingestion.
-- Rollback: any exception before COMMIT aborts the transaction. After COMMIT,
-- recreate from the protected Phase 8F.10 schema metadata and regrant only after
-- intentional access review; restore rows from the hash-verified JSONL export.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';
set local idle_in_transaction_session_timeout = '60s';

lock table public.sensor_events in share row exclusive mode;
lock table public.sensor_logs in access exclusive mode;

do $phase8f10_schema_preflight$
declare
  sensor_log_columns text;
  helper_dependency_count integer;
begin
  if current_setting('transaction_read_only') <> 'off' then
    raise exception 'Phase 8F.10 aborted: schema transaction is read only';
  end if;

  if to_regclass('public.sensor_logs') is null
     or to_regclass('public.sensor_events') is null then
    raise exception 'Phase 8F.10 aborted: expected legacy table is missing';
  end if;

  if (select count(*) from public.sensor_logs) <> 0
     or (select count(*) from public.sensor_events) <> 0 then
    raise exception 'Phase 8F.10 aborted: execute and verify the six-row slice first';
  end if;

  select string_agg(
    column_name || ':' || udt_name || ':' || is_nullable || ':' || coalesce(column_default, ''),
    ',' order by ordinal_position
  )
  into sensor_log_columns
  from information_schema.columns
  where table_schema = 'public' and table_name = 'sensor_logs';

  if sensor_log_columns <>
     'id:uuid:NO:gen_random_uuid(),device_id:text:NO:,timestamp:timestamptz:NO:,data:jsonb:NO:' then
    raise exception 'Phase 8F.10 aborted: sensor_logs column fingerprint changed: %',
      sensor_log_columns;
  end if;

  if not exists (
    select 1 from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public' and relation.relname = 'sensor_logs'
      and relation.relkind = 'r' and relation.relrowsecurity is true
      and relation.relforcerowsecurity is false
  ) then
    raise exception 'Phase 8F.10 aborted: sensor_logs RLS state changed';
  end if;

  if (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'sensor_logs') <> 2
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public' and tablename = 'sensor_logs'
         and policyname = 'Public read sensor logs' and cmd = 'SELECT'
         and roles = array['anon','authenticated']::name[] and qual = 'true'
     )
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public' and tablename = 'sensor_logs'
         and policyname = 'Registry active devices can insert sensor logs'
         and cmd = 'INSERT' and roles = array['anon']::name[]
         and with_check = 'is_device_telemetry_insert_enabled(device_id)'
     ) then
    raise exception 'Phase 8F.10 aborted: sensor_logs policy fingerprint changed';
  end if;

  if (select count(*) from pg_indexes
      where schemaname = 'public' and tablename = 'sensor_logs') <> 2
     or not exists (select 1 from pg_indexes where schemaname = 'public'
                    and tablename = 'sensor_logs' and indexname = 'sensor_logs_pkey')
     or not exists (select 1 from pg_indexes where schemaname = 'public'
                    and tablename = 'sensor_logs' and indexname = 'sensor_logs_timestamp_idx')
     or (select count(*) from pg_constraint
         where conrelid = 'public.sensor_logs'::regclass) <> 1
     or not exists (select 1 from pg_constraint
                    where conrelid = 'public.sensor_logs'::regclass
                      and conname = 'sensor_logs_pkey' and contype = 'p') then
    raise exception 'Phase 8F.10 aborted: sensor_logs index/constraint fingerprint changed';
  end if;

  if exists (
    select 1 from pg_views where definition ilike '%sensor_logs%'
  ) or exists (
    select 1 from pg_proc
    where prokind = 'f' and pg_get_functiondef(oid) ilike '%sensor_logs%'
  ) or exists (
    select 1 from pg_trigger
    where tgrelid = 'public.sensor_logs'::regclass and not tgisinternal
  ) or exists (
    select 1 from pg_constraint
    where contype = 'f'
      and (conrelid = 'public.sensor_logs'::regclass
           or confrelid = 'public.sensor_logs'::regclass)
  ) or exists (
    select 1 from pg_publication where puballtables
  ) or exists (
    select 1 from pg_publication_tables
    where schemaname = 'public' and tablename = 'sensor_logs'
  ) or exists (
    select 1 from pg_subscription_rel
    where srrelid = 'public.sensor_logs'::regclass
  ) then
    raise exception 'Phase 8F.10 aborted: an external sensor_logs dependency appeared';
  end if;

  select count(*) into helper_dependency_count
  from pg_depend
  where refobjid = to_regprocedure('public.is_device_telemetry_insert_enabled(text)')
    and pg_describe_object(classid, objid, objsubid) like 'policy Registry active devices can insert%';

  if to_regprocedure('public.is_device_telemetry_insert_enabled(text)') is null
     or helper_dependency_count <> 3 then
    raise exception 'Phase 8F.10 aborted: shared Gen2 telemetry helper dependency changed';
  end if;

  if (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'sensor_events') <> 0
     or not exists (
       select 1 from pg_class as relation
       join pg_namespace as namespace on namespace.oid = relation.relnamespace
       where namespace.nspname = 'public' and relation.relname = 'sensor_events'
         and relation.relrowsecurity is true and relation.relforcerowsecurity is false
     ) then
    raise exception 'Phase 8F.10 aborted: sensor_events policy/RLS state changed';
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
end
$phase8f10_schema_preflight$;

-- Retained manual operational-log table: remove unused browser/server API grants.
revoke all privileges on table public.sensor_events
  from anon, authenticated, service_role;

-- Obsolete legacy telemetry table: retire access controls and owned objects explicitly.
revoke all privileges on table public.sensor_logs
  from anon, authenticated, service_role;

drop policy "Public read sensor logs" on public.sensor_logs;
drop policy "Registry active devices can insert sensor logs" on public.sensor_logs;

drop index public.sensor_logs_timestamp_idx;
alter table public.sensor_logs drop constraint sensor_logs_pkey;
drop table public.sensor_logs restrict;

do $phase8f10_schema_postcheck$
declare
  helper_dependency_count integer;
begin
  if to_regclass('public.sensor_logs') is not null then
    raise exception 'Phase 8F.10 aborted: sensor_logs still exists';
  end if;

  if to_regclass('public.sensor_events') is null
     or (select count(*) from public.sensor_events) <> 0
     or (select count(*) from pg_policies
         where schemaname = 'public' and tablename = 'sensor_events') <> 0 then
    raise exception 'Phase 8F.10 aborted: retained sensor_events boundary changed';
  end if;

  if exists (
    select 1
    from pg_class as relation
    cross join lateral aclexplode(relation.relacl) as acl
    join pg_roles as grantee on grantee.oid = acl.grantee
    where relation.oid = 'public.sensor_events'::regclass
      and grantee.rolname in ('anon', 'authenticated', 'service_role')
  ) then
    raise exception 'Phase 8F.10 aborted: an obsolete sensor_events role grant remains';
  end if;

  select count(*) into helper_dependency_count
  from pg_depend
  where refobjid = to_regprocedure('public.is_device_telemetry_insert_enabled(text)')
    and pg_describe_object(classid, objid, objsubid) like 'policy Registry active devices can insert%';

  if to_regprocedure('public.is_device_telemetry_insert_enabled(text)') is null
     or helper_dependency_count <> 2 then
    raise exception 'Phase 8F.10 aborted: current Gen2 telemetry helper was not preserved';
  end if;

  if to_regclass('public.sensor_measurement_batches') is null
     or to_regclass('public.device_heartbeats') is null
     or to_regclass('public.watering_events') is null
     or to_regclass('public.device_registry') is null
     or to_regclass('public.device_capabilities') is null then
    raise exception 'Phase 8F.10 aborted: a protected current Gen2 table is missing';
  end if;

  if (select count(*)
      from public.sensor_measurement_batches as source_row
      where source_row.device_id::text = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
        and to_jsonb(source_row)::text ilike '%reservoir_liquid_state%') <> 95 then
    raise exception 'Phase 8F.10 aborted: protected reservoir_liquid_state count changed';
  end if;
end
$phase8f10_schema_postcheck$;

commit;
