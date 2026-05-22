# ADR 0015: Supabase Device Registry and Table-Driven Allowlist

- Status: Accepted
- Date: 2026-05-22

## Context

Phase 6B established stable device identity. Phase 6J.0 added multi-unit visibility and local control target safety. Phase 6J.3 added `public.device_heartbeats`, and Phase 6J.4 proved firmware heartbeat inserts through Supabase anon REST/RLS for the bench device.

The current Supabase insert allowlists have been managed as repeated hardcoded UUID lists in RLS policies. That works for a very small set of devices, but it creates drift risk as more devices are provisioned. Known/provisioned devices should have one Supabase-side registry that controls whether a device may insert telemetry and diagnostics evidence.

The registry must not become command/control. Local ESP32 firmware remains the owner of watering decisions and pump shutoff.

## Decision

Add `public.device_registry` as the Supabase provisioned-device registry.

Registry-backed RLS replaces repeated hardcoded UUID allowlists for device inserts:

- `sensor_logs` INSERT is allowed only when the registry says the device is active and telemetry insert is enabled.
- `device_heartbeats` INSERT is allowed only when the registry says the device is active and heartbeat insert is enabled.

Registry flags authorize inserts only. They are not command/control, do not ask firmware to perform actions, and do not grant watering authority.

The MVP registry fields are:

- `device_id`
- `device_key`
- `device_label`
- `device_role`
- `active`
- `telemetry_insert_enabled`
- `heartbeat_insert_enabled`
- `hosted_visible`
- `notes`
- `created_at`
- `updated_at`

Use `SECURITY DEFINER` helper functions for RLS checks rather than requiring broad anon read access to `public.device_registry`.

Base registry anon read is not approved in this phase. If hosted/frontend registry display is needed later, prefer a deliberately limited read-only view with safe columns in a later phase.

Initial registry rows are:

- Installed Balcony Unit: `550e8400-e29b-41d4-a716-446655440000`, key `balcony`, role `controller`
- Bench Prototype Unit: `318fab98-89ad-4f36-9100-3134a04e0be5`, key `bench`, role `bench`
- Balcony Sensor Scout 01: `28f4e6e3-5979-4af4-9753-34e185d8e47e`, key `scout01`, role `sensor-scout`

## Consequences

- Known/provisioned device insert eligibility moves to one Supabase registry table.
- Future device add/remove/disable work can update registry rows instead of editing repeated RLS UUID lists.
- Supabase remains telemetry/history/diagnostics storage only.
- No Remote Water Now is introduced.
- No Supabase command/control is introduced.
- Hosted diagnostics/display remains deferred.
- No firmware, frontend runtime, `SensorLogRow`, `/status`, `/logs`, `/water-now`, or watering behavior changes are made by this ADR.
