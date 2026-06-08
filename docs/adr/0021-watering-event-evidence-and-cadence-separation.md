# ADR 0021: Watering Event Evidence and Cadence Separation

- Status: Accepted
- Date: 2026-06-07

## Context

MBG has a customer/support trust gap: physical watering can happen locally without being clearly represented as hosted customer/support event evidence.

The current architecture intentionally separates:

- local ESP32 live/control endpoints and watering behavior
- legacy/current `sensor_logs` telemetry history
- Gen2 `sensor_measurement_batches` measurement package evidence
- `device_heartbeats` diagnostics/latest health evidence
- `sensor_events` manual operational context
- hosted read-only customer/support views

Inspection for Phase 7O.1 found that local firmware tracks watering state, and legacy `sendDataToSupabase()` can write `sensor_logs.data.watering`, `lastWateredTime`, and `lastWateringDuration`. However, immediate manual watering-start and watering-completion telemetry are compiled out for Gen2 paths with `MBG_GEN2_ENABLED`. Balcony01 has a Gen2 watering-capable profile. Protected hosted `/mygarden` and `/support` routes use customer/support Gen2 measurement and diagnostics views rather than the legacy `sensor_logs` watering-marker path.

## Decision

Watering event evidence must be device-originated. The local ESP32 must generate watering event evidence after local state transitions, such as watering start, watering completion, blocked watering, or firmware safety cutoff.

Local ESP32 firmware remains the owner of watering decisions and pump shutoff. Supabase remains evidence storage only. Hosted customer/support views remain read-only.

Use a hybrid model:

- `sensor_logs` remains legacy/current compatibility for environmental telemetry and historical watering markers.
- `sensor_events` remains manual operational context, not canonical device telemetry.
- `sensor_measurement_batches` remains Gen2 measurement package evidence.
- `device_heartbeats` remains diagnostics/health evidence.
- A future dedicated append-only `watering_events` table is the recommended canonical event-evidence path for device-originated watering history.

Future `watering_events` evidence should include event type, trigger source, duration when known, reason, firmware/build provenance, device label, and structured details. It should support events such as `watering_started`, `watering_completed`, `watering_blocked`, and `watering_safety_cutoff`.

Cadences must be separated conceptually:

- local sensor sampling
- local control evaluation
- routine cloud telemetry
- immediate event telemetry
- hosted dashboard refresh

Immediate event telemetry must not depend on a routine 15-minute telemetry cadence. Hosted dashboard refresh reads protected Supabase views only and must not call local ESP32 endpoints.

## Consequences

The design preserves the current local-control safety boundary while making future watering history more trustworthy for customer/support use.

`sensor_logs` compatibility can continue, but customer/support trust should move toward explicit event evidence instead of relying only on environmental telemetry rows.

`sensor_events` manual notes remain useful for human context and backfill explanations, but manual notes should not be confused with device-originated facts.

`sensor_measurement_batches` can remain clean Gen2 measurement package evidence. Event/state transitions do not need to be represented as synthetic sensor measurements.

`device_heartbeats` can continue to provide latest watering diagnostics such as `currently_watering` or last duration, but it is not required to preserve every watering start/completion event.

A later SQL/RLS design must expose watering events through protected customer/support views without granting broad base-table browser access or introducing command/control.

Phase 7O.1 later implemented the dedicated `watering_events` evidence path and validated real Balcony01 Manual Water Now start/completion evidence. This does not change the ADR boundary: Supabase remains evidence storage only, hosted UI remains read-only, and local ESP32 firmware remains the owner of watering decisions and pump shutoff.

Hosted frontend display of `watering_events` remains a later implementation slice.

## Non-Goals

- No Supabase command/control.
- No Remote Water Now.
- No hosted Water Now.
- No hosted local ESP32 calls.
- No app-based watering command.
- No fake telemetry rows.
- No fake watering rows.
- No silent replacement of failed values.
- No changes to pins.
- No changes to sensors.
- No changes to device IDs.
- No changes to watering duration.
- No changes to `MOISTURE_THRESHOLD`.
- No changes to cooldown.
- No changes to `LOG_INTERVAL_MS`.
- No changes to moisture mapping.
- No changes to `control_eligible` behavior.
- No changes to firmware metadata wording.
- No changes to local dashboard Water Now behavior.
- No additional SQL execution or applied Supabase schema change without separate approval.
