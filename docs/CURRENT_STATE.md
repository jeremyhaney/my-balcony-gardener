# Current State Freeze

This file is the short operational freeze note for the repo after the Phase 2 hygiene cleanup.

## Operational Role

- This file is the changeable operational snapshot.
- Stable architecture authority lives in [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md).
- Locked architectural decisions live in [`docs/adr`](./adr).

## Authoritative Ownership

- Firmware source of truth: [`platformio.ini`](../platformio.ini), [`src`](../src), [`include`](../include)
- Frontend source of truth: [`mbg_dashboard`](../mbg_dashboard)
- Stable architecture source of truth: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- Operational documentation companion: [`README.md`](../README.md)

## Working Baseline

- Firmware compiles on BJ3.
- Frontend lints, builds, runs, and loads on BJ3.
- ESP32 is reachable locally at `10.0.0.200`.
- `GET /logs` works from BJ3, phone, and other devices on the local network when the ESP32 is powered independently from USB power.
- The UI shows live sensor values through the local ESP32 path.
- Manual Water Now works from the local site.
- ESP32 now posts current telemetry directly to Supabase `sensor_logs`.
- Supabase `sensor_logs` uses the canonical `SensorLogRow` shape with top-level `device_id`, `timestamp`, and nested `data`.
- Supabase stores firmware timestamps as UTC ISO-8601 values so the browser can render them correctly in local time.
- Read-only Supabase-backed Sensor History / graph display is restored and auto-refreshes every 10 seconds.
- The local ESP32 path still owns live/current values.
- Supabase is not used for remote command/control.
- MVP v1.0 bench test passed.
- MVP v1.0 balcony field commissioning test passed.
- MVP v1.0 physical install is complete.
- Relay-controlled pump activation works from Manual Water Now.
- Moisture-triggered pump behavior was confirmed during field testing.

## MVP v1.0 Field Commissioning Notes

- The v1.0 relay box and ESP32 box are fully buttoned up.
- Heat shrink, grommets, and v1.0 cable/box cleanup are complete.
- The current system is ready for supervised local prove-out and data gathering.
- Sensors remain installed for v1.0 prove-out and local data visibility.
- Read-only Supabase history/graph display is restored, and current ESP32 telemetry now posts to Supabase for validation/history.
- Displayed moisture readings should currently be treated as a relative sensor index, not true volumetric soil moisture.
- Observed moisture sensor reference readings:
  - Air-dry / wiped sensor: mostly `23%`, lowest observed `22%`
  - Tap-water reference: mostly `93%`, highest observed `94%`
  - Moist soil after repeated watering tests: approximately `82%`
- `MOISTURE_THRESHOLD` was lowered from `50` to `35` for MVP installed-system safety before sensor calibration.
- No moisture scaling, compensation, or pump-duration change has been made based on these observations.
- Normal deployment cadence has not yet been changed.
- `5`-second logging remains temporary for Phase 5 validation.

## Deferred Items

- Broader deployment polish
- Optional history UI/statistics improvements
- Phase 5B sensor events for physical changes, calibration notes, maintenance events, and experiment notes
- Phase 5C logging cadence changes after current telemetry write validation is complete
- Any Supabase-first or non-local live/control runtime change, only by ADR
- Any firmware behavior changes
- Any frontend behavior changes unrelated to preserving or improving the current baseline

## Current Guardrails

- Do not break the local ESP32 live/control path while preserving the restored read-only history path.
- Do not change firmware or frontend runtime behavior unless the pass explicitly requires it.
- Keep repo changes small, reviewable, and anchored to the working BJ3 baseline.

## Safe Next Priorities

1. Continue supervised local prove-out using the working ESP32 local path.
2. Preserve the separate local live/control path and Supabase history/read path.
3. Preserve validated Supabase logging and browser-local timestamp display before sensor comparison/calibration work.
4. Then proceed with sensor comparison, calibration, and Gage R&R-style analysis.
5. Route any future runtime/data-flow architecture change through an ADR before implementation.

## Maintenance Rule

If the current working path changes, update this file and the root [`README.md`](../README.md) in the same pass. If the approved architecture changes, add or update an ADR and update [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) as part of that same change.
