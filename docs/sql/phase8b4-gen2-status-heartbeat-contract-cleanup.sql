-- Phase 8B.4 - Gen2 /status and heartbeat diagnostics contract cleanup
--
-- This additive migration prepares device_heartbeats for every profile built
-- with MBG_GEN2_ENABLED and exposes one normalized hosted diagnostics contract.
-- Old columns remain for historical evidence and temporary Gen1 writers, but
-- old field names are not exposed by the rebuilt hosted views. A later Gen1
-- code-removal phase can stop old writes without deleting historical evidence.
--
-- Historical telemetry success is not measurement-specific: watering-event
-- storage could update last_successful_telemetry_post_at. It is therefore never
-- used as fallback for last_successful_measurement_post_at. Evidence that cannot
-- be proved from an old row remains null rather than being invented.
--
-- Local IP addresses, MAC addresses, SSIDs, endpoints, static watering authority,
-- and command/control are intentionally excluded. Existing grants, protected-view
-- security barriers, membership joins, and RLS policies remain unchanged.

begin;

alter table public.device_heartbeats
  add column if not exists wifi_status_code integer,
  add column if not exists wifi_status_label text,
  add column if not exists last_wifi_disconnect_reason integer,
  add column if not exists last_wifi_disconnect_reason_label text,
  add column if not exists wifi_reconnect_attempts_since_boot integer,
  add column if not exists wifi_full_recovery_attempts_since_boot integer,
  add column if not exists wifi_disconnects_since_boot integer,
  add column if not exists wifi_ip_acquisitions_since_boot integer,
  add column if not exists last_wifi_disconnect_uptime_seconds integer,
  add column if not exists last_wifi_ip_acquired_uptime_seconds integer,
  add column if not exists last_wifi_activity text,
  add column if not exists last_http_status integer,
  add column if not exists last_http_status_label text,
  add column if not exists consecutive_failures integer,
  add column if not exists last_error_category text,
  add column if not exists last_successful_measurement_post_at timestamptz,
  add column if not exists last_successful_measurement_post_uptime_seconds integer,
  add column if not exists last_successful_status_post_at timestamptz,
  add column if not exists last_successful_status_post_uptime_seconds integer,
  add column if not exists active_trigger_source text,
  add column if not exists last_watering_at timestamptz,
  add column if not exists last_watering_duration_seconds integer,
  add column if not exists free_heap_bytes integer,
  add column if not exists minimum_free_heap_bytes integer;

-- The output contract removes and reorders existing columns, so dependent
-- protected views are dropped first. No base-table column or row is removed.
drop view if exists public.customer_hosted_device_diagnostics;
drop view if exists public.support_hosted_device_diagnostics;
drop view if exists public.hosted_device_diagnostics;
drop view if exists public.device_diagnostics_normalized_internal;

-- This normalization layer contains no profile branch and receives no browser
-- grant. Scope-specific wrappers below retain the existing public/customer/support
-- visibility boundaries without duplicating the compatibility expressions.
create view public.device_diagnostics_normalized_internal as
select
  registry.device_id,
  registry.device_key,
  registry.device_label,
  registry.device_role,
  registry.hosted_visible,
  latest.firmware_version,
  latest.build_profile,
  latest.heartbeat_at as last_heartbeat_at,
  case
    when latest.heartbeat_at is null then null
    else greatest(0, floor(extract(epoch from (now() - latest.heartbeat_at)))::integer)
  end as heartbeat_age_seconds,
  latest.heartbeat_reason,
  latest.uptime_seconds,
  latest.wifi_connected,
  latest.wifi_rssi,
  normalized.wifi_status_code,
  coalesce(
    nullif(latest.wifi_status_label, ''),
    case normalized.wifi_status_code
      when 255 then 'no_shield' when 0 then 'idle'
      when 1 then 'no_ssid_available' when 2 then 'scan_completed'
      when 3 then 'connected' when 4 then 'connection_failed'
      when 5 then 'connection_lost' when 6 then 'disconnected'
      else 'unknown'
    end
  ) as wifi_status_label,
  normalized.last_wifi_disconnect_reason,
  case
    when normalized.last_wifi_disconnect_reason is null then 'not_recorded'
    else coalesce(
      nullif(latest.last_wifi_disconnect_reason_label, ''),
      case normalized.last_wifi_disconnect_reason
        when 1 then 'unspecified' when 2 then 'auth_expire'
        when 3 then 'auth_leave' when 4 then 'assoc_expire'
        when 5 then 'assoc_too_many' when 6 then 'not_authed'
        when 7 then 'not_assoced' when 8 then 'assoc_leave'
        when 9 then 'assoc_not_authed' when 10 then 'disassoc_power_capability_bad'
        when 11 then 'disassoc_supported_channel_bad' when 12 then 'bss_transition_disassoc'
        when 13 then 'ie_invalid' when 14 then 'mic_failure'
        when 15 then 'four_way_handshake_timeout'
        when 16 then 'group_key_update_timeout' when 17 then 'ie_in_4way_differs'
        when 18 then 'group_cipher_invalid' when 19 then 'pairwise_cipher_invalid'
        when 20 then 'akmp_invalid' when 21 then 'unsupported_rsn_ie_version'
        when 22 then 'invalid_rsn_ie_capability'
        when 23 then '802_1x_auth_failed'
        when 24 then 'cipher_suite_rejected'
        when 25 then 'tdls_peer_unreachable' when 26 then 'tdls_unspecified'
        when 27 then 'ssp_requested_disassoc' when 28 then 'no_ssp_roaming_agreement'
        when 29 then 'bad_cipher_or_akm' when 30 then 'not_authorized_this_location'
        when 31 then 'service_change_precludes_ts' when 32 then 'unspecified_qos'
        when 33 then 'not_enough_bandwidth' when 34 then 'missing_acks'
        when 35 then 'exceeded_txop' when 36 then 'sta_leaving'
        when 37 then 'end_ba' when 38 then 'unknown_ba'
        when 39 then 'timeout' when 46 then 'peer_initiated'
        when 47 then 'ap_initiated' when 48 then 'invalid_ft_action_frame_count'
        when 49 then 'invalid_pmkid' when 50 then 'invalid_mde'
        when 51 then 'invalid_fte' when 67 then 'transmission_link_establish_failed'
        when 68 then 'alternative_channel_occupied' when 200 then 'beacon_timeout'
        when 201 then 'no_ap_found' when 202 then 'auth_fail'
        when 203 then 'assoc_fail' when 204 then 'handshake_timeout'
        when 205 then 'connection_fail' when 206 then 'ap_tsf_reset'
        when 207 then 'roaming' when 208 then 'assoc_comeback_time_too_long'
        when 209 then 'sa_query_timeout' else 'unknown'
      end
    )
  end as last_wifi_disconnect_reason_label,
  coalesce(latest.wifi_reconnect_attempts_since_boot, latest.wifi_reconnect_attempt_count)
    as wifi_reconnect_attempts_since_boot,
  coalesce(latest.wifi_full_recovery_attempts_since_boot, historical.wifi_full_recovery_attempts)
    as wifi_full_recovery_attempts_since_boot,
  coalesce(latest.wifi_disconnects_since_boot, historical.wifi_disconnects)
    as wifi_disconnects_since_boot,
  coalesce(latest.wifi_ip_acquisitions_since_boot, historical.wifi_ip_acquisitions)
    as wifi_ip_acquisitions_since_boot,
  coalesce(
    latest.last_wifi_disconnect_uptime_seconds,
    case
      when coalesce(historical.wifi_disconnects, 0) > 0
        or historical.last_wifi_disconnect_reason is not null
      then historical.last_wifi_disconnect_uptime_seconds
      else null
    end
  ) as last_wifi_disconnect_uptime_seconds,
  coalesce(
    latest.last_wifi_ip_acquired_uptime_seconds,
    case
      when coalesce(historical.wifi_ip_acquisitions, 0) > 0
      then historical.last_wifi_ip_acquired_uptime_seconds
      else null
    end
  ) as last_wifi_ip_acquired_uptime_seconds,
  normalized.last_wifi_activity,
  normalized.last_http_status,
  case
    when normalized.last_http_status is null then 'not_recorded'
    else coalesce(
      nullif(latest.last_http_status_label, ''),
      case
      when normalized.last_http_status = 0 then 'no_http_response'
      when normalized.last_http_status < 0 then 'client_error'
      when normalized.last_http_status = 200 then 'ok'
      when normalized.last_http_status = 201 then 'created'
      when normalized.last_http_status = 204 then 'no_content'
      when normalized.last_http_status = 400 then 'bad_request'
      when normalized.last_http_status = 401 then 'unauthorized'
      when normalized.last_http_status = 403 then 'forbidden'
      when normalized.last_http_status = 404 then 'not_found'
      when normalized.last_http_status = 409 then 'conflict'
      when normalized.last_http_status = 429 then 'too_many_requests'
      when normalized.last_http_status = 500 then 'internal_server_error'
      when normalized.last_http_status = 502 then 'bad_gateway'
      when normalized.last_http_status = 503 then 'service_unavailable'
        else 'unknown'
      end
    )
  end as last_http_status_label,
  coalesce(latest.consecutive_failures, latest.consecutive_supabase_failures)
    as consecutive_failures,
  coalesce(latest.last_error_category, latest.last_supabase_error_category)
    as last_error_category,
  latest.last_successful_measurement_post_at,
  latest.last_successful_measurement_post_uptime_seconds,
  coalesce(latest.last_successful_status_post_at, latest.last_successful_diagnostics_post_at)
    as last_successful_status_post_at,
  latest.last_successful_status_post_uptime_seconds,
  latest.currently_watering,
  latest.active_trigger_source,
  coalesce(latest.last_watering_at, latest.last_watering_started_at) as last_watering_at,
  coalesce(
    latest.last_watering_duration_seconds,
    case when latest.last_watering_completed_at is not null then latest.last_watering_duration else null end
  ) as last_watering_duration_seconds,
  coalesce(latest.free_heap_bytes, latest.free_heap) as free_heap_bytes,
  coalesce(latest.minimum_free_heap_bytes, latest.min_free_heap) as minimum_free_heap_bytes
from public.device_registry as registry
left join lateral (
  select *
  from public.device_heartbeats as heartbeat
  where heartbeat.device_id = registry.device_id
  order by heartbeat.heartbeat_at desc
  limit 1
) as latest on true
left join lateral (
  select
    case when latest.details ->> 'last_wifi_status_code' ~ '^-?[0-9]+$'
      then (latest.details ->> 'last_wifi_status_code')::integer end as wifi_status_code,
    case when latest.details ->> 'last_wifi_disconnect_reason' ~ '^-?[0-9]+$'
      then nullif((latest.details ->> 'last_wifi_disconnect_reason')::integer, -1) end
      as last_wifi_disconnect_reason,
    case when latest.details ->> 'wifi_begin_recovery_attempt_count' ~ '^[0-9]+$'
      then (latest.details ->> 'wifi_begin_recovery_attempt_count')::integer end
      as wifi_full_recovery_attempts,
    case when latest.details ->> 'wifi_disconnect_event_count' ~ '^[0-9]+$'
      then (latest.details ->> 'wifi_disconnect_event_count')::integer end as wifi_disconnects,
    case when latest.details ->> 'wifi_got_ip_event_count' ~ '^[0-9]+$'
      then (latest.details ->> 'wifi_got_ip_event_count')::integer end as wifi_ip_acquisitions,
    case when latest.details ->> 'last_wifi_disconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest.details ->> 'last_wifi_disconnected_uptime_seconds')::integer end
      as last_wifi_disconnect_uptime_seconds,
    case when latest.details ->> 'last_wifi_reconnected_uptime_seconds' ~ '^[0-9]+$'
      then (latest.details ->> 'last_wifi_reconnected_uptime_seconds')::integer end
      as last_wifi_ip_acquired_uptime_seconds
) as historical on true
left join lateral (
  select
    coalesce(latest.wifi_status_code, historical.wifi_status_code) as wifi_status_code,
    coalesce(nullif(latest.last_wifi_disconnect_reason, -1), historical.last_wifi_disconnect_reason)
      as last_wifi_disconnect_reason,
    coalesce(latest.last_http_status, latest.last_supabase_http_status) as last_http_status,
    case coalesce(nullif(latest.last_wifi_activity, ''), latest.details ->> 'last_network_recovery_action')
      when 'none' then 'none' when 'wifi_connected_event' then 'connected'
      when 'connected' then 'connected' when 'wifi_got_ip_event' then 'ip_acquired'
      when 'ip_acquired' then 'ip_acquired' when 'wifi_disconnected_event' then 'disconnected'
      when 'disconnected' then 'disconnected'
      when 'wifi_not_connected_detected' then 'disconnect_detected'
      when 'disconnect_detected' then 'disconnect_detected'
      when 'wifi_reconnect' then 'reconnect_requested'
      when 'reconnect_requested' then 'reconnect_requested'
      when 'wifi_disconnect_begin' then 'full_recovery_started'
      when 'full_recovery_started' then 'full_recovery_started'
      else 'none'
    end as last_wifi_activity
) as normalized on true;

create view public.hosted_device_diagnostics as
select normalized.*
from public.device_diagnostics_normalized_internal as normalized
inner join public.device_registry as registry
  on registry.device_id = normalized.device_id
where registry.active is true
  and registry.hosted_visible is true;

-- Protected views reuse the normalized contract without inheriting the public-demo
-- hosted_visible filter, so existing customer/support membership boundaries remain.
create view public.customer_hosted_device_diagnostics
with (security_barrier = true)
as
select
  diagnostics.device_id,
  diagnostics.device_key,
  diagnostics.device_label,
  diagnostics.device_role,
  true as hosted_visible,
  diagnostics.firmware_version,
  diagnostics.build_profile,
  diagnostics.last_heartbeat_at,
  diagnostics.heartbeat_age_seconds,
  diagnostics.heartbeat_reason,
  diagnostics.uptime_seconds,
  diagnostics.wifi_connected,
  diagnostics.wifi_rssi,
  diagnostics.wifi_status_code,
  diagnostics.wifi_status_label,
  diagnostics.last_wifi_disconnect_reason,
  diagnostics.last_wifi_disconnect_reason_label,
  diagnostics.wifi_reconnect_attempts_since_boot,
  diagnostics.wifi_full_recovery_attempts_since_boot,
  diagnostics.wifi_disconnects_since_boot,
  diagnostics.wifi_ip_acquisitions_since_boot,
  diagnostics.last_wifi_disconnect_uptime_seconds,
  diagnostics.last_wifi_ip_acquired_uptime_seconds,
  diagnostics.last_wifi_activity,
  diagnostics.last_http_status,
  diagnostics.last_http_status_label,
  diagnostics.consecutive_failures,
  diagnostics.last_error_category,
  diagnostics.last_successful_measurement_post_at,
  diagnostics.last_successful_measurement_post_uptime_seconds,
  diagnostics.last_successful_status_post_at,
  diagnostics.last_successful_status_post_uptime_seconds,
  diagnostics.currently_watering,
  diagnostics.active_trigger_source,
  diagnostics.last_watering_at,
  diagnostics.last_watering_duration_seconds,
  diagnostics.free_heap_bytes,
  diagnostics.minimum_free_heap_bytes
from public.device_diagnostics_normalized_internal as diagnostics
inner join public.device_registry as registry
  on registry.device_id = diagnostics.device_id
inner join public.customer_garden_devices as customer_device
  on customer_device.device_id = registry.device_id
where registry.active is true;

create view public.support_hosted_device_diagnostics
with (security_barrier = true)
as
select
  diagnostics.device_id,
  diagnostics.device_key,
  diagnostics.device_label,
  diagnostics.device_role,
  true as hosted_visible,
  diagnostics.firmware_version,
  diagnostics.build_profile,
  diagnostics.last_heartbeat_at,
  diagnostics.heartbeat_age_seconds,
  diagnostics.heartbeat_reason,
  diagnostics.uptime_seconds,
  diagnostics.wifi_connected,
  diagnostics.wifi_rssi,
  diagnostics.wifi_status_code,
  diagnostics.wifi_status_label,
  diagnostics.last_wifi_disconnect_reason,
  diagnostics.last_wifi_disconnect_reason_label,
  diagnostics.wifi_reconnect_attempts_since_boot,
  diagnostics.wifi_full_recovery_attempts_since_boot,
  diagnostics.wifi_disconnects_since_boot,
  diagnostics.wifi_ip_acquisitions_since_boot,
  diagnostics.last_wifi_disconnect_uptime_seconds,
  diagnostics.last_wifi_ip_acquired_uptime_seconds,
  diagnostics.last_wifi_activity,
  diagnostics.last_http_status,
  diagnostics.last_http_status_label,
  diagnostics.consecutive_failures,
  diagnostics.last_error_category,
  diagnostics.last_successful_measurement_post_at,
  diagnostics.last_successful_measurement_post_uptime_seconds,
  diagnostics.last_successful_status_post_at,
  diagnostics.last_successful_status_post_uptime_seconds,
  diagnostics.currently_watering,
  diagnostics.active_trigger_source,
  diagnostics.last_watering_at,
  diagnostics.last_watering_duration_seconds,
  diagnostics.free_heap_bytes,
  diagnostics.minimum_free_heap_bytes
from public.device_diagnostics_normalized_internal as diagnostics
inner join public.device_registry as registry
  on registry.device_id = diagnostics.device_id
inner join public.support_garden_devices as support_device
  on support_device.device_id = registry.device_id
where registry.active is true;

-- Restore the exact existing browser-facing privilege posture. Direct browser
-- access to device_heartbeats remains unavailable and no RLS policy is altered.
revoke select on table public.device_heartbeats
  from public, anon, authenticated;
revoke all on public.device_diagnostics_normalized_internal
  from public, anon, authenticated;
revoke all on public.hosted_device_diagnostics from public, anon, authenticated;
grant select on public.hosted_device_diagnostics to anon, authenticated;

revoke all on public.customer_hosted_device_diagnostics from public, anon, authenticated;
revoke all on public.support_hosted_device_diagnostics from public, anon, authenticated;
grant select on public.customer_hosted_device_diagnostics to authenticated;
grant select on public.support_hosted_device_diagnostics to authenticated;

commit;

-- Manual validation SQL, intentionally commented out. Do not execute as part of
-- this artifact checkpoint.
--
-- 1. Confirm all new nullable base columns exist.
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'device_heartbeats'
--   and column_name in (
--     'wifi_status_code','wifi_status_label','last_wifi_disconnect_reason',
--     'last_wifi_disconnect_reason_label','wifi_reconnect_attempts_since_boot',
--     'wifi_full_recovery_attempts_since_boot','wifi_disconnects_since_boot',
--     'wifi_ip_acquisitions_since_boot','last_wifi_disconnect_uptime_seconds',
--     'last_wifi_ip_acquired_uptime_seconds','last_wifi_activity','last_http_status',
--     'last_http_status_label','consecutive_failures','last_error_category',
--     'last_successful_measurement_post_at',
--     'last_successful_measurement_post_uptime_seconds','last_successful_status_post_at',
--     'last_successful_status_post_uptime_seconds','active_trigger_source',
--     'last_watering_at','last_watering_duration_seconds','free_heap_bytes',
--     'minimum_free_heap_bytes'
--   )
-- order by ordinal_position;
--
-- 2. Confirm all three views expose the exact expected ordered contract.
-- with expected as (
--   select column_name, ordinal_position
--   from unnest(array[
--     'device_id','device_key','device_label','device_role','hosted_visible',
--     'firmware_version','build_profile','last_heartbeat_at','heartbeat_age_seconds',
--     'heartbeat_reason','uptime_seconds','wifi_connected','wifi_rssi',
--     'wifi_status_code','wifi_status_label','last_wifi_disconnect_reason',
--     'last_wifi_disconnect_reason_label','wifi_reconnect_attempts_since_boot',
--     'wifi_full_recovery_attempts_since_boot','wifi_disconnects_since_boot',
--     'wifi_ip_acquisitions_since_boot','last_wifi_disconnect_uptime_seconds',
--     'last_wifi_ip_acquired_uptime_seconds','last_wifi_activity','last_http_status',
--     'last_http_status_label','consecutive_failures','last_error_category',
--     'last_successful_measurement_post_at',
--     'last_successful_measurement_post_uptime_seconds','last_successful_status_post_at',
--     'last_successful_status_post_uptime_seconds','currently_watering',
--     'active_trigger_source','last_watering_at','last_watering_duration_seconds',
--     'free_heap_bytes','minimum_free_heap_bytes'
--   ]) with ordinality as expected_columns(column_name, ordinal_position)
-- ), view_names as (
--   select unnest(array[
--     'hosted_device_diagnostics','customer_hosted_device_diagnostics',
--     'support_hosted_device_diagnostics'
--   ]) as table_name
-- ), actual as (
--   select table_name, column_name, ordinal_position::bigint
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name in (select table_name from view_names)
-- )
-- select view_names.table_name, expected.ordinal_position, expected.column_name,
--   actual.column_name as actual_column_name
-- from view_names cross join expected
-- left join actual on actual.table_name = view_names.table_name
--   and actual.ordinal_position = expected.ordinal_position
-- where actual.column_name is distinct from expected.column_name
-- order by view_names.table_name, expected.ordinal_position;
-- Expected: zero rows.
--
-- Confirm each view has exactly 38 columns. Expected: zero rows.
-- select
--   table_name,
--   count(*) as actual_column_count
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in (
--     'hosted_device_diagnostics',
--     'customer_hosted_device_diagnostics',
--     'support_hosted_device_diagnostics'
--   )
-- group by table_name
-- having count(*) <> 38
-- order by table_name;
--
-- 3-5. Review latest normalized evidence for Balcony02, Prototype01, and
-- Balcony01/Scout01 where rows exist.
-- select * from public.hosted_device_diagnostics
-- where device_id in (
--   '7e5bd328-ad68-4389-a71a-fa5cd01b3813', -- Balcony02
--   '318fab98-89ad-4f36-9100-3134a04e0be5', -- Prototype01
--   '550e8400-e29b-41d4-a716-446655440000', -- Balcony01
--   '28f4e6e3-5979-4af4-9753-34e185d8e47e'  -- Scout01
-- )
-- order by device_id;
--
-- 6. Review temporary Gen1/historical fallback behavior without profile branching.
-- select device_key, build_profile, wifi_status_code, wifi_status_label,
--   wifi_reconnect_attempts_since_boot, last_wifi_activity, last_http_status,
--   last_http_status_label, last_successful_status_post_at,
--   last_successful_status_post_uptime_seconds
-- from public.hosted_device_diagnostics
-- order by device_key;
--
-- 7. Prove historical telemetry success is not exposed as measurement success.
-- select latest.id, latest.device_id, latest.last_successful_telemetry_post_at,
--   diagnostics.last_successful_measurement_post_at,
--   diagnostics.last_successful_measurement_post_uptime_seconds
-- from public.hosted_device_diagnostics as diagnostics
-- inner join lateral (
--   select heartbeat.* from public.device_heartbeats as heartbeat
--   where heartbeat.device_id = diagnostics.device_id
--   order by heartbeat.heartbeat_at desc limit 1
-- ) as latest on true
-- where latest.last_successful_telemetry_post_at is not null
--   and latest.last_successful_measurement_post_at is null;
-- Expected normalized measurement-success fields: null.
--
-- 8. Confirm no local-network, details, old-name, or static watering-authority
-- columns leak through the hosted views. Expected count: 0.
-- select table_name, column_name
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in (
--     'hosted_device_diagnostics','customer_hosted_device_diagnostics',
--     'support_hosted_device_diagnostics'
--   )
--   and column_name in (
--     'ip_address','mac_address','ssid','details','pump_control_available',
--     'device_can_water','last_successful_telemetry_post_at',
--     'last_successful_diagnostics_post_at','free_heap','min_free_heap',
--     'last_watering_duration'
--   );
--
-- 9-11. Confirm base-table denial, public-view access, and authenticated-only
-- protected-view access.
-- select
--   has_table_privilege('anon','public.device_heartbeats','select') as anon_base_select,
--   has_table_privilege('authenticated','public.device_heartbeats','select')
--     as authenticated_base_select,
--   has_table_privilege('anon','public.device_diagnostics_normalized_internal','select')
--     as anon_internal_view_select,
--   has_table_privilege(
--     'authenticated','public.device_diagnostics_normalized_internal','select'
--   ) as authenticated_internal_view_select,
--   has_table_privilege('anon','public.hosted_device_diagnostics','select')
--     as anon_public_view_select,
--   has_table_privilege('authenticated','public.hosted_device_diagnostics','select')
--     as authenticated_public_view_select,
--   has_table_privilege('anon','public.customer_hosted_device_diagnostics','select')
--     as anon_customer_view_select,
--   has_table_privilege('authenticated','public.customer_hosted_device_diagnostics','select')
--     as authenticated_customer_view_select,
--   has_table_privilege('anon','public.support_hosted_device_diagnostics','select')
--     as anon_support_view_select,
--   has_table_privilege('authenticated','public.support_hosted_device_diagnostics','select')
--     as authenticated_support_view_select;
--
-- Confirm both protected diagnostics views retain security_barrier=true.
-- Expected: both rows contain security_barrier=true.
-- select
--   namespace.nspname as schemaname,
--   relation.relname as viewname,
--   relation.reloptions
-- from pg_class as relation
-- inner join pg_namespace as namespace
--   on namespace.oid = relation.relnamespace
-- where namespace.nspname = 'public'
--   and relation.relkind = 'v'
--   and relation.relname in (
--     'customer_hosted_device_diagnostics',
--     'support_hosted_device_diagnostics'
--   )
-- order by relation.relname;
--
-- 12. Membership filtering remains enforced by the existing customer/support
-- membership views. Validate under authenticated JWT sessions for a customer and
-- a support user; each result must remain limited to its existing membership scope.
-- select * from public.customer_hosted_device_diagnostics order by device_key;
-- select * from public.support_hosted_device_diagnostics order by device_key;
--
-- 13. Confirm this migration made no RLS policy changes by comparing with the
-- approved pre-migration policy inventory.
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'device_heartbeats'
-- order by policyname;
