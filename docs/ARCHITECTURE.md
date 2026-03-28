# Architecture Lock

This document is the stable architecture authority for the repo. Changes to the approved architecture require a new ADR in [`docs/adr`](./adr).

## Authoritative Repo Ownership

- Firmware project: [`platformio.ini`](../platformio.ini), [`src`](../src), [`include`](../include), [`lib`](../lib)
- Frontend project: [`mbg_dashboard`](../mbg_dashboard)
- Stable architecture docs: this file plus [`docs/adr`](./adr)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)

## Active Components

- ESP32 firmware
  - Reads sensors
  - Exposes local device endpoints
  - Controls watering behavior already implemented in firmware
- React/Vite dashboard
  - Runs from [`mbg_dashboard`](../mbg_dashboard)
  - Displays current sensor values
  - Triggers Manual Water Now from the local site

## Approved Runtime And Data Flow

1. The ESP32 is reachable on the local network.
2. The dashboard runs locally from [`mbg_dashboard`](../mbg_dashboard).
3. The current approved working path for live values and manual watering is the local ESP32 fallback path.
4. The active local endpoints used by the current baseline are:
   - `GET /`
   - `GET /logs`
   - `POST /water-now`

## Approved Frontend Boundary For Deferred Restoration

- Local live path remains separate from deferred history/graph restoration work.
- The live path must continue to own:
  - current sensor value display
  - local ESP32 fallback reads
  - Manual Water Now behavior
- Deferred history/graph restoration must use a separate read-only data path in its first pass.
- The shared sensor log contract remains centralized in [`mbg_dashboard/src/types`](../mbg_dashboard/src/types).
- The first restoration slice must not introduce package extraction or a broad frontend refactor.

## Local And Deployment Baseline

- BJ3 is the current working development machine baseline.
- Frontend development and build commands are run from [`mbg_dashboard`](../mbg_dashboard).
- Firmware build and upload commands are run from the repo root PlatformIO project.
- The local ESP32 fallback path is the approved baseline until a later ADR changes it.

## Deferred Architecture Areas

- Supabase-backed history restoration
- Graph/history UI restoration
- Any shift away from the current local fallback baseline
- Any broader deployment architecture changes

## Change Control Rule

- Update [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md) when the operational state changes.
- Add a new ADR in [`docs/adr`](./adr) before changing the approved architecture, ownership boundaries, or runtime/data flow described here.
