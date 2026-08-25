# Architecture Lock

This document is the stable architecture authority for the repo. Changes to the approved architecture require a new ADR in [`docs/adr`](./adr).

Source-pack compression/reference documents are available for future ChatGPT/Codex loading: [`docs/ADR_ACTIVE_DECISION_DIGEST.md`](./ADR_ACTIVE_DECISION_DIGEST.md), [`docs/ADR_SOURCE_PACK_INDEX.md`](./ADR_SOURCE_PACK_INDEX.md), and [`docs/SQL_SCHEMA_ACTIVE_DIGEST.md`](./SQL_SCHEMA_ACTIVE_DIGEST.md). These documents summarize and index the current decision/storage state; they do not replace the historical ADRs.

## Authoritative Repo Ownership

- Firmware project: [`platformio.ini`](../platformio.ini), [`src`](../src), [`include`](../include), [`lib`](../lib)
- Frontend project: [`mbg_dashboard`](../mbg_dashboard)
- Stable architecture docs: this file plus [`docs/adr`](./adr)
- Source-pack reference docs: [`docs/ADR_ACTIVE_DECISION_DIGEST.md`](./ADR_ACTIVE_DECISION_DIGEST.md), [`docs/ADR_SOURCE_PACK_INDEX.md`](./ADR_SOURCE_PACK_INDEX.md), [`docs/SQL_SCHEMA_ACTIVE_DIGEST.md`](./SQL_SCHEMA_ACTIVE_DIGEST.md)
- Operational snapshot: [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)

## Active Components

- ESP32 firmware
  - Reads sensors
  - Exposes local device endpoints
  - Controls watering behavior already implemented in firmware
- React/Vite dashboard
  - Runs from [`mbg_dashboard`](../mbg_dashboard)
  - Displays hosted Gen2 readings, trends, diagnostics, and watering evidence
  - Does not call local device endpoints or expose Manual Water Now

## Approved Runtime And Data Flow

1. ESP32 firmware retains local watering authority and the supported read-only local endpoint set.
2. The dashboard runs from [`mbg_dashboard`](../mbg_dashboard) without a direct browser-to-device path.
3. Ordinary and hosted-readonly builds use the same hosted Gen2 route shell and read the appropriate public or protected hosted views.
4. Supported firmware endpoints, none of which has a current frontend consumer, are:
   - `GET /`
   - `GET /status`
   - `GET /capabilities`
   - `GET /measurements`
5. The ESP32 posts measurement batches, device heartbeats, and watering-event evidence directly to their current Gen2 Supabase tables.
6. Supabase-backed frontend reads remain telemetry/history/diagnostics only and must not become command/control.
7. Supabase `sensor_events` is a separate manual operational event log for physical or system changes that help interpret telemetry.
8. `sensor_events` is not the live/current path, not command/control, and not a replacement for current Gen2 telemetry or watering-event evidence.

## Watering Control Boundary

ADR 0025 in [`docs/adr/0025-local-button-programs-and-automatic-control-retirement.md`](./adr/0025-local-button-programs-and-automatic-control-retirement.md) defines the current watering-control boundary. ADR 0006 and ADR 0018 remain historical/design evidence for the retired automatic-control direction.

- ESP32 firmware owns watering decisions locally.
- Supabase is telemetry/history only and must not be used for command/control.
- Moisture-triggered automatic watering is not part of the current executable or configuration surface. No RMI or sensor value can start watering.
- A press/release before `5,000 ms` selects a 30-second local cycle; a hold through `5,000 ms` or longer followed by release selects a 60-second local cycle. Selection starts on release.
- A valid second press cancels an active cycle immediately; its release only re-arms the button.
- Pump shutoff, programmed completion, button cancellation, reservoir start blocking, and reservoir-loss cutoff remain local and do not depend on Supabase. Empty-reservoir start blocking is immediate; active-run loss requires GPIO26 to remain continuously LOW for 20 ms so one transient raw read cannot masquerade as reservoir loss.
- Supported firmware exposes no HTTP watering endpoint, and the hosted frontend exposes no watering-threshold or watering-control UI.
- Current SEN0308/ADS1115 measurements and the hosted RMI scale remain observational evidence only.

## Offline Autonomy And Network Failure Boundary

ADR 0011 in [`docs/adr/0011-offline-autonomy-and-wifi-recovery.md`](./adr/0011-offline-autonomy-and-wifi-recovery.md) locks the Phase 6G offline autonomy and Wi-Fi recovery boundary.

- Local firmware owns watering decisions and pump shutoff.
- Wi-Fi, internet, and Supabase are not required for local button programs or safety shutoff.
- Wi-Fi is best-effort; unavailable Wi-Fi must not keep the ESP32 from entering local-control/offline mode.
- Pump shutoff must be checked before client/server/network/telemetry work.
- Supabase remains read-only telemetry/history for frontend use and must not control watering.
- Hosted dashboard must remain read-only and must not expose Water Now.
- Hosted dashboard may show stale or no recent data when telemetry stops.
- No AP/captive portal provisioning is implemented yet.
- No-Wi-Fi operation is autonomous/headless for now; local dashboard/manual control require reachable network access.

## Hosted Read-Only Dashboard Boundary

ADR 0009 in [`docs/adr/0009-hosted-readonly-dashboard.md`](./adr/0009-hosted-readonly-dashboard.md) locks the Phase 6A hosted read-only dashboard boundary. Phases 8F.2 and 8F.3 remove the former local browser control and legacy history surfaces without weakening that boundary.

- Ordinary and hosted-readonly builds enter the same hosted route shell; `VITE_MBG_DASHBOARD_MODE` no longer selects a separate application branch.
- Public Demo reads `public.hosted_gen2_measurements` and hosted diagnostics for Balcony02. Customer and Support routes use their protected garden-device, Gen2 measurement, diagnostics, capability, and watering-event views.
- Hosted reads filter server-side by selected `device_id` and selected timestamp lower bound except for all-time.
- Hosted Gen2 Garden Reading Quality is computed in the frontend from already-fetched Gen2 rows for the selected device/window.
- Device Status must remain read-only and must not introduce Supabase command/control or local ESP32 endpoint calls.
- Protected watering history and chart markers use hosted watering-event evidence, not `sensor_logs.data.watering`.
- Hosted Read-Only Mode must not show Water Now, call local ESP32 `/logs`, or call local ESP32 `/water-now`.
- Hosted Read-Only Mode must not bundle local control code in the production artifact.
- No supported frontend route reads or renders `sensor_logs`; Phase 8F.10 retired the obsolete live table after protected export and exact-row deletion.
- Firmware retains local watering authority and read-only local inspection endpoints, but the frontend has no local ESP32 consumer.
- Supabase remains telemetry/history only and must not be used for command/control.
- Phase 6A does not add multi-device UI, Admin, Settings, or Remote Water Now.
- Phase 7L.3 introduced the hosted route shell. `/` and `/demo` are public hosted routes.
- Phase 7L.4 adds Supabase Auth and membership-filtered protected hosted views. `/login` is the real Supabase email/password login path. `/mygarden` and `/app` use authenticated customer access through `customer_*` views. `/support` uses authenticated support/admin access through `support_*` views and remains hidden from normal navigation. Route path, query state, selected device key, and display label remain navigation state, not authorization.

## Multi-Unit Visibility And Local Control Target Safety

ADR 0013 in [`docs/adr/0013-multi-unit-visibility-and-local-control-target-safety.md`](./adr/0013-multi-unit-visibility-and-local-control-target-safety.md) records the safety boundary that governed the retired Phase 6J.0 local target surface.

- Phase 8F.2 removes local target selection, live `/logs` polling, browser identity gating, and manual action UI from the frontend.
- Device selection remains read-only navigation state. Demo uses the shared registry for Balcony02, while protected routes use authorization-derived device options.
- The retired local-control target definitions had no consumer outside `LiveStats` and are removed.
- Hosted-readonly mode remains read-only and must not import local control metadata or expose local endpoints.
- Supabase remains telemetry/history only and must not be used for command/control.

## Device Diagnostics / Heartbeats

ADR 0014 in [`docs/adr/0014-device-diagnostics-heartbeats-and-reliability-evidence.md`](./adr/0014-device-diagnostics-heartbeats-and-reliability-evidence.md) defines the Phase 6J.1 diagnostics/heartbeat architecture.

- `device_heartbeats` is the current append-only machine/device health evidence table.
- `device_heartbeats` is separate from Gen2 measurement telemetry and `sensor_events` manual operational context.
- `GET /status` is the supported read-only local diagnostics endpoint.
- `/status` must be diagnostic-only and must not control watering, alter runtime state, or expose command authority.
- Diagnostics should exist on every deployed ESP32 unit, including controller, sensor-only/scout, and bench units.
- Supabase may store telemetry/history/diagnostics evidence only and must not become command/control.
- Hosted diagnostics read current heartbeat evidence through limited public or protected views and remain read-only.

## Device Registry / Provisioned Device Allowlist

ADR 0015 in [`docs/adr/0015-supabase-device-registry-and-table-driven-allowlist.md`](./adr/0015-supabase-device-registry-and-table-driven-allowlist.md) defines the Phase 6J.5 Supabase device registry and table-driven insert allowlist.

- `public.device_registry` is the provisioned-device registry for known MBG ESP32 units.
- Registry-backed RLS replaces repeated hardcoded UUID allowlists for device-originated inserts.
- Registry flags authorize current Gen2 measurement-batch, watering-event, and device-heartbeat inserts only.
- Registry flags are not command/control and must not grant watering authority.
- Supabase remains telemetry/history/diagnostics storage only and must not expose Remote Water Now.
- Base `device_registry` anonymous read access is not approved in Phase 6J.5.
- Hosted/frontend registry display remains deferred; if public labels are needed later, prefer a limited read-only view in a separately approved phase.

## Gen2 Modular Sensor Architecture

ADR 0016 in [`docs/adr/0016-gen2-modular-sensor-architecture.md`](./adr/0016-gen2-modular-sensor-architecture.md) defines Gen2 as a modular grow-environment platform where sensors, capabilities, and control authority are independently discoverable, optional, and replaceable.

- `SensorLogRow` is a retired historical firmware/storage contract; its frontend type, writer, reader, and live table are retired.
- Gen2 measurements use the current measurement-list/batch path in `public.sensor_measurement_batches` and `public.sensor_measurements_flat`.
- `SensorLogRow.data` must not keep expanding with fixed fields for every future sensor.
- Gen2 optional sensors may be present, missing, disabled, failed, or not installed without breaking device operation.
- Valid for display is not the same as valid for control. ADR 0022 removes `control_eligible` from new external `/measurements` records; local firmware/control logic remains solely responsible for deciding whether any measurement may influence watering.
- GPIO5 is retired from Gen2 relay/pump control designs.
- The standard Gen2 pin map is GPIO25 relay/pump output, GPIO34 analog soil moisture, GPIO21 I2C SDA, GPIO22 I2C SCL, GPIO26 DHT11 / non-I2C auxiliary digital sensor, and GPIO27 DS18B20 / OneWire soil temperature.
- I2C SDA/SCL is approved as a short-range local sensor-module bus, not the long-distance field wiring strategy.
- The Gen2 4-conductor local I2C sensor-module cable color standard is RED = 3.3V, BLK = GND, GRN = GPIO21 / I2C SDA, and WHT = GPIO22 / I2C SCL. This July 3, 2026 convention supersedes the earlier WHT = SDA / GRN = SCL documentation; GPIO21 remains SDA and GPIO22 remains SCL. This color standard applies only to short-range local I2C sensor-module wiring and is not the approved long-distance field wiring strategy. Factory SEN0562 leads remain a documented cable exception, including BLUE = GND and YELLOW = SCL, and do not redefine the MBG internal convention.
- The MBG Gen2 controller/sensor electrical boundary is 3.3V-only. There is no 5V rail, 5V device supply, or 5V fallback in the approved Prototype01, Balcony02, or Prototype02 systems. Their mux, ADC, relay-control, WL01, SEN0562, BME280, SEN0308, and other local logic/sensor connections remain on the proven 3.3V/GND boundary; vendor nominal-voltage wording must not be used to infer or recommend a 5V change to these units.
- Local ESP32 firmware remains the owner of watering decisions and pump shutoff.
- Supabase remains telemetry/history/diagnostics storage only and must not become command/control.
- Phase 7B historically implemented `bench-proto-gen2` and retained `bench-prototype` as a Gen1 fallback/reference. Phase 8F.4 retires both selectable profiles after Prototype01/Bench01 retirement.
- Historical Gen1 compatibility used `/logs`; the Gen2 bench used `/capabilities` and `/measurements`.
- `/logs` is not part of the Gen2 bench measurement contract.
- Phase 7B `bench-proto-gen2` historically used GPIO25 for the pump-free simulated watering output through `RELAY_PIN`.
- GPIO5 remains retired for future Gen2 relay/pump control designs.
- Phase 7C historically added a Prototype01-only local/default panel over `/status`, `/capabilities`, and `/measurements`; Phase 8F.1 retires that unsupported frontend consumer and its stale local response types and request helpers.
- The supported Gen2 firmware endpoints remain available for direct local inspection and later contract-aware work, but the frontend does not mount or poll a local-device panel.
- Phase 8F.2 retires the remaining `LiveStats` browser consumer, selected-target five-second `/logs` polling, and local `/water-now` action.
- Phase 8F.3 retires the non-hosted route, frontend `sensor_logs` query/adapter/types, legacy Sensor History chart, and legacy telemetry-health presentation.
- `/logs` was historical compatibility and is absent from supported firmware and frontend source.
- Hosted-readonly remains Supabase-only/read-only and does not bundle local endpoint/control strings.
- Supabase command/control remains prohibited.
- ADR 0017 in [`docs/adr/0017-gen2-measurement-batch-storage.md`](./adr/0017-gen2-measurement-batch-storage.md) defines Gen2 measurement storage as one append-only raw batch row per complete device `/measurements` package.
- Phase 7D stores raw Gen2 packages in `public.sensor_measurement_batches`; one database row equals one complete Gen2 `/measurements` package from one device at one measured time.
- The full Gen2 `records[]` array is stored as `jsonb` on the raw batch row.
- `public.sensor_measurements_flat` is the derived chart/query view that unnests `records[]` for charting, diagnostics, filtering, unit conversion, and future control-quality evaluation.
- Firmware posts one batch object to `/rest/v1/sensor_measurement_batches`.
- Phase 8F.6 makes the ignored firmware `SUPABASE_URL` contract the HTTPS Supabase project root only. A build-time guard rejects placeholders, non-HTTPS or unrecognized hosts, malformed URLs, `/rest/v1`, table-suffixed paths, and other paths without printing the configured value. Firmware appends the exact active table route with deterministic optional trailing-slash handling; no historical configured-table suffix is accepted or rewritten.
- Registry-backed RLS for Gen2 measurement batch inserts uses `public.is_device_telemetry_insert_enabled(device_id)`.
- Phase 7D adds no anon SELECT, UPDATE, or DELETE policies for the batch table or flat view.
- Phase 7F adds limited hosted read-only Gen2 measurement display through `public.hosted_gen2_measurements`.
- `public.hosted_gen2_measurements` joins active, hosted-visible registry rows to flattened Gen2 measurements and exposes only hosted-safe display columns.
- Hosted Gen2 display reads `public.hosted_gen2_measurements` only; it does not grant anon SELECT on `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, or `public.device_registry`.
- Hosted Gen2 display shows measurement history evidence only. It does not calibrate measurements, treat Raw ADC as calibrated moisture, control watering, call local ESP32 endpoints, or introduce Supabase command/control.
- Hosted Gen2 Device Status freshness and measurement-quality warnings use already-fetched hosted Gen2 rows, unique `measured_at` report samples, and Gen2 metadata such as `valid`, `quality`, `reason`, and displayability. They do not diagnose plant health, diagnose sensor root cause, infer watering authority, or require every optional Gen2 sensor to be present.
- JSONB/GIN indexing on `records` is deferred until real query patterns justify it.
- Database-backed physical sensor inventory and assignment administration remain deferred. ADR 0022 permits optional runtime `physical_sensor_id` on measurement/capability entries where a known physical identity already exists.
- `sensor_events` remains an operational note log, not the source of truth for defining installed physical sensors.
- Phase 7D preserved `SensorLogRow`, `sensor_logs`, Gen1 `/logs`, watering behavior, and the then-current per-record `control_eligible` field. ADR 0022 later removes that field from new external Gen2 measurement records while preserving historical stored evidence.
- Phase 7E historically moved the now-retired field units onto the Gen2 compatibility path while preserving their then-current UUIDs.
- Phase 7E display labels `Balcony01`, `Scout01`, and `Prototype01` were compile-time endpoint readability labels, not user-editable names or database-driven nicknames.
- Phase 7E local endpoints report firmware provenance with `firmware_version`, `build_profile`, and `device_label` on `/status`, `/capabilities`, and `/measurements`.
- Gen2 local endpoint timestamp semantics are explicit: `/status.reported_at` is the status snapshot generation time, `/capabilities.reported_at` is the capability snapshot generation time, and `/measurements.measured_at` is the measurement package/sample time.
- The retired installed/scout profiles historically enabled `/logs` through `MBG_GEN2_ENABLE_LEGACY_LOGS=1`. Phase 8F.5 removes that feature flag, handler, registration, and response implementation.
- Phase 7G.0 historically preserved the `/logs` `SensorLogRow` compatibility shape for Scout01; Phase 8F.5 later removed that path.
- Gen2 firmware batch posts include top-level `firmware_version` and `build_profile`, plus `batch_details.phase = "7E"` and `batch_details.device_label`.
- Balcony01 and Scout01 profile capabilities are historical; both device profiles are retired. Supabase remains telemetry/history/diagnostics storage only and must not become command/control.
- Balcony02 retains local firmware watering authority through physical-button/safety behavior; the unsupported HTTP `/water-now` implementation is absent. Remote Water Now remains prohibited.
- Historical pre-ADR-0022 records may contain `control_eligible`. New cleaned external Gen2 records omit it; watering eligibility remains internal firmware/control logic and does not grant hosted command authority.
- DHT11 and direct analog-soil modules are absent from the supported Balcony02 firmware contract and implementation.

### ADR 0022 Endpoint Responsibility Refinement

ADR 0022 in [`docs/adr/0022-gen2-endpoint-responsibility-and-contract-cleanup.md`](./adr/0022-gen2-endpoint-responsibility-and-contract-cleanup.md) refines the active Gen2 external endpoint contract without changing hardware or watering behavior.

- `/measurements` reports observations at one authoritative batch time. The envelope owns device identity and `measured_at`; new records contain measurement identity/value/unit, `valid`, coarse `quality`, the most specific available `reason`, and optional `physical_sensor_id` where one exists.
- New measurement records omit record-level `device_id`, record-level `measured_at`, `control_eligible`, and `details`. Historical batches containing those fields remain valid and are not rewritten.
- `public.sensor_measurements_flat` restores `device_id` and `measured_at` from the batch row when records are flattened.
- `/capabilities` is a deterministic static compile-time/profile manifest. It reports identity, `can_water`, control authority, pinout, active states, shared provider topology, module inventory, installed state, connections, and actual declared control roles.
- Requesting `/capabilities` must not perform sensor reads, GPIO health reads, I2C scans, mux scans, live detection, or provider conversions.
- `/status` reports current operation through nested `network`, `cloud_reporting`, `watering`, and `system` objects. It does not duplicate static watering authority or configured inventory.
- The periodic heartbeat is the flattened cloud representation of the same runtime semantics. Local IP and MAC remain local-only status evidence and are not exposed through hosted-safe diagnostics.
- New DS18B20 records use external `measurement_name` `soil temp`; hosted consumers retain compatibility with historical DS18B20 `temperature` rows.
- Balcony02 emits 11 successful observation records. SEN0308 M04 remains configured but uninstalled capability inventory and is not emitted as a measurement.
- SEN0204 is the only current sensor module with declared `control_role: watering_interlock`. No automatic SEN0308 watering is approved.

### ADR 0024 Hosted Capability and Presentation Boundary

ADR 0024 in [`docs/adr/0024-hosted-device-capability-source-of-truth-and-presentation-boundary.md`](./adr/0024-hosted-device-capability-source-of-truth-and-presentation-boundary.md) defines the hosted commissioned-capability authority. The Phase 8C schema and Balcony02 provisioning were executed and production-validated on 2026-08-14.

- Provisioned per-device capability configuration in Supabase is the hosted source of truth for commissioned logical sensors and remains subject to authentication, garden/device membership, customer isolation, and support access.
- Declarations are positive and lifecycle-based. Connector accommodation or possible hardware, including Balcony02 M04, is not commissioned merely because it exists; negative records for every absent sensor are not required.
- Firmware `/capabilities` is runtime/build evidence. Mismatches with provisioning are Support-visible commissioning/configuration discrepancies and never silently add or remove customer cards.
- Measurements, flattened views, heartbeats, and diagnostics supply values and evidence; they never create or retire capabilities.
- Current cards start from currently commissioned capabilities and retain visible stale, invalid, missing, unavailable, or not-yet-reported states. Undeclared measurements remain diagnostic and do not become ordinary customer cards.
- Stable generic display definitions remain frontend-owned; installation-specific friendly/location names may accompany provisioning. Gen1 and Gen2 adapters feed a common presentation model without making measurement storage capability configuration.
- Local, Demo, My Garden, Support, History, and diagnostic panels apply shared definitions with route-specific policy rather than duplicated card catalogs. Device/route eligibility remains assignment/access policy, independent of sensor health.
- `public.device_capabilities` is the positive lifecycle table. Authenticated reads use separate `security_barrier` customer-current and Support-lifecycle views; the base table has RLS enabled, zero policies, and no browser grants. Balcony02 currently has nine declarations and remains Support-visible/customer-hidden. Frontend adapters, cards, history controls, diagnostics UI, friendly-name styling, derived readings, and deterministic Demo work remain separately reviewed implementation slices.
- Phase 8C.1 documents the approved frontend application in [`docs/product/phase8c1-hosted-frontend-capability-integration-design.md`](./product/phase8c1-hosted-frontend-capability-integration-design.md). Phase 8C.2 is production-validated (**Pass**) and operationally closed for authenticated Support: it reads `support_device_capabilities`, normalizes to a shared logical-sensor model, filters current-effective rows, caches per device in memory, applies exact logical-series mappings, and uses no inventory fallback. Jeremy's 2026-08-16 production smoke test confirmed Balcony02's eleven approved cards in Light, Air, Water, Soil order, Prototype01's then-valid successful-zero state, and preserved Demo availability; unforced failure, lifecycle, cache, refresh, polling, and concurrency cases remain test/inspection-supported. Prototype01 provisioning and Gen1 cleanup were deferred at that checkpoint and are now retired through Phase 8F; customer adoption, deterministic Demo work, visual modernization, and public capability access remain later work.
- Phase 8C.3A–D is the closed evidence-state sequence. `measured_at` owns freshness; `batch_created_at` remains transport evidence; current thresholds are 50 minutes and 95 minutes with device-active qualification. Last-good, invalidity, latest-package omission, selected-window absence, derived availability, environmental condition, evidence-health severity, and device reporting remain separate frontend concepts. The implementation record is [`docs/product/phase8c3c-evidence-state-implementation.md`](./product/phase8c3c-evidence-state-implementation.md); deterministic evidence and production closeout are in [`docs/product/phase8c3d-evidence-state-production-validation-and-closeout.md`](./product/phase8c3d-evidence-state-production-validation-and-closeout.md).
- Phase 8C.4 is the completed measurement-quality gate. Exact commissioned identities select product/provider rules; air uses `0..130 °F`, soil uses `10..130 °F`, and SEN0562 accepts `0..65535 lux` while recording the upper measurement ceiling as a non-rejecting concern. Latest rejected evidence remains visible to authenticated Support, ordinary value/condition and trend paths use only presentation-eligible rows, and `lastPresentationEligibleRow` remains separate from device-good evidence. Design: [`docs/product/phase8c4-measurement-quality-gates-design.md`](./product/phase8c4-measurement-quality-gates-design.md). Implementation: [`docs/product/phase8c4-measurement-quality-gates-implementation.md`](./product/phase8c4-measurement-quality-gates-implementation.md).
- Phase 8C.5A design and Phase 8C.5B implementation define the environmental-presentation layer; see the [design](./product/phase8c5a-environmental-presentation-design.md) and [implementation](./product/phase8c5b-environmental-presentation-implementation.md). Phase 8C.4 eligibility precedes Phase 8C.3 evidence health. Eligible evidence current through the inclusive 50-minute boundary may supply condition wording, measurement-specific card color, and a full-scale marker. Ordinary current cards show condition in the upper-right pill; evidence exceptions show evidence state. Older evidence is neutral. Support diagnostics, future customer wording, trends/RMI, and firmware watering authority remain separate. The frontend uses already-fetched rows and adds no query or Disk I/O. Phase 9 separately holds optional local schedule persistence and sensor-assisted watering.
- Phase 8G.1 supersedes the Phase 8A RMI scale for current hosted presentation without rewriting the historical Phase 8A records. Every eligible SEN0308 raw ADC source is converted directly as `RMI = 35 + 65 × (11230 − raw_adc) / 3590`; the index is unclamped, larger values mean wetter soil, negative values are valid dry evidence rather than faults by themselves, and `100` is an adequately watered reference rather than a maximum. Unrounded values classify as `≤35 Too Dry`, `>35..55 Dry`, `>55..85 Moist`, `>85..140 Well-watered`, `>140..180 Very Wet`, and `>180 Saturated`. RMI remains display evidence, not a percentage or watering authority. See the [Phase 8G.1 implementation record](./product/phase8g1-relative-moisture-index-scale-implementation.md).
- The approved continuation is Phase 8D watering-event visibility restoration, 8E Feels Like/Dew Point, 8F Gen1 risk containment/retirement, 8G threshold presentation, 8H customer adoption/customer-led modernization, and 8I deterministic Demo. Phases 8D, 8E, and 8F are operationally closed; Phase 8G.1 revises the provisional hosted RMI scale, while actual controller-configuration presentation remains next. This is a roadmap order, not implementation authority. In particular, watering events and thresholds remain evidence/presentation, derived microclimate values remain display-only, customer adoption requires authorized commissioned visibility, and the Demo must not depend on protected configuration or live production telemetry. See the [priority sequence](./product/phase8-post-8c5-priority-sequence.md).
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

- The retired first installed balcony unit historically kept UUID `550e8400-e29b-41d4-a716-446655440000` for evidence continuity; it is not a current executable or registry identity.
- Firmware `DEVICE_ID` remains the stable telemetry identity used in Gen2 envelopes and current evidence tables. Historical Gen1 used it in `sensor_logs.device_id` and local `/logs`.
- Future ESP32 units must be preloaded/provisioned with unique, stable, non-null UUIDs before deployment.
- Friendly names are separate user-facing labels and are not the telemetry identity.
- Hosted selection uses the Balcony02-only Demo registry or authorization-derived customer/Support device options; `VITE_MBG_DEVICE_ID` is retired.
- No Supabase schema change, `SensorLogRow` change, multi-device UI, or provisioning UI is approved in Phase 6B.
- ADR 0010 remains the identity convention authority.
- Phase 6C implements a prototype/small-batch bridge using PlatformIO build profiles.
- `platformio.ini` supplies `MBG_DEVICE_ID` per profile.
- `src/device_identity.h` maps `MBG_DEVICE_ID` to the existing `DEVICE_ID`.
- `src/config.h` remains ignored/local-only for Wi-Fi and Supabase secrets.
- This is not the final production provisioning system.
- Phase 8F.4 narrows executable build configuration to the single supported `balcony02-gen2` device environment. PlatformIO's non-selectable `[env]` section retains only shared board/framework, monitor, and upload-port mechanics; it carries no device identity or behavior flags.
- Phase 8G.3 subsequently adds `prototype02-gen2` as the second explicit supported device environment. It has its own new identity and complete static hardware contract; it does not restore or inherit retired Prototype01/Bench01 configuration. Balcony02 remains the pump-backed controller, while Prototype02 is watering-capable for controller-path testing through a relay/LED simulation that explicitly reports no pump and no physical water delivery.
- Phase 8F.5 requires exact explicit Balcony02 identity, static sensor/control provisioning, and Gen2 enablement at compile time. There is no generic/default firmware selection.
- Future numbered devices require a new explicit environment, UUID, static capability manifest, measurement validation, and an intentional extension of the supported-profile guards.

## Historical Phase 5F Telemetry Integrity

ADR 0008 in [`docs/adr/0008-telemetry-integrity-hardening.md`](./adr/0008-telemetry-integrity-hardening.md) locks the historical Phase 5F telemetry-integrity boundary. Phase 8F.5 retires its DHT, direct-soil, `/logs`, and `sensor_logs` firmware implementation from the sole supported Balcony02 profile without rewriting that historical decision record.

- DHT temperature/humidity fallback and fresh-only direct analog-soil control were requirements of the retired Phase 5/Gen1 path, not current Balcony02 behavior.
- Pump stop logic remains local and independent of telemetry success or failure.
- Supabase remains read-only history/telemetry and is not command/control.
- Historical `SensorLogRow` data remains database evidence, but supported firmware no longer creates those rows.

## Historical Frontend Restoration Boundary

This boundary records the earlier restoration sequence. Its bullets describe the historical requirements at that checkpoint, not current runtime guidance. Phases 8F.1–8F.3 supersede its local browser path and `sensor_logs` frontend assumptions; Phase 8F.5 removes the corresponding unsupported firmware endpoints and writer.

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

## Historical Sensor Log Contract

The following contract remains authoritative for interpreting historical `sensor_logs` rows. It is no longer a supported firmware or frontend runtime contract.

Phase 8F.10 proves that the table had no supported current or future Gen2 consumer and that its final three rows were a Phase 4 development seed. Separate exact-hash approvals exported/deleted the final legacy rows and retired the empty `sensor_logs` table with `RESTRICT`. The shared telemetry helper remains for its two current Gen2 policies. The retained empty `sensor_events` table remains RLS-enabled and has no `anon`, `authenticated`, or `service_role` table privileges.

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

- The former shared frontend definition was retired in Phase 8F.3. This historical contract and protected exports remain interpretation evidence; the live table was retired in Phase 8F.10.
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

Phase 8F.10 found no frontend, firmware, script, fixture, view, function, or trigger consumer. Its final three Phase 5B sample-validation fixtures were exported and deleted. The table remains approved as isolated manual context; its `anon`, `authenticated`, and `service_role` table privileges were revoked.

- It is used for operational notes such as sensor swaps, moves, cleaning, calibration, reference readings, maintenance, plant moves, container changes, and experiment markers.
- It does not store telemetry payloads and does not replace current Gen2 telemetry or watering-event evidence.
- It does not change firmware ownership of local live values, Manual Water Now, or watering behavior.
- It does not introduce Supabase command/control.
- MVP entry is manual through the Supabase Table Editor or SQL Editor under RLS.

## Local And Deployment Baseline

- BJ3 is the current working development machine baseline.
- Frontend development and build commands are run from [`mbg_dashboard`](../mbg_dashboard).
- Firmware build and upload commands are run from the repo root PlatformIO project.
- The browser-to-device fallback path is retired; local read-only endpoints remain available only for direct device inspection outside the frontend.
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
