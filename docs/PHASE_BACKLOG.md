# My Balcony Gardener Phase Backlog

This document captures deferred work that should not be mixed into the current implementation phase.

It is a planning guide, not an implementation approval. Each item still requires normal inspection, design, review, validation, and commit discipline before implementation.

## Current Active Branch Context

- Current repo context: Phase 6G offline autonomy / Wi-Fi recovery on branch `phase6g-offline-autonomy-reliability`
- Current Phase 6A status: merged to `main`; Cloudflare Pages Production and custom domain validated
- Current Phase 6B status: complete; device identity and bench unit readiness convention documented
- Current Phase 6C status: complete; PlatformIO device identity build-profile bridge validated
- Current Phase 6D status: complete; bench ESP32 identity flash validation passed
- Current Phase 6E status: complete; hosted read-only Device and Window selectors validated locally and on the custom domain
- Current Phase 6F status: complete, merged to `main`, deployed, and validated on the hosted custom domain
- Current Phase 6G status: complete on branch; bench build/flash and normal Wi-Fi boot validation passed, and offline/no-Wi-Fi behavior is code-hardened and static-inspected
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
11. Phase 6G - Offline Autonomy / Wi-Fi Recovery - complete on branch
12. Advanced Sensor Health / Fault Detection
13. Sensor Calibration / Measurement-System Evaluation
14. Device Settings / Provisioning
15. Hardware Safety Maturity

Phase 5F, Phase 6A, Phase 6B, Phase 6C, Phase 6D, Phase 6E, and Phase 6F are complete and merged to `main`; Phase 6G is complete on branch pending review, commit, merge, and post-merge validation.

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

