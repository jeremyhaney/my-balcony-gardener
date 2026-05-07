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
5. The ESP32 also posts telemetry directly to Supabase `sensor_logs` for history storage.
6. Supabase-backed history remains a separate read path in the frontend and must not replace the local live/control path.
7. Supabase `sensor_events` is a separate manual operational event log for physical or system changes that help interpret telemetry.
8. `sensor_events` is not the live/current path, not command/control, and not a replacement for `sensor_logs` telemetry history.

## Approved Frontend Boundary For Deferred Restoration

- Local live path remains separate from deferred history/graph restoration work.
- Local live/control path remains separate from the Supabase history/read path after current logging restoration.
- The live path must continue to own:
  - current sensor value display
  - local ESP32 fallback reads
  - Manual Water Now behavior
- Supabase history must use a separate read path and must not introduce Supabase command/control.
- Manual operational events may be recorded separately in Supabase `sensor_events`, but this does not change live/control ownership or the telemetry contract.
- Supabase timestamps for `sensor_logs` must be written by firmware as UTC ISO-8601 values so browser-local rendering stays correct.
- The Sensor History graph may auto-refresh from Supabase without altering the live/control ownership boundary.
- The shared sensor log contract remains centralized in [`mbg_dashboard/src/types`](../mbg_dashboard/src/types).
- The first restoration slice must not introduce package extraction or a broad frontend refactor.

## Canonical Sensor Log Contract

The canonical sensor log contract is authoritative across frontend code, firmware payload handling, and Supabase history work.

```ts
type SensorLogRow = {
  id?: string
  device_id: string
  timestamp: string
  data: {
    temperature: number
    humidity: number
    moisture: number
    watering: boolean
    lastWateredTime: string
    lastWateringDuration: number
  }
}
```

- The shared frontend definition in [`mbg_dashboard/src/types/sensorLog.ts`](../mbg_dashboard/src/types/sensorLog.ts) is the canonical in-repo contract.
- In Supabase, `data` is stored as `jsonb`.
- For the `jsonb` object, key order is not significant.
- Field names and value types are significant and must not drift.
- `sensor_events` is intentionally separate and must not be used to reshape or extend the canonical `SensorLogRow`.
- Contract changes require:
  - a new ADR
  - coordinated frontend updates
  - coordinated firmware updates
  - coordinated database/query updates

## Manual Operational Event Log

Supabase `public.sensor_events` is approved as a separate manual operational event/history table for changes that affect how telemetry should be interpreted.

- It is used for operational notes such as sensor swaps, moves, cleaning, calibration, reference readings, maintenance, plant moves, container changes, and experiment markers.
- It does not store telemetry payloads and does not replace `sensor_logs`.
- It does not change firmware ownership of local live values, Manual Water Now, or watering behavior.
- It does not introduce Supabase command/control.
- MVP entry is manual through the Supabase Table Editor or SQL Editor under RLS.

## Local And Deployment Baseline

- BJ3 is the current working development machine baseline.
- Frontend development and build commands are run from [`mbg_dashboard`](../mbg_dashboard).
- Firmware build and upload commands are run from the repo root PlatformIO project.
- The local ESP32 fallback path is the approved baseline until a later ADR changes it.

## Deferred Architecture Areas

- Logging cadence changes after current telemetry logging is proven
- Any shift away from the current local fallback baseline
- Any broader deployment architecture changes

## Change Control Rule

- Update [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md) when the operational state changes.
- Add a new ADR in [`docs/adr`](./adr) before changing the approved architecture, ownership boundaries, or runtime/data flow described here.
