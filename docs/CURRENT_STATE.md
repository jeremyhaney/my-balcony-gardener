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

- Frontend currently lints, builds, runs, and loads on BJ3.
- Firmware currently compiles on BJ3.
- ESP32 is reachable locally.
- The UI currently shows live sensor values through the local fallback path.
- Manual Water Now currently works from the local site.

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

1. Restore graph/history against the deferred data path without regressing the working local path.
2. Reintroduce deferred Supabase-backed behavior in small, testable slices.
3. Update older docs only after implementation behavior is stable again.

## Maintenance Rule

If the current working path changes, update this file and the root [`README.md`](../README.md) in the same pass. If the approved architecture changes, add or update an ADR and update [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) as part of that same change.
