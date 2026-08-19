# Phase 8 Post-8C.5 Priority Sequence

Date: 2026-08-19

Status: Approved roadmap sequence; each phase still requires its own discovery, boundary approval, implementation approval, validation, and closeout

## Decision

The former Phase 8D/8E optional schedule and sensor-assisted watering work remains deferred and renamed Phase 9A/9B. Phase 8D through Phase 8I now continue the nearer-term working-product sequence:

1. **Phase 8D — Watering-Event Visibility Restoration.** Restore the recently lost hosted watering-event display as regression repair before adding new features. Diagnose the evidence/query/transformation/rendering path and recover honest timestamps, duration, type, selected-device behavior, selected-window behavior, chart markers, and history presentation without changing watering authority or behavior. Threshold presentation is excluded unless proven inseparable from the regression.
2. **Phase 8E — Feels Like and Dew Point.** Add the familiar derived microclimate values as a small presentation slice. Define exact formulas, units, rounding, source-time alignment, Phase 8C.4 eligibility, Phase 8C.3 freshness/fallback behavior, trend/card placement, and deterministic acceptance cases. These values remain display-only and gain no watering authority.
3. **Phase 8F — Gen1 Risk Review, Containment, and Retirement.** Treat recurring Gen1 references and assumptions as an active delivery and correctness risk. Inventory code, queries, adapters, fallbacks, fixtures, tests, terminology, documentation, build profiles, and compatibility obligations; classify each item as required, isolated compatibility, obsolete, unreachable, or uncertain; protect required behavior with tests; then remove or contain proven remnants through bounded implementation slices. This is intended to retire risk, not merely produce an inventory, and must not revive generic raw-ADC or 12-bit assumptions.
4. **Phase 8G — Watering-Threshold Presentation.** Clearly expose the controller's actual configured threshold and associated units/context without presenting it as an agronomic recommendation, changing it from the hosted UI, or transferring watering authority from local firmware. Keeping this separate prevents the Phase 8D regression repair from becoming a redesign.
5. **Phase 8H — Customer Adoption and Customer-Led UI Modernization.** Use an authorized customer-visible commissioned device and a real customer journey to drive adoption, onboarding, naming, navigation, responsive behavior, accessibility, and targeted modernization. Phase 8H may be divided into approved 8H.x slices. Balcony02 must not be reassigned merely to simulate customer adoption, and modernization must preserve the successful information-at-a-glance presentation rather than become an untethered visual rewrite.
6. **Phase 8I — Deterministic Demo.** Build the stable public showcase after customer adoption and the resulting UI direction are established, avoiding a Demo that would immediately be rebuilt. Use curated non-live data, representative conditions and watering history, guided interactions, and no protected Support configuration or production-data dependency.

## Priority rationale

- Phase 8D is first because watering-event visibility is a recently broken existing function.
- Phase 8E has unusually high near-term value: the values are familiar to dashboard users, provide direct personal feedback against the balcony microclimate, and should be a bounded derived-presentation slice.
- Phase 8F moves ahead of expansion because Gen1 ambiguity repeatedly consumes review time and creates a hidden-change risk. Removing that drag should make every later slice safer and faster.
- Phase 8G follows the repair and Gen1 review so threshold display uses the correct surviving control concepts and units.
- Phase 8H couples adoption with evidence-driven modernization rather than modernizing speculatively.
- Phase 8I follows adoption and modernization so the deterministic Demo represents the intended product instead of a transitional interface.

## Preserved boundaries

- Phase numbers express priority, not implementation approval.
- Phase 8D and Phase 8G are read-only presentation/evidence work unless a later approved design explicitly says otherwise.
- Supabase remains telemetry, history, diagnostics, and event-evidence storage—not command/control.
- Local ESP32 firmware continues to own watering decisions and pump shutoff.
- Phase 9A/9B remains deferred optional local automation and is not implied by any Phase 8 work.
- No phase in this roadmap is authorized to change firmware, SQL, deployment, customer visibility, watering behavior, thresholds, or control authority merely by appearing here.

