# My Balcony Gardener

My Balcony Gardener is an ESP32-based balcony irrigation project with a React/Vite dashboard in [`mbg_dashboard`](./mbg_dashboard).

## Current State

- Firmware compiles on BJ3 with PlatformIO.
- Frontend lints, builds, runs, and loads on BJ3.
- The frontend no longer contains a direct browser-to-device live/control path.
- Phase 8F retires unsupported Gen1 paths, profiles, identities, rows, and schema/access surfaces. Phase 8G.1 revises the hosted observational RMI scale. Phase 8G.2 provides 30/60-second local button programs, immediate second-press cancellation, and reservoir start/cutoff authority while removing dormant automatic moisture-control code/configuration. Phase 8G.3 adds and commissions the new `Prototype02` / `prototype02-gen2` bench simulation unit without restoring Prototype01/Bench01. Phase 8G.3.1 makes environmental cards adaptive fuzzy scales and collapses current `Water Detected` evidence to a compact confirmation while preserving prominent reservoir exceptions. No threshold UI or hosted watering control is added.
- Ordinary and hosted-readonly frontend builds now enter the same hosted Gen2 route shell.
- Balcony02 posts Gen2 measurement batches, device heartbeats, and watering-event evidence to their current Supabase Data API tables; firmware no longer creates `sensor_logs` rows.
- Firmware configuration now stores only the Supabase project root; the resolver constructs exactly `/rest/v1/sensor_measurement_batches`, `/rest/v1/device_heartbeats`, or `/rest/v1/watering_events` and accepts only an optional trailing root slash.
- Supabase stores firmware timestamps as UTC ISO-8601 values.
- Hosted Gen2 measurements, diagnostics, capability evidence, and protected watering-event history refresh every 5 minutes while visible and pause scheduled refreshes while hidden.
- Hosted polling correction diagnosis: Supabase warned that the project was depleting its Disk IO Budget, while the database was only approximately `82 MB` with low storage utilization. Normal B02 and P01 writes matched the intended 15-minute cadence at approximately four measurement batches and four heartbeats per active device per hour.
- Gen2 storage matched ADR 0017: each device batch occupied one physical `sensor_measurement_batches` row; B02's eleven records remained inside that batch and were flattened through the conventional SQL view. The dominant workload was instead repeated 10-second hosted Support View polling across multiple open browser tabs; PostgreSQL statistics showed approximately `197,000` executions of the leading protected Gen2 measurement queries and approximately `185 GB` of cumulative temporary-file activity.
- The correction reduces visible scheduled refresh cycles by `30x`, eliminates scheduled hidden-tab polling, refreshes immediately after visibility return and Device/Window changes, and adds a non-overlapping manual Refresh control with a local completion timestamp. It reduces opportunities for complex queries to spill into temporary files but does not guarantee that an individual query cannot spill.
- Local validation passed for the B02 Gen2 Support View, manual refresh, local timestamp, Device/Window changes, hidden/visible behavior, responsive layout, lint, TypeScript/Vite production build, and `git diff --check`. The current control placement remains temporary pending a broader frontend redesign; Gen1-remnant retirement is operationally closed through Phase 8F.11. This polling correction is not yet claimed committed, pushed, deployed, or production-validated.
- This correction changed no SQL, schema, indexes, retention, firmware, telemetry/heartbeat cadence, device identity, authentication/RLS, watering behavior, or local control authority.
- Supabase `sensor_events` remains an approved isolated manual operational log with no frontend/firmware consumer. Its three Phase 5B sample-validation fixtures were deleted in Phase 8F.10; the table remains present, empty, RLS-enabled, and inaccessible to `anon`, `authenticated`, and `service_role` through table privileges.
- ADR 0025 defines the current watering boundary; ADR 0006 and ADR 0018 remain historical/design records.
- The historical browser and firmware HTTP Manual Water Now paths are retired. A short press/release selects 30 seconds, a hold through 5 seconds then release selects 60 seconds, and a valid press during watering stops immediately. Empty-reservoir start blocking is immediate; active-run WL01 LOW must persist for 20 ms before cutoff so one transient raw read cannot stop a valid cycle. Relay LOW initialization/shutoff and queued watering-event evidence remain local.
- Moisture-triggered automatic watering is absent from the current executable/configuration surface. RMI and all sensor measurements remain observational and cannot start the pump.
- Normal Gen2 measurement batches and heartbeats post on approximately a 15-minute cadence; watering-event evidence remains immediate/best-effort outside that cadence.
- Phase 5D/5F DHT, direct analog-soil, `/logs`, and `sensor_logs` behavior is historical evidence for retired firmware profiles, not current Balcony02 implementation.
- Hosted watering events are presented from the protected Gen2 event-evidence path; the frontend no longer derives watering markers from `sensor_logs`.
- The frontend and supported firmware contain no `/logs` path.
- Phase 6A hosted read-only dashboard was merged to `main`.
- Code commit `a7488ba Add hosted read-only dashboard mode` added the hosted read-only dashboard mode.
- Cloudflare Pages project `my-balcony-gardener` is connected to GitHub, and Production deployment from `main` is validated.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- The custom domain was moved from the obsolete old `mybalconygardener` Cloudflare Pages/Tunnel setup to the current `my-balcony-gardener` Pages project.
- Ordinary and hosted production builds use the same hosted route shell and require no dashboard-mode setting.
- Phase 6E hosted read-only device/window controls are validated on the custom domain.
- Phase 6F hosted read-only Device Status / telemetry quality panel is validated locally, on Cloudflare preview, and on the hosted custom domain.
- Phase 6G bench profile built successfully.
- Phase 6G bench profile flashed successfully.
- Phase 6G bench unit booted successfully on normal Wi-Fi.
- Phase 6G bench unit served valid `/logs`.
- Phase 6G offline/no-Wi-Fi behavior is code-hardened and static-inspected, but not physically no-Wi-Fi tested in this phase because Wi-Fi/router disruption was not available.
- Network failure does not block local button programs, reservoir interlocks, or pump shutoff.
- Firmware no longer restarts solely because Wi-Fi is unavailable during boot.
- Pump shutoff is prioritized before client/server/network/telemetry work.
- Phase 6H historically validated `soilRawAdc` through the then-current bench `/logs`, local dashboard, and Supabase `sensor_logs.data` paths; those firmware/frontend paths are now retired.
- Current SEN0308 moisture measurements remain relative indices, not calibrated soil-moisture percentages, and are not automatic-control inputs.
- Future sensors should move toward a measurement-list/table model before adding more fixed fields.
- The hosted route shell renders Gen2 readings, trends, diagnostics, capability/evidence presentation, and protected watering history without `LiveStats`, Water Now, local `/logs`, local `/water-now`, or frontend `sensor_logs` reads.
- Public Demo is contained to Balcony02; authenticated customer and support device options come from their protected garden-device views.
- Hosted read-only Window selector supports `3h`, `6h`, `12h`, `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`; `24h` remains the default.
- Hosted URL query state keeps valid authorized devices and windows; invalid device values fall back within the route's available device set, and invalid windows fall back to `24h`.
- Hosted Gen2 queries filter server-side by selected `device_id` and selected lower timestamp bound except for `all`.
- Garden Reading Quality is based on already-fetched hosted Gen2 measurement rows for the selected device/window.
- Device Status is informational only; it does not diagnose sensor accuracy, plant condition, watering need, or pump behavior.
- Public Demo selection is fixed by the Balcony02-only source registry; authenticated customer and Support selection remains authorization-derived from hosted views.
- Hosted Gen2 trend axes and tooltips adapt to the selected history window.
- Hosted read-only production build scan found no `Water Now`, `/water-now`, `/logs`, or `10.0.0.200` strings after the lazy/dynamic import fix.
- Phase 6E hosted-readonly production bundle guardrail scan returned no output for `water-now`, `Water Now`, `/logs`, `Currently Watering`, `LiveStats`, `VITE_ESP32_URL`, or `VITE_WATER_ENDPOINT`.
- Phase 6E custom-domain validation confirmed Garden check-in mode is visible, `LiveStats` and Water Now are hidden, Sensor History is visible, Supabase `sensor_logs` requests are visible, and there are no `/logs`, `/water-now`, or `10.0.0.200` requests.
- Phase 7L.3 hosted-readonly routing is implemented pending validation and review: `/` is a minimal public landing page with an embedded real-data snapshot, `/demo` is the fuller public read-only demo with a dismissible visitor guide and no prominent site-assignment shell, `/mygarden` is the customer `My Garden` dashboard shell without the prominent site-assignment shell, `/app` remains a backward-compatible alias, `/login` opens the landing page with a placeholder login dialog, and `/support` is a temporary read-only support view reachable by direct URL.
- As a short-term containment correction, the public landing snapshot and `/demo` temporarily use live Balcony02 (`balcony02`, `7e5bd328-ad68-4389-a71a-fa5cd01b3813`) data. The Demo's single-option Device selector and existing guide are intentionally retained; a deterministic interactive sample Demo is deferred to its own future phase.
- The Phase 7L.3 landing snapshot uses real hosted telemetry from Balcony02 and does not introduce fake telemetry, fake `sensor_logs` rows, or ghost devices.
- The retired local/default dashboard route no longer exists; ordinary builds use the hosted route shell.
- Remote command/control (Remote Water Now) is not part of MVP.
- Supabase remains read-only for telemetry and history; it is not used for command/control.
- Supabase outages may interrupt hosted history/Device Status freshness, but must not prevent local watering logic.
- Hosted Supabase reads require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in [`mbg_dashboard/.env.local`](./mbg_dashboard/.env.local).
- Missing Supabase env vars or unavailable Supabase fail gracefully and should not crash the app.
- MVP v1.0 bench test passed.
- MVP v1.0 balcony field commissioning test passed.
- MVP v1.0 physical install is complete.
- Relay-controlled pump activation works from Manual Water Now.
- Moisture-triggered pump behavior was confirmed during field testing.
- Phase 7B Gen2 bench runtime validation is complete.
- Phase 7B historically used `bench-proto-gen2` as the Gen2 bench profile and retained `bench-prototype` as a Gen1 fallback/reference; Phase 8F.4 retires both selectable profiles after Prototype01/Bench01 retirement.
- The retired physical bench ESP32 used UUID `318fab98-89ad-4f36-9100-3134a04e0be5` and historically acted as the Gen2 mule after rewire/flash.
- Gen2 validation uses `/capabilities` and `/measurements`; `/measurements` is authoritative for Gen2 measurement data.
- Phase 8F.5 removes the Gen1 `/logs` branch and the unregistered HTTP `/water-now` implementation from supported firmware source.
- Historical `bench-proto-gen2` exposed a simulated `/water-now` path; no supported firmware profile or handler now exposes an HTTP watering endpoint.
- Phase 7B Gen2 measurements are local-only; no `SensorLogRow`, Supabase SQL, hosted dashboard, or frontend runtime changes were made.
- Phase 7C's Prototype01-only local measurement panel was historically implemented and runtime validated against the then-current bench contracts.
- Phase 8F.1 retires that unsupported frontend panel, its 5-second Prototype01 endpoint polling, and its exclusively owned pre-current-contract types and request helpers.
- Phase 8F.2 retires `LiveStats`, its selected-target five-second `/logs` polling, browser identity gating, local Water Now action, and exclusively owned local-control target definitions.
- Phase 8F.3 retires the non-hosted route, Demo's redundant legacy history request, frontend `sensor_logs` normalization/presentation, and exclusively owned legacy chart/health code. Firmware posting, tables, rows, policies, profiles, endpoints, and registry entries remain unchanged.
- Phase 8F.4 retires obsolete Balcony01, Scout01, and Prototype01/Bench01 firmware environments and the Balcony01 default selection. Phase 8F.5 then retires unreachable Gen1 implementation, disabled DHT/direct-soil/VEML modules, dynamic capability aggregation, and legacy endpoint code while preserving the Balcony02 static contract and Gen2 ingestion/safety paths.
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
- The Phase 7E field-unit profiles used GPIO25 relay/pump output, GPIO34 analog soil moisture, GPIO21 I2C SDA, GPIO22 I2C SCL, GPIO26 DHT11 / non-I2C auxiliary digital sensor, and GPIO27 DS18B20 / OneWire soil temperature.
- Phase 7E historically used `balcony-installed-gen2` for Balcony01, `balcony-sensor-scout-01` for Scout01, and `bench-proto-gen2` for Prototype01. Phase 8F.4 retires those firmware profiles and identities from executable build configuration.
- `balcony02-gen2` and `prototype02-gen2` are the supported firmware device environments. New numbered devices receive explicit profiles, identities, and UUIDs rather than inheriting retired identity.
- `device_label` values are compile-time endpoint readability labels, not user-editable names or database-driven nicknames.
- Balcony02 local endpoints include `device_label`, `firmware_version`, and `build_profile` on `/status`, `/capabilities`, and `/measurements`.
- Gen2 firmware batch posts include top-level `firmware_version` and `build_profile`; `batch_details.phase` is now `7E`, and `batch_details.device_label` identifies the short device label.
- Historical Balcony01 firmware was watering-capable and used `moisture_index` as its only `control_eligible:true` Gen2 measurement; DHT11 measurements and `raw_adc` were display/diagnostic only.
- Historical Scout01 firmware had no watering authority; all scout Gen2 measurements were `control_eligible:false`.
- Phase 7G.0 validated Scout01 BME02/BME280 and ST02/DS18B20, Balcony01 DHT01 and ST03/DS18B20, and hosted Gen2 automatic measurement discovery for Soil Temperature and Barometric Pressure without changing watering/control authority.
- Supabase remains telemetry/history/diagnostics storage only. No Supabase command/control or Remote Water Now exists, and supported firmware exposes no HTTP watering endpoint.
- `/water-now` was not called during final Phase 7E field-unit label/provenance validation.
- Known deferred wart: startup Gen2 DHT11 reads may briefly show suspicious values around `32.72°F / 0%`; later reads and `/logs` are plausible, and this does not affect watering control because DHT11 records are not control-eligible.
- A two-device field capture for future watering-response analysis is ongoing and outside the Phase 7E closeout.

- Phase 8B is COMPLETE, and Phase 8B.5 Gen2 Endpoint Integration and Closeout is COMPLETE / PRODUCTION VALIDATED in commits `a291be6` and `a8b282e`.
- Phase 8B.5 delivers deterministic Garden Readings, separate Garden Reading Quality and MBG Diagnostics surfaces, ten independent chart series with five family shortcuts, mixed-family unit-driven multi-axis trends, unique stable series colors, deterministic watering-label lanes, and responsive production validation while preserving hosted read-only behavior and local firmware watering authority. Detailed evidence is recorded in [`docs/product/phase8b-gen2-endpoint-contract-cleanup.md`](./docs/product/phase8b-gen2-endpoint-contract-cleanup.md).
- Phase 8B.6 Hosted Short History Window Expansion is COMPLETE / PRODUCTION VALIDATED in commit `9b8eb0f`: `3h`, `6h`, and `12h` were added ahead of the unchanged longer Windows with `24h` preserved as default; short hosted chart ticks use local hour/minute labels, expected package counts are `12`, `24`, and `48`, and Jeremy visually confirmed the deployed ten-option selector, selected 12-hour chart, existing multi-axis presentation, and watering marker on 2026-07-20. Hosted history remains read-only and local firmware retains all watering authority.
- Phase 8C hosted device-capability schema and Balcony02 provisioning are production executed and validated as of 2026-08-14. Supabase now holds nine positive commissioned Balcony02 logical-sensor declarations with eleven expected measurement names; Balcony02 remains Support-visible and customer-hidden, no public capability view or browser write exists, and no frontend or watering authority changed. See the [`Phase 8C production execution evidence`](./docs/product/phase8c-hosted-device-capability-production-execution-evidence.md).
- Balcony02 build profile `balcony02-gen2` returns a static configured-hardware and control-feature manifest from `/capabilities`. The isolated path uses existing compile-time/profile flags for installed state and performs no sensor reads, GPIO reads, I2C or mux scans, detection probes, or provider conversions.
- Live validation at `10.0.0.69` against `Balcony02` (`7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, firmware `phase8b-balcony02-proveout`) confirmed ten ordered capability modules, M04 `installed:false`, L01 `installed:true`, and WL01 as the only `control_role:"watering_interlock"`. Two responses matched after normalizing only `reported_at`.
- Phase 8B.4 firmware `phase8b4-gen2-status-contract` built in all seven environments and was live-validated on Balcony02 plus a status-only Prototype01 check. The nested `/status`, heartbeat, cloud storage, and hosted diagnostics contracts align; all three SEN0562 light sensors are now detected after replacing the bad L01 connector, and full `/measurements` validation confirms SEN0308 M01/M02/M03. This firmware/runtime checkpoint made no further frontend or SQL changes and changed no hosted command/control, hardware assignment, watering policy, cadence, threshold, duration, cooldown, relay, button, interlock, or Gen1 contract behavior.
- Balcony02 passed all three local endpoint contracts; Prototype01 passed status-only validation. Measurement and status post success remain separate, hosted diagnostics remain read-only and exclude local IP/MAC, and three physical-button watering cycles were stored successfully.
- Phase 8B.1 Balcony02 physical build and commissioning completed August 12, 2026. The controller and relay/reservoir enclosures are mounted, dressed, sealed, and presented; all installed sensors produced valid final readings; and WL01, the physical button, relay, actual pump, low-water interlock behavior, and 15-second cutoff were functionally proven. Pump power uses COM/NO fail-off routing and a sealed 16 AWG stranded-copper extension. The authoritative closeout is [`docs/production/MBG_Balcony02_As_Built_and_Commissioning_v1.0_2026-08-12.md`](./docs/production/MBG_Balcony02_As_Built_and_Commissioning_v1.0_2026-08-12.md), with a fillable [`as-built BOM`](./docs/production/MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx).
- The installed sensor map intentionally separates physical markings, stable firmware/telemetry identities, and customer-facing locations. `sen0308_m04` remains intentionally `installed:false`; it is not incomplete installation. Installed soak/reliability, intermittent DS18B20 missing readings, moisture-system evaluation, WL01 elevation, reservoir calibration, hydraulic characterization, plausibility handling, customer-facing metadata, Supabase storage growth, and a later major website redesign remain open follow-on evidence streams. Gen1-remnant review is operationally closed through Phase 8F.11.

## Authoritative Repo Areas

- Firmware: [`platformio.ini`](./platformio.ini), [`src`](./src), [`include`](./include)
- Frontend: [`mbg_dashboard`](./mbg_dashboard)
- Stable architecture lock: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md)
- Architecture decisions: [`docs/adr`](./docs/adr)

## Local Working Path

1. The ESP32 firmware runs locally on the device and exposes `/`, `/status`, `/capabilities`, and `/measurements` for direct read-only inspection.
2. The React/Vite frontend in [`mbg_dashboard`](./mbg_dashboard) is the active UI.
3. Ordinary and hosted-readonly builds render the same hosted Gen2 route shell and do not call device `/logs` or `/water-now` endpoints.
4. Supabase `sensor_events` is a separate manual operational event table for physical/system changes and is not telemetry storage.
5. Gen2 batch storage path: firmware posts complete `/measurements` packages to `public.sensor_measurement_batches`, and `public.sensor_measurements_flat` derives chart/query rows.
6. Supabase is not used for remote command/control.
7. Local button programs and pump shutoff remain firmware-owned when Wi-Fi, internet, or Supabase is unavailable.

## Hosted Read-Only Dashboard

- Cloudflare Pages Production is validated from branch `main`.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- Ordinary and hosted production builds use the same route shell and generated assets.
- Hosted read-only builds require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; do not document real values.
- Hosted read-only routing now uses `/` for the public landing page, `/demo` for the public detailed demo, `/mygarden` for the customer `My Garden` dashboard shell, `/app` as a backward-compatible alias, `/login` for a placeholder login dialog, and `/support` for temporary read-only support review by direct URL.
- Cloudflare Pages direct route refreshes are supported by `mbg_dashboard/public/_redirects` with `/* /index.html 200`.
- Hosted routes expose read-only Device and Window selectors for Gen2 measurements and trends.
- When no valid `device` query value is present, each route falls back to its first available Demo or authorized device.
- Balcony02 is the only source-configured frontend identity and uses `device_id` `7e5bd328-ad68-4389-a71a-fa5cd01b3813`.
- Public Demo currently exposes Balcony02; authenticated customer and support selectors are authorization-derived.
- Hosted Window selector supports `3h`, `6h`, `12h`, `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`; `24h` remains the default.
- Hosted query-string state supports scoped values such as `?device=balcony02&window=24h`; authenticated routes additionally accept devices returned by their protected garden-device views.
- This Demo containment changes no SQL, firmware, polling, authentication, watering, or broader UI behavior. Future Demo ideas include curated Balcony02-derived data, guided interactions, representative watering history, controlled failure examples, no live-device dependency, and a possible separate Live Garden route.
- Invalid hosted query values fall back to the first available authorized/Demo device and `24h`.
- Hosted Gen2 reads filter server-side by selected `device_id` and selected timestamp lower bound except for `all`.
- Garden Reading Quality is a read-only at-a-glance indicator based on the selected device/window Gen2 rows.
- Device Status green/yellow/red status is informational and inspectable; details are available from the indicator.
- No additional Supabase query is required for the Device Status panel.
- Protected watering evidence is displayed from hosted watering-event views, not `sensor_logs.data.watering`.
- Firmware build profiles historically provided the Phase 6C prototype/small-batch bridge for intentional device identity.
- The selectable supported device environments are `balcony02-gen2`, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, and `prototype02-gen2`, UUID `a5c59d97-5687-483c-8773-86c9e6a84aea`.
- Balcony02's ESP32 board/framework, validation hook, identity, and hardware contract live in the explicit `balcony02-gen2` environment; shared monitor/upload-port mechanics alone remain in non-selectable `[env]`. There is no default or generic device profile.
- Tracked `src/device_identity.h` maps `MBG_DEVICE_ID` to the firmware `DEVICE_ID`.
- Ignored local-only `src/config.h` remains for secrets and is not the repo-owned identity mechanism.
- Phase 6D bench hardware identity validation passed using the explicit PlatformIO `bench-prototype` upload profile.
- Historical registry-backed RLS allowed the installed balcony unit, bench prototype, and scout01; those retired live registry identities and rows were removed in Phase 8F.9.
- Protected historical exports and completed phase evidence remain unchanged by the retirement.
- Future ESP32 units must receive a new explicit profile, identity, and UUID.
- Friendly names are separate labels, not telemetry identity.
- The hosted shell shows Gen2 readings, trends, quality, diagnostics, and authorized watering evidence while keeping local ESP32 controls unavailable.
- Hosted read-only mode has no Water Now and does not call local ESP32 `/logs` or `/water-now`.
- Ordinary builds use the same hosted shell and have no direct browser-to-device polling or manual action controls.
- The source registry remains Balcony02-only for Demo selection; customer and Support options are authorization-derived, and the retired live registry rows were deleted in Phase 8F.9.
- Supabase remains telemetry/history only, not command/control.
- No-Wi-Fi operation is autonomous/headless for now; installer/customer AP or captive-portal provisioning is deferred.

## Common Commands

### Firmware

```bash
# Build only; does not upload firmware
pio run -e balcony02-gen2
pio run -e prototype02-gen2
```

- `balcony02-gen2` is the physical pump-backed controller profile; `prototype02-gen2` is the pump-free relay/LED simulation profile. Both retain local button and WL01 safety behavior while reporting their physical capabilities honestly.
- The shared `[env]` section contains monitor/upload mechanics only and is not a device identity or upload target.
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

Balcony02 Gen2 firmware endpoints (no current local frontend consumer):

- `GET /` - health/basic device response

- `GET /status` - read-only local diagnostics
- `GET /capabilities` - Gen2 configured-hardware and control-feature manifest; Balcony02 uses the validated static contract without hardware reads or scans
- `GET /measurements` - authoritative Gen2 measurement-list payload

- Balcony02 Gen2 endpoints include compile-time `device_label`, `firmware_version`, and `build_profile` provenance for quick local inspection.
- Gen2 `/status` and `/capabilities` include top-level `reported_at` for snapshot generation time; `/measurements` includes top-level `measured_at` for measurement package/sample time.
- No `/logs` or HTTP `/water-now` handler exists in supported firmware. Unknown requests use the Gen2 `404` handler.
- Firmware-owned 30/60-second button programs and safety shutoff remain local; Supabase cannot command watering, and no RMI value can start it.

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

## Historical MVP v1.0 Field Commissioning Notes

These notes preserve the Phase 5/6 commissioning state. They are not the current Balcony02 implementation or priority authority; the Phase 8 roadmap and records above supersede their present-tense wording.

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

## Historical Next Safe Priorities

- Continue supervised local prove-out using the working ESP32 local path
- Preserve the local live/control path and the separate Supabase history/read path
- Use `sensor_events` only for manual operational context that helps interpret telemetry without changing `sensor_logs`
- Preserve validated Supabase logging and browser-local timestamp display while keeping the live/control path local
- Sensor Calibration / Raw ADC Prove-Out
- Phase 5G - Quiet Hours / Runtime Settings
- Phase 5H - Watering Duration Prove-Out while keeping current watering at `15` seconds and comparing `30` / `45` / `60` seconds only under appropriate dry-enough conditions
- Keep the frontend and firmware contract aligned with the current payload shape
- Continue small, reviewable cleanup only after the active local path remains stable
