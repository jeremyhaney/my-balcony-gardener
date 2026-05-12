# ADR 0010: Device Identity and Production Traceability

- Status: Accepted
- Date: 2026-05-11

## Context

- Phase 6A added hosted read-only dashboard filtering by `VITE_MBG_DEVICE_ID`.
- Firmware currently posts `sensor_logs` rows using `DEVICE_ID`.
- Local `/logs` also reports `DEVICE_ID`.
- More than one ESP32 using the same `DEVICE_ID` would contaminate Supabase telemetry history.
- Changing the current installed unit ID now would split existing Supabase history unless old rows were migrated.

## Decision

- Keep current installed balcony UUID `550e8400-e29b-41d4-a716-446655440000` for continuity.
- Treat it as the assigned installed balcony unit ID going forward.
- Future ESP32 units must receive unique, stable, non-null UUIDs before deployment.
- Device UUID is production/provisioning identity; friendly names are field/user labels.
- `sensor_logs.device_id` remains the telemetry identity field.
- `VITE_MBG_DEVICE_ID` selects the hosted read-only dashboard device.
- No schema, `SensorLogRow`, firmware behavior, hosted mode, local control, or UI change in this ADR.

## Consequences

- Existing installed unit history remains continuous.
- Bench/field units must not reuse the installed unit UUID.
- Friendly name changes do not affect telemetry identity.
- Future device registry/provisioning may be added later by separate ADR/scope.
- Supabase remains telemetry/history only, not command/control.
