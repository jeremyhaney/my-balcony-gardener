# Current State Freeze

This file is the short operational freeze note for the repo after the Phase 2 hygiene cleanup.

## Operational Role

- This file is the changeable operational snapshot.
- Stable architecture authority lives in [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md).
- Locked architectural decisions live in [`docs/adr`](./adr).

## Authoritative Ownership

- Firmware source of truth: [`platformio.ini`](../platformio.ini), [`src`](../src), [`include`](../include)
- Frontend source of truth: [`mbg_dashboard`](../mbg_dashboard)
- Stable architecture source of truth: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- Operational documentation companion: [`README.md`](../README.md)

## Working Baseline

- Firmware compiles on BJ3.
- Frontend lints, builds, runs, and loads on BJ3.
- ESP32 is reachable locally at `10.0.0.200`.
- `GET /logs` works from BJ3, phone, and other devices on the local network when the ESP32 is powered independently from USB power.
- The UI shows live sensor values through the local ESP32 path.
- Manual Water Now works from the local site.
- ESP32 now posts current telemetry directly to Supabase `sensor_logs`.
- Supabase `sensor_logs` uses the canonical `SensorLogRow` shape with top-level `device_id`, `timestamp`, and nested `data`.
- Supabase stores firmware timestamps as UTC ISO-8601 values so the browser can render them correctly in local time.
- Read-only Supabase-backed Sensor History / graph display is restored, auto-refreshes every 10 seconds, and now displays watering-start event markers.
- Supabase `sensor_events` exists as a separate manual operational event log and was validated with manual sample events.
- The local ESP32 path still owns live/current values.
- Supabase is not used for remote command/control.
- Phase 5E kept the local ESP32 live/control path unchanged.
- ADR 0006 locks the Phase 5C watering logic and safety philosophy.
- Phase 5C cooldown firmware was uploaded to the ESP32 and field validated.
- Phase 5D telemetry logging cadence firmware was compiled, uploaded, and field validated on feature branch `phase5d-telemetry-logging-cadence`.
- Phase 5F telemetry integrity firmware compiled with `pio run`, uploaded to the ESP32, and was validated after upload.
- ESP32 rebooted cleanly after upload and after repeated USB power disconnect/reconnect cycles.
- ESP32 resumed local site reporting immediately after reconnecting to USB power; the local dashboard showed its expected unavailable warning while the ESP32 was offline and recovered after return.
- Manual Water Now still works and remains local/supervised.
- Manual Water Now can still be run again after a completed manual cycle.
- Pump still stops after approximately `15` seconds, independently from the telemetry cadence.
- Automatic watering is blocked during the cooldown and resumes after approximately `15` minutes if moisture remains below threshold.
- Supabase normal telemetry cadence now posts approximately every `15` minutes (not every 5 seconds).
- Immediate watering-start telemetry with `data.watering = true` posts to Supabase immediately upon Manual Water Now trigger.
- Immediate watering-completion telemetry with `data.watering = false` posts to Supabase immediately upon pump shutoff.
- `lastWateringDuration` is populated with the pump runtime (approximately 15 seconds) in completion telemetry.
- DHT temperature/humidity may use firmware last-known-good fallback for `/logs` and telemetry rows after at least one good DHT read.
- Soil moisture remains fresh-only for watering decisions and is not cached.
- During DHT failure, immediate watering-start and watering-completion telemetry still posts when cached DHT values exist, using cached temperature/humidity plus fresh moisture.
- Sensor History chart rows now use explicit chronological timestamp sorting before rendering.
- Watering-start rows are shown as vertical history markers using Supabase `sensor_logs.data.watering = true`.
- No frontend runtime changes were made in Phase 5C or Phase 5D; Phase 5E only updated Sensor History graph display semantics.
- Local dashboard continues to update frequently with live values from the `/logs` endpoint because the frontend polls locally.
- Supabase telemetry display is sparse at the ~15-minute cadence, with additional rows for immediate watering events.
- `sensor_events` remains a manual operational log and is unchanged; it is not used by firmware.
- Phase 6A hosted read-only dashboard was merged to `main`.
- Code commit `a7488ba Add hosted read-only dashboard mode` added the hosted read-only dashboard mode.
- Cloudflare Pages project `my-balcony-gardener` is connected to GitHub, and Production deployment from `main` is validated.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- The custom domain was moved from the obsolete old `mybalconygardener` Cloudflare Pages/Tunnel setup to the current `my-balcony-gardener` Pages project.
- Hosted read-only mode is controlled by `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted read-only mode uses `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optional `VITE_MBG_DEVICE_ID`.
- Phase 6E hosted read-only device/window controls are validated locally and on the Cloudflare custom domain.
- Hosted read-only mode renders Supabase Sensor History with Device and Window selectors and does not render `LiveStats` or Water Now.
- Hosted Device selector supports Installed Balcony Unit (`balcony`, `550e8400-e29b-41d4-a716-446655440000`) and Bench Prototype Unit (`bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`).
- Hosted Window selector supports `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`.
- Hosted URL query state supports valid combinations such as `?device=balcony&window=24h` and `?device=bench&window=7d`.
- Invalid hosted query values safely fall back to Installed Balcony Unit / `24h`.
- `VITE_MBG_DEVICE_ID` remains the fallback/default hosted device behavior.
- Hosted Supabase history queries filter server-side by selected `device_id`.
- Hosted Supabase history queries filter by selected timestamp lower bound except for `all`, which does not apply a lower timestamp bound.
- Sensor History chart X-axis labels adapt by selected history window, and chart tooltips show full date/time.
- Hosted read-only mode does not call local ESP32 `/logs` or `/water-now`.
- Hosted read-only production build scan found no `Water Now`, `/water-now`, `/logs`, or `10.0.0.200` strings after the lazy/dynamic import fix.
- Phase 6E hosted-readonly production bundle guardrail scan returned no output for `water-now`, `Water Now`, `/logs`, `Currently Watering`, `LiveStats`, `VITE_ESP32_URL`, or `VITE_WATER_ENDPOINT`.
- Custom-domain validation confirmed Garden check-in mode is visible, `LiveStats` and Water Now are hidden, Sensor History is visible, Supabase `sensor_logs` requests are visible, and there are no `/logs`, `/water-now`, or `10.0.0.200` requests.
- Phase 6B keeps installed balcony unit `device_id` `550e8400-e29b-41d4-a716-446655440000` for history continuity.
- Future ESP32 units must use unique, stable, non-null UUIDs before deployment.
- Friendly names remain separate field/user labels and are not telemetry identity.
- Phase 6B identity decision did not change watering, runtime control, or frontend behavior.
- Phase 6C adds PlatformIO build profiles for intentional prototype device identity.
- `balcony-installed` preserves UUID `550e8400-e29b-41d4-a716-446655440000`.
- `bench-prototype` uses UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- `src/device_identity.h` is tracked and contains no secrets; `src/config.h` remains ignored/local-only for Wi-Fi and Supabase secrets.
- `pio run`, `pio run -e balcony-installed`, `pio run -e bench-prototype`, and binary UUID checks passed.
- No firmware upload occurred during Phase 6C validation.
- No watering/runtime/frontend behavior changed.
- Phase 6D bench ESP32 device identity flash validation is complete.
- Bench ESP32 was flashed using the explicit PlatformIO profile command `pio run -e bench-prototype -t upload --upload-port COM5`; the generic upload command was not used.
- Bench firmware profile used UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Installed balcony unit UUID remains `550e8400-e29b-41d4-a716-446655440000`.
- Bench ESP32 booted successfully, connected to Wi-Fi, and was observed at `10.0.0.192`.
- Bench local `/logs` returned valid data with `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Initial Supabase insert failed because the `sensor_logs` RLS insert policy only allowed the installed balcony UUID.
- Supabase RLS insert policy was updated to allow both known provisioned UUIDs: `550e8400-e29b-41d4-a716-446655440000` and `318fab98-89ad-4f36-9100-3134a04e0be5`.
- After the RLS policy correction, bench telemetry posted successfully to Supabase `sensor_logs`.
- Installed balcony unit remained unaffected and continued using its original UUID.
- Bench unit is now on the BJ1 test bench, powered, and returning good `/logs` data.
- No pump was connected to the bench unit during identity validation.
- No firmware behavior changes, frontend behavior changes, or Supabase schema changes were made in Phase 6D.
- Local/default dashboard mode still renders `LiveStats`, local `/logs` polling, local Manual Water Now, and Sensor History.
- The local ESP32 live/control path and hosted read-only Supabase history path remain separate.
- Supabase remains read-only telemetry/history only and is not used for command/control.
- Phase 6E did not change firmware, Supabase schemas, `sensor_events`, the canonical `SensorLogRow` shape, watering logic, local Manual Water Now behavior, or the local live/control path.
- MVP v1.0 bench test passed.
- MVP v1.0 balcony field commissioning test passed.
- MVP v1.0 physical install is complete.
- Relay-controlled pump activation works from Manual Water Now.
- Manual Water Now and approximately `15`-second pump shutoff remain validated after Phase 5F.
- Moisture-triggered pump behavior was confirmed during field testing.

## MVP v1.0 Field Commissioning Notes

- The v1.0 relay box and ESP32 box are fully buttoned up.
- Heat shrink, grommets, and v1.0 cable/box cleanup are complete.
- The current system is ready for supervised local prove-out and data gathering.
- Sensors remain installed for v1.0 prove-out and local data visibility.
- Read-only Supabase history/graph display is restored, and current ESP32 telemetry now posts to Supabase for validation/history.
- Displayed moisture readings should currently be treated as a relative sensor index, not true volumetric soil moisture.
- Observed moisture sensor reference readings:
  - Air-dry / wiped sensor: mostly `23%`, lowest observed `22%`
  - Tap-water reference: mostly `93%`, highest observed `94%`
  - Moist soil after repeated watering tests: approximately `82%`
- `MOISTURE_THRESHOLD` was lowered from `50` to `35` for MVP installed-system safety before sensor calibration.
- No moisture scaling, compensation, or pump-duration change has been made based on these observations.
- Normal Supabase telemetry cadence is now approximately `15` minutes, with immediate watering event rows outside that cadence.
- If pump power is intentionally unplugged during wet/rainy conditions, firmware may still command watering and telemetry may show `watering: true` even though no water physically flows.

## Deferred Items

- Optional history UI/statistics improvements
- Additional Sensor History UI/statistics polish beyond Phase 6E selectors and chart label/tooltip improvements
- Additional multi-device read-only UI beyond the current hosted Device selector
- Auth/login, settings/provisioning, alerts, and commercial production hardening
- Sensor Calibration / Measurement-System Evaluation
- Hardware Safety Maturity
- Any Supabase-first or non-local live/control runtime change, only by ADR
- Any additional firmware behavior changes beyond the validated Phase 5F telemetry-integrity boundary
- Any frontend behavior changes unrelated to preserving or improving the current baseline

## Current Guardrails

- Do not break the local ESP32 live/control path while preserving the restored read-only history path.
- Do not change firmware or frontend runtime behavior unless the pass explicitly requires it.
- Keep repo changes small, reviewable, and anchored to the working BJ3 baseline.

## Safe Next Priorities

1. Continue supervised local prove-out using the working ESP32 local path.
2. Preserve the separate local live/control path and Supabase history/read path.
3. Preserve validated Supabase logging, validated manual `sensor_events`, and browser-local timestamp display before sensor comparison/calibration work.
4. Then proceed with sensor comparison, calibration, and Gage R&R-style analysis.
5. Route any future runtime/data-flow architecture change through an ADR before implementation.

## Maintenance Rule

If the current working path changes, update this file and the root [`README.md`](../README.md) in the same pass. If the approved architecture changes, add or update an ADR and update [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) as part of that same change.
