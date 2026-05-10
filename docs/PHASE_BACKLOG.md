# My Balcony Gardener Phase Backlog

This document captures deferred work that should not be mixed into the current implementation phase.

It is a planning guide, not an implementation approval. Each item still requires normal inspection, design, review, validation, and commit discipline before implementation.

## Current Active Branch Context

- Current branch: `phase5d-telemetry-logging-cadence`
- Current Phase 5D status: committed and pushed for backup
- Firmware compile status: passed
- Firmware upload status: intentionally deferred
- Main branch status: not merged yet

## Recommended Phase Order

1. Phase 5D Validation
2. Phase 5D Closeout / merge
3. Phase 5E — History Graph Event Semantics
4. Phase 5F — Telemetry Integrity Hardening
5. Hosted Read-Only Dashboard
6. Multi-Device Readiness
7. Sensor Calibration / Measurement-System Evaluation
8. Device Settings / Provisioning
9. Hardware Safety Maturity

## Phase 5D Validation — FIELD VALIDATED

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

## Phase 5D Closeout / Merge

Scope:

- Update `README.md` and `docs/CURRENT_STATE.md` only after Phase 5D behavior is field validated.
- Review final diff.
- Commit closeout documentation.
- Merge `phase5d-telemetry-logging-cadence` to `main` only after validation.
- Push `main`.

## Phase 5E — History Graph Event Semantics

Scope:

- Represent watering events on the history graph as event markers, vertical lines, or event dots.
- Use `data.watering`, `lastWateredTime`, and `lastWateringDuration` to communicate watering events.
- De-emphasize or remove any misleading remote/history interpretation of "Currently Watering."
- **Deferred observation:** During Phase 5D Sensor History viewing, graph points appeared to replace/reorder unexpectedly as new sparse telemetry rows arrived. Supabase rows themselves were valid and correctly ordered by timestamp. This is a frontend graph event-semantics/point-ordering polish issue and should not be treated as a firmware/cadence failure.
- Fix graph point reordering/replacement behavior to preserve expected chronological display order.
- Explore local-vs-remote mode indicator:
  - **Local Control Mode:** ESP32 local network, fast live readings from frequent polling, Water Now enabled, real-time telemetry visibility.
  - **Remote Read-Only Mode:** Supabase-only, no Water Now, clear visual mode indicator, sparse ~15-minute telemetry cadence.
- Preserve the local ESP32 live/control path.
- Preserve the read-only Supabase history path.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Schema changes unless separately approved.
- Admin page.

## Phase 5F — Telemetry Integrity Hardening

Scope:

- Prevent watering-completion audit gaps when DHT reads fail.
- Evaluate use of last-known-good sensor values for completion telemetry.
- Clarify timestamp semantics between local `lastWateredTime` and UTC Supabase `timestamp`.
- Consider whether post-watering stabilization samples are useful.
- **Cached local sensor sampling concept:** ESP32 samples sensor readings locally on a controlled internal cadence. `/logs` endpoint returns cached latest readings for fast local polling. Supabase telemetry posts validated/cached readings on the ~15-minute cadence. This preserves local responsiveness while reducing Supabase volume and improving telemetry cadence consistency.
- Preserve the canonical `SensorLogRow` shape unless a new ADR approves a contract change.

Out of scope:

- Sensor calibration experiments.
- Graph UI polish.
- Settings UI.
- Hardware safety sensors.

## Hosted Read-Only Dashboard

Scope:

- Deploy a read-only dashboard outside the local development environment.
- Monitor a selected `device_id`.
- Show current or near-current status from approved data sources.
- Keep remote dashboard read-only.
- Do not add remote pump control.

Out of scope:

- Remote Water Now.
- Multi-device management beyond basic device filtering.
- Admin control features.

## Multi-Device Readiness

Scope:

- Add support for testing and viewing more than one device.
- Confirm device identity handling.
- Confirm dashboard filtering by `device_id`.
- Confirm Supabase queries remain efficient enough for multiple devices.

Out of scope:

- Production provisioning.
- User account system unless separately approved.
- Commercial fleet management.

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
- Full production provisioning.
- Full commercial multi-device fleet management.
