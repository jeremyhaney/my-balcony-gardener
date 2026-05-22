# My Balcony Gardener Phase Backlog

This document captures deferred work that should not be mixed into the current implementation phase.

It is a planning guide, not an implementation approval. Each item still requires normal inspection, design, review, validation, and commit discipline before implementation.

## Current Active Branch Context

- Current repo context: Phase 6J.5 Supabase Device Registry / Table-Driven Provisioned Device Allowlist on branch `phase6j5-supabase-device-registry-allowlist`
- Current Phase 6A status: merged to `main`; Cloudflare Pages Production and custom domain validated
- Current Phase 6B status: complete; device identity and bench unit readiness convention documented
- Current Phase 6C status: complete; PlatformIO device identity build-profile bridge validated
- Current Phase 6D status: complete; bench ESP32 identity flash validation passed
- Current Phase 6E status: complete; hosted read-only Device and Window selectors validated locally and on the custom domain
- Current Phase 6F status: complete, merged to `main`, deployed, and validated on the hosted custom domain
- Current Phase 6G status: complete, merged to `main`; bench build/flash and normal Wi-Fi boot validation passed, and offline/no-Wi-Fi behavior is code-hardened and static-inspected
- Current Phase 6H status: complete; raw soil ADC visibility implemented in commit `8157e66 Add raw soil ADC diagnostic telemetry` and validated on the bench and Supabase history path
- Current Phase 6J.0 status: complete; frontend multi-unit visibility and local control target safety implemented and documented
- Current Phase 6J.1 status: complete; design/ADR documentation pass with no firmware, SQL, frontend runtime, `SensorLogRow`, watering, or local control behavior changes
- Current Phase 6J.2 status: bench validated / complete; local read-only `GET /status` endpoint implemented in `src/main.cpp`
- Current Phase 6J.3 status: SQL/RLS MVP complete / manually validated; `docs/sql/phase6j3-device-heartbeats.sql` creates `public.device_heartbeats`
- Current Phase 6J.4 status: bench validated / complete; firmware periodic heartbeats post to `public.device_heartbeats`
- Current Phase 6J.5 status: manually validated / complete; `public.device_registry` centralizes provisioned-device insert allowlists
- Code commit already exists: `a7488ba Add hosted read-only dashboard mode`
- Production branch status: `main`
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`
- Custom domain status: configured and validated at `https://mybalconygardener.boileragency.com`

## Recommended Phase Order

1. Phase 5D Validation - complete
2. Phase 5D Closeout / merge - complete and merged to main
3. Phase 5E — History Graph Event Semantics - validated/complete
4. Phase 5F — Telemetry Integrity Hardening - complete and merged to main
5. Phase 6A - Hosted Read-Only Dashboard MVP - complete and merged to main
6. Phase 6B — Device Identity / Bench Unit Readiness - complete
7. Phase 6C — Prototype Device Identity Build Profiles - complete
8. Phase 6D - Bench ESP32 Device Identity Flash Validation - complete
9. Phase 6E - Hosted Device/Window Controls - complete
10. Phase 6F - Hosted Read-Only Device Status / Telemetry Quality - complete and merged to `main`
11. Phase 6G - Offline Autonomy / Wi-Fi Recovery - complete and merged to `main`
12. Phase 6H - Sensor Fault Detection / Raw ADC Visibility - complete
13. Phase 6J.0 - Multi-Unit Visibility / Local Control Target Safety - complete
14. Phase 6J.1 - Device Diagnostics / Heartbeats / Reliability Evidence - DESIGN / ADR
15. Phase 6J.2 - Local Read-Only `/status` Endpoint MVP - bench validated / complete
16. Phase 6J.3 - Supabase `device_heartbeats` SQL/RLS MVP - manually validated / complete
17. Phase 6J.4 - Firmware Heartbeat Posting MVP - bench validated / complete
18. Phase 6J.5 - Supabase Device Registry / Table-Driven Provisioned Device Allowlist - manually validated / complete
19. Device Roles / Sensor-Only Telemetry Unit
20. Phase 6K - Sensor Calibration / Measurement-System Evaluation
21. Sensor Fault Detection / Control-Quality Validation
22. Future SenML-Inspired Measurement Model
23. Device Settings / Provisioning
24. Hardware Safety Maturity

Phase 5F, Phase 6A, Phase 6B, Phase 6C, Phase 6D, Phase 6E, Phase 6F, and Phase 6G are complete and merged to `main`; Phase 6H is complete. Phase 6J.0, Phase 6J.1, Phase 6J.2, Phase 6J.3, Phase 6J.4, and Phase 6J.5 are complete.

## Phase 5D Validation — FIELD VALIDATED / COMPLETE

Validation Results (feature branch `phase5d-telemetry-logging-cadence`):

- ✅ Firmware compiles and uploaded successfully.
- ✅ ESP32 restarted successfully after upload.
- ✅ Local `/logs` endpoint working.
- ✅ Manual Water Now triggers correctly from local UI.
- ✅ Pump starts on Manual Water Now trigger.
- ✅ 15-second pump shutoff validated.
- ✅ Phase 5C cooldown behavior remains intact.
- ✅ Supabase telemetry still posts.
- ✅ Normal 15-minute telemetry cadence validated.
- ✅ Immediate watering-start telemetry with `data.watering: true` posts to Supabase immediately.
- ✅ Immediate watering-completion telemetry with `data.watering: false` posts to Supabase immediately.
- ✅ `lastWateringDuration` populated upon completion (~15 seconds).
- ✅ `sensor_logs` shape unchanged; contains top-level `device_id`, `timestamp`, nested `data`.
- ✅ `sensor_events` unchanged and not used by firmware.
- ✅ Local dashboard updates frequently from live `/logs` polling.
- ✅ Supabase normal telemetry shows ~15-minute cadence.
- ✅ Automatic watering tied to 15-minute cadence (pump did not activate immediately with manual threshold probe; consistent with cooldown eligibility).

Out of scope:

- Frontend graph marker polish (deferred to Phase 5E).
- Admin page.
- Settings page.
- Supabase schema changes.
- Remote command/control.

## Phase 5D Closeout / Merge - COMPLETE AND MERGED TO MAIN

Scope:

- Phase 5D behavior was field validated.
- Phase 5D closeout documentation was completed before Phase 5E work.
- Phase 5D was merged to `main` before Phase 5E began.

## Phase 5E — History Graph Event Semantics - VALIDATED / COMPLETE

Scope:

- The apparent point replacement/reordering was determined to be chart label/window interpretation, not a firmware or Supabase cadence failure.
- The graph now uses explicit chronological timestamp sorting.
- Watering-start rows are displayed as vertical event markers using `sensor_logs.data.watering = true`.
- Hover tooltip behavior is preserved.
- Chart dots remain hidden.
- The local live/control path and Manual Water Now were preserved.
- No watering-completion markers were added because the history graph resolution does not justify that complexity.
- Future UI polish may explore a local-vs-remote mode indicator:
  - **Local Control Mode:** ESP32 local network, fast live readings from frequent polling, Water Now enabled, real-time telemetry visibility.
  - **Remote Read-Only Mode:** Supabase-only, no Water Now, clear visual mode indicator, sparse ~15-minute telemetry cadence.
- Preserve the local ESP32 live/control path.
- Preserve the read-only Supabase history path.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Schema changes unless separately approved.
- Admin page.

## Phase 5F — Telemetry Integrity Hardening - COMPLETE AND MERGED TO MAIN

Scope:

- Firmware compiled successfully with `pio run`, uploaded to the ESP32, and was validated after upload.
- ESP32 rebooted cleanly after upload and after repeated USB power disconnect/reconnect cycles.
- Local dashboard showed the expected unavailable warning while the ESP32 was offline and recovered after the ESP32 returned.
- `/logs` works with the DHT connected.
- `/logs` works with the DHT disconnected after at least one good DHT reading has populated the cache.
- During DHT failure, temperature/humidity use cached last-known-good DHT values.
- During DHT failure, soil moisture remains a fresh analog read and is not cached.
- Manual Water Now still works, and the pump still stops after approximately `15` seconds.
- Supabase watering-start and watering-completion telemetry post immediately during DHT failure using cached DHT values plus fresh moisture.
- Supabase payload shape remains unchanged with top-level `device_id`, `timestamp`, and nested `data.temperature`, `data.humidity`, `data.moisture`, `data.watering`, `data.lastWateredTime`, and `data.lastWateringDuration`.
- No frontend changes or Supabase schema changes were made.

Out of scope:

- Sensor calibration experiments.
- Graph UI polish.
- Settings UI.
- Hardware safety sensors.

## Phase 6A - Hosted Read-Only Dashboard MVP - COMPLETE AND MERGED TO MAIN

Scope:

- Cloudflare Pages project `my-balcony-gardener` is GitHub-connected.
- Branch `phase6a-hosted-readonly-dashboard` was merged to `main`.
- Cloudflare Pages Production deployment is validated from `main`.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- The custom domain was moved from the obsolete old `mybalconygardener` Cloudflare Pages/Tunnel setup to the current `my-balcony-gardener` Pages project.
- Hosted read-only mode is controlled by `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted read-only build requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The single displayed device is controlled by `VITE_MBG_DEVICE_ID`.
- Hosted read-only mode renders Sensor History from Supabase.
- Hosted read-only Supabase history requests filter by `device_id` when `VITE_MBG_DEVICE_ID` is configured.
- Hosted read-only mode does not render `LiveStats`.
- Hosted read-only mode does not show Water Now.
- Hosted read-only mode does not call local `/logs` or `/water-now`.
- Hosted read-only production build scan found no `Water Now`, `/water-now`, `/logs`, or `10.0.0.200` strings after the lazy/dynamic import fix.
- Hosted custom-domain validation confirmed Garden check-in mode is visible, `LiveStats` and Water Now are hidden, Sensor History is visible, Supabase `sensor_logs` requests are visible, and there are no `/logs`, `/water-now`, or `10.0.0.200` requests.
- Local/default dashboard mode still renders `LiveStats`, local `/logs` polling, local Manual Water Now, and Sensor History.
- The local ESP32 live/control path and hosted read-only Supabase history path remain separate.
- Supabase remains telemetry/history only and is not command/control.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Multi-device UI.
- Admin or Settings behavior.
- Supabase schema changes.

## Advanced Sensor Health / Fault Detection

Deferred future work, not part of Phase 6F Device Status:

- Track repeated bad sensor reads.
- Track repeated low moisture readings after watering.
- Alert when a sensor appears stuck, disconnected, saturated, or implausible.
- Possibly require N consecutive low fresh moisture readings before automatic watering.
- Possibly require a post-watering stabilization period before trusting moisture again.
- Phase 6F Device Status is a basic read-only data-quality indicator and does not perform fault diagnosis.

## Hosted Read-Only Dashboard Follow-Up

Scope:

- Keep hosted dashboard read-only.
- Consider future polish only as separately approved work.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Multi-device UI unless separately approved.
- Admin or Settings behavior.

## Phase 6E - Hosted Device/Window Controls - VALIDATED / COMPLETE

Scope:

- Hosted read-only dashboard now has Device and Window selectors for Sensor History.
- Device selector supports Installed Balcony Unit (`balcony`, `550e8400-e29b-41d4-a716-446655440000`) and Bench Prototype Unit (`bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`).
- Window selector supports `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`.
- URL query-string state supports valid combinations such as `?device=balcony&window=24h` and `?device=bench&window=7d`.
- Invalid query values safely fall back to Installed Balcony Unit / `24h`.
- `VITE_MBG_DEVICE_ID` remains the fallback/default hosted device behavior.
- Supabase history queries filter server-side by selected `device_id`.
- Supabase history queries filter by selected timestamp lower bound except for `all`, which applies no lower timestamp bound.
- Hosted read-only mode still does not render `LiveStats`, show Water Now, call local ESP32 `/logs`, or call local ESP32 `/water-now`.
- Supabase remains telemetry/history only and is not command/control.
- Local/default dashboard mode still renders `LiveStats`, local `/logs` polling, local Manual Water Now, and Sensor History.
- Manual Water Now remains local only.
- Chart X-axis labels adapt by selected history window.
- Chart tooltip shows full date/time.
- Local browser validation passed for balcony and bench devices across history windows.
- Invalid query fallback validation passed.
- `npm run lint` and `npm run build` passed.
- Hosted-readonly production bundle guardrail scan returned no output for `water-now`, `Water Now`, `/logs`, `Currently Watering`, `LiveStats`, `VITE_ESP32_URL`, or `VITE_WATER_ENDPOINT`.
- Cloudflare/custom-domain production validation passed at `https://mybalconygardener.boileragency.com`.
- No firmware changes were made.
- No Supabase schema changes were made.
- `sensor_events` was unchanged.
- The canonical `SensorLogRow` shape was unchanged.
- Watering logic and local Manual Water Now behavior were unchanged.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Supabase schema changes.
- Firmware changes.
- Watering logic changes.
- Advanced sensor health / fault detection.
- Calibration.
- Alerts.
- Auth/login.
- Device registry.
- Settings/provisioning UI.

## Phase 6F - Hosted Read-Only Device Status / Telemetry Quality - COMPLETE AND MERGED TO MAIN

Scope:

- Added pure helper `mbg_dashboard/src/telemetryHealth.ts`.
- Added presentational `mbg_dashboard/src/components/SensorHealthPanel.tsx`.
- Added component CSS `mbg_dashboard/src/components/SensorHealthPanel.css`.
- Wired Device Status into `SensorLogViewer.tsx` using already-fetched rows only.
- No second Supabase query.
- No firmware changes.
- No Supabase schema changes.
- No `SensorLogRow` shape changes.
- No `sensor_events` changes.
- No Water Now / Remote Water Now.
- No local live/control behavior changes.
- Device Status evaluates latest report age, row count, expected row count, coverage, largest gap, broad latest-reading plausibility, and watering history marker count.
- User-facing indicator is "Device Status" with green/yellow/red behavior.
- Hosted-readonly guardrail scan passed.
- Local hosted-readonly browser validation passed.
- Cloudflare preview validation passed.
- Production/custom-domain validation passed after merge to `main`.

Out of scope:

- Sensor calibration.
- Plant diagnosis.
- Fault diagnosis beyond basic data-quality status.
- Alerts/notifications.
- Responsive hosted dashboard polish.
- Firmware changes.
- Supabase command/control.

## Phase 6G - Offline Autonomy / Wi-Fi Recovery - COMPLETE ON BRANCH

Scope:

- Firmware no longer restarts solely because Wi-Fi is unavailable during boot.
- ESP32 continues into local-control/offline mode when Wi-Fi is unavailable.
- Wi-Fi reconnect is retried periodically without blocking local control.
- Pump shutoff is checked before client/server/network/telemetry work.
- Relay shutoff remains local and occurs before watering-completion telemetry.
- Supabase remains telemetry/history only and is not command/control.
- Hosted read-only dashboard may show stale or no recent data when telemetry stops.
- Bench profile built successfully.
- Bench profile flashed successfully.
- Bench unit booted successfully on normal Wi-Fi.
- Bench unit served valid `/logs`.
- Offline/no-Wi-Fi behavior is code-hardened and static-inspected, but not physically no-Wi-Fi tested in this phase because Wi-Fi/router disruption was not available.

Out of scope:

- AP/captive portal provisioning.
- Stored customer credentials.
- Setup/reset mode.
- Status indication.
- Offline log buffering.
- Hardware safety changes.
- Supabase schema changes.
- Frontend runtime changes.

## Phase 6H - Sensor Fault Detection / Raw ADC Visibility - COMPLETE

Scope:

- Raw soil ADC visibility was implemented and validated in commit `8157e66 Add raw soil ADC diagnostic telemetry`.
- Firmware build passed with `pio run`.
- Frontend lint passed.
- Frontend build passed.
- Local bench `/logs` showed `data.soilRawAdc`.
- Supabase `sensor_logs.data` received `soilRawAdc`.
- Before correcting the moisture signal wire, bench Supabase telemetry for device `318fab98-89ad-4f36-9100-3134a04e0be5` at `2026-05-14T19:52:12Z` showed moisture index `100` with `soilRawAdc: 0`; this specific mapped `100` was caused by raw ADC `0`, but it does not prove all mapped `100` values are raw ADC `0`.
- After moving the bench moisture signal wire to the firmware-defined `SOIL_PIN`, local `/logs` at `2026-05-14 16:01:51` showed moisture index `30` with `soilRawAdc: 2925`, moving from a pinned `0` condition to a plausible analog value.
- A later Supabase row after pin correction at `2026-05-14T20:07:12Z` showed moisture index `30` with `soilRawAdc: 2921`.
- The sensor sitting on the bench, not in soil or water, triggered automatic relay logic because mapped moisture was below `MOISTURE_THRESHOLD`.
- Moist bench soil later showed local `/logs` at `2026-05-14 16:09:25` with moisture index `73` and `soilRawAdc: 1889`.
- Local dashboard was run against the bench unit and displayed Raw Soil ADC successfully.
- Sensor History for the bench unit showed usable data across the 7-day window with a few DHT dropouts visible.
- `sensor_events` was used manually to record the raw ADC validation, pin correction, clarification that one reading was not in soil, sensor placement into moist bench soil, and moist-soil reference reading.
- `data.moisture` remains a derived moisture index, not a calibrated soil-moisture percentage.
- `data.soilRawAdc` is diagnostic raw ESP32 ADC evidence.
- Moisture mapping, thresholds, watering duration, cooldown, pump shutoff behavior, and Manual Water Now behavior were unchanged.

Out of scope:

- Calibration.
- Filtering.
- Repeated-reading validation.
- Invalid-reading rejection.
- Quiet hours.
- Hardware safety.
- Supabase command/control.
- Remote Water Now.

## Phase 6J.0 - Multi-Unit Visibility / Local Control Target Safety - COMPLETE / CURRENT CLOSEOUT

Scope:

- Hosted-safe frontend device registry now covers Installed Balcony Unit, Bench Prototype Unit, and Balcony Sensor Scout 01.
- Local-only control target metadata keeps local IP/manual-action information out of hosted history code.
- Hosted/history Device selector includes scout01 and remains read-only.
- Local/default dashboard has a distinct Local Control Target selector.
- Local live polling can switch between known ESP32 units from one local Vite site.
- Manual action is gated by selected target and live `/logs` `device_id` match.
- Installed Balcony Unit uses Water Now wording only when identity is verified.
- Bench Prototype Unit uses relay-test wording only when identity is verified.
- Balcony Sensor Scout 01 remains manual-action disabled.
- Supabase `sensor_logs` RLS INSERT policy was manually updated to allow scout01 telemetry.
- A near-live scout01 Sensor History row was observed after the RLS update.
- No firmware, Supabase schema, `SensorLogRow`, watering duration, threshold, cooldown, or sensor logic changes were made.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Supabase schema migration.
- Firmware behavior changes.
- Production provisioning database.

## Phase 6J.1 - Device Diagnostics / Heartbeats / Reliability Evidence - DESIGN / ADR

Scope:

- ADR 0014 defines a separate diagnostics/heartbeat architecture for ESP32 device-health evidence.
- `device_heartbeats` is the recommended future append-only historical heartbeat/evidence table.
- `device_heartbeats` remains separate from `sensor_logs` plant/environment telemetry and `sensor_events` manual operational context.
- Future `GET /status` is recommended as a read-only local diagnostics endpoint.
- Diagnostics should exist on every deployed unit, including controller, sensor-only/scout, and bench units.
- Recommended diagnostic fields cover identity/configuration, runtime, Wi-Fi, Supabase/cloud posting, sensor read health, watering/control safety, local-only diagnostics, and deferred/future fields.
- Recommended MVP heartbeat cadence is boot when Wi-Fi/time allows plus periodic 15-minute heartbeats.
- Future event-triggered heartbeats after Wi-Fi reconnect and cloud recovery are deferred.
- Hosted dashboard diagnostics display is deferred until `/status` and `device_heartbeats` are proven.
- No firmware, frontend runtime, SQL schema, `SensorLogRow`, watering duration, threshold, cooldown, pin, sensor, moisture mapping, or local control behavior changes are included in this design pass.

Follow-up implementation slices, requiring separate approval:

- Add firmware heartbeat posting.
- Add hosted read-only diagnostics display after the diagnostics path is proven.
- Add latest-status `device_status_current` table/view if append-only evidence proves useful.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Anonymous update/delete policies.
- Firmware behavior changes.
- SQL migrations.
- Frontend runtime changes.
- `SensorLogRow` changes.
- Hosted-readonly control boundary changes.

## Phase 6J.2 - Local Read-Only `/status` Endpoint MVP - BENCH VALIDATED / COMPLETE

Scope:

- Implemented local read-only `GET /status` diagnostics endpoint in `src/main.cpp`.
- `/status` reports existing runtime state and lightweight ESP32/Wi-Fi diagnostics.
- `/status` does not read DHT or soil sensors.
- `/status` is local diagnostics only and does not post to Supabase.
- Bench validation passed on Bench Prototype Unit UUID `318fab98-89ad-4f36-9100-3134a04e0be5` at IP `10.0.0.192`.
- `/status` returned valid JSON.
- `/status` reported `wifi_connected: true`.
- `/status` reported `wifi_rssi: -45`.
- `/status` reported `hasLastGoodDht: true`.
- `/status` reported `free_heap: 235028` and `min_free_heap: 186292`.
- `/status` reported `currently_watering: false`.
- No Supabase `device_heartbeats` table was added.
- No Supabase heartbeat posting was added.
- No frontend runtime behavior changed.
- No `SensorLogRow` change was made.
- No intentional `/logs` behavior change was made.
- No `/water-now` behavior change was made.
- No watering duration, threshold, cooldown, moisture mapping, pin, or sensor logic changed.

Follow-up implementation slices, requiring separate approval:

- Add firmware heartbeat posting.
- Add hosted read-only diagnostics display after the diagnostics path is proven.
- Add latest-status `device_status_current` table/view if append-only evidence proves useful.

Out of scope:

- Supabase command/control.
- Remote Water Now.
- SQL migrations.
- Firmware heartbeat posting.
- Frontend runtime changes.
- Hosted dashboard behavior changes.
- `SensorLogRow` changes.
- Watering behavior changes.

## Phase 6J.3 - Supabase `device_heartbeats` SQL/RLS MVP - MANUALLY VALIDATED / COMPLETE

Scope:

- Added SQL artifact `docs/sql/phase6j3-device-heartbeats.sql`.
- The SQL artifact defines `public.device_heartbeats` as an append-only diagnostics/evidence table.
- RLS is enabled.
- Anon INSERT policy is limited to known provisioned device IDs.
- No anon SELECT policy is included in Phase 6J.3.
- No UPDATE policy is included.
- No DELETE policy is included.
- Constraints and indexes are included.
- Manual validation SQL is kept as a commented block in the SQL artifact.
- Supabase validation was performed manually in the SQL Editor.
- `public.device_heartbeats` was created successfully.
- Manual validation insert succeeded for Bench Prototype Unit.
- Validation row used bench `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`, `device_label` `Bench Prototype Unit`, `device_role` `bench`, and `heartbeat_reason` `manual_sql_validation`.
- `select` from `public.device_heartbeats` ordered by `heartbeat_at desc` returned the validation row.
- SQL Editor validation proves the table, constraints, indexes, and owner/admin insert path.
- SQL Editor validation does not fully prove anon REST/RLS insert behavior because SQL Editor usually runs with elevated privileges.
- Anon insert validation is deferred until firmware heartbeat posting or a dedicated REST test is approved.
- No firmware heartbeat posting was added.
- No hosted diagnostics display was added.
- No Supabase command/control was introduced.

Follow-up implementation slices, requiring separate approval:

- Phase 6J.4 firmware heartbeat posting MVP.
- Dedicated anon REST/RLS insert validation if not covered by firmware heartbeat validation.
- Hosted read-only diagnostics display after the diagnostics path is proven.
- Latest-status `device_status_current` table/view if append-only evidence proves useful.

Out of scope:

- Firmware changes.
- Frontend runtime changes.
- Hosted dashboard diagnostics display.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` changes.
- Watering behavior changes.
- Supabase command/control.
- Remote Water Now.

## Phase 6J.4 - Firmware Heartbeat Posting MVP - BENCH VALIDATED / COMPLETE

Scope:

- Added firmware posting from local diagnostics state to `public.device_heartbeats`.
- Added `HEARTBEAT_INTERVAL_MS` default `900000`.
- Added `lastHeartbeatPostTime`.
- Added `DEVICE_ROLE` through `MBG_DEVICE_ROLE` in `src/device_identity.h`.
- Added `MBG_DEVICE_ROLE` build flags in `platformio.ini`: `balcony-installed` is `controller`, `bench-prototype` is `bench`, and `balcony-sensor-scout-01` is `sensor-scout`.
- Added periodic-only `sendDeviceHeartbeatToSupabase("periodic")`.
- Heartbeat posting occurs after pump shutoff priority, after `maintainWiFiConnection()`, after `server.handleClient()`, and after the regular sensor logging / automatic watering eligibility block.
- Existing `sendDataToSupabase()` remains unchanged.
- No boot heartbeat was added.
- No Wi-Fi reconnect heartbeat was added.
- No cloud recovery heartbeat was added.
- No offline buffering or aggressive retry was added.
- All PlatformIO builds passed.
- Bench profile upload succeeded.
- No upload was performed to `balcony-installed` or `balcony-sensor-scout-01` because those units are collecting field data.
- Bench `/status` still worked after upload.
- Bench `/logs` still worked after upload.
- Bench firmware inserted a new row into `public.device_heartbeats`.
- Firmware heartbeat row used `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`, `device_role` `bench`, `heartbeat_reason` `periodic`, `uptime_seconds` `901`, `wifi_connected` `true`, `wifi_rssi` `-52`, `free_heap` `238348`, `min_free_heap` `190036`, `currently_watering` `false`, `last_watering_duration` `0`, and `details` `{"phase":"6J.4","source":"firmware"}`.
- The successful firmware heartbeat validates anon REST/RLS insert behavior for the bench device.
- No Supabase command/control was introduced.

Follow-up implementation slices, requiring separate approval:

- Hosted diagnostics display.
- Latest-status `device_status_current` table/view.
- Supabase device registry / table-driven provisioned device allowlist.

Out of scope:

- Frontend runtime changes.
- Hosted dashboard behavior changes.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` behavior changes.
- Watering duration, threshold, cooldown, moisture mapping, pin, sensor, or automatic watering logic changes.
- Supabase command/control.
- Remote Water Now.

## Phase 6J.5 - Supabase Device Registry / Table-Driven Provisioned Device Allowlist - MANUALLY VALIDATED / COMPLETE

Scope:

- ADR 0015 defines `public.device_registry` as the Supabase provisioned-device registry.
- SQL artifact `docs/sql/phase6j5-device-registry.sql` creates and seeds the registry for Installed Balcony Unit, Bench Prototype Unit, and Balcony Sensor Scout 01.
- Registry-backed RLS replaces repeated hardcoded UUID allowlists for device-originated inserts.
- `sensor_logs` INSERT is allowed only when the registry row is active and `telemetry_insert_enabled`.
- `device_heartbeats` INSERT is allowed only when the registry row is active and `heartbeat_insert_enabled`.
- `public.device_registry` has no anon SELECT, INSERT, UPDATE, or DELETE policy in this phase.
- SECURITY DEFINER helper functions allow RLS policies to check registry state without granting broad registry read access.
- Policy replacement is intentionally scoped to anon/public INSERT policies on `sensor_logs` and `device_heartbeats`; SELECT, UPDATE, DELETE, and authenticated-only policies are not targeted.
- Registry flags authorize telemetry and heartbeat inserts only and are not command/control.
- Hosted diagnostics display remains deferred.
- Limited read-only registry view remains deferred.
- Latest-status `device_status_current` table/view remains deferred.
- Sensor Calibration remains Phase 6K and is not part of this device-registry phase.
- Supabase validation confirmed `public.device_registry` exists.
- Registry rows exist for Installed Balcony Unit (`balcony`, `controller`, `550e8400-e29b-41d4-a716-446655440000`), Bench Prototype Unit (`bench`, `bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`), and Balcony Sensor Scout 01 (`scout01`, `sensor-scout`, `28f4e6e3-5979-4af4-9753-34e185d8e47e`).
- All three registry rows are active with `telemetry_insert_enabled`, `heartbeat_insert_enabled`, and `hosted_visible` set to `true`.
- Supabase validation confirmed `sensor_logs` INSERT policy is registry-backed.
- Supabase validation confirmed `device_heartbeats` INSERT policy is registry-backed.
- The existing public/anon `sensor_logs` SELECT policy remains.
- `device_registry` has no anon SELECT policy.
- Helper function validation passed: bench telemetry allowed is `true`, bench heartbeat allowed is `true`, fake telemetry allowed is `false`, and fake heartbeat allowed is `false`.
- After registry-backed RLS, `device_heartbeats` continued receiving firmware heartbeat rows.
- After registry-backed RLS, `sensor_logs` continued receiving rows from known provisioned devices.
- No Supabase command/control or Remote Water Now was introduced.

Follow-up validation and implementation slices, requiring separate approval:

- Hosted diagnostics display.
- Add a limited read-only device registry view later only if hosted/frontend labels need Supabase-backed registry reads.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Hosted diagnostics display.
- Firmware behavior changes.
- Frontend runtime changes.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` changes.
- Watering duration, threshold, cooldown, moisture mapping, pin, sensor, or automatic watering logic changes.

## Device Roles / Sensor-Only Telemetry Unit

Scope:

- Evaluate sensor-only device roles before installing additional balcony sensor units.
- Decide how non-actuating units should identify themselves and report telemetry.
- Preserve the boundary that only properly equipped local firmware owns watering control.

## Sensor Fault Detection / Control-Quality Validation

Scope:

- Evaluate control-quality sensor validation before automatic watering uses suspicious readings.
- Evaluate repeated-reading validation for soil moisture.
- Decide how invalid, pinned, saturated, disconnected, or implausible readings should affect automatic watering.
- Add DHT quality/fallback metadata before using DHT behavior for stronger status conclusions.

Out of scope:

- Changing watering behavior without explicit validation and ADR coverage.

## Future SenML-Inspired Measurement Model

Scope:

- Evaluate a SenML-inspired measurement-list or measurement-table model before adding more fixed fields for additional sensors.
- Consider future light, pressure, flow, water level, and additional moisture sensors.

Out of scope:

- Immediate schema migration without a concrete need.

## Phase 6B — Device Identity / Bench Unit Readiness

Scope:

- Lock device identity convention before adding bench or field units.
- Keep installed balcony unit UUID `550e8400-e29b-41d4-a716-446655440000` for history continuity.
- Future ESP32 units require unique, stable, non-null UUIDs before deployment.
- Friendly names are separate field/user labels.
- Hosted read-only dashboard uses `VITE_MBG_DEVICE_ID` to select the displayed UUID.
- No Supabase schema change.

Out of scope:

- Multi-device UI.
- Settings/provisioning UI.
- Supabase schema changes.
- SensorLogRow changes.
- Remote Water Now.
- Supabase command/control.
- Sensor calibration.
- Hardware safety sensors.
- Commercial fleet management.

## Phase 6C — Prototype Device Identity Build Profiles

Scope:

- Add PlatformIO build profiles for intentional prototype device identity.
- Keep `src/config.h` ignored/local-only for secrets.
- Use tracked `src/device_identity.h` as the no-secrets identity bridge.
- Preserve installed balcony UUID for `balcony-installed`.
- Add bench-prototype UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Validate `pio run` and explicit profile builds.
- Validate built firmware binaries contain only the expected UUID.

Out of scope:

- Firmware upload without explicit approval.
- Production provisioning database.
- Device registry table.
- Supabase schema changes.
- SensorLogRow changes.
- Multi-device UI.
- Settings/provisioning UI.
- Remote Water Now.
- Supabase command/control.
- Sensor calibration.
- Hardware safety sensors.
- Graph duration controls.
- Broad frontend refactor.

## Phase 6D - Bench ESP32 Device Identity Flash Validation - COMPLETE

Scope:

- Bench ESP32 was flashed using the explicit PlatformIO profile command `pio run -e bench-prototype -t upload --upload-port COM5`.
- Generic upload command was not used.
- Bench firmware profile used UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Installed balcony unit UUID remains `550e8400-e29b-41d4-a716-446655440000`.
- Bench ESP32 booted successfully, connected to Wi-Fi, and was observed at `10.0.0.192`.
- Bench local `/logs` endpoint returned valid data with `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Initial Supabase insert failed because the `sensor_logs` RLS insert policy only allowed the installed balcony UUID.
- Supabase RLS insert policy was updated to allow both known provisioned UUIDs: `550e8400-e29b-41d4-a716-446655440000` and `318fab98-89ad-4f36-9100-3134a04e0be5`.
- After the RLS policy correction, bench telemetry posted successfully to Supabase `sensor_logs`.
- Installed balcony unit remained unaffected and continued using its original UUID.
- Bench unit is now on the BJ1 test bench, powered, and `/logs` reports good data.
- No pump was connected to the bench unit during identity validation.
- No firmware behavior changes were made.
- No frontend behavior changes were made.
- No Supabase schema changes were made.

Out of scope:

- Firmware behavior changes.
- Frontend behavior changes.
- Supabase schema changes.
- Watering logic changes.
- Remote Water Now.
- Multi-device UI.
- Device registry.

## Sensor Calibration / Measurement-System Evaluation

Scope:

- Compare soil moisture sensors.
- Perform gage R&R or appropriate measurement-system evaluation.
- Inspect raw ADC behavior.
- Determine whether software adjustment, filtering, sensor replacement, or no action is appropriate.
- Evaluate repeated-reading validation before automatic watering.
- Distinguish display moisture index from validated control input.

Out of scope:

- Changing `MOISTURE_THRESHOLD` without experimental justification.
- Changing moisture scaling without documentation.
- Changing watering duration as part of calibration unless explicitly approved.

## Hydraulic Prove-Out

Scope:

- Test alternate watering durations such as 30, 45, or 60 seconds.
- Treat duration changes as controlled physical watering experiments.
- Observe emitter performance, overspray, basket wetting, drainage, and pump behavior.

Out of scope:

- Bundling hydraulic experiments into telemetry or graph phases.
- Changing duration without field validation.

## Watering Scheduling

Scope:

- Evaluate quiet hours.
- Review time handling.
- Decide whether 10:00 PM to 8:00 AM is the correct default quiet-hours window.
- Decide whether Manual Water Now should continue bypassing quiet hours.

Out of scope:

- Remote command/control.
- Full settings UI unless this phase is intentionally combined with Device Settings.

## Device Settings / Provisioning

Scope:

- Evaluate moving user-adjustable behavior values out of compile-time-only local config.
- Consider ESP32 Preferences/NVS for persistent device-local settings.
- Separate private/local secrets from product behavior defaults and user settings.
- Evaluate safe user-adjustable values:
  - moisture threshold
  - watering duration
  - cooldown duration
  - telemetry cadence
  - device nickname/location
- Evaluate Wi-Fi provisioning for end users.
- Evaluate AP/captive portal fallback for Wi-Fi setup.
- Evaluate stored customer credentials.
- Evaluate setup/reset mode.
- Evaluate clear setup/connectivity status indication.
- Evaluate optional offline log buffering for telemetry gaps.
- Decide whether the product needs both an Admin page and a User Settings page.

Out of scope:

- Immediate Phase 5D firmware changes.
- Storing secrets in Git.
- Changing current local live/control ownership.

## Hardware Safety Maturity

Scope:

- Evaluate reservoir low-water / dry-run protection.
- Evaluate leak detection.
- Evaluate overflow detection.
- Evaluate flow sensing.
- Evaluate pump-current sensing.
- Evaluate failure detection for disconnected tubing or blocked outlets.

Out of scope:

- Treating MVP v1.0 as fully unattended-safe before hardware protections are validated.

## Explicitly Deferred / Not MVP

- Remote Water Now through Supabase.
- Supabase command/control.
- Using `sensor_events` for every telemetry row.
- Admin page for `sensor_events`.
- Multi-device read-only UI.
- Auth/login, settings/provisioning, alerts, and commercial production hardening.
- Full production provisioning.
- Full commercial multi-device fleet management.

