# Phase 7G.1 - Gen2 Calibration and Control Validation Baseline

## Purpose

Phase 7G.1 defines the evidence needed before changing automatic watering behavior. The goal is to make calibration and control-validation work deliberate, comparable, and reviewable before changing any live control path.

Phase 7G.1 does not change watering duration, `MOISTURE_THRESHOLD`, cooldown, moisture mapping, control eligibility, pins, sensors, Supabase schema, frontend runtime behavior, or command/control boundaries.

## Current Control Reality

- Balcony01 is the only watering-capable field unit.
- Balcony01 `moisture_index` is currently the only `control_eligible:true` Gen2 measurement.
- DHT01, ST03, raw ADC, Scout01, BME02, ST02, and all Scout01 records are not control inputs.
- The current automatic watering decision still depends on one fresh mapped moisture read and cooldown.
- Raw ADC is diagnostic evidence, not calibrated moisture.
- Supabase remains telemetry/history/diagnostics storage only.

## Known Guardrails

- No Supabase command/control.
- No Remote Water Now.
- Local ESP32 firmware owns watering decisions and pump shutoff.
- Pump shutoff must remain local.
- Hosted dashboard is read-only.
- Gen2 valid/display metadata is not the same as watering-control approval.

## Required Pre-Test Context Checklist

Before each calibration/control-validation test, record:

- [ ] Test date/time.
- [ ] Operator.
- [ ] Device IDs involved.
- [ ] Physical sensor IDs.
- [ ] Basket/container/location labels.
- [ ] Probe insertion depth and orientation.
- [ ] Recent manual watering/rain history.
- [ ] Actual flashed watering duration.
- [ ] `MOISTURE_THRESHOLD`.
- [ ] Cooldown value.
- [ ] Telemetry/logging cadence.
- [ ] Whether pump power is connected.
- [ ] Visible plant stress notes.
- [ ] Weather/sun/wind notes.
- [ ] Any sensor startup/reboot event.

Known duration discrepancy to record, not fix here:

- Local ignored `src/config.h` was observed with `WATERING_DURATION_MS = 60000`.
- Tracked `src/config.h.example` and older ADR text still describe `15000`.
- Do not change either in this phase.
- Every watering-response test must record the actual flashed watering duration used.

## Evidence Needed Before Changing Automatic Watering

Collect evidence for:

- Raw ADC repeatability.
- Mapped moisture index repeatability.
- Probe placement sensitivity.
- Dry/wet/reference behavior.
- Startup/settling behavior.
- Sensor failure/null behavior.
- Post-watering response curve.
- Post-watering stabilization time.
- Agreement/disagreement between Balcony01 and Scout01 trends.
- False-dry risk.
- False-wet risk.
- Effect of environment: temperature, humidity, pressure, sun/wind/rain where available.

## Balcony01 vs Scout01 Comparison Method

Comparison should emphasize:

- Trend direction.
- Response timing.
- Before/after deltas.
- Raw ADC changes.
- Moisture index changes.
- Environmental context.
- Not absolute equality between probes.

Different baskets, locations, and probe insertions can dominate absolute readings. Use the two-device comparison as trend and response evidence, not proof that the probes should match numerically.

## Startup/Settling Exclusion Rules For Analysis

Analysis-only exclusion candidates:

- First N readings after reboot.
- Records where `valid = false`.
- Records where `quality` is not `good`.
- Records with `reason` such as `read_failed`, `sensor_missing`, `not_detected`, `startup`, or equivalent.
- Suspicious DHT startup wart readings.
- Initial DS18B20 null/read_failed readings after boot or flash.

These are analysis candidates only. Do not propose firmware enforcement yet.

## Repeated-Reading Validation Concept

Future candidate rule, not implemented in Phase 7G.1:

- Require N consecutive fresh, valid, good-quality, control-eligible `moisture_index` samples below threshold before automatic watering.
- Require raw ADC values to be plausible and not pinned/saturated.
- Require samples to fall within a freshness window.
- Require no active startup/settling exclusion.
- Require cooldown to be satisfied.

Candidate values to evaluate later:

- N could be 2, 3, or 4 consecutive readings.
- Timing could follow the existing control cycle, a shorter deliberate local sampling window, or a hybrid where repeated local reads occur only when a low reading is first observed.
- Final N and final timing are intentionally not selected in this phase.

## Freshness-Window Concept

Future control should depend on local fresh measurement timing, not Supabase row age. Supabase rows are history/evidence; they are not the authority for local watering decisions.

Collect evidence before selecting a freshness-window value:

- Normal read interval.
- Measurement jitter.
- Wi-Fi/Supabase outage behavior.
- Latest local `/measurements.measured_at`.
- Whether the value came from the current control cycle.

## Watering-Response Test Structure

Use a controlled test structure:

- Pre-test stabilization period.
- Pre-water baseline capture.
- Event marker in `sensor_events`.
- Manual Water Now or controlled local watering action.
- Immediate post-water high-frequency observation window if available.
- Settling window.
- Next-day follow-up.
- Visual notes: drip, runoff, basket wetting, pump behavior, plant response.
- Required note if pump power is disconnected or water does not physically flow.

## Analysis Outputs Desired

- Time-series plot by device and measurement.
- Moisture index vs raw ADC over time.
- Watering event overlay.
- Before/after delta table.
- Settling-time estimate.
- Invalid/degraded/read-failed count.
- Repeated-low-read candidates.
- Startup-excluded rows.
- Scout01 vs Balcony01 delta/trend comparison.

## Explicit Non-Goals

- No firmware changes.
- No frontend runtime changes.
- No SQL schema/RLS changes.
- No control eligibility changes.
- No threshold/duration/cooldown changes.
- No moisture mapping changes.
- No Supabase command/control.
- No Remote Water Now.
- No plant-health diagnosis automation.
