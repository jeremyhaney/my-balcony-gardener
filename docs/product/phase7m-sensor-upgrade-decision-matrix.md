# Phase 7M - Sensor Upgrade Decision Matrix and Balcony02 Build-Out Plan

Status: Draft implementation for review

Date: 2026-06-04

## Purpose

Phase 7M decides the next sensor upgrade, proposed Balcony02 build-out direction, and wiring logic before new hardware work begins.

This is a planning/design artifact. It does not approve firmware, SQL/RLS, frontend runtime, as-built production wiring changes, implemented pin wiring, dashboard selector, device registry, build profile, provisioning, deploy, or firmware upload work.

The preferred direction is Option C:

- Build a new Balcony02 candidate unit first for side-by-side validation.
- Preserve Balcony01 as the current installed baseline while evidence is gathered.
- Modify Balcony01 only after side-by-side evidence supports the change and Jeremy approves a later implementation slice.

## Known Incoming Parts

Jeremy ordered the following sensors from Digi-Key. They are incoming parts, not installed parts.

| Quantity | Part | Description | Phase 7M role |
| --- | --- | --- | --- |
| 4 | DFRobot SEN0308 | Gravity: Analog Waterproof Capacitive Soil Moisture Sensor | Strong MVP comparison candidate |
| 5 | DFRobot SEN0562 | Gravity: I2C IP68 Waterproof Ambient Light Sensor | Stronger light-sensing MVP/evaluation candidate |
| 2 | DFRobot SEN0390 | Ambient light / optical sensor module | Comparison/evaluation or deferred |
| 2 | DFRobot SEN0204 | Gravity: Non-Contact Liquid Level Sensor | MVP-worthy reservoir-level safety/serviceability candidate |

These parts must not be treated as installed, wired, configured, control-approved, or dashboard-approved until a later explicit implementation phase.

## Existing Boundaries

Phase 7M inherits the current architecture and safety boundaries:

- Local ESP32 firmware owns watering decisions and pump shutoff.
- Supabase remains telemetry/history/diagnostics storage only.
- Hosted dashboard remains read-only and must not call local ESP32 endpoints.
- `SensorLogRow` must not be expanded for every new sensor.
- Gen2 measurements belong on the modular measurement path with explicit metadata.
- Valid for display is not valid for control.
- `control_eligible` changes require separate implementation approval.
- Raw ADC is diagnostic evidence, not calibrated moisture.
- Current mapped `moisture_index` is not calibrated volumetric soil moisture.
- No new sensor may affect watering control just because it is installed.

Phase 7M does not create ADR 0021 because this matrix does not lock a new architecture boundary. It applies existing ADR 0016, ADR 0017, ADR 0018, and ADR 0020 to the sensor upgrade decision.

## Proposed Balcony02 Wiring Artifact

Phase 7M includes a separate proposed wiring/build-out planning artifact:

- [`docs/production/MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md`](../production/MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md)

That artifact is explicitly labeled `PROPOSED / NOT AS-BUILT / NOT IMPLEMENTED`.

The current controlled Gen2 production workbook is:

- [`docs/production/MBG_Gen2_Pinout_From-To_v1.2_2026-08-04.xlsx`](../production/MBG_Gen2_Pinout_From-To_v1.2_2026-08-04.xlsx)

The proposed Balcony02 wiring artifact is used to reason through planning-level GPIO allocation, I2C topology, ADC expansion, connectors, cable glands, enclosure penetrations, power distribution, and physical placement needs before any physical build or firmware implementation is approved.

## Decision 1 - Sensor Role Classification

| Sensor | Classification | Decision direction |
| --- | --- | --- |
| SEN0308 waterproof capacitive moisture | MVP candidate and comparison/evaluation candidate | Use for side-by-side evidence before any control replacement. |
| SEN0562 IP68 I2C ambient light | MVP candidate and comparison/evaluation candidate | Prefer over SEN0390 for field light sensing because weatherproofing is more practical. |
| SEN0390 ambient light / optical module | Comparison/evaluation candidate or deferred/future | Keep for bench comparison or protected enclosure experiments unless mounting/weatherproofing proves practical. |
| SEN0204 non-contact liquid level | MVP-worthy safety/serviceability candidate | Evaluate as low-reservoir evidence, not yet as alerting or dry-run interlock. |

### SEN0308 Moisture

Customer value:

- Potentially more robust field moisture evidence than the current analog moisture module.
- Could reduce customer confusion if it proves stable and repeatable.

Calibration/control value:

- High, because moisture is the only current watering-control sensor class.
- Must be compared against Balcony01 and Scout01 evidence before replacing the current control input.

Practicality:

- Waterproof form factor is promising for outdoor/container use.
- Analog output should be conceptually compatible with the existing Gen2 analog moisture measurement pattern, but no implemented pin wiring or firmware mapping is approved in Phase 7M.

Risks:

- False confidence if the new sensor is assumed better before field evidence exists.
- Sensor-to-sensor variation across the four ordered units may matter.
- Placement depth/location can dominate the reading.
- It must not become `control_eligible` merely because it is installed.

Decision:

- Treat SEN0308 as a strong MVP comparison candidate.
- Do not treat it as a control-approved replacement yet.
- Reserve enough units for repeatability and placement comparison, not just one installed sample.

### SEN0562 Light

Customer value:

- Useful environmental context for sun/shade exposure and future customer-facing trust language.
- May help explain dry-down patterns and container conditions.

Calibration/control value:

- Useful for interpretation, not watering control.
- Must not be described as PAR or plant-usable light unless later datasheet review and validation prove that claim.

Practicality:

- IP68 packaging makes it the preferred light candidate for field evaluation.
- I2C is practical only as short-range local wiring under the existing Gen2 boundary.

Risks:

- Saturation, mounting angle, shading, reflection, enclosure fouling, and cable routing can all distort readings.
- Light must not influence watering control in MVP.

Decision:

- Treat SEN0562 as the stronger MVP/evaluation light sensor.
- Prefer it for Balcony02 field evidence if a later approved implementation slice adds light sensing.

### SEN0390 Light / Optical Module

Customer value:

- Potentially useful as a low-cost comparison light module.

Calibration/control value:

- Useful mainly for comparison against SEN0562 or bench experiments.
- Not control-relevant.

Practicality:

- Weatherproofing and mounting are the main unknowns.
- It may be better suited to protected bench/prototype testing unless enclosure strategy is approved.

Risks:

- Outdoor exposure can create support burden if the module is not weather-protected.
- False comparison against SEN0562 if mounting and shielding are not equivalent.

Decision:

- Treat SEN0390 as comparison/evaluation or deferred unless field mounting/weatherproofing proves practical.

### SEN0204 Non-Contact Liquid Level

Customer value:

- Low-reservoir evidence is highly relevant to customer trust.
- Could reduce dry-reservoir surprises and support questions.

Calibration/control value:

- Useful as safety/serviceability evidence before future hardware safety maturity work.
- One level point is likely enough for low-reservoir warning evidence, but not enough for continuous volume or usage forecasting.

Practicality:

- Non-contact mounting may avoid putting electrical parts in the reservoir.
- Requires physical testing against the actual reservoir wall material, wall thickness, curvature, liquid type, mounting height, adhesive/mechanical retention, and cable strain relief.

Risks:

- False positives and false negatives are possible.
- Bucket/reservoir wall material or thickness may prevent reliable detection.
- It must not become an alert source, dry-run interlock, or pump-control input without later validation.

Decision:

- Treat SEN0204 as an MVP-worthy reservoir-level safety/serviceability candidate.
- Start with physical detection tests before any product or control claim.

## Decision 2 - Balcony02 Versus Modifying Balcony01

### Option A - Build Balcony02 First

Advantages:

- Preserves Balcony01 as the installed baseline.
- Enables direct side-by-side comparison against Balcony01 and Scout01.
- Reduces risk of losing current field evidence during sensor experimentation.
- Supports sensor-to-sensor variation, dry-down, watering-response, light/environment, and control-validation analysis.

Limitations:

- Requires another controller build and future provisioning/device identity work.
- Does not immediately upgrade the installed production-like unit.

### Option B - Modify Balcony01 Now

Advantages:

- Directly upgrades the installed system if the sensor is correct.

Limitations:

- Destroys or muddies the current installed baseline.
- Makes it harder to distinguish sensor improvement from placement, container, weather, or firmware changes.
- Risks changing the control input before evidence exists.

Decision:

- Not recommended for Phase 7M.

### Option C - Build Balcony02 First, Then Modify Balcony01 After Evidence

Advantages:

- Keeps the side-by-side evidence benefits of Option A.
- Still allows Balcony01 upgrade later if the evidence supports it.
- Matches the current field-validation discipline.

Decision:

- Recommended direction.

Side-by-side comparison matters because it gives evidence for:

- Moisture calibration and mapped-index behavior.
- Sensor-to-sensor variation.
- Watering-response timing and post-watering behavior.
- Dry-down behavior.
- DHT/BME/light/environment comparison.
- Control validation without sacrificing the installed baseline.
- Customer trust in future sensor and dashboard language.

## Decision 3 - Proposed Balcony02 Sensor Package

Initial proposed package for a later approved build slice:

| Component | Install direction | Notes |
| --- | --- | --- |
| 2-3 SEN0308 moisture sensors | Install for comparison | Not control-approved; collect per-sensor raw ADC evidence; ADS1115/ADS1015-style external ADC is recommended. |
| 3 SEN0562 IP68 light sensors | Install for balcony light mapping if wiring/mounting is approved | GPIO21/GPIO22 I2C should support a TCA9548A-style mux if fixed-address conflicts exist. |
| SEN0204 level | Bench-test or install depending reservoir access | Low-level evidence only; no alert/interlock yet. |
| BME280/BME-style environmental sensor | Include if physically protected and appropriate | Mount shaded/vented, not inside a warm sealed electronics box. |
| Momentary hold-to-water/test switch | Requirements only in Phase 7M | GPIO32 is a proposed planning candidate; no wiring or firmware implementation yet. |
| Future relay/pump path | Deferred | Only after later approval. |

Phase 7M does not assign a Balcony02 UUID, build profile, registry row, dashboard selector, or provisioning record, and it does not implement pin wiring, cable routing, or production wiring entries.

## Decision 4 - SEN0308 Moisture Validation Plan

Required evidence before replacing or trusting the current analog moisture sensor:

- Current Balcony01 mapped `moisture_index` and `raw_adc`.
- Current Scout01 mapped `moisture_index` and `raw_adc`, if relevant to placement/environment comparison.
- Balcony02 SEN0308 mapped value and raw ADC once implemented in a later phase.
- Sensor unit identity and physical placement notes.
- Probe depth and container location.
- Container, plant, soil, and drainage differences.
- Watering event timing.
- Whether water physically flowed.
- Post-watering response time and shape.
- Dry-down behavior over multiple days.
- Weather/light/environment context.
- Startup/settling and failed-read candidates.
- Any sensor movement, cleaning, reseating, replacement, or cable change.

No calibration claim is allowed until evidence exists. No watering-control behavior change is approved in Phase 7M.

## Decision 5 - Light Sensor Strategy

SEN0562 is the preferred field light candidate because its IP68 packaging is more practical for outdoor evidence.

SEN0390 remains useful for:

- Bench comparison.
- Protected-enclosure experiments.
- Sanity checks against SEN0562 behavior.

Light evidence may help interpret:

- Sun/shade exposure.
- Dry-down differences.
- Seasonal patterns.
- Dashboard context.

Light evidence must not:

- Affect watering control in MVP.
- Be treated as plant diagnosis.
- Be overclaimed as PAR.
- Become a safety input.

## Decision 6 - Reservoir Level Strategy

SEN0204 should be evaluated as a low-reservoir evidence sensor.

Physical tests must answer:

- Does it detect through the actual reservoir wall?
- Does wall thickness, curvature, or material matter?
- Does mounting location stay stable?
- Does liquid level slosh cause unreliable state changes?
- Does sunlight, water temperature, condensation, or adhesive failure matter?
- Is one level point enough for MVP low-reservoir evidence?
- Would future multi-level or continuous level sensing be needed?

Phase 7M does not approve alerting, dry-run protection, or pump-control use.

## Decision 7 - Momentary Switch Requirements

Recommended switch type:

- Momentary pushbutton.
- Normally-open contact preferred.
- Hold-to-run interaction.
- Outdoor/weather-rated enclosure or panel-mount part.
- Suitable for low-voltage ESP32 digital input use.

Minimum requirements:

- Weather resistance appropriate to outdoor balcony exposure; IP65 minimum is the practical floor, with IP67 or better preferred when available.
- Panel-mount or enclosure-mount body with a clear mounting hole specification.
- Normally-open dry-contact output.
- Usable with wet fingers and light gloves.
- Clear tactile feedback.
- Accidental press resistance through placement, shroud, guard, raised bezel, or deliberate button force.
- Durable cap/actuator material suitable for UV/weather exposure.
- Practical wire leads, solder lugs, screw terminals, or connector pigtail.
- Serviceable replacement path.
- Clear labeling/color choice, such as blue for water/test or a guarded neutral color.

Nice-to-have features:

- Stainless or UV-stable body.
- Sealed rear terminals or boot.
- Replaceable cap/legend.
- Prewired pigtail with strain relief.
- Distinct feel from reset/power buttons.

Shopping keywords:

- `momentary normally open waterproof pushbutton`
- `IP67 panel mount momentary switch`
- `sealed NO push button 12mm 16mm 19mm`
- `outdoor momentary pushbutton normally open`
- `anti vandal momentary NO waterproof switch`

Recommended order quantity:

- Order at least 3 candidate switches or 2 plus one spare after Jeremy/ChatGPT final part review.

Failure modes to consider:

- Switch stuck closed.
- Water intrusion.
- Corroded terminals.
- Cable pullout.
- Accidental hold.
- User confusion with reset/power.

GPIO32 is a proposed planning candidate for the normally-open physical hold-to-water/test switch input, subject to later firmware and wiring approval. Future firmware must enforce pump shutoff as first-priority logic and a hard maximum runtime if the input remains active. Phase 7M does not implement the switch in firmware, does not wire it physically, and does not grant pump authority.

## Decision 8 - Control Eligibility And Safety Boundary

Must not happen yet:

- New sensors must not affect watering control because they are installed.
- Light must not affect watering control.
- Reservoir level must not control the pump until separately implemented and validated.
- SEN0308 must not replace the current control input without side-by-side evidence and approval.
- Raw ADC must remain diagnostic evidence.
- `control_eligible` must not change in Phase 7M.
- Hosted dashboard must remain read-only.
- Supabase must not become command/control.
- Manual Water Now behavior remains unchanged until a later explicit phase.

## Decision 9 - Documentation Artifact Choice

This product/design matrix is the right Phase 7M artifact.

ADR 0021 is not created in this implementation because Phase 7M does not define a new durable architecture boundary. Existing accepted ADRs already cover the relevant boundaries:

- ADR 0016 for modular sensors and control eligibility.
- ADR 0017 for Gen2 measurement storage.
- ADR 0018 for control-quality and freshness gates.
- ADR 0020 for customer/local-control and physical hold-to-water direction.

If a later Phase 7M review locks a product boundary that future work must not casually change, ADR 0021 can be proposed separately.

## Future Implementation Slices

Possible later slices after hardware arrival and approval:

- Balcony02 hardware/build plan.
- Balcony02 identity/provisioning plan.
- SEN0308 bench/field firmware support.
- SEN0562 light firmware support.
- SEN0204 bench physical detection test.
- Physical switch hardware and firmware design.
- Evidence capture protocol and CSV/export workflow.
- Production wiring workbook update after hardware decisions are approved.

Each slice needs separate inspection, proposal, approval, implementation, validation, and commit discipline.

## Validation Expectations For This Phase

Docs-only validation:

- `git diff --check`
- `git status -sb`
- `git diff --stat`
- `git diff --name-only`

No frontend build is expected because no frontend files change.

No firmware build is expected because no firmware files change.

No SQL validation is expected because no SQL files change.

No deploy or firmware upload is expected.
