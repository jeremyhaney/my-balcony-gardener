# ADR 0013: Multi-Unit Visibility and Local Control Target Safety

- Status: Accepted
- Date: 2026-05-18

## Context

- Local dashboard confusion occurred when the browser was expected to control the installed balcony unit but the bench relay fired.
- Hosted/history graph selection and local live/control target selection are separate concerns.
- More than one known ESP32 now exists: installed controller, bench prototype, and Balcony Sensor Scout 01.

## Decision

- Add a hosted-safe frontend device registry for friendly names, device IDs, roles, and descriptions.
- Keep local IP and manual-action metadata in local-only control target metadata.
- Hosted/history device selection remains read-only.
- Local/default dashboard provides a Local Control Target selector.
- Manual action requires the selected target identity to match the live `/logs` `device_id`.
- The installed controller may show Water Now when verified.
- The bench unit may show a relay-test action when verified, but must not use plant-watering wording.
- The sensor scout has no manual relay or pump command authority.
- Hosted-readonly mode must not bundle local control targets, local IPs, `LiveStats`, `/logs`, `/water-now`, or Water Now.
- Supabase remains telemetry/history only, not command/control.
- Supabase `sensor_logs` RLS policy was updated to allow scout01 telemetry inserts.
- Future Supabase `device_registry` / table-driven allowlist is deferred.

## Consequences

- One local Vite site can switch between known units.
- History Device and Local Control Target are visibly distinct.
- The user is protected from thinking they are watering the balcony unit while actually targeting bench or scout hardware.
- Adding future units is easier in the frontend registry but still requires intentional provisioning and RLS updates.
- No firmware, `SensorLogRow`, Supabase schema, watering duration, threshold, cooldown, or sensor logic changes are made.
