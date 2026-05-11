# ADR 0009: Hosted Read-Only Dashboard Boundary

- Status: Accepted
- Date: 2026-05-11

## Context

- Phase 5F completed telemetry integrity hardening.
- The next useful MVP was a hosted dashboard allowing remote viewing without remote control.
- Existing local dashboard owns local ESP32 live/control behavior.
- Supabase `sensor_logs` already provides read-only history.
- Remote Water Now creates avoidable safety/security problems and is not part of MVP.

## Decision

- Add hosted read-only dashboard mode using `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Host through Cloudflare Pages.
- Keep local/default mode unchanged.
- Hosted read-only mode renders Sensor History only and a gardener-facing read-only notice.
- Hosted read-only mode must not render `LiveStats`.
- Hosted read-only mode must not show Water Now.
- Hosted read-only mode must not call local ESP32 endpoints `/logs` or `/water-now`.
- Hosted read-only mode must not bundle local control code in the production artifact.
- Supabase `sensor_logs` remains the read-only data source.
- `VITE_MBG_DEVICE_ID` filters history to one selected device for Phase 6A.
- Multi-device UI is deferred.
- Supabase command/control remains prohibited.

## Consequences

- A user can remotely view near-current/history data for one configured device.
- Local supervised watering remains available only through the local dashboard path.
- The hosted dashboard can be shared without exposing pump control.
- Cloudflare Pages build variables must be configured for Preview and Production.
- Production deployment follows merge to `main`.
- Custom domain setup is a separate follow-up after Production validation.
- Future multi-device support should use explicit UI/config work, not a shared busy graph and not command/control.
