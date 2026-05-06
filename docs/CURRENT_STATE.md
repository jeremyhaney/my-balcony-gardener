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
- The UI shows live sensor values through the local ESP32 fallback path.
- Manual Water Now works from the local site.
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
- After Supabase history/graph restoration, the installed sensors will be swapped with same-model spares for data collection, comparison, analysis, and calibration/Gage R&R-style evaluation.
- Displayed moisture readings should currently be treated as a relative sensor index, not true volumetric soil moisture.
- Observed moisture sensor reference readings:
  - Air-dry / wiped sensor: mostly `23%`, lowest observed `22%`
  - Tap-water reference: mostly `93%`, highest observed `94%`
  - Moist soil after repeated watering tests: approximately `82%`
- No moisture scaling, compensation, threshold, or pump-duration change has been made based on these observations.

## Deferred Items

- Supabase-backed graph/history restoration
- Supabase-first runtime restoration beyond the current local fallback path
- Any firmware behavior changes
- Any frontend behavior changes unrelated to the deferred path restoration

## Current Guardrails

- Do not break the local ESP32 fallback path while restoring deferred features.
- Do not change firmware or frontend runtime behavior unless the pass explicitly requires it.
- Keep repo changes small, reviewable, and anchored to the working BJ3 baseline.

## Safe Next Priorities

1. Continue supervised local prove-out using the working ESP32 local path.
2. Restore graph/history against the deferred Supabase data path without regressing the working local path.
3. Swap same-model sensors after history/graph restoration for comparison, calibration, and Gage R&R-style analysis.
4. Reintroduce deferred Supabase-backed behavior in small, testable slices.
5. Update older docs only after implementation behavior is stable again.

## Maintenance Rule

If the current working path changes, update this file and the root [`README.md`](../README.md) in the same pass. If the approved architecture changes, add or update an ADR and update [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) as part of that same change.
