-- Phase 7K.6 - Hosted Runtime Diagnostics Plain-English Visibility
--
-- Expands the existing hosted-safe diagnostics view with scalar runtime
-- evidence already written by device_heartbeats. The original Phase 6J.6
-- columns remain in their existing order, and Phase 7K.6 fields are appended.
-- This artifact is not a command/control path and does not grant anon SELECT
-- on base tables.

create or replace view public.hosted_device_diagnostics as
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
  latest_heartbeat.last_watering_duration,
  latest_heartbeat.wifi_reconnect_attempt_count,
  latest_heartbeat.last_supabase_http_status,
  latest_heartbeat.consecutive_supabase_failures,
  latest_heartbeat.last_supabase_error_category,
  latest_heartbeat.last_successful_telemetry_post_at,
  latest_heartbeat.last_successful_diagnostics_post_at,
  latest_heartbeat.pump_control_available,
  latest_heartbeat.device_can_water,
  case
    when latest_heartbeat.details ->> 'wifi_begin_recovery_attempt_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_begin_recovery_attempt_count')::integer
    else null
  end as wifi_begin_recovery_attempt_count,
  case
    when latest_heartbeat.details ->> 'wifi_disconnect_event_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_disconnect_event_count')::integer
    else null
  end as wifi_disconnect_event_count,
  case
    when latest_heartbeat.details ->> 'wifi_got_ip_event_count' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'wifi_got_ip_event_count')::integer
    else null
  end as wifi_got_ip_event_count,
  case
    when latest_heartbeat.details ->> 'last_wifi_status_code' ~ '^-?[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_status_code')::integer
    else null
  end as last_wifi_status_code,
  case
    when latest_heartbeat.details ->> 'last_wifi_disconnect_reason' ~ '^-?[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_disconnect_reason')::integer
    else null
  end as last_wifi_disconnect_reason,
  case
    when latest_heartbeat.details ->> 'last_wifi_disconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_disconnected_uptime_seconds')::integer
    else null
  end as last_wifi_disconnected_uptime_seconds,
  case
    when latest_heartbeat.details ->> 'last_wifi_reconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest_heartbeat.details ->> 'last_wifi_reconnected_uptime_seconds')::integer
    else null
  end as last_wifi_reconnected_uptime_seconds,
  nullif(latest_heartbeat.details ->> 'last_network_recovery_action', '')
    as last_network_recovery_action
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
    last_watering_duration,
    wifi_reconnect_attempt_count,
    last_supabase_http_status,
    consecutive_supabase_failures,
    last_supabase_error_category,
    last_successful_telemetry_post_at,
    last_successful_diagnostics_post_at,
    pump_control_available,
    device_can_water,
    details
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
-- select
--   device_key,
--   device_label,
--   last_heartbeat_at,
--   heartbeat_age_seconds,
--   last_supabase_http_status,
--   consecutive_supabase_failures,
--   last_supabase_error_category,
--   wifi_reconnect_attempt_count,
--   wifi_begin_recovery_attempt_count,
--   wifi_disconnect_event_count,
--   wifi_got_ip_event_count,
--   last_network_recovery_action,
--   pump_control_available,
--   device_can_water
-- from public.hosted_device_diagnostics
-- order by device_key;
--
-- select
--   has_table_privilege('anon', 'public.hosted_device_diagnostics', 'select')
--     as anon_can_select_hosted_device_diagnostics,
--   has_table_privilege('anon', 'public.device_heartbeats', 'select')
--     as anon_can_select_device_heartbeats,
--   has_table_privilege('anon', 'public.device_registry', 'select')
--     as anon_can_select_device_registry;
