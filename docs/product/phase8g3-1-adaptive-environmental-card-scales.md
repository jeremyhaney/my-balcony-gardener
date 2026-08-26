# Phase 8G.3.1 - Adaptive Environmental Card Scales

Status: Complete and locally validated; production deployment and hosted validation are not claimed

Date: 2026-08-26

Scope: Hosted Gen2 environmental-card presentation, the healthy reservoir presentation, deterministic tests, and current product documentation

## Product decision

The environmental reading cards are now the visible scales rather than single-color cards with separate miniature scale pills. Each adaptive card:

- preserves visible lower and higher environmental context at its edges;
- gives the current condition neighborhood the dominant central field;
- blends between neighboring conditions instead of presenting equal hard stoplight bands;
- retains the explicit gardener-facing condition pill and numeric value;
- includes a small `lower / current range / higher` orientation cue;
- exposes an accessible scale description and current-condition label.

This presentation intentionally communicates fuzzy environmental interpretation. Temperature, light, humidity, dew point, soil moisture, and related weather/garden conditions have useful neighborhoods and gradual transitions even though their classification functions retain deterministic boundaries. The adaptive background does not change any measurement, threshold, classification, trend, or evidence-state rule.

## Scale behavior

The existing Phase 8C.5 and Phase 8G.1 environmental presentation authorities remain the source of scale position, condition label, tone, and RMI classification. Phase 8G.3.1 adds a display transform only:

- the full scale family supplies the lower-to-higher color order;
- the current scale position selects the dominant color neighborhood;
- the dominant neighborhood occupies approximately the middle half of the card, with soft shoulders into adjacent conditions and compressed endpoint context;
- ordinary sensor cards and the derived Feels Like and Dew Point cards share the same treatment;
- unavailable/neutral cards retain the established evidence presentation rather than inventing an environmental interpretation.

The card condition pill remains the primary concise text interpretation. The background is supporting context, not the sole carrier of meaning.

## Reservoir exception

Reservoir evidence remains binary and is not rendered as a fuzzy continuum.

When current evidence says `Water Detected`, the former major reservoir card collapses to a compact confirmation row with access to sensor details. `Refill Reservoir`, unavailable, stale, invalid, not-installed, and sensor-trouble states retain the prominent card path so an actionable or uncertain water condition is never visually minimized.

This is presentation behavior only. The firmware reservoir start block, active-run cutoff, local pump authority, and watering-event evidence are unchanged.

## Accessibility and responsive behavior

- Adaptive cards receive an accessible label containing the scale meaning and current condition.
- Numeric values and text condition pills remain visible; color is not the only information channel.
- Desktop retains the existing section-specific card grids.
- Mobile retains the single-column card layout without horizontal overflow.
- The compact healthy reservoir status remains readable and exposes its details control.

## Implementation

- `mbg_dashboard/src/hostedGen2EnvironmentalPresentation.ts` defines the adaptive scale-background transform without changing the existing scale-object contract.
- `mbg_dashboard/src/components/HostedGen2Measurements.tsx` applies the transform to ordinary and derived environmental cards and selects the compact healthy-reservoir presentation.
- `mbg_dashboard/src/components/HostedGen2Measurements.css` supplies the adaptive card surface, orientation caption, and compact reservoir layout.
- `mbg_dashboard/tests/hostedGen2AdaptiveScale.test.ts` verifies current-neighborhood dominance and the binary reservoir exclusion.

## Validation

- Dashboard deterministic tests passed `70/70`.
- ESLint passed.
- TypeScript/Vite production build passed.
- `git diff --check` passed.
- Local browser validation passed with live Demo data at the normal desktop viewport.
- Phone-sized validation passed at a requested `390 × 844` viewport; the browser reported equal document scroll width and client width, proving no horizontal overflow.
- Visual review covered light, air temperature, humidity, pressure, Feels Like, Dew Point, RMI moisture, soil temperature, and the healthy reservoir treatment.

## Non-changes and exclusions

No firmware, firmware threshold, watering behavior, reservoir logic, button behavior, telemetry, heartbeat, watering-event evidence, Supabase query, schema, function, policy, RLS, grant, view, device identity, capability declaration, authentication rule, deployment, upload, or production-data mutation is part of Phase 8G.3.1.

