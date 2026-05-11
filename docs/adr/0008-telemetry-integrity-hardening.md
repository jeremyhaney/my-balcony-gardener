# ADR 0008: Telemetry Integrity Hardening

- Status: Accepted

- Date: 2026-05-11

## Context

Phase 5F hardens telemetry continuity when DHT temperature/humidity reads fail temporarily. Watering decisions must remain local to the ESP32 and must not depend on Supabase or cached moisture values.

## Decision

- Use last-known-good fallback only for DHT temperature/humidity.
- Do not cache soil moisture for watering decisions.
- Keep soil moisture fresh-only because it controls automatic watering.
- Preserve immediate watering-start and watering-completion telemetry rows when DHT fresh reads fail and cached DHT values exist.
- Preserve the canonical `SensorLogRow` shape with top-level `device_id`, `timestamp`, and nested `data`.
- Do not add retry queues, schema changes, command/control, or frontend behavior in Phase 5F.

## Consequences

- Important watering audit rows are less likely to be lost due to temporary DHT read failures.
- Telemetry may show repeated temperature/humidity values during DHT failure.
- Moisture-based watering decisions remain based on fresh sensor reads only.
- Supabase remains telemetry/history only and is not command/control.
- Longer-term anomaly detection and sensor-health work remains deferred.
