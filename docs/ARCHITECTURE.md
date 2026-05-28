# Architecture Lock

This document is the stable architecture authority for the repo. Changes to the approved architecture require a new ADR in [`docs/adr`](./adr).

## Authoritative Repo Ownership

- Firmware project: [`platformio.ini`](../platformio.ini), [`src`](../src), [`include`](../include), [`lib`](../lib)
- Frontend project: [`mbg_dashboard`](../mbg_dashboard)
- Stable architecture docs: this file plus [`docs/adr`](./adr)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)

## Active Components

- ESP32 firmware
  - Reads sensors
  - Exposes local device endpoints
  - Controls watering behavior already implemented in firmware
- React/Vite dashboard
  - Runs from [`mbg_dashboard`](../mbg_dashboard)
  - Displays current sensor values
  - Triggers Manual Water Now from the local site

## Approved Runtime And Data Flow

1. The ESP32 is reachable on the local network.
2. The dashboard runs locally from [`mbg_dashboard`](../mbg_dashboard).
3. The current approved working path for live values and manual watering is the local ESP32 fallback path.
4. The active local endpoints used by the current baseline are:
   - `GET /`
   - `GET /logs`
   - `POST /water-now`
5. The ESP32 also posts telemetry directly to Supabase `sensor_logs` for history storage.
6. Supabase-backed history remains a separate read path in the frontend and must not replace the local live/control path.
7. Supabase `sensor_events` is a separate manual operational event log for physical or system changes that help interpret telemetry.
8. `sensor_events` is not the live/current path, not command/control, and not a replacement for `sensor_logs` telemetry history.

## Watering Control Boundary

ADR 0006 in [`docs/adr/0006-watering-logic-and-safety.md`](./adr/0006-watering-logic-and-safety.md) locks the current watering-control and safety boundary.

- ESP32 firmware owns watering decisions locally.
- Supabase is telemetry/history only and must not be used for command/control.
- Automatic watering remains fixed-duration batch watering.
- Pump shutoff remains local and does not depend on Supabase.
- Automatic watering includes a post-watering cooldown guard between automatic cycles.
- Manual Water Now remains local/supervised and is intentionally not blocked by the automatic cooldown.
- Current moisture is a derived display/control index from `analogRead(SOIL_PIN)`, not a proven calibrated soil-moisture percentage.
- Phase 6H approves raw soil ADC visibility in telemetry for diagnosis.
- Repeated-reading validation, filtering, calibration, and automatic-watering invalid-read rejection remain deferred.

## Offline Autonomy And Network Failure Boundary

ADR 0011 in [`docs/adr/0011-offline-autonomy-and-wifi-recovery.md`](./adr/0011-offline-autonomy-and-wifi-recovery.md) locks the Phase 6G offline autonomy and Wi-Fi recovery boundary.

- Local firmware owns watering decisions and pump shutoff.
- Wi-Fi, internet, and Supabase are not required for local automatic watering logic.
- Wi-Fi is best-effort; unavailable Wi-Fi must not keep the ESP32 from entering local-control/offline mode.
- Pump shutoff must be checked before client/server/network/telemetry work.
- Supabase remains read-only telemetry/history for frontend use and must not control watering.
- Hosted dashboard must remain read-only and must not expose Water Now.
- Hosted dashboard may show stale or no recent data when telemetry stops.
- No AP/captive portal provisioning is implemented yet.
- No-Wi-Fi operation is autonomous/headless for now; local dashboard/manual control require reachable network access.

## Hosted Read-Only Dashboard Boundary

ADR 0009 in [`docs/adr/0009-hosted-readonly-dashboard.md`](./adr/0009-hosted-readonly-dashboard.md) locks the Phase 6A hosted read-only dashboard boundary.

- Local Control Mode uses the local ESP32 endpoints, `LiveStats`, Manual Water Now, and frequent `/logs` polling.
- Hosted Read-Only Mode is a Cloudflare Pages static frontend mode controlled by `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted Read-Only Mode renders Supabase `sensor_logs` history and read-only Device Status / telemetry-quality information, supports read-only Device and Window selectors, and keeps `VITE_MBG_DEVICE_ID` as the fallback/default device behavior.
- Hosted Read-Only Mode filters Supabase history server-side by selected `device_id` and by selected timestamp lower bound except for all-time.
- Device Status is computed in the frontend from already-fetched `sensor_logs` rows for the selected device/window.
- Device Status must remain read-only and must not introduce Supabase command/control or local ESP32 endpoint calls.
- Supabase `data.watering` may be shown only as watering history markers, not as live currently-watering status.
- Hosted Read-Only Mode must not render `LiveStats`, show Water Now, call local ESP32 `/logs`, or call local ESP32 `/water-now`.
- Hosted Read-Only Mode must not bundle local control code in the production artifact.
- Sensor History remains rendered in both modes.
- The local ESP32 live/control path and Supabase history/read path remain separate.
- Supabase remains telemetry/history only and must not be used for command/control.
- Phase 6A does not add multi-device UI, Admin, Settings, or Remote Water Now.

## Multi-Unit Visibility And Local Control Target Safety

ADR 0013 in [`docs/adr/0013-multi-unit-visibility-and-local-control-target-safety.md`](./adr/0013-multi-unit-visibility-and-local-control-target-safety.md) locks the Phase 6J.0 multi-unit visibility and local target safety boundary.

- The local/default dashboard can select known local targets.
- Local target selection affects live `/logs` polling and the local manual action endpoint.
- Manual action is gated by selected device role and a live `/logs` `device_id` match.
- The installed balcony controller may expose Water Now only when the selected target identity is verified.
- The bench unit may expose relay-test wording only, not plant-watering wording, and only when identity is verified.
- The sensor scout has no manual relay or pump command authority.
- History Device selection is the read-only Supabase history target and remains separate from Local Control Target selection.
- Hosted-readonly mode remains read-only and must not import local control metadata or expose local endpoints.
- Supabase remains telemetry/history only and must not be used for command/control.

## Device Diagnostics / Heartbeats

ADR 0014 in [`docs/adr/0014-device-diagnostics-heartbeats-and-reliability-evidence.md`](./adr/0014-device-diagnostics-heartbeats-and-reliability-evidence.md) defines the Phase 6J.1 diagnostics/heartbeat architecture.

- `device_heartbeats` is the recommended future append-only machine/device health evidence table.
- `device_heartbeats` is separate from `sensor_logs` plant/environment telemetry and `sensor_events` manual operational context.
- `GET /status` is the proposed future read-only local diagnostics endpoint.
- `/status` must be diagnostic-only and must not control watering, alter runtime state, or expose command authority.
- Diagnostics should exist on every deployed ESP32 unit, including controller, sensor-only/scout, and bench units.
- Supabase may store telemetry/history/diagnostics evidence only and must not become command/control.
- Hosted dashboard diagnostics display is deferred until `/status` and `device_heartbeats` are proven, and hosted-readonly mode must remain read-only.

## Device Registry / Provisioned Device Allowlist

ADR 0015 in [`docs/adr/0015-supabase-device-registry-and-table-driven-allowlist.md`](./adr/0015-supabase-device-registry-and-table-driven-allowlist.md) defines the Phase 6J.5 Supabase device registry and table-driven insert allowlist.

- `public.device_registry` is the provisioned-device registry for known MBG ESP32 units.
- Registry-backed RLS replaces repeated hardcoded UUID allowlists for device-originated inserts.
- Registry flags authorize `sensor_logs` telemetry inserts and `device_heartbeats` diagnostics inserts only.
- Registry flags are not command/control and must not grant watering authority.
- Supabase remains telemetry/history/diagnostics storage only and must not expose Remote Water Now.
- Base `device_registry` anonymous read access is not approved in Phase 6J.5.
- Hosted/frontend registry display remains deferred; if public labels are needed later, prefer a limited read-only view in a separately approved phase.

## Gen2 Modular Sensor Architecture

ADR 0016 in [`docs/adr/0016-gen2-modular-sensor-architecture.md`](./adr/0016-gen2-modular-sensor-architecture.md) defines Gen2 as a modular grow-environment platform where sensors, capabilities, and control authority are independently discoverable, optional, and replaceable.

- `SensorLogRow` remains the Gen1/current compatibility contract for the existing `sensor_logs` telemetry history path.
- Gen2 expanded measurements belong in a separate measurement-list/table path, likely future `public.sensor_measurements`.
- `SensorLogRow.data` must not keep expanding with fixed fields for every future sensor.
- Gen2 optional sensors may be present, missing, disabled, failed, or not installed without breaking device operation.
- Valid for display is not the same as valid for control; watering control may only use measurements explicitly marked `control_eligible`.
- GPIO5 is retired from future Gen2 relay/pump control designs, without changing the installed balcony unit in this phase.
- I2C SDA/SCL is approved as a short-range local sensor-module bus, not the long-distance field wiring strategy.
- Local ESP32 firmware remains the owner of watering decisions and pump shutoff.
- Supabase remains telemetry/history/diagnostics storage only and must not become command/control.
- Phase 7B implements the Gen2 bench profile as `bench-proto-gen2`; the retained `bench-prototype` profile remains Gen1 fallback/reference.
- Gen1/current compatibility uses `/logs`; Gen2 bench uses `/capabilities` and `/measurements`.
- `/logs` is not part of the Gen2 bench measurement contract.
- Phase 7B `bench-proto-gen2` uses GPIO25 for the pump-free simulated watering output through `RELAY_PIN`.
- GPIO5 remains retired for future Gen2 relay/pump control designs.
- Gen2 measurements remain local-only until a future approved measurement storage phase; no `public.sensor_measurements` table exists yet.

## Hosted Read-Only Device Diagnostics

Phase 6J.6 adds a limited hosted diagnostics read path through `public.hosted_device_diagnostics`.

- `public.hosted_device_diagnostics` joins active, hosted-visible `public.device_registry` rows to the latest `public.device_heartbeats` row per device.
- The view exposes only hosted-safe diagnostics fields for the selected device: identity label/key/role, latest heartbeat time/age/reason, uptime, Wi-Fi connected/RSSI, heap evidence, latest heartbeat watering evidence, and last watering duration.
- The view does not expose local IP, MAC, SSID, notes, registry administrative flags other than `hosted_visible`, registry administration timestamps, heartbeat `details`, or command/control fields.
- `anon` and `authenticated` may select from the limited view.
- Base `public.device_registry` anonymous read access remains unapproved.
- Hosted diagnostics display is read-only evidence. It must not call local ESP32 endpoints, expose Water Now, diagnose plant health, diagnose sensor calibration/root cause, or introduce Supabase command/control.

## Device Identity And Production Traceability

ADR 0010 in [`docs/adr/0010-device-identity-and-production-traceability.md`](./adr/0010-device-identity-and-production-traceability.md) locks the Phase 6B device identity convention.

- The current installed balcony unit keeps UUID `550e8400-e29b-41d4-a716-446655440000` for Supabase history continuity.
- Firmware `DEVICE_ID` is the telemetry identity used in `sensor_logs.device_id` and local `/logs`.
- Future ESP32 units must be preloaded/provisioned with unique, stable, non-null UUIDs before deployment.
- Friendly names are separate user-facing labels and are not the telemetry identity.
- Hosted read-only dashboard selection uses `VITE_MBG_DEVICE_ID`.
- No Supabase schema change, `SensorLogRow` change, multi-device UI, or provisioning UI is approved in Phase 6B.
- ADR 0010 remains the identity convention authority.
- Phase 6C implements a prototype/small-batch bridge using PlatformIO build profiles.
- `platformio.ini` supplies `MBG_DEVICE_ID` per profile.
- `src/device_identity.h` maps `MBG_DEVICE_ID` to the existing `DEVICE_ID`.
- `src/config.h` remains ignored/local-only for Wi-Fi and Supabase secrets.
- This is not the final production provisioning system.
- Future production provisioning may replace this with programming-station or device-storage assignment without changing `sensor_logs.device_id` or `VITE_MBG_DEVICE_ID` behavior.
- Supabase `sensor_logs` RLS insert policy must allow provisioned device UUIDs that are expected to post telemetry.

## Firmware Telemetry Integrity

ADR 0008 in [`docs/adr/0008-telemetry-integrity-hardening.md`](./adr/0008-telemetry-integrity-hardening.md) locks the Phase 5F telemetry-integrity boundary.

- DHT temperature/humidity may use last-known-good fallback for `/logs` and Supabase telemetry continuity after at least one good DHT read has populated the firmware cache.
- Soil moisture must remain fresh-only because it controls automatic watering.
- Pump stop logic remains local and independent of telemetry success or failure.
- Supabase remains read-only history/telemetry and is not command/control.
- The canonical `SensorLogRow` shape remains unchanged.

## Approved Frontend Boundary For Deferred Restoration

- Local live path remains separate from deferred history/graph restoration work.
- Local live/control path remains separate from the Supabase history/read path after current logging restoration.
- The live path must continue to own:
  - current sensor value display
  - local ESP32 fallback reads
  - Manual Water Now behavior
- Supabase history must use a separate read path and must not introduce Supabase command/control.
- Manual operational events may be recorded separately in Supabase `sensor_events`, but this does not change live/control ownership or the telemetry contract.
- Supabase timestamps for `sensor_logs` must be written by firmware as UTC ISO-8601 values so browser-local rendering stays correct.
- The Sensor History graph may auto-refresh from Supabase without altering the live/control ownership boundary.
- The shared sensor log contract remains centralized in [`mbg_dashboard/src/types`](../mbg_dashboard/src/types).
- The first restoration slice must not introduce package extraction or a broad frontend refactor.

## Canonical Sensor Log Contract

The canonical sensor log contract is authoritative across frontend code, firmware payload handling, and Supabase history work.

```ts
type SensorLogRow = {
  id?: string
  device_id: string
  timestamp: string
  data: {
    temperature: number
    humidity: number
    moisture: number
    soilRawAdc?: number
    watering: boolean
    lastWateredTime: string
    lastWateringDuration: number
  }
}
```

- The shared frontend definition in [`mbg_dashboard/src/types/sensorLog.ts`](../mbg_dashboard/src/types/sensorLog.ts) is the canonical in-repo contract.
- In Supabase, `data` is stored as `jsonb`.
- For the `jsonb` object, key order is not significant.
- Field names and value types are significant and must not drift.
- `data.moisture` is the current derived moisture index.
- `data.soilRawAdc` is the raw ESP32 ADC count from `analogRead(SOIL_PIN)`, when available.
- `soilRawAdc` is optional because older rows do not contain it.
- ADR 0012 approves this contract change.
- Future added sensors should move toward a SenML-inspired measurement-list or measurement-table model before adding several more fixed fields.
- `sensor_events` is intentionally separate and must not be used to reshape or extend the canonical `SensorLogRow`.
- Contract changes require:
  - a new ADR
  - coordinated frontend updates
  - coordinated firmware updates
  - coordinated database/query updates

## Manual Operational Event Log

Supabase `public.sensor_events` is approved as a separate manual operational event/history table for changes that affect how telemetry should be interpreted.

- It is used for operational notes such as sensor swaps, moves, cleaning, calibration, reference readings, maintenance, plant moves, container changes, and experiment markers.
- It does not store telemetry payloads and does not replace `sensor_logs`.
- It does not change firmware ownership of local live values, Manual Water Now, or watering behavior.
- It does not introduce Supabase command/control.
- MVP entry is manual through the Supabase Table Editor or SQL Editor under RLS.

## Local And Deployment Baseline

- BJ3 is the current working development machine baseline.
- Frontend development and build commands are run from [`mbg_dashboard`](../mbg_dashboard).
- Firmware build and upload commands are run from the repo root PlatformIO project.
- The local ESP32 fallback path is the approved baseline until a later ADR changes it.
- Cloudflare Pages project `my-balcony-gardener` has a validated Production deployment from branch `main`.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- The custom domain was moved from the obsolete old `mybalconygardener` Cloudflare Pages/Tunnel setup to the current `my-balcony-gardener` Pages project.

## Deferred Architecture Areas

- Future graph polish / trend visualization
- Future sensor calibration, repeated-reading validation, filtering, and invalid-reading rejection
- Future advanced sensor health / fault detection, calibration, alerts, and diagnosis
- Future quiet hours / runtime settings
- Future auth/login, alerts, settings/provisioning, runtime settings, and production hardening
- Future multi-device read-only UI
- Any shift away from the current local fallback baseline
- Any Supabase command/control or Remote Water Now behavior

## Change Control Rule

- Update [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md) when the operational state changes.
- Add a new ADR in [`docs/adr`](./adr) before changing the approved architecture, ownership boundaries, or runtime/data flow described here.
