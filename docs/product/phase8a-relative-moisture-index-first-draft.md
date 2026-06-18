# Phase 8A Relative Moisture Index First Draft

Status: Accepted first-draft product scale; implemented in hosted Support View for Phase 8A

Date: 2026-06-18

Scope: Documentation/design only.

## Core Decision

- Phase 8A defines a first-draft gardener-facing moisture scale for SEN0308 raw ADC evidence.
- This is not a calibrated volumetric water-content percentage.
- This is a practical product index for interpreting whether soil is too dry, dry, moist, well-watered, very wet, or saturated.
- Use one fleet-average/provisional scale. Do not require per-sensor field calibration for the MVP.
- Preserve raw ADC evidence for audit, future tuning, and troubleshooting.
- Do not display this to normal gardeners as a scientific moisture percentage.

## Formula

```text
gardener_moisture_index =
  90 × (practical_dry_raw - current_raw)
      / (practical_dry_raw - wet_drained_raw)
```

Initial constants:

```text
practical_dry_raw = 14820
wet_drained_raw = 11230
wet_drained_index = 90
```

Therefore:

```text
gardener_moisture_index =
  90 × (14820 - current_raw) / (14820 - 11230)
```

## Rationale

- Earlier engineering RMI work treated an extreme dry reference as the bottom of the useful scale.
- That wasted practical display resolution on soil conditions that are already too dry for plant health.
- The product scale should make sense to a gardener, not just to a sensor engineer.
- Practical dead-dry soil becomes `0`.
- Wet-drained / saturated-drained soil becomes `90`.
- `100+` is reserved for wetter-than-normal, saturated, or water-like readings.
- This leaves useful headroom above normal wet-drained soil and improves resolution across the practical living-plant range.

## Display Labels

| Index range | Display label | Product interpretation                                                                                 |
| ----------: | ------------- | ------------------------------------------------------------------------------------------------------ |
|       `< 0` | Check Sensor  | Reading is outside the practical soil range; possible air gap, poor contact, or unusual dry condition. |
|      `0-20` | Too Dry       | Already too dry; watering should generally be allowed if safety gates pass.                            |
|     `20-40` | Dry           | Watering is likely needed or should be allowed if schedule and gates agree.                            |
|     `40-70` | Moist         | Soil has usable moisture and can still accept water; not necessarily a skip condition.                 |
|     `70-90` | Well-watered  | Soil is in a good wet/reserve range; scheduled watering should usually be skipped.                     |
|    `90-105` | Very Wet      | Wet-drained or wetter than the normal target range; skip or block watering.                            |
|     `> 105` | Saturated     | Saturated or water-like evidence; block watering and preserve evidence.                                |

## UI Language Decision

- Normal UI should use gardener labels such as `Moist` and `Well-watered`.
- Avoid `OK` labels.
- Avoid presenting the value as a calibrated percent moisture.
- Advanced/debug details may show raw ADC, formula constants, and off-scale values.

## Control Boundary

- This Phase 8A documentation does not approve new watering authority.
- The scale may support display and later sensor-assisted schedule decisions.
- Actual skip/allow thresholds remain later implementation work.
- Sensor-assisted watering should remain schedule-first: the schedule says watering is due, and sensor evidence helps allow, skip, or block that scheduled watering.
- Low values should not be interpreted as the desired watering target. `Too Dry` means the product waited too long.

## Non-Goals

- No firmware changes.
- No frontend runtime changes.
- No SQL/RLS changes.
- No hosted behavior changes.
- No pin, sensor, device ID, watering duration, cooldown, telemetry cadence, `MOISTURE_THRESHOLD`, or `control_eligible` changes.
- No per-sensor field calibration requirement.
- No unattended watering authority change.

## Follow-Up Evidence

- Future tuning should compare this index against Jeremy's finger-test judgment, cheap moisture-meter readings, actual watering decisions, post-watering response, and dry-down behavior over time.
- Preserve raw ADC so future tuning can revise constants or display windows without losing evidence.

## Phase 8A Implementation Note

- Phase 8A implemented this scale in the hosted Support View as display-only frontend behavior for Prototype01.
- The hosted Moisture Index card and Device History series derive `gardener_moisture_index` from Prototype01 SEN0308 ADS1115 A0 raw ADC evidence (`sensor_key = sen0308_m01`, `measurement_name = raw_adc`).
- Disabled/profile-not-installed channels are hidden from the main card grid, expected `profile_not_installed` rows no longer make Device Status yellow, and chart tooltips use measurement-specific units.
- Closeout details: [`phase8a-hosted-support-view-card-cleanup-closeout.md`](./phase8a-hosted-support-view-card-cleanup-closeout.md).
- This implementation did not change watering authority, firmware, SQL/RLS, command/control behavior, pins, sensors, device IDs, thresholds, cadence, cooldown, or local dashboard behavior.
