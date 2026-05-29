# ADR 0017: Gen2 Measurement Batch Storage

## Status

Accepted

## Date

2026-05-28

## Context

Phase 7D originally validated a long/narrow Gen2 measurement storage shape with one database row per individual measurement. That proved firmware-to-Supabase measurement storage, but it is not the preferred long-term Gen2 storage architecture.

MBG may eventually have many sensors per device, including multiple light, moisture, temperature, humidity, pressure, reservoir, flow, pump-current, and future measurements. Treating each individual reading as the primary storage event can create excessive row counts and make the base database harder to inspect.

Gen2 local firmware already emits a complete `/measurements` package with a device identity, sample timestamp, and `records[]` array. That package is the device sample event and should be preserved directly.

## Decision

Gen2 raw measurement storage uses one row per complete device measurement package or batch.

The base table is append-only evidence. It stores the complete `records[]` array as `jsonb`, preserving the exact device sample event: this unit reported this package at this time.

Batch rows include batch-level provenance fields such as device role, firmware/build identifiers when available, source endpoint, and batch details.

`measured_at` uses fixed sanity bounds to reject obviously bad device timestamps.

Flattened measurement rows are derived through a SQL view for charting, diagnostics, filtering, unit conversion, and future control-quality evaluation. The view provides chart-friendly query shapes without treating each individual reading as the primary storage event.

Per-measurement metadata remains inside each record in `records[]`, including:

- `valid`
- `quality`
- `reason`
- `control_eligible`
- `details`

Supabase remains telemetry/history/diagnostics storage only. This ADR introduces no Supabase command/control and no Remote Water Now behavior.

JSONB/GIN indexing on `records` is deferred until real Phase 7E/7F query patterns prove it is needed.

Unique physical sensor tracking is deferred to a future sensor inventory / device sensor assignment model. `sensor_events` remains the operational note log and is not the source of truth for defining which physical sensor is installed where.

## Consequences

The raw Gen2 measurement table is easier to inspect because each row corresponds to one complete device report.

Charting and analysis should use the flattened SQL view later, rather than requiring firmware to emit one database row per individual measurement.

`SensorLogRow` remains unchanged.

`sensor_logs` remains unchanged.

No watering behavior is changed.

Hosted read-only measurement display remains deferred to a later phase.
