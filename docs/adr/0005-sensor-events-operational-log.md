# ADR 0005: Sensor Events Operational Log

- Status: Accepted
- Date: 2026-05-07

## Context

Phase 5A restored current ESP32-to-Supabase telemetry logging while preserving the approved local ESP32 live/control baseline for current values and Manual Water Now.

Operational events such as sensor swaps, sensor moves, sensor cleaning, reference readings, maintenance, and experiment markers also need a durable record so later telemetry can be interpreted correctly.

Those notes should not be stuffed into `sensor_logs` rows. The canonical `SensorLogRow` contract must remain unchanged.

## Decision

- Add `public.sensor_events` as a separate manual operational event log.
- Use this validated core schema:

```sql
create table public.sensor_events (
  id uuid primary key default gen_random_uuid(),
  event_timestamp timestamptz not null default now(),
  device_id text null,
  event_type text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  sensor_type text null,
  sensor_id text null,
  previous_sensor_id text null,
  container_id text null,
  location_label text null,
  created_at timestamptz not null default now(),
  changed_by text not null default 'Jeremy'
);
```

- The validated `event_type` values are:
  - `sensor_swap`
  - `sensor_move`
  - `sensor_cleaning`
  - `sensor_calibration`
  - `reference_reading`
  - `maintenance`
  - `plant_move`
  - `container_change`
  - `experiment_start`
  - `experiment_stop`
  - `note`
- The validated table also includes:
  - a check constraint limiting `event_type` to the approved values
  - a summary-not-blank check
  - a changed_by-not-blank check
  - indexes for `event_timestamp`, `event_type`, `sensor_type`, `device_id`, `container_id`, and `location_label`
- Enable RLS on `public.sensor_events`.
- Do not create anonymous insert, update, or delete policies for MVP.
- Manual entry through the Supabase Table Editor or SQL Editor is acceptable for MVP.
- Do not add frontend or Admin page behavior in Phase 5B.
- Do not change firmware, watering behavior, local live/control ownership, logging cadence, or `sensor_logs`.

## Consequences

- Sensor interpretation changes now have a separate audit trail.
- `sensor_logs` remains clean telemetry/history.
- Phase 5B does not weaken command/control boundaries.
- Future Admin page work or a read-only frontend display can be evaluated later with intentional RLS policies.
