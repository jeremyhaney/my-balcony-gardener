# ADR 0018: Gen2 Control Quality and Freshness Gates

- Status: Accepted
- Date: 2026-06-01

## Context

Current automatic watering still uses a local mapped soil moisture index from `analogRead(SOIL_PIN)` and starts watering when one local mapped moisture value is below `MOISTURE_THRESHOLD` and the automatic cooldown is satisfied. The relevant firmware path reads raw ADC and maps it to the 0-100 moisture index in `src/main.cpp:156`, evaluates `maybeStartAutomaticWatering()` in `src/main.cpp:162`, compares against `MOISTURE_THRESHOLD` in `src/main.cpp:171`, and runs the Gen2 watering-capable automatic path from `src/main.cpp:753`.

Pump shutoff remains local firmware logic and is bounded by `WATERING_DURATION_MS` in `src/main.cpp:692` and `src/main.cpp:696`. The tracked example still defines `WATERING_DURATION_MS` as `15000` and `MOISTURE_THRESHOLD` as `35` in `src/config.h.example:23` and `src/config.h.example:24`. ADR 0006 records the historical current values and requires cooldown/soak protection in `docs/adr/0006-watering-logic-and-safety.md:14` and `docs/adr/0006-watering-logic-and-safety.md:27`.

This ADR is design-only. It approves future control-quality rules to implement and validate later; it does not change firmware behavior, frontend runtime behavior, SQL/RLS, thresholds, duration, cooldown, moisture mapping, pins, sensors, device IDs, or current `control_eligible` behavior.

ADR 0016 defines Gen2 measurement metadata fields, including `valid`, `quality`, `reason`, and `control_eligible`, and states that valid for display is not the same as valid for control (`docs/adr/0016-gen2-modular-sensor-architecture.md:36`, `docs/adr/0016-gen2-modular-sensor-architecture.md:51`). ADR 0017 preserves the same per-measurement metadata in Gen2 batch storage (`docs/adr/0017-gen2-measurement-batch-storage.md:31`).

The current Gen2 soil moisture firmware is transitional. It can mark installed controller `moisture_index` as `control_eligible:true` when `MBG_DEVICE_CAN_WATER` and `MBG_PUMP_CONTROL_AVAILABLE` are true (`src/gen2_soil_moisture.cpp:32`), but the same measurement currently emits `valid:true`, `quality:"diagnostic"`, and `reason:"uncalibrated_legacy_mapping"` (`src/gen2_soil_moisture.cpp:43`). The soil module emits both `moisture_index` and `raw_adc` records (`src/gen2_soil_moisture.cpp:79`). Therefore, this ADR must distinguish current transitional metadata from a future mature control-quality predicate.

Phase 7G.2 evidence found that the full 1558-row export spans hardware/configuration transitions and is not one homogeneous current-field dataset (`docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:46`). Balcony01 and Scout01 control scope is documented in `docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:54`. Balcony01 current ST03-era evidence includes only 18 moisture/raw ADC samples (`docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:132`). Startup/settling and read-failed candidates exist, freshness gaps exist, and no watering-response evidence was captured (`docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:146`, `docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:157`, `docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:166`). The evidence is sufficient for design-only repeated-reading, startup, freshness, and post-watering trust-window work, but not sufficient to change threshold, duration, cooldown, or final automatic watering behavior (`docs/field_tests/phase7g2-gen2-calibration-evidence-review.md:213`).

Architecture boundaries remain locked: local ESP32 firmware owns watering decisions and pump shutoff, hosted dashboard behavior remains read-only, and Gen2 remains within the local-control and telemetry-only boundaries (`docs/ARCHITECTURE.md:37`, `docs/ARCHITECTURE.md:65`, `docs/ARCHITECTURE.md:121`). Supabase remains telemetry/history/diagnostics storage only and must not become command/control (`docs/adr/0016-gen2-modular-sensor-architecture.md:70`, `docs/sql/phase7g1-control-validation-readonly-queries.sql:318`).

## Decision

Future Gen2 automatic watering control must use local control-quality gates before any low `moisture_index` reading can start watering. These gates are:

- Startup/settling exclusion.
- Repeated-reading validation.
- Local freshness-window qualification.
- Post-watering trust/exclusion.
- A control-eligible measurement predicate that separates display/diagnostic evidence from watering-control evidence.

These rules are approved as design requirements for later implementation and validation. This ADR does not approve a runtime behavior change by itself.

### Startup / Settling Gate

Future automatic watering should be blocked after boot until both conditions are satisfied:

- A short local boot/settling period has elapsed.
- Enough local control-quality `moisture_index` samples have been observed.

The exact elapsed time and sample count are Phase 7G.4 implementation candidates, not constants locked by this ADR.

Startup/settling exclusion should reset or re-arm after sensor-not-detected events or repeated failed reads. A sensor that has just recovered from missing, failed, or not-detected state should not immediately authorize watering from its first mapped low value.

This gate must be local firmware logic based on local device state. Supabase rows, hosted status, or remote history age must not clear startup/settling exclusion.

### Repeated-Reading Validation

One low mapped moisture reading must not be sufficient to trigger automatic watering.

Future implementation should prefer an M-of-N, majority-of-window, or median-style validation strategy over a minimum-of-window strategy. The rule must avoid a path where one bad low reading can trigger watering.

This ADR does not select final M, N, sampling cadence, threshold, or final automatic-watering behavior. `MOISTURE_THRESHOLD` remains unchanged.

### Local Freshness Window

Control freshness must be based on local firmware sample timing, such as `millis()` and local sample age, not Supabase row age.

Stale local moisture readings must block automatic watering. Wi-Fi or Supabase telemetry staleness must not authorize watering. Wi-Fi or Supabase telemetry staleness also must not automatically block watering when local readings are fresh, qualified, and all local control gates pass.

Pump shutoff remains local and must not depend on telemetry success.

### Post-Watering Trust Window

Future control should define a post-watering trust/exclusion window after watering completes. During this window, immediate post-watering moisture readings should not be used to authorize another automatic watering decision.

This is separate from cooldown:

- Cooldown prevents repeated pump activation.
- Post-watering trust/exclusion prevents acting on misleading immediate post-watering sensor readings.

Future implementation may choose candidate durations later. This ADR does not change cooldown or watering duration.

### Control-Eligible Measurement Predicate

Future watering control may only consider local measurements from a watering-capable controller.

At minimum, future control logic must require all of the following:

- Device role is `controller`.
- `device_can_water` is true.
- `pump_control_available` is true.
- `measurement_name` is `moisture_index`.
- `measurement_value` is finite numeric.
- `control_eligible` is true.
- `valid` is true.
- Local sample is fresh.
- Startup/settling gate is cleared.
- Post-watering trust/exclusion window is cleared.
- Repeated-reading validation passes.

The mature metadata direction is that `quality` should be control-approved, preferably `good`, and `reason` should indicate an approved control-quality read, preferably `read_ok`.

However, current firmware metadata for the installed controller's mapped `moisture_index` may still use diagnostic and uncalibrated legacy wording while `control_eligible:true` is present. If Phase 7G.4 requires `quality:"good"` and `reason:"read_ok"` for control, then Phase 7G.4 must intentionally update firmware metadata semantics and validate them. This ADR does not change metadata or runtime behavior.

Scout01 remains evidence-only and non-control. Its records must not gain watering authority from this design.

### Raw ADC Treatment

Raw ADC is diagnostic evidence. It is not calibrated moisture and must not directly trigger watering in Phase 7G.4 unless a later ADR or separately approved phase validates and approves that behavior.

Future uses may include plausibility checks, stuck-sensor detection, saturation detection, wiring diagnostics, and calibration review after validation.

### Telemetry Gap Treatment

Supabase telemetry gaps are evidence/display/diagnostic issues, not command/control.

Supabase gaps:

- Must not authorize watering.
- Must not block pump shutoff.
- Must not become command/control.
- May affect hosted status and diagnostics.

Local control may continue through telemetry gaps only when local sensor evidence is fresh and qualified and all local gates pass.

### Local-Only Control Boundary

Automatic watering decisions remain local ESP32 firmware logic. Pump shutoff remains local ESP32 firmware logic.

Supabase remains telemetry/history/diagnostics storage only. Hosted dashboard remains read-only. Remote Water Now through Supabase remains prohibited. Supabase command/control remains prohibited.

### Future Implementation Guidance

Phase 7G.4 candidate: firmware implementation of local control-quality gates only.

Phase 7G.4 should implement:

- Startup/settling gate.
- Repeated-reading validation.
- Local freshness gate.
- Post-watering trust/exclusion gate.

Phase 7G.4 must preserve the current threshold, duration, cooldown, moisture mapping, pins, sensors, device IDs, Supabase schema, frontend runtime, hosted-readonly boundary, and current control authority scope. No firmware upload is approved unless separately approved.

Phase 7G.5 candidate: validation of implemented gates.

Phase 7G.5 should validate:

- Boot/startup behavior.
- First-read and failed-read behavior.
- Repeated-reading rule behavior.
- Stale local sample behavior.
- Wi-Fi/Supabase gap behavior.
- Post-watering trust/exclusion behavior.
- Scout01 remains evidence-only.
- Automatic watering is safer but still not recalibrated.

Phase 7G.5 must not change threshold, duration, or cooldown unless a later separately approved phase explicitly does that.

## Consequences

Future Gen2 watering-control work has a clear safety design before firmware changes are proposed.

Display, diagnostics, and watering-control evidence remain separate concepts. `valid:true` alone is not enough for future watering control, and `control_eligible:true` is necessary but not sufficient once the full gate set is implemented.

The existing automatic watering behavior remains unchanged until a later approved implementation phase. The existing mapped `moisture_index` remains a mapped index, not calibrated volumetric soil moisture. Raw ADC remains diagnostic evidence.

The design preserves local ESP32 autonomy during Wi-Fi/Supabase gaps while also preventing stale local moisture readings from authorizing watering.

## Out of Scope

- Firmware implementation.
- Firmware upload.
- Frontend runtime changes.
- Frontend deploy.
- SQL schema/RLS changes.
- CSV creation, movement, staging, or commit.
- Support-folder export changes.
- Threshold changes.
- Watering duration changes.
- Cooldown changes.
- Moisture mapping changes.
- Pin changes.
- Sensor changes.
- Device ID changes.
- Current `control_eligible` behavior changes.
- Supabase command/control.
- Remote Water Now.
- Scout01 watering authority.
- Treating raw ADC as calibrated moisture or as a direct watering trigger.
