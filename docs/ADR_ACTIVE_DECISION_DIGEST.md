# ADR Active Decision Digest

## Purpose

This digest is the compact current active decision state for future ChatGPT/Codex source-pack loading. It compresses the current meaning of the ADR set and related architecture documents without replacing the original ADRs.

The original files in [`docs/adr`](./adr) remain the historical decision log and the authority for exact historical wording. Use this digest to load the active decision picture quickly; load raw ADRs when editing or challenging a specific decision.

## How To Use This Digest

- Load this digest with [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md), [`docs/ADR_SOURCE_PACK_INDEX.md`](./ADR_SOURCE_PACK_INDEX.md), and [`docs/SQL_SCHEMA_ACTIVE_DIGEST.md`](./SQL_SCHEMA_ACTIVE_DIGEST.md) for most planning phases.
- Load individual ADRs only when the phase changes that topic, needs historical nuance, or touches supersession/amendment details.
- Treat this file as source-pack compression, not as permission to change locked behavior.
- If this digest conflicts with a raw ADR or an applied repo artifact, inspect the raw source before acting.

## Current Non-Negotiable Architecture Boundaries

- Local ESP32 firmware owns watering decisions and pump shutoff.
- Supabase is telemetry, history, diagnostics, and evidence storage only.
- Hosted dashboard behavior remains read-only.
- No Remote Water Now.
- No hosted calls to local ESP32 endpoints.
- No Supabase command/control.
- Manual Water Now remains local and supervised.
- Gen2 measurements remain separate from the legacy `SensorLogRow` compatibility contract.
- Control eligibility remains an internal firmware/control-design concern and historical evidence field; it is not part of new cleaned Gen2 `/measurements` records and is never hosted command/control.
- ADR 0023 locks the MBG internal short-range I2C wire-color convention as RED = 3.3V, BLACK = GND, GREEN = GPIO21 / SDA, and WHITE = GPIO22 / SCL. GPIO21 remains SDA and GPIO22 remains SCL. Factory SEN0562 lead colors, including BLUE = GND and YELLOW = SCL, are cable exceptions and do not redefine the MBG internal convention.

## Local Runtime And Watering Control Boundary

ADR 0001 is the historical/foundational local working baseline: the local ESP32 path owns current values and local Manual Water Now. ADR 0002 keeps restored history separate from local live/control. ADR 0004 restores current telemetry writes to Supabase while preserving local `/logs` and `/water-now` as the live/control path.

ADR 0006 locks watering safety: ESP32 firmware owns automatic watering and pump shutoff, fixed-duration watering and cooldown remain local, and Supabase must not command watering. ADR 0007 separates sparse Supabase telemetry cadence from fast local dashboard polling and immediate watering evidence. ADR 0011 keeps offline autonomy: Wi-Fi, internet, and Supabase are not required for local automatic watering when local readings and local gates are valid.

ADR 0018 defines future Gen2 control-quality and freshness gates. It remains an active design anchor, but it does not change current thresholds, duration, cooldown, moisture mapping, pins, sensors, device IDs, or current `control_eligible` behavior by itself.

ADR 0019 is present in this repo and active for runtime Wi-Fi recovery and network self-healing. It preserves pump shutoff priority, avoids hosted local endpoint calls, and treats recovery diagnostics as evidence rather than command/control.

## Hosted Read-Only Boundary

ADR 0009 locks hosted-readonly mode: hosted pages may read Supabase history, hosted Gen2 measurement views, and hosted diagnostics views, but must not render Water Now, call `/logs`, call `/water-now`, bundle local control paths, or become command/control.

ADR 0013 adds multi-unit visibility while keeping history device selection separate from local control target selection. In local/default mode, manual actions are gated by selected device role and live identity match. In hosted-readonly mode, device/window route/query state is navigation and display state only, not authorization or command authority.

ADR 0020 keeps the customer product path read-only. Hosted customer use is daily visibility, not app-based watering. Authenticated customer/support views may filter read paths by membership, but support/admin visibility remains read-only and must not create remote watering authority.

## Gen1 Compatibility Contract

ADR 0003 defines the canonical `SensorLogRow` contract: top-level `device_id`, `timestamp`, and nested `data` stored as `jsonb`. Its active meaning is Gen1/current compatibility, not a place to keep adding every future sensor.

ADR 0012 amends ADR 0003 by adding optional `data.soilRawAdc` for raw ESP32 ADC evidence. Older rows without `soilRawAdc` remain valid. `data.moisture` remains a derived moisture index, not a calibrated soil-moisture percentage.

ADR 0016 further clarifies that `SensorLogRow` and `sensor_logs` remain stable for Gen1/current compatibility while Gen2 expanded measurements use a separate measurement path.

## Gen2 Modular Measurement And Endpoint Contract

ADR 0016 remains the major Gen2 modular sensor architecture anchor. ADR 0017 remains the raw measurement-batch storage anchor. ADR 0022 refines the active external endpoint shapes and aligns local status with cloud heartbeat evidence.

Active Gen2 endpoint meaning:

- `/measurements` reports installed sensor observations at one authoritative batch time. The envelope owns `device_id` and `measured_at`; new records contain `sensor_key`, `sensor_type`, optional `physical_sensor_id`, measurement value/unit, `valid`, coarse `quality`, and the most specific available `reason`.
- New `/measurements` records omit record-level identity/time, `control_eligible`, and `details`. Historical stored rows containing those fields remain valid evidence.
- `/capabilities` is a static compile-time/profile manifest of identity, `can_water`, control authority, pinout, configured active states, shared provider topology, module inventory, installed state, connections, and declared control roles. Requesting it performs no sensor reads, GPIO health reads, I2C scans, mux scans, live detection, or provider conversions.
- `/status` reports current runtime operation through nested `network`, `cloud_reporting`, `watering`, and `system` objects. Permanent watering authority and configured inventory do not belong in status.
- The periodic heartbeat is the flattened cloud representation of the same active runtime semantics. Hosted diagnostics remain read-only and do not expose local IP/MAC or command authority.
- Optional configured sensors may be absent or uninstalled without breaking device operation. Uninstalled inventory belongs in `/capabilities`; it is not emitted as a measurement observation.
- Display validity remains separate from watering-control eligibility. Control eligibility remains internal firmware/control evidence and is not part of the cleaned external measurement record.
- GPIO5 remains retired from Gen2 relay/pump designs.
- Supabase remains telemetry/history/diagnostics/evidence storage only.

ADR 0017 continues to define one append-only raw batch row per complete `/measurements` package in `public.sensor_measurement_batches`, with `public.sensor_measurements_flat` as the derived flat query view. Flattened rows receive batch-level `device_id` and `measured_at`. ADR 0018 continues to define control-quality gates that firmware/control work must respect.

## Data And Evidence Paths

- `sensor_logs`: legacy/current `SensorLogRow` telemetry history and historical watering markers.
- `sensor_events`: manual operational context, not device-originated telemetry and not command/control.
- `device_heartbeats`: append-only diagnostics/latest health evidence.
- `device_registry`: provisioned-device registry and insert allowlist source, not command/control.
- `sensor_measurement_batches`: raw Gen2 measurement package evidence.
- `sensor_measurements_flat`: derived Gen2 measurement query view.
- `hosted_gen2_measurements`: limited hosted-safe public/demo read view for Gen2 display.
- Customer/support `*_hosted_*` views: authenticated membership-filtered read views.
- `watering_events`: dedicated append-only watering event evidence path per ADR 0021 and Phase 7O.1 artifacts; repo artifacts should still distinguish proposed/applied state.

## Device Identity, Registry, And Provisioning Boundary

ADR 0010 remains active for stable device identity. Firmware `DEVICE_ID` is telemetry identity; friendly names and site assignments are presentation/access metadata. Future production provisioning may change how IDs are assigned, but must preserve stable unique non-null device UUID behavior.

ADR 0015 remains active for `public.device_registry` and table-driven insert allowlists. Registry flags authorize telemetry/diagnostics/evidence inserts only. They do not grant watering authority, runtime settings authority, or browser read authority on the base registry table.

ADR 0020 defines the customer/site/device assignment boundary: customers see their own site/device data through authenticated membership-filtered hosted views. This access model is separate from firmware identity and separate from command/control.

## Diagnostics And Heartbeats

ADR 0014 defines diagnostics and heartbeat architecture. `device_heartbeats` is separate from `sensor_logs` and `sensor_events`. Local `/status` is diagnostic-only and must not control watering, alter runtime state, or expose command authority.

ADR 0019 extends diagnostics with runtime Wi-Fi/network recovery evidence. ADR 0022 aligns nested local `/status` semantics with flattened heartbeat/storage fields for network recovery, cloud reporting, watering runtime evidence, and heap evidence. Hosted diagnostics remain read-only through limited views such as `public.hosted_device_diagnostics` and protected customer/support variants, and they do not expose local IP/MAC or static watering authority.

## Customer Access, Site Membership, And Support Boundary

ADR 0020 remains active for MVP customer setup/access/local-control boundaries. Customer daily use should be hosted read-only. Support/admin access is explicit and read-only by default. Device/window route/query selection is navigation state only.

Phase 7L.4 SQL artifacts add `profiles`, `gardens`, `garden_devices`, `garden_memberships`, `support_memberships`, and protected customer/support views. These views filter already-hosted-safe measurement/diagnostics surfaces by `auth.uid()` membership. Base metadata tables are not intended to become broad browser-read tables.

## Hosted Capability And Presentation Boundary

ADR 0024 makes provisioned per-device capability configuration in Supabase the hosted source of truth for commissioned logical sensors. Declarations are positive and lifecycle-based: presence means the hosted frontend should expect the sensor; absence does not require negative records for every possible connector, module, or unsupported sensor. A physical accommodation such as Balcony02 M04 is not commissioned merely because it exists.

Firmware `/capabilities` is runtime/build evidence, and measurements from `sensor_logs`, `sensor_measurement_batches`, flattened views, heartbeats, or diagnostics are value/evidence sources. Neither runtime declarations nor measurements may silently create or remove customer cards. Provisioning/runtime mismatches and undeclared measurements are Support diagnostics.

Phase 8C implemented the hosted contract in production on 2026-08-14: `device_capabilities` stores the positive lifecycle, and separate authenticated `security_barrier` customer-current and Support-lifecycle views preserve the authorization boundary. Balcony02 has nine current declarations with eleven expected measurement names and remains Support-visible/customer-hidden. No public capability view, browser write path, frontend consumer, or command/control authority was introduced.

Phase 8C.1 defines how capability-driven cards join currently commissioned capabilities to the best available measurement state. Phase 8C.2 was implemented, committed, and pushed on `main` as `b1eea01c484d6838e66598f6fd5b0eeae3c2d251` (`Implement Phase 8C.2 Support capabilities`), then deployed through the normal post-push hosted-page update with no manual deployment. Automated validation passed 15/15 tests, lint, the TypeScript/Vite production build, and `git diff --check`; the existing large-chunk advisory remained non-blocking. Jeremy approved the 2026-08-16 manual production smoke test: Balcony02 rendered eleven capability-driven cards from nine commissioned logical sensors in Light, Air, Water, Soil order; M04 and L04/LUX04 remained absent; live evidence, Manual Refresh, Sensor Details, and History functioned; Prototype01 showed the successful zero-capability state; and the public Demo remained available and materially unchanged. Failure, lifecycle, fallback/exclusion, evidence-fixture, cache, refresh-separation, hidden-tab polling, and concurrency behavior remains automated-test/inspection-supported rather than manually reproduced in production. Result: **Pass**; Phase 8C.2 is operationally closed. Prototype01 provisioning, customer adoption, evidence/quality refinement, Gen1 cleanup, deterministic Demo work, and visual modernization remain later work.

Phase 8C.3 is the approved bounded Support continuation. It separates environmental condition from evidence health, preserves and timestamps last-good evidence, distinguishes invalidity and latest-package omission, uses cadence-derived 50-minute freshness and 95-minute device-active actionable boundaries, derives bounded consecutive counts from already-fetched history, keeps RMI tied to its raw source, and makes Support Device Status capability-driven. No query/storage/backend/device authority changes are introduced. Authenticated production validation passed on 2026-08-17 for the healthy/current Balcony02 path, capability-driven quality, details, History, refresh, Demo preservation, and protected read-only boundary; fault states remained deterministic-test-supported. Phase 8C.3 is operationally closed.

Phase 8C.4 is a deterministic validation-only continuation. It directly covers the existing derived-unavailable RMI policy and verifies fault-label/environmental-condition separation without changing runtime behavior, data access, authority, or presentation. Validation passed 22/22 tests, lint, build, and `git diff --check`; commit `de7e5de8bcc9e1d73bc72333939225210b273843` is complete on `main`.

Phase 8C.5A is the documentation-only measurement-quality boundary decision. A stored Gen2 row and its device-reported metadata remain immutable evidence even when a frontend later rejects it for ordinary trusted presentation. Numeric finiteness, provider electrical possibility, sensor physical plausibility, installation expectations, recent behavior, freshness, environmental condition, Support concern, future customer eligibility, and firmware control eligibility remain distinct. Generic raw-ADC trust handling from the failed prior moisture path is obsolete, has no compatibility requirement, and must be removed rather than propagated. Future rules are designed directly for Balcony02's ADS1115-backed SEN0308 system, and the inactive `hostedMeasurementTrust.ts` is not approved authority. The preferred later frontend slice uses already-fetched rows with no new query, SQL, storage mutation, polling, backfill, or Disk IO.

Phase 8C.5B implements that deterministic frontend boundary. Approved product-context windows are `0..130 °F` for air and `10..130 °F` for soil. SEN0562 `0 lux` is valid darkness and `65535 lux` remains eligible with a measurement-ceiling concern. Provider-specific rules reject implausible ordinary presentation while preserving the original row and device metadata for Support; trends exclude rejected points, and last-presentation-eligible evidence remains distinct from device-reported last-good evidence. The obsolete trust module and prior generic raw-ADC display rule are removed.

Local pages may consume directly connected runtime capabilities. The temporary Demo remains Balcony02-only and receives no protected capability access. A future My Garden adoption will use authorized commissioned customer capabilities only after an authorized customer-visible commissioned device exists. Support may later expose discrepancies and physical/runtime evidence, and History may later include formerly commissioned logical sensors where lifecycle overlaps the requested period. Device eligibility remains assignment/access policy, separate from sensor health or capability presentation.

## Watering Event Evidence And Cadence Separation

ADR 0021 remains active for watering event evidence and cadence separation. `sensor_logs` remains legacy/current environmental telemetry and historical watering-marker compatibility. `sensor_events` remains manual human context. `device_heartbeats` can show latest watering diagnostics but is not a complete event history.

The active architecture favors a dedicated append-only `watering_events` evidence path for device-originated watering facts such as `watering_started`, `watering_completed`, `watering_blocked`, and `watering_safety_cutoff`. This path is evidence/storage/read-only. It does not authorize watering and does not change pump ownership.

## Deferred / Future Decision Areas

- Production provisioning flow and device-storage/programming-station ID assignment.
- Customer account lifecycle, invites, billing/account administration, and provisioning UI.
- Hosted capability frontend adapters/cards, history controls, Support mismatch UI, and automatic reconciliation per ADR 0024. The exact schema, SQL/RLS/grants, and initial Balcony02 provisioning are implemented and production-validated. ADR 0022 continues to permit optional runtime `physical_sensor_id` where a known physical identity already exists.
- Calibration, filtering, invalid-read rejection, advanced sensor health, and alert policy.
- Future hardware safety maturity beyond currently approved local firmware safety gates.
- Any Remote Water Now, hosted local ESP32 call, or Supabase command/control proposal requires a new explicit ADR and is currently prohibited.

## Recommended ChatGPT Source Pack

For most future phases, load:

- [`docs/ADR_ACTIVE_DECISION_DIGEST.md`](./ADR_ACTIVE_DECISION_DIGEST.md)
- [`docs/ADR_SOURCE_PACK_INDEX.md`](./ADR_SOURCE_PACK_INDEX.md)
- [`docs/SQL_SCHEMA_ACTIVE_DIGEST.md`](./SQL_SCHEMA_ACTIVE_DIGEST.md)
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md)
- [`docs/PHASE_BACKLOG.md`](./PHASE_BACKLOG.md)

Load raw ADRs only for the specific topic under change. Load raw SQL artifacts only when SQL/RLS/storage behavior is in scope.

## ADR Status And Supersession Summary

| ADR | Active current meaning |
| --- | --- |
| 0001 | Historical/foundational local ESP32 working baseline. |
| 0002 | Historical/foundational boundary: Supabase history restoration is additive/read-only and separate from local live/control. |
| 0003 | Gen1/current canonical `SensorLogRow` compatibility contract; amended by ADR 0012 and Gen2 architecture. |
| 0004 | Active current Supabase telemetry logging boundary while local `/logs` and `/water-now` remain live/control. |
| 0005 | Active manual `sensor_events` operational log boundary; not firmware telemetry or command/control. |
| 0006 | Active watering logic and safety philosophy. |
| 0007 | Active telemetry cadence separation. |
| 0008 | Active telemetry integrity hardening. |
| 0009 | Active hosted-readonly dashboard boundary. |
| 0010 | Active stable device identity and production traceability convention. |
| 0011 | Active offline autonomy and Wi-Fi recovery boundary. |
| 0012 | Active amendment adding optional raw ADC evidence to `SensorLogRow.data`. |
| 0013 | Active multi-unit visibility and local control target safety boundary. |
| 0014 | Active diagnostics/heartbeat architecture, mostly implemented by later phases. |
| 0015 | Active device registry and table-driven insert allowlist architecture. |
| 0016 | Major active Gen2 modular sensor architecture anchor. |
| 0017 | Active Gen2 measurement batch storage architecture. |
| 0018 | Active Gen2 control-quality/freshness gate design anchor. |
| 0019 | Present in repo; active runtime Wi-Fi recovery and network self-healing architecture. |
| 0020 | Active customer setup/access/local-control boundary. |
| 0021 | Active watering event evidence and cadence separation architecture. |
| 0022 | Active Gen2 endpoint responsibility, cleaned measurement record, static capability manifest, nested status, and heartbeat-alignment contract. |
| 0023 | Active MBG internal I2C wire-color convention: GREEN = GPIO21 / SDA and WHITE = GPIO22 / SCL; supersedes earlier WHT = SDA / GRN = SCL documentation without changing GPIO assignments. |
| 0024 | Active hosted commissioned-capability source-of-truth, runtime/measurement evidence, lifecycle, and presentation boundary. |
