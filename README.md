# My Balcony Gardener

My Balcony Gardener is an ESP32-based balcony irrigation project with a React/Vite dashboard in [`mbg_dashboard`](./mbg_dashboard).

## Current State

- Firmware compiles on BJ3 with PlatformIO.
- Frontend lints, builds, runs, and loads on BJ3.
- The local ESP32 path is the active live/control working path today.
- ESP32 is reachable locally at `10.0.0.200`.
- `GET /logs` works from BJ3, phone, and other devices on the local network when the ESP32 is powered independently from USB power.
- Local ESP32 live sensor values display in the UI.
- Manual Water Now works from the local site.
- ESP32 now posts current telemetry directly to Supabase `sensor_logs`.
- Supabase `sensor_logs` uses the canonical `SensorLogRow` shape with top-level `device_id`, `timestamp`, and nested `data`.
- Supabase stores firmware timestamps as UTC ISO-8601 values.
- Read-only Supabase-backed Sensor History / graph display is restored, auto-refreshes every 10 seconds, and displays watering-start event markers.
- Supabase `sensor_events` is validated as a separate manual operational event log for sensor swaps, moves, cleaning, calibration notes, maintenance, and experiment markers.
- ADR 0006 is accepted and locks the Phase 5C watering logic and safety philosophy.
- A `15`-minute automatic watering cooldown guard has been implemented in firmware, uploaded to the ESP32, and field validated.
- Manual Water Now remains a local/supervised testing and hydraulic-prove-out feature and intentionally bypasses the automatic cooldown.
- Manual Water Now can still be run again after a completed manual watering cycle.
- Automatic watering resumes after cooldown if moisture remains below `MOISTURE_THRESHOLD`.
- Phase 5D telemetry logging cadence has been field validated on the feature branch `phase5d-telemetry-logging-cadence`.
- Normal Supabase telemetry now posts on approximately a 15-minute cadence (vs. previous 5 seconds).
- Immediate watering-start and watering-completion telemetry rows post to Supabase outside the normal cadence.
- `lastWateringDuration` is populated upon watering completion.
- Phase 5F telemetry integrity hardening has been compiled, uploaded, and validated on the ESP32.
- During DHT read failure, firmware may use cached last-known-good DHT temperature/humidity for `/logs` and telemetry continuity after at least one good DHT read.
- Soil moisture remains a fresh analog read and is not cached because it controls automatic watering behavior.
- Sensor History chart rows are explicitly sorted chronologically by timestamp before rendering.
- Watering-start rows are displayed as vertical history markers using Supabase `sensor_logs.data.watering = true`.
- Local `/logs` endpoint still provides frequent live readings for the local dashboard.
- Local dashboard updates frequently because the frontend polls the ESP32 `/logs` endpoint directly.
- Phase 6A hosted read-only dashboard was merged to `main`.
- Code commit `a7488ba Add hosted read-only dashboard mode` added the hosted read-only dashboard mode.
- Cloudflare Pages project `my-balcony-gardener` is connected to GitHub, and Production deployment from `main` is validated.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- The custom domain was moved from the obsolete old `mybalconygardener` Cloudflare Pages/Tunnel setup to the current `my-balcony-gardener` Pages project.
- Hosted read-only mode is controlled by `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted read-only mode renders Sensor History from Supabase, filters by `VITE_MBG_DEVICE_ID` when configured, and does not render `LiveStats`, Water Now, local `/logs`, or local `/water-now`.
- Hosted read-only production build scan found no `Water Now`, `/water-now`, `/logs`, or `10.0.0.200` strings after the lazy/dynamic import fix.
- Custom-domain validation confirmed Garden check-in mode is visible, `LiveStats` and Water Now are hidden, Sensor History is visible, Supabase `sensor_logs` requests are visible, and there are no `/logs`, `/water-now`, or `10.0.0.200` requests.
- Local/default dashboard behavior remains unchanged; Manual Water Now remains available only through the local/default path.
- Remote command/control (Remote Water Now) is not part of MVP.
- Supabase remains read-only for telemetry and history; it is not used for command/control.
- Supabase history requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in [`mbg_dashboard/.env.local`](./mbg_dashboard/.env.local).
- Missing Supabase env vars or unavailable Supabase fail gracefully and should not crash the app.
- MVP v1.0 bench test passed.
- MVP v1.0 balcony field commissioning test passed.
- MVP v1.0 physical install is complete.
- Relay-controlled pump activation works from Manual Water Now.
- Moisture-triggered pump behavior was confirmed during field testing.

## Authoritative Repo Areas

- Firmware: [`platformio.ini`](./platformio.ini), [`src`](./src), [`include`](./include)
- Frontend: [`mbg_dashboard`](./mbg_dashboard)
- Stable architecture lock: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md)
- Architecture decisions: [`docs/adr`](./docs/adr)

## Local Working Path

1. The ESP32 firmware runs locally on the device and exposes the local endpoints used by the dashboard.
2. The React/Vite frontend in [`mbg_dashboard`](./mbg_dashboard) is the active UI.
3. Local ESP32 path: live sensor values and Manual Water Now.
4. Supabase read/history path: current and historical Sensor History graph data only.
5. Supabase `sensor_events` is a separate manual operational event table for physical/system changes and is not telemetry storage.
6. Supabase is not the live/current value path and does not replace local ESP32 control.
7. Supabase is not used for remote command/control.

## Hosted Read-Only Dashboard

- Cloudflare Pages Production is validated from branch `main`.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- Hosted read-only mode uses `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted read-only builds require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; do not document real values.
- `VITE_MBG_DEVICE_ID` selects the single displayed device for the Phase 6A MVP.
- Installed balcony unit currently uses `device_id` `550e8400-e29b-41d4-a716-446655440000` for Supabase history continuity.
- Hosted read-only builds use `VITE_MBG_DEVICE_ID` to select that UUID or a future unique device UUID.
- Firmware build profiles provide the Phase 6C prototype/small-batch bridge for intentional device identity.
- The default firmware build profile is `balcony-installed`.
- The `bench-prototype` firmware profile uses UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Tracked `src/device_identity.h` maps `MBG_DEVICE_ID` to the firmware `DEVICE_ID`.
- Ignored local-only `src/config.h` remains for secrets and is not the repo-owned identity mechanism.
- Future ESP32 units must not reuse the installed unit UUID.
- Friendly names are separate labels, not telemetry identity.
- Hosted read-only mode shows Supabase Sensor History only and keeps local ESP32 controls unavailable.
- Local/default dashboard mode still renders `LiveStats`, local `/logs` polling, and local Manual Water Now.
- Supabase remains telemetry/history only, not command/control.

## Common Commands

### Firmware

```bash
# Build only; does not upload firmware
pio run
pio run -e balcony-installed
pio run -e bench-prototype
```

Firmware upload is intentionally omitted from the common commands for Phase 6C; upload only after explicit approval using a specific PlatformIO profile.

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

- Long-term analytics/statistics such as min/max/avg
- Additional Sensor History UI/statistics polish beyond Phase 5E event markers
- Multi-device read-only UI
- Auth/login, settings/provisioning, alerts, and commercial production hardening
- Sensor Calibration / Raw ADC Prove-Out
- Phase 5G - Quiet Hours / Runtime Settings
- Phase 5H - Watering Duration Prove-Out
- Hardware Safety Maturity
- Any future architecture change away from local live control, only by ADR

## MVP v1.0 Field Commissioning Notes

- The v1.0 relay box and ESP32 box are fully buttoned up.
- Heat shrink, grommets, and v1.0 cable/box cleanup are complete.
- The current system is ready for supervised local prove-out and data gathering.
- Sensors remain installed for v1.0 prove-out and local data visibility.
- Read-only Supabase history/graph display is restored, and current ESP32 telemetry is now being written to Supabase for validation/history.
- Supabase `sensor_events` has been manually validated as a separate operational log and does not change firmware, live control, or telemetry cadence.
- Displayed moisture readings should currently be treated as a relative sensor index, not true volumetric soil moisture.
- Observed moisture sensor reference readings:
  - Air-dry / wiped sensor: mostly `23%`, lowest observed `22%`
  - Tap-water reference: mostly `93%`, highest observed `94%`
  - Moist soil after repeated watering tests: approximately `82%`
- `MOISTURE_THRESHOLD` was lowered from `50` to `35` for MVP installed-system safety before sensor calibration.
- No moisture scaling, compensation, or pump-duration change has been made based on these observations.
- Normal Supabase telemetry cadence is now approximately `15` minutes, with immediate watering event rows outside that cadence.
- Automatic watering remains fixed-duration batch watering at `15000` ms / `15` seconds, with a field-validated `15`-minute cooldown guard between automatic cycles.
- Manual Water Now remains local/supervised and is intentionally not blocked by the automatic cooldown.
- Manual Water Now and approximately `15`-second pump shutoff remain validated after Phase 5F.
- Soil moisture display/control remains a derived index from `analogRead(SOIL_PIN)`, not a proven calibrated soil-moisture percentage.
- Quiet hours are accepted as a future requirement but are not implemented yet.
- Dry-run protection, leak/failure detection, reservoir-level sensing, flow sensing, and pump-current sensing remain deferred hardware/safety work.

## Next Safe Priorities

- Continue supervised local prove-out using the working ESP32 local path
- Preserve the local live/control path and the separate Supabase history/read path
- Use `sensor_events` only for manual operational context that helps interpret telemetry without changing `sensor_logs`
- Preserve validated Supabase logging and browser-local timestamp display while keeping the live/control path local
- Sensor Calibration / Raw ADC Prove-Out
- Phase 5G - Quiet Hours / Runtime Settings
- Phase 5H - Watering Duration Prove-Out while keeping current watering at `15` seconds and comparing `30` / `45` / `60` seconds only under appropriate dry-enough conditions
- Keep the frontend and firmware contract aligned with the current payload shape
- Continue small, reviewable cleanup only after the active local path remains stable
