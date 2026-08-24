# Phase 8G.1 Relative Moisture Index Scale Implementation

Status: Implemented and locally validated; production deployment and production validation are excluded

Date: 2026-08-24

Scope: Hosted frontend RMI calculation, gardener-facing condition presentation, deterministic tests, and current product documentation

## Decision

The hosted frontend uses a revised provisional gardener-facing Relative Moisture Index (RMI) derived directly from each presentation-eligible SEN0308 raw ADC reading:

```text
RMI = 35 + 65 × (11230 − raw_adc) / 3590
```

The reference points are:

- raw ADC `11230` maps to RMI `35`, the observed lower condition where watering is already overdue or plant stress is likely;
- raw ADC `7640` maps to RMI `100`, the adequately watered reference;
- larger raw ADC generally means drier soil, while larger RMI means wetter soil.

The reference-point equation is the implementation authority. Its expanded approximation, `RMI = 238.3565 − 0.01810585 × raw_adc`, is explanatory only. The frontend calculates RMI directly from raw ADC; it does not calculate or transform the superseded Phase 8A index first.

## Product meaning

RMI is an index, not a moisture percentage and not laboratory-calibrated volumetric water content. The scale is based on practical garden observations. It remains one shared provisional display scale rather than per-sensor calibration.

RMI is intentionally unclamped. Negative values describe conditions drier than the ordinary reference range, and values above `100` describe wetter conditions. RMI `100` is an adequately watered reference, not a maximum. A negative or otherwise out-of-band RMI is not independently an electrical fault; provider validity, electrical plausibility, presentation eligibility, quality, freshness, and evidence-state handling remain separate.

Each reading describes the soil immediately around its probe. Roots and rootballs, soil packing, probe contact, emitter placement, sun exposure, drainage, plant consumption, and water distribution can create legitimate differences among installed probes. A normal four-cycle watering event produced revised readings near `108`, `121`, and `131`. The deliberately broad `Well-watered` band keeps all three reassuring instead of manufacturing conflicting conditions from ordinary local variation.

## Condition bands

Classification uses the unrounded calculated RMI. The card rounds only after classification.

| Unrounded RMI | Condition | Gardener meaning |
| ---: | --- | --- |
| `≤ 35` | Too Dry | Watering is overdue |
| `> 35` and `≤ 55` | Dry | Watering is due |
| `> 55` and `≤ 85` | Moist | Usable moisture remains |
| `> 85` and `≤ 140` | Well-watered | Adequately watered; ordinary probe differences remain reassuring |
| `> 140` and `≤ 180` | Very Wet | Wetter than normally necessary |
| `> 180` | Saturated | Exceptional saturation-like evidence |

`Saturated` is intentionally reserved for evidence substantially wetter than the observed normal watering event. These descriptions are presentation bands, not separate watering-control thresholds.

## Provisional watering-due context

RMI `55` is the selected provisional point where watering becomes due during dry-down because it is the transition from `Moist` into `Dry`. At or below `55`, watering is due. At or below `35`, watering is overdue; waiting for the Too Dry boundary would be too late. RMI `55` corresponds to raw ADC approximately `10125`.

This context does not give the hosted frontend watering authority and does not change the controller's actual configured threshold. Any future automated use must remain firmware-local and retain repeated-reading, freshness, evidence-quality, reservoir, cooldown, and other safety gates. Phase 8G's separate work to present actual controller configuration honestly remains open.

## Implementation behavior

- Current moisture cards, card trends, historical series, chart tooltips, condition labels, condition colors, and Support details use the same shared direct derivation.
- Derived RMI retains the exact source row's timestamp and evidence metadata and is unavailable when that raw source has no usable numeric value.
- Raw ADC remains visible only as Support engineering evidence; ordinary gardener-facing cards and charts show the RMI as an `index` without raw ADC or formula detail.
- Current cards preserve whole-index display rounding. Historical tooltips preserve their existing one-decimal maximum. Neither path clamps the calculated value.
- Phase 8C.3 freshness/evidence policy and Phase 8C.4 presentation eligibility remain unchanged.

## Historical boundary

The accepted 2026-06-18 Phase 8A first-draft and its implementation closeout remain accurate records of the earlier `0`/`90` reference scale and then-current condition bands. This record supersedes that scale only for current hosted behavior; it does not rewrite the earlier decision as though the revised scale existed at that time.

## Exclusions

No firmware, firmware threshold, watering behavior, button, pump duration, reservoir logic, device configuration, per-sensor calibration, Supabase schema/function/RLS/grant/view/data, deployment, upload, live-device mutation, or production-data mutation is part of Phase 8G.1.
