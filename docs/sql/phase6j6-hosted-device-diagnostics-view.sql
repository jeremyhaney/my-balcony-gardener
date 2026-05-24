-- Phase 6J.6 - Hosted Read-Only Diagnostics Display MVP
--
-- Limited hosted-safe diagnostics view for the read-only dashboard.
-- Supabase remains telemetry/history/diagnostics storage only, not command/control.

drop view if exists public.hosted_device_diagnostics;

create view public.hosted_device_diagnostics as
select
  registry.device_id,
  registry.device_key,
  registry.device_label,
  registry.device_role,
  registry.hosted_visible,
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
  latest_heartbeat.last_watering_duration
from public.device_registry as registry
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
    last_watering_duration
  from public.device_heartbeats
  where device_id = registry.device_id
  order by heartbeat_at desc
  limit 1
) as latest_heartbeat on true
where registry.active is true
  and registry.hosted_visible is true;

revoke all on public.hosted_device_diagnostics from public;
revoke all on public.hosted_device_diagnostics from anon;
revoke all on public.hosted_device_diagnostics from authenticated;

grant select on public.hosted_device_diagnostics to anon;
grant select on public.hosted_device_diagnostics to authenticated;

-- Manual validation SQL, intentionally commented out.
--
-- The view should expose hosted-safe fields only:
--
-- select *
-- from public.hosted_device_diagnostics
-- order by device_key;
--
-- Check the public grants without adding anon SELECT to public.device_registry:
--
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'hosted_device_diagnostics'
-- order by grantee, privilege_type;
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('device_registry', 'device_heartbeats')
-- order by tablename, policyname;
