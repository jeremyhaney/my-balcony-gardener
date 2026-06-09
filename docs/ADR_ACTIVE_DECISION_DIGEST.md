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
- `control_eligible` is local firmware evidence about possible control suitability, not a hosted command/control flag.

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

## Gen2 Modular Measurement Contract

ADR 0016 is the major active Gen2 architecture anchor. Gen2 is a modular grow-environment platform where sensors, capabilities, and control authority are independently discoverable, optional, and replaceable.

Active Gen2 meaning:

- `/capabilities` and `/measurements` are the modular local endpoint contract.
- Optional sensors may be present, missing, disabled, failed, or not installed without breaking device operation.
- Display validity is separate from watering-control eligibility.
- `control_eligible:true` is local firmware evidence only.
- GPIO5 is retired from Gen2 relay/pump designs.
- Supabase remains telemetry/history/diagnostics/evidence storage only.

ADR 0017 defines Gen2 measurement batch storage: one append-only raw batch row per complete `/measurements` package in `public.sensor_measurement_batches`, with `public.sensor_measurements_flat` as the derived flat query view. ADR 0018 defines control-quality gates that future firmware/control work must respect.

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

ADR 0019 extends diagnostics with runtime Wi-Fi/network recovery evidence. Hosted diagnostics remain read-only evidence through limited views such as `public.hosted_device_diagnostics` and protected customer/support variants.

## Customer Access, Site Membership, And Support Boundary

ADR 0020 remains active for MVP customer setup/access/local-control boundaries. Customer daily use should be hosted read-only. Support/admin access is explicit and read-only by default. Device/window route/query selection is navigation state only.

Phase 7L.4 SQL artifacts add `profiles`, `gardens`, `garden_devices`, `garden_memberships`, `support_memberships`, and protected customer/support views. These views filter already-hosted-safe measurement/diagnostics surfaces by `auth.uid()` membership. Base metadata tables are not intended to become broad browser-read tables.

## Watering Event Evidence And Cadence Separation

ADR 0021 remains active for watering event evidence and cadence separation. `sensor_logs` remains legacy/current environmental telemetry and historical watering-marker compatibility. `sensor_events` remains manual human context. `device_heartbeats` can show latest watering diagnostics but is not a complete event history.

The active architecture favors a dedicated append-only `watering_events` evidence path for device-originated watering facts such as `watering_started`, `watering_completed`, `watering_blocked`, and `watering_safety_cutoff`. This path is evidence/storage/read-only. It does not authorize watering and does not change pump ownership.

## Deferred / Future Decision Areas

- Production provisioning flow and device-storage/programming-station ID assignment.
- Customer account lifecycle, invites, billing/account administration, and provisioning UI.
- Sensor inventory and physical sensor assignment tracking.
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
