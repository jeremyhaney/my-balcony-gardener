# My Balcony Gardener Phase Backlog

This document captures deferred work that should not be mixed into the current implementation phase.

It is a planning guide, not an implementation approval. Each item still requires normal inspection, design, review, validation, and commit discipline before implementation.

## Current Active Branch Context

- Current repo context: Phase 7H MVP Field Deployment Backlog Rebaseline on branch `phase7h-mvp-field-deployment-backlog-rebaseline`
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
- Current Phase 6J.6 status: complete and merged to `main`; hosted read-only diagnostics display uses limited view `public.hosted_device_diagnostics`
- Phase 7A status: accepted documentation/design phase
- Phase 7B status: runtime validated / complete on `bench-proto-gen2`
- Phase 7C status: runtime validated / complete; Live Measurements Local Frontend MVP
- Phase 7D status: runtime validated / complete; Gen2 Measurement Batch Storage MVP
- Phase 7E status: runtime validated / complete and merged to main; Field Units Gen2 Compatibility Migration
- Phase 7F.1 status: runtime/browser validated / complete pending commit; Hosted Gen2 UI Flexibility and Trend Charting
- Phase 7F.3 status: validated / complete pending commit; Hosted Device Status Gen2 Freshness Fix
- Phase 7G.0 status: validated / complete pending commit; Field Gen2 Soil Temperature and Scout BME280 Swap
- Phase 7G.1 status: complete / committed; calibration control validation baseline
- Phase 7G.2 status: complete / committed; Gen2 calibration evidence review
- Phase 7G.3 status: complete / committed; Gen2 control-quality rule design
- Phase 7G.4 status: firmware implementation committed / build-validated
- Phase 7G.5 status: complete and present on `main` in commit `1ea2f5a Document Phase 7G.5 control gate runtime validation`
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
19. Phase 6J.6 - Hosted Read-Only Diagnostics Display MVP - complete and merged to `main`
20. Phase 7A — Gen2 Modular Sensor Architecture Lock - complete
21. Phase 7B — Gen2 Bench Platform Bring-Up - complete
22. Phase 7C — Live Measurements Local Frontend MVP - complete
23. Phase 7D — Gen2 Measurement Storage MVP - complete
24. Phase 7E — Field Units Gen2 Compatibility Migration - runtime validated / complete and merged to main
25. Phase 7F.1 — Hosted Gen2 UI Flexibility and Trend Charting - runtime/browser validated / complete pending commit
26. Phase 7F.3 - Hosted Device Status Gen2 Freshness Fix - validated / complete pending commit
27. Phase 7G.0 - Field Gen2 Soil Temperature and Scout BME280 Swap - validated / complete pending commit
28. Phase 7G.1 - Calibration / Control Validation Baseline - complete / committed
29. Phase 7G.2 - Gen2 Calibration Evidence Review - complete / committed
30. Phase 7G.3 - Gen2 Control-Quality Rule Design - complete / committed
31. Phase 7G.4 - Gen2 Local Control-Quality Gates Firmware Implementation - committed / build-validated
32. Phase 7G.5 - Gen2 Local Control-Quality Gates Runtime Validation - complete and present on `main`
33. Phase 7H - MVP Field Deployment Backlog Rebaseline - documentation/planning only
34. Phase 7I - Hosted Measurement Trust & Plausibility Guardrails - future
35. Phase 7J - Official Pinout, Wiring, and From-To Documentation - future
36. Phase 7K - Hosted At-a-Glance Measurement Trends - future
37. Phase 7L - MVP Setup / Provisioning Boundary - future
38. Phase 7M - Sensor Upgrade Decision Matrix - future
39. Phase 7N - Sensor Calibration / Measurement-System Evaluation - future
40. Phase 7P - Hardware Safety Maturity - future
41. Phase 7Q - Pilot Deployment Package - future

Phase 5F, Phase 6A, Phase 6B, Phase 6C, Phase 6D, Phase 6E, Phase 6F, and Phase 6G are complete and merged to `main`; Phase 6H is complete. Phase 6J.0, Phase 6J.1, Phase 6J.2, Phase 6J.3, Phase 6J.4, Phase 6J.5, and Phase 6J.6 are complete. Phase 7A is accepted. Phase 7B is runtime validated on the Gen2 bench mule. Phase 7C Live Measurements Local Frontend MVP is runtime validated / complete. Phase 7D Gen2 Measurement Batch Storage MVP is runtime validated / complete. Phase 7E Field Units Gen2 Compatibility Migration is runtime validated / complete and merged to main. Phase 7F.1 Hosted Gen2 UI Flexibility and Trend Charting is runtime/browser validated / complete pending commit. Phase 7F.3 Hosted Device Status Gen2 Freshness Fix is validated / complete pending commit. Phase 7G.0 Field Gen2 Soil Temperature and Scout BME280 Swap is validated / complete pending commit. Phase 7G.1 Calibration / Control Validation Baseline, Phase 7G.2 Gen2 Calibration Evidence Review, and Phase 7G.3 Gen2 Control-Quality Rule Design are complete and committed. Phase 7G.4 Gen2 Local Control-Quality Gates Firmware Implementation is committed and build-validated. Phase 7G.5 Gen2 Local Control-Quality Gates Runtime Validation is complete and present on `main` in commit `1ea2f5a Document Phase 7G.5 control gate runtime validation`. Future work is now rebaselined around this question: what must be true before MBG can be deployed at someone else's balcony without Jeremy babysitting it?

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
- Sensor calibration remains deferred and is now tracked in the Phase 7N deployment-readiness roadmap; it is not part of this device-registry phase.
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

## Phase 6J.6 - Hosted Read-Only Diagnostics Display MVP - COMPLETE AND MERGED TO MAIN

Scope:

- Add SQL artifact `docs/sql/phase6j6-hosted-device-diagnostics-view.sql`.
- Create limited read-only view `public.hosted_device_diagnostics`.
- Join active, hosted-visible `public.device_registry` rows to the latest `public.device_heartbeats` row per device.
- Expose only safe hosted diagnostics fields: device identity label/key/role, hosted visibility, latest heartbeat time/age/reason, uptime, Wi-Fi connected/RSSI, heap evidence, latest heartbeat watering evidence, and last watering duration.
- Grant SELECT on the view to `anon` and `authenticated`.
- Keep base `public.device_registry` anon SELECT unapproved.
- Add frontend `fetchDeviceDiagnostics(selectedDeviceId = '')` using `public.hosted_device_diagnostics`, selected `device_id` filtering, and `maybeSingle()`.
- Add read-only `DeviceDiagnosticsPanel` near Sensor History / Device Status.
- Show Diagnostics Fresh, Diagnostics Stale, or No Diagnostics Yet using `DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS = 35 * 60`.
- Phrase watering as latest heartbeat evidence only, not guaranteed live pump state.
- Wire diagnostics fetching into `SensorLogViewer` without changing existing Sensor History, selectors, `SensorHealthPanel`, or `DualAxisChart` behavior.

Out of scope:

- Firmware changes.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` changes.
- Watering behavior, threshold, duration, cooldown, moisture mapping, pin, sensor, `LiveStats`, `DualAxisChart`, or `SensorLogRow` changes.
- Base registry anon read.
- INSERT policy weakening.
- UPDATE or DELETE policies.
- Supabase command/control or Remote Water Now.
- Plant health diagnosis, sensor calibration diagnosis, root-cause diagnosis, alerts, or live pump-state guarantees.

## Phase 7A - Gen2 Modular Sensor Architecture Lock - ACCEPTED

Scope:

- Create ADR 0016 to define Gen2 as a modular grow-environment platform where sensors, capabilities, and control authority are independently discoverable, optional, and replaceable.
- Preserve Gen1/current compatibility through the existing `SensorLogRow` / `sensor_logs` telemetry history contract.
- Keep expanded Gen2 measurements separate from legacy `SensorLogRow`, likely through a future `public.sensor_measurements` measurement-list/table path.
- Define sensor modules as independent software components with their own detection, read timing, validity, quality, reason, and control eligibility reporting.
- Define the standard Gen2 measurement record fields: `device_id`, `measured_at`, `sensor_key`, `sensor_type`, `measurement_name`, `measurement_value`, `measurement_unit`, `valid`, `quality`, `reason`, `control_eligible`, and `details`.
- Clarify that valid for display is not the same as valid for control.
- Require watering control to use only measurements explicitly marked `control_eligible`.
- Retire GPIO5 from future Gen2 relay/pump control designs without changing the installed balcony unit in this phase.
- Approve I2C SDA/SCL as a short-range local sensor-module bus.
- Defer long-distance sensing to separate ESP32 sensor nodes or a future deliberate fieldbus design, such as RS-485/Modbus, after separate evaluation.
- Keep local ESP32 firmware as the owner of watering decisions and pump shutoff.
- Keep Supabase as telemetry/history/diagnostics storage only, with no command/control or Remote Water Now.

Follow-up placeholders, requiring separate approval:

- Phase 7B — Gen2 Bench Platform Bring-Up
- Phase 7C — Live Measurements Local Frontend MVP
- Phase 7D — Gen2 Measurement Storage MVP
- Phase 7E — Field Units Gen2 Compatibility Migration
- Phase 7F.1 — Hosted Gen2 UI Flexibility and Trend Charting
- Phase 7H - MVP Field Deployment Backlog Rebaseline
- Phase 7I - Hosted Measurement Trust & Plausibility Guardrails
- Phase 7J - Official Pinout, Wiring, and From-To Documentation
- Phase 7K - Hosted At-a-Glance Measurement Trends
- Phase 7L - MVP Setup / Provisioning Boundary
- Phase 7M - Sensor Upgrade Decision Matrix
- Phase 7N - Sensor Calibration / Measurement-System Evaluation
- Phase 7P - Hardware Safety Maturity
- Phase 7Q - Pilot Deployment Package

Out of scope:

- Firmware code changes.
- Firmware upload.
- Frontend runtime behavior changes.
- Supabase SQL changes.
- Creating `sensor_measurements`.
- Adding BME280, DS18B20, VEML6030, light, pressure, soil temperature, reservoir level, flow, PAR, or extra moisture readings into `SensorLogRow.data`.
- Changing watering duration, watering threshold, cooldown, moisture mapping, automatic watering logic, Manual Water Now behavior, hosted-readonly boundary, Supabase command/control boundary, or existing Gen1 local control safety.
- Changing the installed balcony unit's relay/pump control design in this phase.

## Phase 7B - Gen2 Bench Platform Bring-Up - RUNTIME VALIDATED / COMPLETE

Scope:

- Added `bench-proto-gen2` as the Gen2 bench PlatformIO profile.
- Kept `bench-prototype` as the retained Gen1 fallback/reference PlatformIO profile.
- The physical bench ESP32 UUID remains `318fab98-89ad-4f36-9100-3134a04e0be5`.
- The physical bench ESP32 is now acting as the Gen2 mule after Gen2 rewire and `bench-proto-gen2` flash.
- Added local Gen2 `/capabilities` and `/measurements` endpoints.
- For Gen2, `/measurements` is authoritative for measurement data.
- `/logs` remains a Gen1 compatibility endpoint and is intentionally not registered for `bench-proto-gen2`; it returns `404` on the Gen2 bench.
- Added Gen2 not-found observability that identified external legacy `/logs` polling after old tabs/Vite were closed.
- Added modular Gen2 support for BME280, DS18B20, VEML6030, and analog soil moisture.
- BME280 emits `air_temperature`, `relative_humidity`, and `barometric_pressure`.
- DS18B20 emits `temperature`.
- VEML6030 emits `ambient_light`.
- Analog soil moisture emits `moisture_index` and `raw_adc`.
- Gen2 I2C scan reports `0x48` and `0x76`.
- All Gen2 measurement records are `control_eligible:false`.
- Phase 7B Gen2 measurements are local-only.
- No `public.sensor_measurements` table exists yet.
- Gen2 no longer runs the legacy DHT / `sensor_logs` / automatic-watering interval block.
- Device heartbeats continue posting with `details.phase = "7B"`.
- On `bench-proto-gen2`, `/water-now` remains the simulated production watering endpoint and toggles the GPIO25 bench output through `RELAY_PIN`; no pump is attached.
- Earlier Phase 6J relay-test wording remains historical Gen1 bench safety language. Phase 7B intentionally keeps watering terminology for `bench-proto-gen2` because the bench now simulates the production watering function while remaining physically pump-free.
- The protected untracked CSV `field_readings/phase6k1_b3e1_vs_b6e2_60s_watering_response_20260521_180127.csv` remains untouched.

Validation:

- `/status` works.
- `/capabilities` works.
- `/measurements` works.
- `/logs` returns `404` because it is not registered for Gen2.
- BME280, DS18B20, VEML6030, analog soil moisture, and I2C scan diagnostics were runtime validated on the Gen2 bench mule.

Out of scope:

- `SensorLogRow` changes.
- Supabase SQL changes.
- Creating `public.sensor_measurements`.
- Hosted dashboard changes.
- Frontend runtime changes.
- Supabase command/control or Remote Water Now.
- Installed balcony controller upload.
- Scout upload.
- Adding Gen2 measurement values to `SensorLogRow.data`.

## Phase 7C - Live Measurements Local Frontend MVP - RUNTIME VALIDATED / COMPLETE

Scope:

- Added local-only `LiveMeasurements` frontend component with user-facing title `Live Measurements`.
- Added local-only types/API helpers for `/status`, `/capabilities`, and `/measurements`.
- Added local default-mode rendering only.
- Preserved existing `LiveStats` `/logs` path.
- Preserved hosted-readonly guardrails.
- Moved technical diagnostics, module details, and raw records behind collapsed advanced sections after visual review.
- Kept `Water Now` wording and `/water-now` semantics for bench simulation with no pump attached.

Validation:

- Runtime validation passed against `bench-proto-gen2` at `10.0.0.192`.
- Rendered BME280 `air_temperature`, BME280 `relative_humidity`, and BME280 `barometric_pressure`.
- Rendered DS18B20 `temperature`.
- Rendered VEML6030 `ambient_light`.
- Rendered analog soil moisture `moisture_index` and `raw_adc`.
- Hosted-readonly production bundle guardrail scan passed and did not bundle local Live Measurements, bench IP, local endpoint strings, `/logs`, or `/water-now`.

Out of scope:

- No measurement storage was created.
- No `public.sensor_measurements`.
- No `SensorLogRow` change.
- No SQL change.
- No firmware change.
- No hosted-readonly behavior change.
- No watering behavior change.
- Protected CSV remained untouched.

## Phase 7D - Gen2 Measurement Batch Storage MVP - RUNTIME VALIDATED / COMPLETE

Scope:

- Added ADR 0017 for Gen2 measurement batch storage.
- Added SQL artifact `docs/sql/phase7d-sensor-measurement-batches.sql`.
- Gen2 raw measurement storage uses `public.sensor_measurement_batches`.
- One database row equals one complete Gen2 `/measurements` package from one device at one measured time.
- The full `records[]` array is stored as `jsonb`.
- Added `public.sensor_measurements_flat` as the derived chart/query view that unnests `records[]`.
- Firmware posts one batch object to `/rest/v1/sensor_measurement_batches`.
- Registry-backed RLS uses `public.is_device_telemetry_insert_enabled(device_id)`.
- Phase 7D adds no anon SELECT, UPDATE, or DELETE policies.
- Hosted read-only measurement display remains deferred to a future frontend phase.
- JSONB/GIN indexing on `records` is deferred until real query patterns justify it.
- Unique physical sensor inventory / sensor assignment tracking is deferred to a later phase.
- `sensor_events` remains an operational note log, not the source of truth for defining installed physical sensors.

Validation:

- Supabase SQL validation passed for `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, manual owner/admin insert, flat-view expansion, and registry helper behavior.
- `bench-proto-gen2` uploaded successfully to COM5; no other firmware environment was uploaded.
- Firmware batch insert validated on bench UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Validated firmware batch had `record_count = 7`, `device_role = bench`, `source_endpoint = /measurements`, and `batch_details` `{"phase":"7D","source":"firmware","post_cadence_ms":900000}`.
- Validated measurement names: `air_temperature`, `relative_humidity`, `barometric_pressure`, `temperature`, `ambient_light`, `moisture_index`, and `raw_adc`.
- All current Gen2 records remain `control_eligible:false`.
- Initial runtime boot Wi-Fi timed out and firmware continued in local-control/offline mode; Wi-Fi later recovered because measurement batch POST and heartbeat POST succeeded.
- Codex/workstation HTTP checks to `10.0.0.192:80` failed even though browser/serial evidence showed Gen2 runtime activity.
- Serial showed an unexpected external `Manual watering triggered` event during validation, likely from an open local UI or other local client still targeting the bench; no pump is attached to the bench, and this is not a Phase 7D blocker.
- The earlier abandoned long/narrow `public.sensor_measurements` validation table was cleaned up manually in Supabase if Jeremy confirms it has been dropped.

Out of scope:

- `SensorLogRow` changes.
- `sensor_logs` changes.
- Gen1 `/logs` behavior changes.
- `/water-now` semantics changes.
- Hosted read-only UI changes.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering logic, or control eligibility changes.
- Making any new sensor control watering.
- JSONB/GIN indexing on `records`.
- Unique physical sensor inventory / assignment tracking.

## Phase 7E - Field Units Gen2 Compatibility Migration - RUNTIME VALIDATED / COMPLETE PENDING COMMIT

Scope:

- Added the installed field-controller Gen2 profile `balcony-installed-gen2` while preserving installed UUID `550e8400-e29b-41d4-a716-446655440000` and role `controller`.
- Moved Balcony Sensor Scout 01 to Gen2 under `balcony-sensor-scout-01`, preserving UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e` and role `sensor-scout`.
- Aligned Gen2-capable profiles to the standard Gen2 pin map: GPIO25 relay/pump output, GPIO34 analog soil moisture, GPIO21 I2C SDA, GPIO22 I2C SCL, GPIO26 DHT11 / non-I2C auxiliary digital sensor, and GPIO27 DS18B20 / OneWire future soil temperature.
- Aligned `bench-proto-gen2` to the standard Gen2 pin map and made `bench-prototype` explicitly declare the relevant standard pins while keeping it non-Gen2.
- Added Gen2 DHT11 support emitting `air_temperature` in `F` and `relative_humidity` in `%`.
- Reused the Gen2 analog soil module emitting `moisture_index` and `raw_adc`.
- Added capability-gated watering authority separate from `MBG_GEN2_ENABLED`.
- Installed `Balcony01` remains watering-capable; Scout `Scout01` remains non-watering.
- Added firmware/build provenance: `firmware_version`, `build_profile`, and compile-time `device_label`.
- Added short display labels `Balcony01`, `Scout01`, and `Prototype01` for endpoint readability only. These are not user-editable names or database-driven nicknames.
- Added `device_label`, `firmware_version`, and `build_profile` to local endpoint responses where applicable.
- Gen2 batch posts now include top-level `firmware_version` and `build_profile`, plus `batch_details.phase = "7E"` and `batch_details.device_label`.
- Installed/scout Gen2 retain `/logs` temporarily through `MBG_GEN2_ENABLE_LEGACY_LOGS=1` to protect current local scripts/UI during migration.
- `bench-proto-gen2` intentionally keeps `/logs` absent.
- Hosted Gen2 read-only measurement display remains deferred to a future frontend phase.

Validation:

- Installed / `Balcony01` validated at `10.0.0.200` after upload with UUID `550e8400-e29b-41d4-a716-446655440000`, role `controller`, build profile `balcony-installed-gen2`, and firmware version `phase7e-gen2-compat`.
- Installed local endpoints `/`, `/status`, `/capabilities`, `/measurements`, and `/logs` validated.
- Installed `/measurements` returns `air_temperature`, `relative_humidity`, `moisture_index`, and `raw_adc`.
- Installed `moisture_index` is the only `control_eligible:true` measurement; DHT11 records and `raw_adc` are `control_eligible:false`.
- Scout / `Scout01` validated at `10.0.0.180` after upload with UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, role `sensor-scout`, build profile `balcony-sensor-scout-01`, and firmware version `phase7e-gen2-compat`.
- Scout local endpoints `/`, `/status`, `/capabilities`, `/measurements`, and `/logs` validated.
- Scout `/measurements` returns `air_temperature`, `relative_humidity`, `moisture_index`, and `raw_adc`.
- All scout measurements are `control_eligible:false`.
- Installed and scout `/logs` retained legacy nested `data` shape with added top-level identity fields.
- A Gen2 installed-controller firmware batch posted successfully to `public.sensor_measurement_batches`, and the flat-view validation matched record counts.
- `/water-now` was not called during final label/provenance validation.

Known deferred wart:

- Immediately after reboot, Gen2 DHT11 `/measurements` may show suspicious startup values around `32.72°F / 0%`.
- Later `/measurements` samples and `/logs` are plausible.
- DHT11 startup read qualification is deferred and is not a Phase 7E blocker because DHT11 records are not watering control inputs.

Out of scope:

- Frontend changes.
- Hosted Gen2 read-only display.
- Supabase SQL changes.
- `SensorLogRow` changes.
- `sensor_logs` changes.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering semantics, or `/water-now` semantics changes.
- Runtime provisioning, pump detection, diagnostic watering endpoints, or startup relay tests.
- The currently running two-device watering-response capture; those CSV results support later calibration/control-quality work and are not Phase 7E closeout evidence.

## Phase 7F.1 - Hosted Gen2 UI Flexibility and Trend Charting - RUNTIME/BROWSER VALIDATED / COMPLETE PENDING COMMIT

Scope:

- Added SQL artifact `docs/sql/phase7f-hosted-gen2-measurements-view.sql`.
- Added limited hosted read-only view `public.hosted_gen2_measurements`.
- Kept hosted Gen2 display on the approved Supabase read path only.
- Kept anon SELECT unavailable on `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, and `public.device_registry`.
- Added hosted-only frontend `HostedGen2Measurements` and separate Gen2-aware `HostedGen2TrendChart`.
- Made hosted Gen2 UI measurement-driven so all numeric hosted Gen2 measurements returned by `public.hosted_gen2_measurements` can display with friendly frontend labels.
- Kept `DualAxisChart` Gen1-only and did not expand `SensorLogRow` or add Gen2 measurements to `sensor_logs.data`.
- Added Gen2 Trend multi-measurement overlay using toggle pills.
- Added dynamic Y-axis groups, color-coded axes matching chart series/legend, and expert overlay mode with multiple right-side axes.
- Added display-only useful domains for temperature (`20-100F`) and barometric pressure (environmentally realistic hPa range with real-data expansion as needed).
- Prevented Gen2 Trend flashing during hosted background refresh.
- Renamed `Gen2 Measurements` to `Live Measurements`.
- Removed the device/unit name line and hosted read-only pill from the Live Measurements container.
- Renamed `Latest batch` to `Last Reading`.
- Collapsed engineering details by default while preserving sensor key, sensor type, valid, quality, reason, and control eligibility behind details.
- Added gardener-facing card status styling for Good, Watch, Check, and Neutral/category states, with full-card background/border status color.
- Prevented Live Measurements cards from clearing, flashing, jumping, or rebuilding during normal hosted refresh.
- Removed the duplicate Raw ADC callout, Raw ADC disclaimer/callout, and Recent Gen2 samples table; Raw ADC remains a normal diagnostic measurement card.

Validation:

- Supabase manual validation confirmed `public.hosted_gen2_measurements` exists and returns Gen2 rows for `Balcony01` and `Scout01`.
- Anon privilege validation returned `true, false, false, false`: anon can select `public.hosted_gen2_measurements`, and anon cannot select `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, or `public.device_registry`.
- Browser validation confirmed hosted/read-only mode is visible.
- Browser validation confirmed `LiveStats`, Water Now, and local ESP32 control UI are not visible.
- Browser validation confirmed existing Gen1 Sensor History still renders.
- Browser validation confirmed Device and Window selectors still work.
- Browser validation confirmed simplified selector labels `Balcony01`, `Scout01`, and `Prototype01`.
- Browser validation confirmed Gen2 Trend renders, trend toggles work, expert overlay mode works, and the chart does not flash during refresh.
- Browser validation confirmed `Live Measurements` renders, `Last Reading` is present, details are collapsed by default, full-card status colors are visible, cards do not jump/rebuild during refresh, duplicate Raw ADC callout is gone, and Recent Gen2 samples table is gone.
- Browser validation confirmed `Balcony01` moisture index shows control eligibility as local firmware evidence only.
- Browser validation confirmed `Scout01` shows control eligibility false as local firmware evidence only.
- Network guardrail validation observed Supabase REST requests to `hosted_gen2_measurements`.
- Network guardrail validation observed no `/logs`, `/water-now`, or local ESP32 IP calls in hosted-readonly mode.
- Connectivity concern from earlier local preview testing was resolved with successful DNS, TCP 443, and HTTP checks against `nkicadvdjpcjhkoluvwf.supabase.co`.
- `npm.cmd run lint` passed.
- Hosted-readonly build passed.
- Hosted forbidden bundle scan returned no matches.
- Approved hosted view string `hosted_gen2_measurements` appeared in the hosted bundle as expected.

Out of scope:

- Firmware changes.
- SQL/RLS changes during Phase 7F.1.
- `SensorLogRow` changes.
- `sensor_logs` changes.
- `DualAxisChart` behavior changes.
- Gen2 calibration or control eligibility changes.
- Sensor assignment or location UI.
- Clean View / Expert View split, seasonal axis presets, or custom axis-label rail.
- Treating Raw ADC as calibrated moisture.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering logic, `/water-now`, or local pump/control behavior changes.
- Real moisture thresholds and control eligibility remain future validation/calibration work.

## Phase 7F.3 - Hosted Device Status Gen2 Freshness Fix - VALIDATED / COMPLETE PENDING COMMIT

Scope:

- Hosted-readonly `Device Status` now uses already-fetched `hostedGen2Rows` from `public.hosted_gen2_measurements` for the selected device/window.
- Gen1/Sensor History `sensor_logs` status assumptions remain available for Gen1/local/history compatibility, but they are no longer the hosted Gen2 Device Status source.
- Gen2 status freshness uses unique parseable `measured_at` report samples, the existing 45-minute freshness threshold, 15-minute expected sample cadence, unique-sample coverage, and largest sample gap.
- Gen2 measurement-quality warnings are based on Gen2 metadata such as `valid`, `quality`, `reason`, and displayability.
- Gen2 status does not diagnose plant health, diagnose sensor root cause, treat Raw ADC as calibrated moisture, or use `control_eligible` as command/control.
- Optional Gen2 sensors remain optional; the status does not require every possible Gen2 sensor to be present.
- The hosted dashboard remains read-only.

Validation:

- `npm.cmd run lint` passed.
- Hosted-readonly build passed.
- Hosted forbidden bundle scan returned no matches.
- Approved hosted view string `hosted_gen2_measurements` appeared in the hosted bundle as expected.
- Source guardrail scan found no reads from `sensor_measurement_batches`, `sensor_measurements_flat`, or `device_registry` in `mbg_dashboard/src`.
- Source guardrail scan found no `SensorLogRow` usage in hosted Gen2 display/trend/display-helper/type files.
- `DualAxisChart.tsx` remained unchanged.

Out of scope:

- New Supabase queries.
- SQL/RLS changes.
- Firmware changes.
- `SensorLogRow` changes.
- `DualAxisChart` changes.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering logic, `/water-now`, or local pump/control behavior changes.

## Phase 7G.0 - Field Gen2 Soil Temperature and Scout BME280 Swap - VALIDATED / COMPLETE PENDING COMMIT

Scope:

- `balcony-installed-gen2` keeps DHT11 enabled, keeps BME280 disabled, enables DS18B20 on GPIO27, and keeps analog soil moisture enabled.
- `balcony-sensor-scout-01` disables DHT11, enables BME280 on GPIO21/GPIO22, enables DS18B20 on GPIO27, and keeps analog soil moisture enabled.
- Scout remains non-watering with `pump_control_available:false`, `device_can_water:false`, and all Scout Gen2 measurement records `control_eligible:false`.
- Balcony01 remains watering-capable with existing watering behavior unchanged; installed `moisture_index` remains the only `control_eligible:true` Gen2 measurement.
- Scout avoids duplicate `air_temperature` and `relative_humidity` records by keeping DHT11 disabled while BME280 is enabled.
- Scout `/logs` preserves the legacy nested `data.temperature` / `data.humidity` response shape by sourcing those fields from BME280 when DHT11 is disabled and BME280 is enabled.
- `/logs` does not add pressure or soil temperature, `SensorLogRow` is unchanged, and BME280 pressure plus DS18B20 soil temperature stay on the Gen2 `/measurements` path.
- Bench `bench-proto-gen2` keeps BME280, DS18B20, VEML6030, soil moisture support, and existing `/water-now` semantics.
- Field dependencies mirror the existing bench Gen2 library names/versions for the newly enabled BME280/DS18B20 modules.

Validation:

- Firmware compile validation passed for `balcony-installed-gen2`, `balcony-sensor-scout-01`, and `bench-proto-gen2`.
- Scout01 field validation on 2026-05-31 at `10.0.0.180` confirmed UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, profile `balcony-sensor-scout-01`, firmware `phase7e-gen2-compat`, role `sensor-scout`, I2C enabled on GPIO21/GPIO22, I2C scan `0x76`, BME02/BME280 detected at `0x76`, ST02/DS18B20 detected on GPIO27 with `device_count:1`, analog soil readings present, and all Scout01 records `control_eligible:false`.
- Scout01 good validation readings included BME02 `air_temperature` `76.44°F`, BME02 `relative_humidity` `90.29%`, BME02 `barometric_pressure` `1016.10 hPa`, ST02 soil temperature `77.79°F`, `moisture_index` `67`, and `raw_adc` `2031`.
- Balcony01 field validation on 2026-06-01 at `10.0.0.200` confirmed UUID `550e8400-e29b-41d4-a716-446655440000`, profile `balcony-installed-gen2`, firmware `phase7e-gen2-compat`, role `controller`, DHT01 on GPIO26, ST03/DS18B20 on GPIO27 with `device_count:1`, analog soil moisture on GPIO34, pump output GPIO25, `pump_control_available:true`, and `device_can_water:true`.
- Balcony01 settled good sample at `2026-06-01T16:29:59Z` included DHT01 `air_temperature` `77.90°F`, DHT01 `relative_humidity` `26.00%`, ST03 soil temperature `72.61°F`, `moisture_index` `79`, and `raw_adc` `1744`.
- The initial Balcony01 ST03 null/read_failed sample after flash is documented as a startup/settling wart similar to the known DHT startup behavior, not a hard sensor failure.
- Timestamp hygiene validation confirmed `/status.reported_at`, `/capabilities.reported_at`, and `/measurements.measured_at` semantics. Balcony01 validation observed `/status.reported_at` `2026-06-01T16:23:48Z`, `/capabilities.reported_at` `2026-06-01T16:23:48Z`, and `/measurements.measured_at` `2026-06-01T16:23:50Z`.
- Hosted Gen2 measurement display automatically discovered Scout01 Soil Temperature and Barometric Pressure after a good Gen2 batch and Balcony01 Soil Temperature after a good Gen2 batch.
- A Supabase `sensor_events` marker was uploaded for the Gen2 field-ready baseline before calibration/control validation.
- Phase 7G.0 added no watering/control/schema/frontend behavior changes beyond the local endpoint timestamp hygiene API addition.

Out of scope:

- Frontend changes.
- `DualAxisChart` changes.
- Supabase SQL/RLS changes.
- `SensorLogRow` changes.
- `sensor_logs` shape changes.
- Pressure or soil temperature in `/logs`.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, quiet hours, automatic watering logic, relay/pump pins, sensor pins, or `/water-now` behavior changes.
- New ADR; this remains inside the existing Gen2 modular sensor architecture boundary.

## Phase 7G.1 - Calibration / Control Validation Baseline - DOCUMENTATION/QUERY BASELINE IN PROGRESS

Scope:

- Add a field-test/control-validation protocol document for Gen2 calibration and watering-control evidence.
- Add a read-only SQL analysis artifact for hosted-safe and owner/admin calibration/control-validation queries.
- Preserve the existing architecture boundary: local ESP32 firmware owns watering decisions and pump shutoff; Supabase remains telemetry/history/diagnostics storage only.

Out of scope:

- Firmware changes.
- Frontend runtime changes.
- SQL schema/RLS changes.
- Pin, sensor, device ID, watering duration, `MOISTURE_THRESHOLD`, cooldown, moisture mapping, or control eligibility changes.
- Supabase command/control or Remote Water Now.

## Phase 7G.4 - Gen2 Local Control-Quality Gates Firmware Implementation - COMMITTED / BUILD-VALIDATED ONLY

Scope:

- Phase 7G.4 implemented local Gen2 automatic watering control-quality gates in `src/main.cpp`.
- The gates are automatic-watering-only and do not block Manual Water Now.
- The implementation adds startup/settling, startup qualified sample count, latest local sample freshness, post-watering exclusion, and 2-of-3 repeated low-reading validation before the existing automatic watering path.
- The existing `MOISTURE_THRESHOLD`, `WATERING_DURATION_MS`, `WATERING_COOLDOWN_MS`, `LOG_INTERVAL_MS`, moisture mapping, raw ADC mapping, pins, sensors, device IDs, Gen2 metadata wording, and `control_eligible` behavior were not changed.
- Post-watering exclusion is `300000` ms / 5 minutes.
- Existing automatic cooldown remains unchanged at the tracked/default `900000` ms / 15 minutes, subject to ignored local config overrides.
- Build validation passed for `balcony-installed-gen2`, `balcony-sensor-scout-01`, and `bench-proto-gen2`.
- No firmware upload occurred.
- No runtime validation occurred.
- No frontend, SQL/RLS, hosted, CSV, Support-folder, or `src/config.h` changes were made.
- Runtime validation is deferred to Phase 7G.5.

Out of scope:

- Firmware upload.
- Runtime validation on Balcony01, Scout01, or Prototype01.
- Frontend changes.
- SQL/RLS changes.
- Hosted behavior changes.
- CSV or Support-folder export changes.
- `src/config.h` changes.
- Threshold, watering duration, cooldown, cadence, mapping, pin, sensor, device ID, Gen2 metadata wording, or `control_eligible` changes.

## Phase 7G.5 - Gen2 Local Control-Quality Gates Runtime Validation - COMPLETE AND PRESENT ON MAIN

Scope:

- Phase 7G.5 runtime-validated the Phase 7G.4 local Gen2 automatic watering control-quality gate firmware on the field/controller, sensor-scout, and bench-prototype profiles.
- Branch `phase7g5-gen2-control-quality-gates-runtime-validation` started from a clean `main` baseline at `a8766ef Document Phase 7G.4 firmware implementation closeout`.
- Build validation passed for `balcony-installed-gen2`, `balcony-sensor-scout-01`, and `bench-proto-gen2`.
- The reported firmware version string intentionally remains `phase7e-gen2-compat` even though the Phase 7G.4 control-quality-gate code is now uploaded.

Prototype01 smoke/runtime validation:

- Uploaded `bench-proto-gen2` to COM5 successfully as a lower-risk smoke/runtime validation target before Balcony01.
- Prototype01 returned UUID `318fab98-89ad-4f36-9100-3134a04e0be5`, label `Prototype01`, role `bench`, build profile `bench-proto-gen2`, and IP `10.0.0.192`.
- `/status`, `/capabilities`, and `/measurements` worked.
- The bench profile intentionally reports `pump_control_available:true`, `device_can_water:true`, and `watering_simulation_available:true`; it remains pump-free physical bench hardware.
- Prototype01 `moisture_index` was the only `control_eligible:true` measurement.
- No `/water-now` call occurred, and no unintended watering or relay activity was observed.
- Serial gate messages were not captured during the observation window, consistent with the 15-minute cadence and no forced trigger condition.

Balcony01 runtime validation:

- Uploaded `balcony-installed-gen2` successfully.
- Balcony01 returned UUID `550e8400-e29b-41d4-a716-446655440000`, label `Balcony01`, role `controller`, build profile `balcony-installed-gen2`, and IP `10.0.0.200`.
- `/status`, `/capabilities`, `/measurements`, and `/logs` worked.
- Balcony01 reported `pump_control_available:true`, `device_can_water:true`, `currently_watering:false`, `lastWateredTime:"N/A"`, and `lastWateringDuration:0`.
- Balcony01 `moisture_index` remained the only `control_eligible:true` measurement; DHT01, ST03 soil temperature, and raw ADC remained `control_eligible:false`.
- ST03 initially had a startup `read_failed` sample, then settled to valid/good/read_ok; settled ST03 evidence included `77.11 F`, `valid:true`, `quality:"good"`, and `reason:"read_ok"`.
- Passive checks after more than two 15-minute cadence windows showed no unintended automatic watering while moisture index remained high around `79`.
- No Manual Water Now call occurred.

Scout01 runtime validation:

- Uploaded `balcony-sensor-scout-01` successfully.
- Scout01 returned UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, label `Scout01`, role `sensor-scout`, build profile `balcony-sensor-scout-01`, and IP `10.0.0.180`.
- `/status`, `/capabilities`, `/measurements`, and `/logs` worked.
- Scout01 reported `pump_control_available:false`, `device_can_water:false`, and `currently_watering:false`.
- All Scout01 measurements remained `control_eligible:false`; Scout01 did not gain watering authority.
- ST02 initially had a startup `read_failed` sample, then settled to valid/good/read_ok; settled ST02 evidence included `77.45 F`, `valid:true`, `quality:"good"`, and `reason:"read_ok"`.

Explicit validation limitations:

- Startup settling gate was not directly observed in serial because the 15-minute cadence means the first automatic-control pass occurs after the 60-second startup-settling window.
- Freshness gate was validated by static inspection and normal runtime operation, not by artificial delay injection.
- Repeated low-reading automatic start was not forced because field moisture was high.
- Post-watering exclusion was not physically exercised because `/water-now` was not called.
- Manual Water Now separation was validated by code inspection, not by a physical pump event in this phase.
- No Supabase command/control or Remote Water Now was introduced.

Known continuing observations:

- Balcony01 DHT01 humidity remains implausibly low compared with Scout01 BME280 humidity, supporting the existing view that DHT01 is not trustworthy. This is not a control blocker because DHT01 is not control-eligible.
- The reported `firmware_version` remains `phase7e-gen2-compat`; do not change metadata wording in this phase.

Out of scope:

- Firmware changes.
- Frontend changes.
- SQL/RLS changes.
- Hosted behavior changes.
- CSV or Support-folder export changes.
- `src/config.h` changes.
- Threshold, watering duration, cooldown, cadence, mapping, pin, sensor, device ID, Gen2 metadata wording, or `control_eligible` changes.
- `/water-now` behavior changes or Manual Water Now runtime activation.

## Device Roles / Sensor-Only Telemetry Unit

This former future-work heading is superseded by the Phase 7L MVP Setup / Provisioning Boundary and Phase 7Q Pilot Deployment Package sections below. Scout01 remains evidence-only / non-watering, and only properly equipped local firmware may own watering control.

## Phase 7H - MVP Field Deployment Backlog Rebaseline - DOCUMENTATION / PLANNING ONLY

Purpose:

- Rebaseline the future backlog around sellable/pilot field deployment readiness.
- Answer the deployment question: what must be true before MBG can be deployed at someone else's balcony without Jeremy babysitting it?
- Make clear that the next priority is field deployability, not sensor expansion by inertia.

Rebaseline principles:

- Sellable MVP readiness outranks sensor expansion.
- Customer-facing trust and dashboard clarity are MVP-critical.
- Official build/service documentation is MVP-critical.
- Installer/setup/provisioning workflow is MVP-critical.
- Sensor upgrade decisions should come before deep calibration.
- Calibration should happen after the sensor upgrade decision matrix unless Jeremy explicitly chooses to calibrate the current analog sensor for short-term evidence only.
- Hardware safety maturity is a deployability track, not optional polish.
- Future product enhancements should be separated from pilot/MVP deployment requirements.

Current evidence and limitations:

- Phase 7G.5 completed the first runtime validation of Gen2 local control-quality gates.
- The system is safer than it was before Phase 7G.4/7G.5.
- The system is still not fully proven as unattended commercial hardware.
- Startup-settling, repeated low-reading, post-watering exclusion, and Manual Water Now separation still have the explicit validation limitations documented in Phase 7G.5.
- This phase changes documentation/planning only and does not approve firmware, frontend, SQL/RLS, hosted, runtime, sensor, hardware, configuration, or command/control changes.

## Phase 7I - Hosted Measurement Trust & Plausibility Guardrails

Scope:

- Improve customer-facing hosted measurement trust before making the dashboard more visually authoritative.
- Suppress known-bad values or mark them with clear warnings.
- Avoid presenting impossible or implausible readings as normal.
- Treat Balcony01 DHT01 humidity as a known trust issue.
- Use Gen2 metadata such as `valid`, `quality`, `reason`, and displayability.
- Keep hosted status informational only.
- Do not diagnose plant health.
- Do not diagnose root cause unless supported by evidence.
- Do not use `control_eligible` as command/control.

Out of scope:

- New Supabase queries unless a later implementation phase approves them.
- Any hosted command/control.
- Remote Water Now.
- Local ESP32 endpoint calls from hosted-readonly mode.
- Treating hosted status as watering authority.

## Phase 7J - Official Pinout, Wiring, and From-To Documentation

Scope:

- Create official build/service documentation for MVP field deployment.
- Document the Gen2 pinout.
- Document physical sensor-to-controller wiring.
- Document relay/pump wiring.
- Document power wiring.
- Document the short local I2C cable standard.
- Document OneWire / DS18B20 wiring.
- Document analog moisture wiring.
- Create a controller-to-field-device From-To table.
- Document sensor IDs and physical assignment.
- Define connector/cable labeling expectations.
- Add an install/service validation checklist.

The documentation should distinguish:

- Architecture-level pin map.
- Current physical deployed wiring.
- Future production wiring standard.
- Temporary prototype/scout wiring.
- Retired/deprecated wiring such as GPIO5 for future Gen2 relay/pump control.

Out of scope:

- Changing pins.
- Changing hardware configuration.
- Creating the full pinout/from-to document without explicit approval.

## Phase 7K - Hosted At-a-Glance Measurement Trends

Scope:

- Make hosted measurement cards more informative at a glance.
- Add small trend visuals such as a sparkline per measurement card.
- Add trend direction context such as rising, falling, flat, or insufficient data.
- Add short time-window context such as 3h, 12h, or 24h.
- Pair "last reading" with "recent behavior".
- Integrate trend context with Good / Watch / Check card states.
- Avoid presenting known unrealistic values as normal trends.

Out of scope:

- Command/control.
- Local ESP32 endpoint calls.
- Making bad or implausible data look more authoritative.

## Phase 7L - MVP Setup / Provisioning Boundary

Scope:

- Define the installer/customer setup boundary needed before MBG can leave Jeremy's bench/balcony.
- Define device identity assignment expectations.
- Define friendly name/location assignment expectations.
- Define the Wi-Fi setup boundary.
- Preserve local-only control authority.
- Prevent accidental Scout01 watering authority.
- Define registry/provisioned-device expectations.
- Separate compile-time/profile-driven values from field-configurable values.
- Identify what must wait for a later provisioning system.

Out of scope:

- Supabase command/control.
- Remote Water Now.
- Accidental promotion of sensor-only devices to watering authority.
- Full production fleet management.

## Phase 7M - Sensor Upgrade Decision Matrix

Scope:

- Compare candidate sensors before deep calibration work.
- Preserve that Jeremy has not yet purchased new sensors.
- Track likely IP68 DFRobot light sensors as future light-mapping candidates.
- Track DFRobot SEN0308 as a strong candidate upgrade to the current analog moisture sensors.
- Track liquid level, flow, leak, pump-current, and other product-safety/serviceability sensors as candidates.
- Treat candidate sensors as evaluation items, not approved implementation work.
- Separate plant-insight telemetry from watering safety.
- Evaluate soil moisture sensor upgrades before deep calibration work.
- Treat liquid level, flow, leak, and pump-current sensing as product-safety/serviceability candidates.

Out of scope:

- Purchasing or installing sensors by documentation implication.
- Treating light sensing as watering safety.
- Approving firmware, hardware, SQL/RLS, or hosted changes.

## Phase 7N - Sensor Calibration / Measurement-System Evaluation

Scope:

- Compare current analog moisture sensors and any approved upgrade candidates.
- Perform gage R&R or a suitable measurement-system evaluation.
- Inspect raw ADC behavior.
- Distinguish display moisture index from validated control input.
- Determine whether software adjustment, filtering, sensor replacement, or no action is appropriate.

Out of scope:

- Changing `MOISTURE_THRESHOLD` without evidence and explicit approval.
- Changing moisture scaling without documentation and approval.
- Bundling watering-duration changes into calibration unless explicitly approved.

## Phase 7P - Hardware Safety Maturity

Scope:

- Treat hardware safety maturity as field deployability and product safety work, not optional polish.
- Evaluate reservoir low-water / dry-run protection.
- Evaluate leak detection.
- Evaluate overflow detection.
- Evaluate flow sensing.
- Evaluate pump-current sensing.
- Evaluate disconnected tubing detection.
- Evaluate blocked outlet detection.
- Gather physical failure/serviceability evidence.

Out of scope:

- Treating MVP as fully unattended-safe before hardware protections are validated.
- Changing watering duration, pins, firmware, or hardware configuration without explicit approval.

## Phase 7Q - Pilot Deployment Package

Scope:

- Assemble the complete pilot deployment bundle.
- Add an install checklist.
- Add a service checklist.
- Add a troubleshooting workflow.
- Link the pinout/from-to reference once created.
- Add a provisioning/setup checklist.
- Define customer-facing dashboard trust rules.
- Define field validation acceptance criteria.
- Document known limitations.
- Define the support workflow.
- Define what "safe enough for a supervised pilot" means.

Out of scope:

- Claiming unattended commercial readiness before Phase 7I through Phase 7P evidence supports it.
- Supabase command/control.
- Remote Water Now.

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

## Deferred Non-Roadmap Notes Superseded By Phase 7H Rebaseline

The older standalone deferred sections for sensor calibration, provisioning/settings, and hardware safety are superseded by the Phase 7H MVP field-deployment roadmap:

- Sensor upgrade decisions move to Phase 7M.
- Sensor calibration and measurement-system evaluation move to Phase 7N.
- Setup/provisioning boundary work moves to Phase 7L.
- Hardware safety maturity moves to Phase 7P.
- Pilot packaging and support readiness move to Phase 7Q.

Hydraulic prove-out and watering scheduling remain useful future physical/product questions, but they are not approved implementation work in this rebaseline. They must not be bundled into calibration or dashboard phases, and any watering duration, quiet-hours, or scheduling change still requires explicit evidence, approval, and the normal architecture/change-control path.

## Explicitly Deferred / Not MVP

- Remote Water Now through Supabase.
- Supabase command/control.
- Using `sensor_events` for every telemetry row.
- Admin page for `sensor_events`.
- Multi-device read-only UI.
- Auth/login, settings/provisioning, alerts, and commercial production hardening.
- Full production provisioning.
- Full commercial multi-device fleet management.

