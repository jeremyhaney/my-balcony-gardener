-- Phase 7G.1 - Control Validation Read-Only Analysis Queries
--
-- These queries are for calibration/control-validation analysis only.
-- They are not command/control and do not authorize watering behavior changes.
-- Run them from a privileged SQL Editor when owner/admin analysis is needed.
-- Hosted dashboard access remains limited to hosted-safe read paths.
--
-- Suggested parameters to adjust manually before running:
--   start_time  example '2026-06-01T00:00:00Z'
--   end_time    example now()
--   balcony_id  '550e8400-e29b-41d4-a716-446655440000'
--   scout_id    '28f4e6e3-5979-4af4-9753-34e185d8e47e'

-- 1. Latest Gen2 flattened measurements for Balcony01 and Scout01.
-- Safe hosted/read-only source: public.hosted_gen2_measurements.
select
  device_id,
  device_key,
  device_label,
  device_role,
  measured_at,
  firmware_version,
  build_profile,
  record_index,
  sensor_key,
  sensor_type,
  measurement_name,
  measurement_value,
  measurement_unit,
  valid,
  quality,
  reason,
  control_eligible,
  batch_created_at
from public.hosted_gen2_measurements
where device_id in (
  '550e8400-e29b-41d4-a716-446655440000',
  '28f4e6e3-5979-4af4-9753-34e185d8e47e'
)
order by measured_at desc, device_label, record_index
limit 80;

-- 2. Moisture index and raw ADC trend extraction by device over a selected time window.
-- Uses hosted-safe view. Adjust the time bounds before running.
select
  device_id,
  device_label,
  device_role,
  measured_at,
  measurement_name,
  measurement_value,
  measurement_unit,
  valid,
  quality,
  reason,
  control_eligible
from public.hosted_gen2_measurements
where device_id in (
  '550e8400-e29b-41d4-a716-446655440000',
  '28f4e6e3-5979-4af4-9753-34e185d8e47e'
)
  and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
  and measured_at < now()
  and measurement_name in ('moisture_index', 'raw_adc')
order by device_label, measured_at, measurement_name;

-- 3. Invalid/degraded/read-failed measurement review.
-- Uses hosted-safe view and keeps quality/reason visible for analysis.
select
  device_id,
  device_label,
  device_role,
  measured_at,
  record_index,
  sensor_key,
  sensor_type,
  measurement_name,
  measurement_value,
  measurement_unit,
  valid,
  quality,
  reason,
  control_eligible
from public.hosted_gen2_measurements
where device_id in (
  '550e8400-e29b-41d4-a716-446655440000',
  '28f4e6e3-5979-4af4-9753-34e185d8e47e'
)
  and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
  and measured_at < now()
  and (
    valid is false
    or coalesce(nullif(lower(quality), ''), 'missing') not in ('good', 'diagnostic', 'ok', 'okay')
    or lower(coalesce(reason, '')) in (
      'read_failed',
      'sensor_missing',
      'not_detected',
      'missing',
      'startup',
      'module_disabled'
    )
  )
order by measured_at desc, device_label, record_index;

-- 4. Startup/settling candidate rows.
-- Analysis-only candidates; this does not imply firmware exclusion.
with ranked_samples as (
  select
    device_id,
    device_label,
    measured_at,
    dense_rank() over (
      partition by device_id
      order by measured_at
    ) as sample_number
  from (
    select distinct
      device_id,
      device_label,
      measured_at
    from public.hosted_gen2_measurements
    where device_id in (
      '550e8400-e29b-41d4-a716-446655440000',
      '28f4e6e3-5979-4af4-9753-34e185d8e47e'
    )
      and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
      and measured_at < now()
  ) samples
)
select
  rows.device_id,
  rows.device_label,
  rows.device_role,
  rows.measured_at,
  ranked_samples.sample_number,
  rows.record_index,
  rows.sensor_key,
  rows.sensor_type,
  rows.measurement_name,
  rows.measurement_value,
  rows.measurement_unit,
  rows.valid,
  rows.quality,
  rows.reason,
  rows.control_eligible
from public.hosted_gen2_measurements rows
join ranked_samples
  on ranked_samples.device_id = rows.device_id
  and ranked_samples.measured_at = rows.measured_at
where ranked_samples.sample_number <= 3
  or rows.valid is false
  or lower(coalesce(rows.reason, '')) in (
    'read_failed',
    'sensor_missing',
    'not_detected',
    'startup'
  )
order by rows.device_label, rows.measured_at, rows.record_index;

-- 5. Control-eligible moisture rows for Balcony01 only.
-- Balcony01 moisture_index is local firmware evidence only, not Supabase control.
select
  device_id,
  device_label,
  measured_at,
  measurement_name,
  measurement_value as moisture_index,
  measurement_unit,
  valid,
  quality,
  reason,
  control_eligible,
  batch_created_at
from public.hosted_gen2_measurements
where device_id = '550e8400-e29b-41d4-a716-446655440000'
  and measurement_name = 'moisture_index'
  and control_eligible is true
  and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
  and measured_at < now()
order by measured_at;

-- 6. Scout01 comparison rows.
-- Scout01 is a non-watering sensor-scout; its rows are not control eligible.
select
  device_id,
  device_label,
  device_role,
  measured_at,
  sensor_key,
  sensor_type,
  measurement_name,
  measurement_value,
  measurement_unit,
  valid,
  quality,
  reason,
  control_eligible
from public.hosted_gen2_measurements
where device_id = '28f4e6e3-5979-4af4-9753-34e185d8e47e'
  and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
  and measured_at < now()
  and measurement_name in (
    'moisture_index',
    'raw_adc',
    'air_temperature',
    'relative_humidity',
    'barometric_pressure',
    'temperature'
  )
order by measured_at, measurement_name;

-- 7. Measurement batch summary by device.
-- Uses hosted-safe view and unique measured_at samples.
with samples as (
  select distinct
    device_id,
    device_label,
    measured_at
  from public.hosted_gen2_measurements
  where device_id in (
    '550e8400-e29b-41d4-a716-446655440000',
    '28f4e6e3-5979-4af4-9753-34e185d8e47e'
  )
    and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
    and measured_at < now()
),
sample_gaps as (
  select
    device_id,
    device_label,
    measured_at,
    measured_at - lag(measured_at) over (
      partition by device_id
      order by measured_at
    ) as gap_since_previous
  from samples
)
select
  device_id,
  device_label,
  count(*) as sample_count,
  min(measured_at) as first_measured_at,
  max(measured_at) as latest_measured_at,
  max(gap_since_previous) as largest_gap
from sample_gaps
group by device_id, device_label
order by device_label;

-- Owner/admin analysis option:
-- public.sensor_measurements_flat exposes details and batch_details for deeper analysis.
-- Referencing it here does not imply anon access or frontend access.
select
  device_id,
  measured_at,
  device_role,
  firmware_version,
  build_profile,
  record_index,
  sensor_key,
  sensor_type,
  measurement_name,
  measurement_value,
  measurement_unit,
  valid,
  quality,
  reason,
  control_eligible,
  details,
  batch_details,
  batch_created_at
from public.sensor_measurements_flat
where device_id in (
  '550e8400-e29b-41d4-a716-446655440000',
  '28f4e6e3-5979-4af4-9753-34e185d8e47e'
)
  and measured_at >= '2026-06-01T00:00:00Z'::timestamptz
  and measured_at < now()
  and measurement_name in ('moisture_index', 'raw_adc')
order by device_id, measured_at, record_index;

-- 8. Watering event context from sensor_logs if available.
-- sensor_logs remains telemetry/history evidence, not command/control.
select
  device_id,
  timestamp,
  data ->> 'watering' as watering,
  data ->> 'lastWateredTime' as last_watered_time,
  data ->> 'lastWateringDuration' as last_watering_duration,
  data ->> 'moisture' as moisture_index,
  data ->> 'soilRawAdc' as soil_raw_adc
from public.sensor_logs
where device_id = '550e8400-e29b-41d4-a716-446655440000'
  and timestamp >= '2026-06-01T00:00:00Z'::timestamptz
  and timestamp < now()
  and (
    data ->> 'watering' = 'true'
    or nullif(data ->> 'lastWateringDuration', '') is not null
  )
order by timestamp;

-- 9. Manual operational context from sensor_events if available.
-- Use event rows as human context for rain, watering, calibration notes,
-- sensor movement, basket changes, and experiment markers.
select
  *
from public.sensor_events
where event_timestamp >= '2026-06-01T00:00:00Z'::timestamptz
  and event_timestamp < now()
  and (
    device_id in (
      '550e8400-e29b-41d4-a716-446655440000',
      '28f4e6e3-5979-4af4-9753-34e185d8e47e'
    )
    or device_id is null
  )
order by event_timestamp;

-- 10. Reminder notes:
-- - These are read-only analysis queries.
-- - Supabase remains telemetry/history/diagnostics storage only.
-- - Hosted dashboard remains read-only.
-- - Local ESP32 firmware owns watering decisions and pump shutoff.
-- - Do not treat hosted rows, sensor_logs rows, or sensor_events rows as command/control.
