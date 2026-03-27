# My Balcony Gardener

My Balcony Gardener is an ESP32-based balcony irrigation project with a React/Vite dashboard in [`mbg_dashboard`](./mbg_dashboard).

## Current State

- Firmware compiles on BJ3 with PlatformIO.
- Frontend lints, builds, runs, and loads on BJ3.
- The local ESP32 fallback path is the active working path today.
- Current sensor values display in the UI.
- Manual Water Now works from the local site.
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

## Next Safe Priorities

- Restore the deferred history/graph path without breaking the current local fallback path
- Keep the frontend and firmware contract aligned with the current payload shape
- Continue small, reviewable cleanup only after the active local path remains stable
