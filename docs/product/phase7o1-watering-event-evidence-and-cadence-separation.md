# Phase 7O.1 — Watering Event Evidence and Cadence Separation Design

## Purpose

Phase 7O.1 records the design direction for making physical watering visible as trustworthy, device-originated evidence in hosted customer and support views.

This document began as the Phase 7O.1 design record and now also records the approved backend/firmware evidence-path runtime validation plus the Phase 7O.2 hosted read-only display implementation.

## Trust Gap Found

On 2026-06-05, Jeremy ran local Manual Water Now twice for two 60-second sequences on Balcony01. The baskets were physically dripping and the watering appeared thorough, but the hosted site did not register or show the watering event. The event had to be recorded manually in `sensor_events`.

The inspection found two likely root causes:

- Gen2 Balcony01 firmware can water locally while immediate legacy `sensor_logs` watering-start/completion telemetry is compiled out under `MBG_GEN2_ENABLED`.
- Authenticated hosted `/mygarden` and `/support` routes use protected Gen2 measurement and diagnostics views, not the legacy `sensor_logs` watering-marker path.

## Inspection Findings

- Local firmware tracks watering runtime state with `isWatering`, `wateringStartTime`, `lastWateringEndTime`, and `lastWateringDuration` in `src/main.cpp:61`.
- Local firmware also tracks `lastWateredTime` in `src/main.cpp:98`.
- `sendDataToSupabase()` writes legacy `sensor_logs` payload fields `data.watering`, `data.lastWateredTime`, and `data.lastWateringDuration` in `src/main.cpp:486` and `src/main.cpp:527`.
- Manual Water Now starts local watering, sets `isWatering`, sets `wateringStartTime`, and updates `lastWateredTime` in `src/main.cpp:925` and `src/main.cpp:935`.
- Immediate manual watering-start telemetry exists for the non-Gen2 legacy path, but it is wrapped in `#ifndef MBG_GEN2_ENABLED` in `src/main.cpp:941`.
- Pump shutoff remains local, bounded by `WATERING_DURATION_MS`, and updates `lastWateringDuration` in `src/main.cpp:999` and `src/main.cpp:1003`.
- Immediate watering-completion telemetry exists for the non-Gen2 legacy path, but it is also wrapped in `#ifndef MBG_GEN2_ENABLED` in `src/main.cpp:1010`.
- The `balcony-installed-gen2` profile defines Balcony01 with `MBG_GEN2_ENABLED=1`, `MBG_PUMP_CONTROL_AVAILABLE=1`, and `MBG_DEVICE_CAN_WATER=1` in `platformio.ini:38`, `platformio.ini:46`, and `platformio.ini:58`.
- Protected `/mygarden` and `/support` routes render `SensorLogViewer` with `hostedReadonlyScope="customer"` and `hostedReadonlyScope="support"` in `mbg_dashboard/src/App.tsx:187`, `mbg_dashboard/src/App.tsx:208`, and `mbg_dashboard/src/App.tsx:244`.
- Protected hosted scopes fetch authorized devices from `customer_garden_devices` or `support_garden_devices` in `mbg_dashboard/src/components/SensorLogViewer.tsx:114`.
- Protected hosted scopes fetch hosted Gen2 measurements and diagnostics in `mbg_dashboard/src/components/SensorLogViewer.tsx:170` and `mbg_dashboard/src/components/SensorLogViewer.tsx:195`.
- Protected hosted scopes do not fetch legacy `sensor_logs`; only the public demo scope calls `fetchHistoryLogs()` in `mbg_dashboard/src/components/SensorLogViewer.tsx:187`.
- `fetchHistoryLogs()` reads `sensor_logs` in `mbg_dashboard/src/api.ts:143` and `mbg_dashboard/src/api.ts:158`, but that path is not used for protected customer/support evidence.
- Customer/support protected Gen2 views expose flattened `sensor_measurements_flat` rows, not `sensor_logs`, in `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql:365` and `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql:397`.
- Customer/support protected diagnostics views expose latest heartbeat-derived fields such as `currently_watering` and `last_watering_duration` in `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql:429` and `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql:529`.
- `device_heartbeats` includes watering-related diagnostic columns, but it is an append-only health/evidence table, not a complete event log, in `docs/sql/phase6j3-device-heartbeats.sql:8` and `docs/sql/phase6j3-device-heartbeats.sql:40`.
- Hosted read-only Gen2 display uses `hosted_gen2_measurements`, which is intentionally measurement display/read evidence only, in `docs/sql/phase7f-hosted-gen2-measurements-view.sql:17`.
- Legacy `DualAxisChart` can render `sensor_logs.data.watering === true` as watering markers in `mbg_dashboard/src/components/DualAxisChart.tsx:45` and `mbg_dashboard/src/components/DualAxisChart.tsx:128`, but protected hosted customer/support routes render hosted Gen2 components instead in `mbg_dashboard/src/components/SensorLogViewer.tsx:470`.

These findings are code and artifact inspection findings. They do not prove which exact binary was running on Balcony01 during the 2026-06-05 physical watering event, but they explain the current repo-level trust gap.

## Why sensor_logs Alone Is Not Enough

`sensor_logs` remains useful and should be preserved as the legacy/current compatibility path for environmental telemetry and historical watering markers.

It is not enough by itself because:

- Current Gen2 watering-capable firmware paths compile out the immediate legacy watering-start and watering-completion posts.
- Protected customer/support hosted routes do not currently expose or render the legacy `sensor_logs` watering-marker path.
- `sensor_logs.data.watering` is a telemetry marker inside an environmental row, not a full event contract with event type, trigger source, reason, duration, firmware/build provenance, and structured details.

For MVP compatibility, future firmware can preserve `sensor_logs` watering markers. For customer/support trust, a canonical event-evidence model should not depend only on a legacy environmental telemetry row shape.

## Why sensor_events Is Not The Right Canonical Device Event Path

`sensor_events` is manual operational context. ADR 0005 defines it for sensor swaps, moves, cleaning, maintenance, experiment notes, and other human-entered context. It explicitly keeps `sensor_logs` clean and does not change firmware, watering behavior, local live/control ownership, logging cadence, or `sensor_logs`.

Using `sensor_events` as the canonical device-originated watering evidence path would blur human operational notes with device facts. It would also make manual backfill look too similar to device-originated evidence.

`sensor_events` should remain available for manual context such as "Jeremy observed dripping baskets" or "Manual note entered after missed event," but it should not become the canonical device telemetry/event table.

## Why sensor_measurement_batches Should Remain Measurement Evidence

`sensor_measurement_batches` stores one complete Gen2 `/measurements` package per device sample. It is measurement package evidence: sensors, values, validity, quality, reasons, and control eligibility.

Watering start, completion, blocked, and safety-cutoff records are state transitions. They are not ordinary sensor measurements. Encoding them as synthetic Gen2 measurement rows would make event evidence harder to query, easier to miss, and more ambiguous for customer/support history.

Gen2 measurement batches should remain measurement evidence only.

## Why device_heartbeats Should Remain Diagnostics Evidence

`device_heartbeats` is useful for latest health and runtime diagnostics. It can show whether the latest heartbeat reported `currently_watering`, recent duration, Wi-Fi status, and cloud-post health.

It is not a complete event log because:

- It posts on heartbeat cadence, not every watering state transition.
- A short watering cycle can happen between heartbeat posts.
- It summarizes latest device health rather than preserving each start/completion/block/cutoff event as a historical fact.

Heartbeats should continue to expose diagnostics and latest health evidence. They should not be the canonical watering-event history.

## Recommended Hybrid Event Model

Phase 7O.1 recommends Option E - Hybrid:

1. Preserve `sensor_logs` watering markers as legacy/current compatibility.
2. Add a future dedicated append-only `watering_events` table as the canonical device-originated watering-event evidence path.
3. Keep `sensor_measurement_batches` as Gen2 measurement package evidence only.
4. Keep `device_heartbeats` as diagnostics/latest health evidence only.
5. Keep `sensor_events` as manual operational context only.
6. Render watering event evidence in protected customer/support hosted views.
7. Keep Supabase as telemetry/history/diagnostics/event-evidence storage only.
8. Keep local ESP32 firmware as the only owner of watering decisions and pump shutoff.

## Proposed Future watering_events Shape

The SQL artifact at [`docs/sql/phase7o1-watering-events.sql`](../sql/phase7o1-watering-events.sql) was manually executed in Supabase after review. `public.watering_events` and the protected customer/support watering event views were validated.

That artifact proposes a dedicated append-only table conceptually shaped like:

- `id`
- `device_id`
- `event_at`
- `event_type`: `watering_started`, `watering_completed`, `watering_blocked`, `watering_safety_cutoff`
- `trigger_source`: `manual_local`, `automatic`, `physical_button`, `firmware_safety`
- `duration_seconds`
- `reason`
- `firmware_version`
- `build_profile`
- `device_label`
- `details jsonb`
- `created_at`

`watering_started` and `watering_completed` must be generated by the ESP32 after local state transitions. They must not be generated by hosted UI, Supabase logic, or manual customer/support actions.

The future table should be append-only device evidence. It should not expose update/delete behavior to browser clients. Device-originated inserts should be allowlisted through the existing provisioned-device/registry pattern or a similarly explicit RLS design.

## Evidence-Only Boundary

This design preserves these boundaries:

- Local ESP32 firmware owns watering decisions.
- Pump shutoff remains local.
- Supabase is telemetry/history/diagnostics/event-evidence storage only.
- No Supabase command/control.
- No Remote Water Now.
- No hosted Water Now.
- No hosted local ESP32 calls.
- No app-based watering command.
- No fake telemetry rows.
- No fake watering rows.
- No silent replacement of failed values.
- Hosted customer/support routes remain read-only.

This design also preserves:

- No changes to pins.
- No changes to sensors.
- No changes to device IDs.
- No changes to watering duration.
- No changes to `MOISTURE_THRESHOLD`.
- No changes to cooldown.
- No changes to `LOG_INTERVAL_MS`.
- No changes to moisture mapping.
- No changes to `control_eligible` behavior.
- No changes to firmware metadata wording.
- No changes to local dashboard Water Now behavior.

## Hosted Customer/Support Visibility Direction

Future hosted customer/support views should expose watering event evidence through protected, membership-filtered views, not through raw base table access.

Customer view direction:

- Show only events for devices assigned to that customer's garden.
- Show Balcony01 watering evidence when the event was device-originated.
- Keep Scout01 telemetry-only and without watering authority.
- Do not expose Bench01 / Prototype01 to normal customer gardens.

Support view direction:

- Show events for support-visible devices.
- Include enough device provenance and reason/duration context to debug whether the firmware reported start/completion/block/cutoff.
- Keep support read-only; support visibility must not become watering authority.

The hosted UI should make event evidence obvious enough that real watering is not hidden inside a diagnostics detail or a sparse measurement chart.

## Cadence Separation Direction

Future cadence work should separate these concepts:

- Local sensor sampling cadence: reads local sensors often enough to support local decisions and recent evidence.
- Local control-evaluation cadence: evaluates automatic watering from recent qualified local samples only.
- Routine cloud telemetry cadence: posts normal measurement/history evidence, likely around 15 minutes.
- Immediate event telemetry: posts important watering events immediately, especially start, completion, block, and safety cutoff.
- Hosted dashboard refresh cadence: reads Supabase protected views for customer/support display only.

Phase 7O.1 does not change `LOG_INTERVAL_MS`, `HEARTBEAT_INTERVAL_MS`, `WATERING_DURATION_MS`, automatic watering logic, or hosted refresh behavior.

## Proposed Implementation Slices

Future implementation should be split behind explicit approvals:

1. SQL design/artifact slice: propose `watering_events`, RLS, grants, and protected customer/support event views.
2. Firmware event-posting slice: post immediate event evidence from manual local, automatic, blocked, and safety-cutoff paths without changing local control behavior.
3. Hosted display slice: render protected event evidence in customer/support views without exposing local endpoints or controls.
4. Compatibility slice: preserve or restore `sensor_logs` watering markers for existing legacy history behavior.
5. Cadence decoupling slice: separate local sampling, control evaluation, routine telemetry, immediate event telemetry, and hosted refresh.

## Validation Expectations

Later implementation should validate:

- Firmware builds for relevant Gen2 and non-Gen2 profiles.
- No firmware upload without explicit approval.
- Device-originated insert behavior through anon REST/RLS, not SQL Editor owner privileges alone.
- Unknown/fake device IDs rejected by RLS.
- Customer protected views show only assigned garden devices.
- Support protected views show support-visible devices.
- Hosted bundles do not contain `/water-now`, `/logs`, local ESP32 IPs, or local control endpoints.
- A real local Manual Water Now creates device-originated `watering_started` and `watering_completed` evidence.
- A real automatic watering cycle follows the same event-evidence path.
- Manual `sensor_events` notes remain distinguishable from device-originated watering evidence.
- No fake rows are required for validation.

## Runtime Validation

Phase 7O.1 backend/firmware evidence-path validation is complete for one real Balcony01 local Manual Water Now event.

Runtime facts:

- Live Supabase validation confirmed `anon` INSERT is registry-gated through `public.is_device_telemetry_insert_enabled(device_id)`, `anon` and `authenticated` have no base-table SELECT on `public.watering_events`, `public.customer_watering_events` and `public.support_watering_events` grant SELECT to `authenticated` only, the Balcony01 registry helper returned `true`, and a fake-device registry helper check returned `false`.
- Balcony01 firmware was uploaded with `balcony-installed-gen2` on `COM5`.
- Local `/status`, `/capabilities`, `/measurements`, and `/logs` endpoints validated after upload.
- One real local Manual Water Now event created device-originated rows in `public.watering_events`.
- `watering_started` was recorded at `2026-06-08 12:54:40+00` with `trigger_source = manual_local`, `duration_seconds = null`, `reason = manual_water_now_started`, `firmware_version = phase7e-gen2-compat`, `build_profile = balcony-installed-gen2`, `device_label = Balcony01`, and `details` containing `{"phase":"7O.1","source":"firmware","uptime_seconds":70}`.
- `watering_completed` was recorded at `2026-06-08 12:55:40+00` with `trigger_source = manual_local`, `duration_seconds = 60`, `reason = manual_water_now_completed`, `firmware_version = phase7e-gen2-compat`, `build_profile = balcony-installed-gen2`, `device_label = Balcony01`, and `details` containing `{"phase":"7O.1","source":"firmware","uptime_seconds":130}`.
- Pump shutoff remained local.
- Supabase remains event-evidence storage only.

Phase 7O.2 wires hosted customer/support frontend display for `/mygarden`, `/app`, and `/support` through protected `customer_watering_events` / `support_watering_events` views. The display marks completed watering cycles on the Gen2 trend chart, keeps chart markers as the primary visual watering indicator, shows a visually aligned compact Watering History table below the chart with `Start Time`, `Duration`, and `Watering Type` columns, uses `Manual Watering`, `Automatic Watering`, `Button Watering`, and rare/fallback `Device Safety` customer-facing nomenclature, corrects the hosted control label to `Device History`, aligns the Watering History panel shell with the hosted dashboard panels, removes defensive read-only copy/pill from the panel, adds no hosted control path, adds no local ESP32 calls, and does not read `public.watering_events` directly.

Subsequent presentation follow-on, 2026-08-27: the protected query/evidence boundary above is unchanged. The chart now uses fixed-height count-preserving dashed lines, current labels use `Auto Watering`, `Button Watering`, `Manual Watering`, pump-free `Button Test`, and explicit safety stops, and complete named evidence remains in Watering History. See [`watering-event-graph-visibility-repair-phase-slice.md`](./watering-event-graph-visibility-repair-phase-slice.md).

The public `/demo` route does not read protected watering-event views and cannot show clean completed watering-cycle history without a future approved curated public demo-safe watering-event view.

Frontend implementation validation passed `npm.cmd run lint`, the default production build, a hosted-readonly production build, and a hosted bundle forbidden-string scan. Jeremy visually reviewed `/mygarden` locally before commit, including the real Balcony01 60-second event marker and compact Watering History table row.

## Explicit Non-Goals

Remaining non-goals:

- Deployment.
- Commit or push without approval.
- Supabase command/control.
- Remote Water Now.
- Hosted Water Now.
- Hosted local ESP32 calls.
- App-based watering commands.
- Changed pins, sensors, IDs, duration, threshold, cooldown, `LOG_INTERVAL_MS`, moisture mapping, `control_eligible`, firmware metadata wording, or local dashboard Water Now behavior.

## Approval Gates

Next approval gates should be explicit and separate:

1. Hosted frontend implementation approval.
2. Deployment/merge/closeout approval.

The SQL and firmware evidence foundation has been runtime validated; hosted display remains deferred.
