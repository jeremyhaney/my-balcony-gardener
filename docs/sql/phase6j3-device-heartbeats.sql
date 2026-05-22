-- Phase 6J.3 - Supabase device_heartbeats SQL/RLS MVP
--
-- Append-only diagnostics/evidence table for MBG ESP32 device health.
-- Supabase remains telemetry/history/diagnostics storage only, not command/control.

create extension if not exists pgcrypto;

create table if not exists public.device_heartbeats (
  id uuid primary key default gen_random_uuid(),
  heartbeat_at timestamptz not null default now(),
  device_id text not null,
  device_label text null,
  device_role text not null,
  firmware_version text null,
  build_profile text null,
  heartbeat_reason text not null,

  uptime_seconds integer null,
  boot_count integer null,
  reset_reason text null,
  free_heap integer null,
  min_free_heap integer null,

  wifi_connected boolean null,
  wifi_rssi integer null,
  wifi_reconnect_attempt_count integer null,

  last_supabase_http_status integer null,
  consecutive_supabase_failures integer null,
  last_supabase_error_category text null,
  last_successful_telemetry_post_at timestamptz null,
  last_successful_diagnostics_post_at timestamptz null,

  last_sensor_read_at timestamptz null,
  dht_fresh_read_ok boolean null,
  dht_using_cached_values boolean null,
  dht_failure_count integer null,
  soil_raw_adc_last integer null,

  currently_watering boolean null,
  last_watering_started_at timestamptz null,
  last_watering_completed_at timestamptz null,
  last_watering_duration integer null,
  pump_control_available boolean null,
  device_can_water boolean null,

  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint device_heartbeats_device_id_not_blank
    check (btrim(device_id) <> ''),
  constraint device_heartbeats_device_role_not_blank
    check (btrim(device_role) <> ''),
  constraint device_heartbeats_heartbeat_reason_not_blank
    check (btrim(heartbeat_reason) <> ''),
  constraint device_heartbeats_uptime_seconds_nonnegative
    check (uptime_seconds is null or uptime_seconds >= 0),
  constraint device_heartbeats_boot_count_nonnegative
    check (boot_count is null or boot_count >= 0),
  constraint device_heartbeats_free_heap_nonnegative
    check (free_heap is null or free_heap >= 0),
  constraint device_heartbeats_min_free_heap_nonnegative
    check (min_free_heap is null or min_free_heap >= 0),
  constraint device_heartbeats_wifi_reconnect_attempt_count_nonnegative
    check (
      wifi_reconnect_attempt_count is null
      or wifi_reconnect_attempt_count >= 0
    ),
  constraint device_heartbeats_consecutive_supabase_failures_nonnegative
    check (
      consecutive_supabase_failures is null
      or consecutive_supabase_failures >= 0
    ),
  constraint device_heartbeats_dht_failure_count_nonnegative
    check (dht_failure_count is null or dht_failure_count >= 0),
  constraint device_heartbeats_soil_raw_adc_last_nonnegative
    check (soil_raw_adc_last is null or soil_raw_adc_last >= 0),
  constraint device_heartbeats_last_watering_duration_nonnegative
    check (
      last_watering_duration is null
      or last_watering_duration >= 0
    ),
  constraint device_heartbeats_details_object
    check (jsonb_typeof(details) = 'object')
);

create index if not exists device_heartbeats_heartbeat_at_desc_idx
  on public.device_heartbeats (heartbeat_at desc);

create index if not exists device_heartbeats_device_id_heartbeat_at_desc_idx
  on public.device_heartbeats (device_id, heartbeat_at desc);

create index if not exists device_heartbeats_heartbeat_reason_idx
  on public.device_heartbeats (heartbeat_reason);

create index if not exists device_heartbeats_device_role_idx
  on public.device_heartbeats (device_role);

create index if not exists device_heartbeats_created_at_desc_idx
  on public.device_heartbeats (created_at desc);

alter table public.device_heartbeats enable row level security;

drop policy if exists "Known provisioned devices can insert device heartbeats"
  on public.device_heartbeats;

create policy "Known provisioned devices can insert device heartbeats"
  on public.device_heartbeats
  for insert
  to anon
  with check (
    device_id in (
      '550e8400-e29b-41d4-a716-446655440000',
      '318fab98-89ad-4f36-9100-3134a04e0be5',
      '28f4e6e3-5979-4af4-9753-34e185d8e47e'
    )
  );

-- Manual validation SQL, intentionally commented out.
--
-- insert into public.device_heartbeats (
--   device_id,
--   device_label,
--   device_role,
--   heartbeat_reason,
--   uptime_seconds,
--   wifi_connected,
--   wifi_rssi,
--   free_heap,
--   min_free_heap,
--   currently_watering,
--   details
-- )
-- values (
--   '318fab98-89ad-4f36-9100-3134a04e0be5',
--   'Bench Prototype Unit',
--   'bench',
--   'manual_sql_validation',
--   123,
--   true,
--   -45,
--   235028,
--   186292,
--   false,
--   '{"phase":"6J.3","source":"manual_validation"}'::jsonb
-- );
--
-- select *
-- from public.device_heartbeats
-- order by heartbeat_at desc
-- limit 5;
