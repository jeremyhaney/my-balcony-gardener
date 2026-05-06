# My Balcony Gardener

My Balcony Gardener is an ESP32-based balcony irrigation project with a React/Vite dashboard in [`mbg_dashboard`](./mbg_dashboard).

## Current State

- Firmware compiles on BJ3 with PlatformIO.
- Frontend lints, builds, runs, and loads on BJ3.
- The local ESP32 fallback path is the active working path today.
- ESP32 is reachable locally at `10.0.0.200`.
- `GET /logs` works from BJ3, phone, and other devices on the local network when the ESP32 is powered independently from USB power.
- Current sensor values display in the UI.
- Manual Water Now works from the local site.
- MVP v1.0 bench test passed.
- MVP v1.0 balcony field commissioning test passed.
- MVP v1.0 physical install is complete.
- Relay-controlled pump activation works from Manual Water Now.
- Moisture-triggered pump behavior was confirmed during field testing.
- Supabase-backed graph/history is intentionally deferred for a later pass.

## Authoritative Repo Areas

- Firmware: [`platformio.ini`](./platformio.ini), [`src`](./src), [`include`](./include)
- Frontend: [`mbg_dashboard`](./mbg_dashboard)
- Stable architecture lock: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md)
- Architecture decisions: [`docs/adr`](./docs/adr)

## Local Working Path

1. The ESP32 firmware runs locally on the device and exposes the local endpoints used by the dashboard.
2. The React/Vite frontend in [`mbg_dashboard`](./mbg_dashboard) is the active UI.
3. The dashboard currently uses the working local ESP32 path for live sensor values and manual watering.
4. Supabase history/graph restoration is deferred and is not part of the current working baseline.

## Common Commands

### Firmware

```bash
pio run
pio run -t upload
```

### Frontend

```bash
cd mbg_dashboard
npm install
npm run lint
npm run build
npm run dev
```

## Current Local Endpoints

- `GET /` - health/basic device response
- `GET /logs` - current sensor payload used by the local fallback path
- `POST /water-now` - manual watering trigger

## Deferred For Later

- Supabase-backed history restoration
- Graph/history UI restoration
- Broader architecture cleanup beyond the current working local path

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

## Next Safe Priorities

- Continue supervised local prove-out using the working ESP32 local path
- Restore the deferred history/graph path without breaking the current local fallback path
- Swap same-model sensors after history/graph restoration for comparison, calibration, and Gage R&R-style analysis
- Keep the frontend and firmware contract aligned with the current payload shape
- Continue small, reviewable cleanup only after the active local path remains stable
