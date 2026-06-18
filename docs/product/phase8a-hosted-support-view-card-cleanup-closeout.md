# Phase 8A Hosted Support View Card Cleanup Closeout

Status: Implemented and accepted for Phase 8A closeout

Date: 2026-06-18

Scope: Hosted Support View frontend only.

## Outcome

Prototype01 hosted Support View now uses the accepted first-draft gardener-facing moisture scale from [`phase8a-relative-moisture-index-first-draft.md`](./phase8a-relative-moisture-index-first-draft.md).

Moisture Index is defined, not learned:

```text
gardener_moisture_index =
  90 * (14820 - current_raw) / (14820 - 11230)
```

Constants:

- `practical_dry_raw = 14820`
- `wet_drained_raw = 11230`
- `wet_drained_index = 90`

Display labels:

| Index range | Display label |
| ---: | --- |
| `< 0` | Check Sensor |
| `0-20` | Too Dry |
| `20-40` | Dry |
| `40-70` | Moist |
| `70-90` | Well-watered |
| `90-105` | Very Wet |
| `> 105` | Saturated |

## Hosted Support View Changes

- The main hosted Support View card grid is grouped into `Soil Conditions`, `Light Conditions`, and `Air Conditions`.
- The Soil Conditions Moisture Index card is derived display-only from Prototype01 SEN0308 ADS1115 A0 raw ADC evidence: `sensor_key = sen0308_m01`, `measurement_name = raw_adc`.
- Raw ADC is preserved as supporting card evidence and sensor-detail evidence.
- Disabled and profile-not-installed channels are no longer promoted as main red cards.
- Legacy Prototype01 `soil_moisture_analog` / GPIO34 moisture index is not promoted as the main hosted Support View moisture card.
- Device History derives and plots the same display-only Moisture Index series from `sen0308_m01` raw ADC.
- Device History tooltip formatting is measurement-specific: Moisture Index shows a plain index number, Relative Humidity shows percent only, and Raw ADC shows counts.
- Device Status no longer treats expected `quality:"not_installed"` / `reason:"profile_not_installed"` rows as bad top-level data.

## Deferred Work

- Light daily exposure and mapping remain future learning/mapping work.
- Full graphic dashboard redesign is explicitly deferred.
- Broader Balcony02 moisture analytics, multi-sensor confidence, and future sensor-assisted watering decisions remain later work.

## Boundaries

- No watering authority changed.
- No firmware, SQL/RLS, deployed command/control, pins, sensors, device IDs, thresholds, cadence, cooldown, or local dashboard behavior changed.
- The derived Moisture Index is display-only and does not authorize watering.
