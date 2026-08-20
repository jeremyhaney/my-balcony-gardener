# Phase 8 Post-8C.5 Priority Sequence

Date: 2026-08-19

Status: Approved roadmap sequence; Phases 8D, 8E, and 8F are operationally closed. Phase 8F.1–8F.10 retired the unsupported frontend/history paths, obsolete firmware profiles and source, legacy firmware configuration shape, retired source/database identities, final development fixtures, and obsolete `sensor_logs` schema/access surface. Phase 8F.11 completes the repository-wide audit and closeout. Phase 8G Watering-Threshold Presentation is next; it remains separately bounded and unimplemented.

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

## Execution status

- **Phase 8D is operationally closed.** Commit `406bce9` restored paired start/terminal watering cycles, normal completions and safety cutoffs, honest sub-second wording, type-specific chart/history presentation, selected-device/window behavior, and count-preserving in-window chart markers. Jeremy confirmed the authenticated hosted result on 2026-08-19. See [`phase8d-watering-event-visibility-restoration-closeout.md`](./phase8d-watering-event-visibility-restoration-closeout.md).
- **Phase 8E is operationally closed.** Its approved formulas, exact package-provenance pairing, evidence behavior, cards, chart series, and deterministic tests were committed and pushed to `main` as `8d90cec77ec128ee7eeaba304fc24cd5cb3a2453`, then deployed through the established Cloudflare production path. Jeremy confirmed on 2026-08-19 that the live site visibly contained the Phase 8E features. This proves deployed feature presence, but byte-for-byte correspondence between the Cloudflare-served bundle and local `HEAD` was not independently proven. No SQL, query, watering, or control-authority change occurred. See [`phase8e-feels-like-and-dew-point-implementation.md`](./phase8e-feels-like-and-dew-point-implementation.md).
- **Phase 8F is operationally closed.** Phase 8F.1–8F.3 retired unsupported local/frontend history consumers. Phase 8F.4 retired obsolete Balcony01, Scout01, and Prototype01/Bench01 PlatformIO environments and default selection. Phase 8F.5 retired unreachable Gen1 firmware implementation. Phase 8F.6 migrated the ignored firmware Supabase URL to the project HTTPS root and preserved the exact active Gen2 routes. Phase 8F.7 recorded live retired-device row/dependency/exposure truth and created the first verified protected safety export. Phase 8F.8 removed retired local frontend identities, obsolete environment fallbacks, and unused browser-to-device Vite proxies. Phase 8F.9 refreshed the protected export and deleted exactly 81,575 proven retired-device rows. Phase 8F.10 attributed, exported, and deleted the final six development/validation rows, dropped the empty obsolete `sensor_logs` surface with `RESTRICT`, and removed unused Data API grants from retained empty `sensor_events`. Phase 8F.11 found no remaining executable Gen1 path, active retired identity/configuration dependency, or unresolved schema/access risk in the tracked repository and reconciled current authority. Balcony02, all protected evidence including the 95 `reservoir_liquid_state` batches, the current Gen2 helper dependencies, and the sole supported `balcony02-gen2` safety boundary remain unchanged. See the [final audit and closeout](./phase8f11-final-gen1-retirement-audit-and-closeout.md) and its linked Phase 8F.1–8F.10 evidence chain.
