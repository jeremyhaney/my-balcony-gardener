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
- Phase 6E hosted read-only device/window controls are validated on the custom domain.
- Phase 6F hosted read-only Device Status / telemetry quality panel is validated locally, on Cloudflare preview, and on the hosted custom domain.
- Phase 6G bench profile built successfully.
- Phase 6G bench profile flashed successfully.
- Phase 6G bench unit booted successfully on normal Wi-Fi.
- Phase 6G bench unit served valid `/logs`.
- Phase 6G offline/no-Wi-Fi behavior is code-hardened and static-inspected, but not physically no-Wi-Fi tested in this phase because Wi-Fi/router disruption was not available.
- Firmware can continue local automatic watering logic when Wi-Fi, internet, or Supabase is unavailable.
- Firmware no longer restarts solely because Wi-Fi is unavailable during boot.
- Pump shutoff is prioritized before client/server/network/telemetry work.
- `soilRawAdc` exists in local `/logs` and Supabase telemetry for diagnostic visibility.
- Phase 6H raw soil ADC visibility was validated on the bench local `/logs`, local dashboard, and Supabase `sensor_logs.data` paths.
- Moisture remains the existing derived index, not a calibrated soil-moisture percentage.
- Watering behavior did not change.
- Future sensors should move toward a measurement-list/table model before adding more fixed fields.
- Hosted read-only mode renders Sensor History and read-only Device Status from Supabase, supports Device and Window selectors, and does not render `LiveStats`, Water Now, local `/logs`, or local `/water-now`.
- Hosted read-only Device selector supports Installed Balcony Unit (`balcony`, `550e8400-e29b-41d4-a716-446655440000`) and Bench Prototype Unit (`bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`).
- Hosted read-only Window selector supports `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`.
- Hosted read-only URL query state supports links such as `?device=balcony&window=24h` and `?device=bench&window=7d`; invalid values safely fall back to Installed Balcony Unit / `24h`.
- Hosted read-only Supabase history queries filter server-side by selected `device_id` and by selected timestamp lower bound except for `all`.
- Device Status is based on already-fetched Supabase `sensor_logs` rows for the selected device/window.
- Device Status evaluates latest report age, row count, expected row count, coverage, largest gap, broad latest-reading plausibility, and watering history marker count.
- Device Status is informational only; it does not diagnose sensor accuracy, plant condition, watering need, or pump behavior.
- `VITE_MBG_DEVICE_ID` remains the fallback/default hosted device behavior.
- Sensor History chart X-axis labels adapt by selected history window, and chart tooltips show full date/time.
- Hosted read-only production build scan found no `Water Now`, `/water-now`, `/logs`, or `10.0.0.200` strings after the lazy/dynamic import fix.
- Phase 6E hosted-readonly production bundle guardrail scan returned no output for `water-now`, `Water Now`, `/logs`, `Currently Watering`, `LiveStats`, `VITE_ESP32_URL`, or `VITE_WATER_ENDPOINT`.
- Phase 6E custom-domain validation confirmed Garden check-in mode is visible, `LiveStats` and Water Now are hidden, Sensor History is visible, Supabase `sensor_logs` requests are visible, and there are no `/logs`, `/water-now`, or `10.0.0.200` requests.
- Phase 7L.3 hosted-readonly routing is implemented pending validation and review: `/` is a minimal public landing page with an embedded real-data snapshot, `/demo` is the fuller public read-only demo with a dismissible visitor guide and no prominent site-assignment shell, `/mygarden` is the customer `My Garden` dashboard shell without the prominent site-assignment shell, `/app` remains a backward-compatible alias, `/login` opens the landing page with a placeholder login dialog, and `/support` is a temporary read-only support view reachable by direct URL.
- The Phase 7L.3 landing snapshot uses real hosted telemetry from Balcony01 and does not introduce fake telemetry, fake `sensor_logs` rows, or ghost devices.
- Local/default dashboard behavior remains unchanged; Manual Water Now remains available only through the local/default path.
- Remote command/control (Remote Water Now) is not part of MVP.
- Supabase remains read-only for telemetry and history; it is not used for command/control.
- Supabase outages may interrupt hosted history/Device Status freshness, but must not prevent local watering logic.
- Supabase history requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in [`mbg_dashboard/.env.local`](./mbg_dashboard/.env.local).
- Missing Supabase env vars or unavailable Supabase fail gracefully and should not crash the app.
- MVP v1.0 bench test passed.
- MVP v1.0 balcony field commissioning test passed.
- MVP v1.0 physical install is complete.
- Relay-controlled pump activation works from Manual Water Now.
- Moisture-triggered pump behavior was confirmed during field testing.
- Phase 7B Gen2 bench runtime validation is complete.
- `bench-proto-gen2` is the Gen2 bench PlatformIO profile; `bench-prototype` remains the retained Gen1 fallback/reference profile.
- The physical bench ESP32 UUID remains `318fab98-89ad-4f36-9100-3134a04e0be5`, and the physical bench ESP32 is now acting as the Gen2 mule after rewire/flash.
- Gen2 validation uses `/capabilities` and `/measurements`; `/measurements` is authoritative for Gen2 measurement data.
- `/logs` remains a Gen1 compatibility endpoint and is intentionally not registered for `bench-proto-gen2`.
- On `bench-proto-gen2`, `/water-now` remains the simulated production watering endpoint and toggles the GPIO25 bench output through `RELAY_PIN`; no pump is attached.
- Phase 7B Gen2 measurements are local-only; no `SensorLogRow`, Supabase SQL, hosted dashboard, or frontend runtime changes were made.
- Phase 7C Live Measurements Local Frontend MVP is implemented and runtime validated.
- Local/default dashboard mode now includes a local-only `Live Measurements` view.
- `Live Measurements` reads the modular bench endpoints `GET /status`, `GET /capabilities`, and `GET /measurements`.
- `Live Measurements` does not use `/logs`.
- Existing `LiveStats` / `/logs` remains as the Gen1/local compatibility path for now.
- Runtime validation against `bench-proto-gen2` at `10.0.0.192` rendered BME280 `air_temperature`, BME280 `relative_humidity`, BME280 `barometric_pressure`, DS18B20 `temperature`, VEML6030 `ambient_light`, analog soil moisture `moisture_index`, and analog soil moisture `raw_adc`.
- The default `Live Measurements` view is compact and gardener-facing, with advanced technical diagnostics collapsed by default.
- `control_eligible:false` is presented as display/diagnostic only and not controlling watering yet.
- `Water Now` remains available for `bench-proto-gen2` as a simulated production watering action through `/water-now`, with no pump attached.
- Phase 7C hosted-readonly guardrail scan passed: the hosted build did not bundle `LiveMeasurements`, the bench IP, local endpoint strings, `/logs`, or `/water-now`.
- Phase 7C made no firmware, Supabase SQL, `SensorLogRow`, hosted-readonly behavior, watering duration, threshold, cooldown, moisture mapping, automatic watering logic, or `/water-now` firmware semantics changes.
- Phase 7D Gen2 Measurement Batch Storage MVP is runtime validated / complete.
- Gen2 raw measurement storage uses `public.sensor_measurement_batches`; one row equals one complete Gen2 `/measurements` package from one device at one measured time.
- The full Gen2 `records[]` array is stored as `jsonb`; `public.sensor_measurements_flat` is the derived chart/query view that unnests `records[]`.
- Firmware posts one batch object to `/rest/v1/sensor_measurement_batches`.
- Registry-backed RLS uses `public.is_device_telemetry_insert_enabled(device_id)`, with no anon SELECT, UPDATE, or DELETE policies added in Phase 7D.
- Hosted read-only Gen2 measurement display remains deferred to a future frontend phase.
- JSONB/GIN indexing on `records` and unique physical sensor inventory / assignment tracking are deferred.
- `sensor_events` remains an operational note log, not the source of truth for installed physical sensors.
- Phase 7D validation against `bench-proto-gen2` UUID `318fab98-89ad-4f36-9100-3134a04e0be5` succeeded with `record_count = 7`, `device_role = bench`, `source_endpoint = /measurements`, and `batch_details` `{"phase":"7D","source":"firmware","post_cadence_ms":900000}`.
- Phase 7D validated `air_temperature`, `relative_humidity`, `barometric_pressure`, `temperature`, `ambient_light`, `moisture_index`, and `raw_adc`; all current Gen2 records remain `control_eligible:false`.
- Phase 7D made no `SensorLogRow`, `sensor_logs`, Gen1 `/logs`, `/water-now`, hosted-readonly UI, watering behavior, Supabase command/control, or Remote Water Now changes.
- Phase 7E Field Units Gen2 Compatibility Migration is runtime validated / complete and merged to main.
- Phase 7G.0 Field Gen2 Soil Temperature and Scout BME280 Swap is field validated / complete pending commit/documentation closeout.
- Standard Gen2 field-unit pins are GPIO25 relay/pump output, GPIO34 analog soil moisture, GPIO21 I2C SDA, GPIO22 I2C SCL, GPIO26 DHT11 / non-I2C auxiliary digital sensor, and GPIO27 DS18B20 / OneWire soil temperature. GPIO27 is actively used for DS18B20 soil temperature on Scout01 and Balcony01.
- Installed Balcony Unit Gen2 uses UUID `550e8400-e29b-41d4-a716-446655440000`, role `controller`, build profile `balcony-installed-gen2`, and display label `Balcony01`.
- Balcony Sensor Scout 01 Gen2 uses UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, role `sensor-scout`, build profile `balcony-sensor-scout-01`, and display label `Scout01`.
- Bench Prototype Unit uses UUID `318fab98-89ad-4f36-9100-3134a04e0be5` and display label `Prototype01`; bench Gen2 remains a richer prototype/reference profile and was not re-uploaded during final field-unit label/provenance validation.
- `device_label` values are compile-time endpoint readability labels, not user-editable names or database-driven nicknames.
- Field-unit local endpoints now include `device_label`, `firmware_version`, and `build_profile` on `/status`, `/capabilities`, and `/measurements`; installed/scout Gen2 also retain `/logs` temporarily with added top-level identity fields and unchanged nested `data`.
- Gen2 firmware batch posts include top-level `firmware_version` and `build_profile`; `batch_details.phase` is now `7E`, and `batch_details.device_label` identifies the short device label.
- Installed `Balcony01` is watering-capable and has `moisture_index` as the only `control_eligible:true` Gen2 measurement; DHT11 measurements and `raw_adc` are display/diagnostic only.
- Scout `Scout01` has no watering authority; all scout Gen2 measurements are `control_eligible:false`.
- Phase 7G.0 validated Scout01 BME02/BME280 and ST02/DS18B20, Balcony01 DHT01 and ST03/DS18B20, and hosted Gen2 automatic measurement discovery for Soil Temperature and Barometric Pressure without changing watering/control authority.
- Supabase remains telemetry/history/diagnostics storage only. No Supabase command/control or Remote Water Now was introduced, and `/water-now` remains local-only and capability-gated.
- `/water-now` was not called during final Phase 7E field-unit label/provenance validation.
- Known deferred wart: startup Gen2 DHT11 reads may briefly show suspicious values around `32.72°F / 0%`; later reads and `/logs` are plausible, and this does not affect watering control because DHT11 records are not control-eligible.
- A two-device field capture for future watering-response analysis is ongoing and outside the Phase 7E closeout.

- Phase 8B.3 Gen2 `/capabilities` Static Contract Cleanup is COMPLETE / LIVE DEVICE VALIDATED on Balcony02; Phase 8B remains IN PROGRESS, Phase 8B.4 `/status` Nested Diagnostics Contract Cleanup is CURRENT / next, and Phase 8B.5 integrated endpoint closeout remains planned.
- Balcony02 build profile `balcony02-gen2` now returns a static configured-hardware and control-feature manifest from `/capabilities`. The isolated path uses existing compile-time/profile flags for installed state and performs no sensor reads, GPIO reads, I2C or mux scans, detection probes, or provider conversions; existing non-Balcony02 capability behavior is unchanged.
- Live validation at `10.0.0.69` against `Balcony02` (`7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, firmware `phase8b-balcony02-proveout`) confirmed ten ordered capability modules, M04 `installed:false`, L01 `installed:true`, and WL01 as the only `control_role:"watering_interlock"`. Two responses matched after normalizing only `reported_at`.
- All four Gen2 profiles built successfully; only Balcony02 was uploaded. The frozen `/measurements` contract passed regression validation unchanged, `/status` remains unchanged for Phase 8B.4, and no frontend, SQL, Supabase, Cloudflare, hardware, sensor, watering, cadence, threshold, duration, cooldown, relay, button, or interlock behavior changed.

## Authoritative Repo Areas

- Firmware: [`platformio.ini`](./platformio.ini), [`src`](./src), [`include`](./include)
- Frontend: [`mbg_dashboard`](./mbg_dashboard)
- Stable architecture lock: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md)
- Architecture decisions: [`docs/adr`](./docs/adr)

## Local Working Path

1. The ESP32 firmware runs locally on the device and exposes the local endpoints used by the dashboard.
2. The React/Vite frontend in [`mbg_dashboard`](./mbg_dashboard) is the active UI.
3. Gen1/current compatibility path: `LiveStats` polls `/logs` for live sensor values and keeps the existing local/manual behavior.
4. Modular local measurements path: `Live Measurements` reads `/status`, `/capabilities`, and `/measurements` for the modular bench measurement model.
5. Local ESP32 path: live sensor values and Manual Water Now.
6. Supabase read/history path: current and historical Sensor History graph data only.
7. Supabase `sensor_events` is a separate manual operational event table for physical/system changes and is not telemetry storage.
8. Gen2 batch storage path: firmware posts complete `/measurements` packages to `public.sensor_measurement_batches`, and `public.sensor_measurements_flat` derives chart/query rows.
9. Supabase is not the live/current value path and does not replace local ESP32 control.
10. Supabase is not used for remote command/control.
11. Local automatic watering logic and pump shutoff remain firmware-owned when Wi-Fi, internet, or Supabase is unavailable.

## Hosted Read-Only Dashboard

- Cloudflare Pages Production is validated from branch `main`.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- Hosted read-only mode uses `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted read-only builds require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; do not document real values.
- Hosted read-only routing now uses `/` for the public landing page, `/demo` for the public detailed demo, `/mygarden` for the customer `My Garden` dashboard shell, `/app` as a backward-compatible alias, `/login` for a placeholder login dialog, and `/support` for temporary read-only support review by direct URL.
- Cloudflare Pages direct route refreshes are supported by `mbg_dashboard/public/_redirects` with `/* /index.html 200`.
- Hosted read-only builds now expose read-only Device and Window selectors for Supabase Sensor History.
- `VITE_MBG_DEVICE_ID` remains the fallback/default hosted device when no valid `device` query value is present.
- Installed balcony unit currently uses `device_id` `550e8400-e29b-41d4-a716-446655440000` for Supabase history continuity.
- Hosted Device selector currently supports Installed Balcony Unit (`balcony`, `550e8400-e29b-41d4-a716-446655440000`), Bench Prototype Unit (`bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`), and Balcony Sensor Scout 01 (`scout01`, `28f4e6e3-5979-4af4-9753-34e185d8e47e`).
- Hosted Window selector supports `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`.
- Hosted query-string state supports `?device=balcony&window=24h`, `?device=bench&window=7d`, and similar valid combinations.
- Invalid hosted query values safely fall back to Installed Balcony Unit / `24h`.
- Hosted Supabase history reads filter server-side by selected `device_id`.
- Hosted Supabase history reads apply a selected timestamp lower bound except for `all`, which applies no lower timestamp bound.
- Hosted Device Status is a read-only at-a-glance indicator based on the selected device/window history rows.
- Device Status green/yellow/red status is informational and inspectable; details are available from the indicator.
- No additional Supabase query is required for the Device Status panel.
- Supabase `data.watering` is displayed only as watering history markers, not live currently-watering status.
- Firmware build profiles provide the Phase 6C prototype/small-batch bridge for intentional device identity.
- The default firmware build profile is `balcony-installed`.
- The `bench-prototype` firmware profile uses UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Tracked `src/device_identity.h` maps `MBG_DEVICE_ID` to the firmware `DEVICE_ID`.
- Ignored local-only `src/config.h` remains for secrets and is not the repo-owned identity mechanism.
- Phase 6D bench hardware identity validation passed using the explicit PlatformIO `bench-prototype` upload profile.
- Supabase RLS insert policy now allows known provisioned device UUIDs for the installed balcony unit, bench prototype, and scout01.
- The installed balcony unit UUID remains unchanged.
- Future ESP32 units must not reuse the installed unit UUID.
- Friendly names are separate labels, not telemetry identity.
- Hosted read-only mode shows Supabase Sensor History and read-only Device Status and keeps local ESP32 controls unavailable.
- Hosted read-only mode has no Water Now and does not call local ESP32 `/logs` or `/water-now`.
- Local/default dashboard mode supports multi-unit Local Control Target selection for known ESP32 units.
- Known local targets are Installed Balcony Unit (`controller`, `10.0.0.200`), Bench Prototype Unit (`bench`, `10.0.0.192`), and Balcony Sensor Scout 01 (`sensor-scout`, `10.0.0.180`).
- Local/default dashboard mode still renders `LiveStats`, selected-target `/logs` polling, and local manual action controls.
- Local manual action is identity-gated by the selected target and live `/logs` `device_id`; balcony uses Water Now wording, bench uses relay-test wording, and scout has no manual command authority.
- Supabase remains telemetry/history only, not command/control.
- No-Wi-Fi operation is autonomous/headless for now; installer/customer AP or captive-portal provisioning is deferred.

## Common Commands

### Firmware

```bash
# Build only; does not upload firmware
pio run
pio run -e balcony-installed
pio run -e balcony-installed-gen2
pio run -e balcony-sensor-scout-01
pio run -e bench-prototype
pio run -e bench-proto-gen2
```

- `bench-prototype` is retained Gen1 fallback/reference.
- `bench-proto-gen2` is the Gen2 bench profile.
- `balcony-installed-gen2` is the Gen2 installed controller field profile.
- `balcony-sensor-scout-01` is the Gen2 scout field profile.
- Do not upload without an explicit environment and confirmed port.
- Use `/status`, `/capabilities`, and `/measurements` for Gen2 validation.

Firmware upload is intentionally omitted from the common commands; upload only after explicit approval using a specific PlatformIO profile and confirmed port.

### Frontend

```bash
cd mbg_dashboard
npm install
npm run lint
npm run build
npm run dev
```

## Current Local Endpoints

Gen1/current compatibility path:

- `LiveStats`
- `GET /` - health/basic device response
- `GET /logs` - current sensor payload used by the Gen1/current compatibility path
- `POST /water-now` - existing local/manual behavior

Modular local measurements path:

- `Live Measurements`
- `GET /status` - read-only local diagnostics
- `GET /capabilities` - Gen2 configured-hardware and control-feature manifest; Balcony02 uses the validated static contract without hardware reads or scans
- `GET /measurements` - authoritative Gen2 measurement-list payload

- Field-unit Gen2 endpoints include compile-time `device_label`, `firmware_version`, and `build_profile` provenance for quick local inspection.
- Gen2 `/status` and `/capabilities` include top-level `reported_at` for snapshot generation time; `/measurements` includes top-level `measured_at` for measurement package/sample time.
- Installed/scout Gen2 retain `GET /logs` temporarily through `MBG_GEN2_ENABLE_LEGACY_LOGS=1` to protect current local scripts/UI during migration.
- `GET /logs` remains intentionally absent on `bench-proto-gen2`; future frontend work should migrate local Gen2 display to `/measurements`.

## Deferred For Later

- Long-term analytics/statistics such as min/max/avg
- Additional Sensor History UI/statistics polish beyond Phase 6E selectors and chart label/tooltip improvements
- Responsive hosted dashboard polish
- Advanced Sensor Health / Fault Detection
- Additional multi-device read-only UI beyond the current hosted Device selector
- Hosted read-only Gen2 measurement display from `sensor_measurement_batches` / `sensor_measurements_flat`
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
