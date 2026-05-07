# ADR 0004: Current Supabase Logging

- Status: Accepted
- Date: 2026-05-07

## Context

The approved live/control baseline remains the local ESP32 path for current sensor values and Manual Water Now. Phase 4 restored the frontend Sensor History graph as a separate read-only Supabase path, but current ESP32 telemetry writes still needed to be confirmed or restored.

The project also needed a timestamp format that would not cause Supabase or the browser to reinterpret local ESP32 time incorrectly. At the same time, existing local `/logs` behavior and `lastWateredTime` display behavior needed to remain unchanged.

Additional near-term work is already identified but not yet approved for this phase:

- a separate `sensor_events` table for physical changes, calibration notes, maintenance events, and experiment notes
- logging cadence changes after current telemetry writes are proven

## Decision

- Keep local ESP32 `/logs` and `/water-now` as the live/control path.
- Restore ESP32-to-Supabase writes for current telemetry logging.
- Store Supabase `sensor_logs.timestamp` values in UTC ISO-8601 format from firmware.
- Keep the canonical `SensorLogRow` shape with top-level `device_id`, `timestamp`, and nested `data`.
- Use Supabase only as the frontend history/read path.
- Allow the Sensor History graph to auto-refresh from Supabase without changing live/control ownership.
- Do not introduce Supabase command/control.
- Keep `sensor_events` work and cadence changes for later phases.

## Consequences

- The local ESP32 path remains the source of truth for live/current values and Manual Water Now.
- Current telemetry is now recorded in Supabase `sensor_logs` without merging the local live/control path and the history/read path.
- UTC timestamps in Supabase can be rendered by the browser in local time without ambiguous timezone shifts.
- The canonical nested payload contract remains locked across firmware, frontend, and Supabase history usage.
- Phase 5B and Phase 5C remain intentionally deferred until after current telemetry logging has been validated.
