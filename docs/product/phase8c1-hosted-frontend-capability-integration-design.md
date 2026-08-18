# Phase 8C.1 Hosted Frontend Capability Integration Design

Status: design accepted; Phase 8C.2 implemented, committed, pushed, production-validated (**Pass**), and operationally closed

Implementation note: Phase 8C.2 was implemented, committed, and pushed on `main` as `b1eea01c484d6838e66598f6fd5b0eeae3c2d251` (`Implement Phase 8C.2 Support capabilities`). The normal post-push hosted update deployed it with no manual deployment. Validation passed 15/15 tests, lint, the TypeScript/Vite production build, and `git diff --check`; the existing large-chunk advisory remained non-blocking. Jeremy approved the authenticated Support production smoke test on 2026-08-16. Directly observed and test/inspection-supported behavior are recorded separately below.

Authority: [ADR 0024](../adr/0024-hosted-device-capability-source-of-truth-and-presentation-boundary.md)

Production contract and evidence: [Phase 8C contract design](./phase8c-hosted-device-capability-contract-design.md) and [production execution evidence](./phase8c-hosted-device-capability-production-execution-evidence.md)

## Purpose and current state

This document defines how a later hosted frontend will consume the commissioned device-capability authority established by ADR 0024 and executed in Phase 8C. It applies that decision to product behavior; it does not replace ADR 0024, change production, or claim that frontend integration exists today.

Production contains `public.device_capabilities`, `public.customer_device_capabilities`, `public.support_device_capabilities`, and `btree_gist` `1.7`. Supabase positive commissioned declarations are the hosted capability authority. There is no public capability surface or frontend capability consumer.

Balcony02 is the first validation device: device ID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`; nine commissioned logical sensors; eleven expected stored measurements; all effective from `2026-08-12T17:03:41Z`; no retirements; no M04; and no L04 or LUX04. Its assignment remains `garden_device_role = support_bench`, `customer_visible = false`, `support_visible = true`, and `active = true`.

The deployed lifecycle fields are `effective_from` and `effective_to`. A declaration is effective now when `effective_from <= current time` and (`effective_to is null` or `effective_to > current time`).

## Binding authority boundaries

1. Presence of a positive Supabase declaration means the hosted frontend may expect that logical sensor. Absence makes no assertion that a sensor is unsupported or physically absent. Do not create negative "not installed" inventory; connector accommodation is not commissioning.
2. Firmware `/capabilities` is runtime/build evidence. Measurements are observations. Neither can commission, retire, create, or remove cards.
3. A commissioned sensor remains represented when evidence is current, stale, invalid, unavailable, absent from the latest batch, missing, or never reported. Unknown or undeclared measurements cannot create ordinary cards.
4. Capability, measurement, validity, freshness, derived health, presentation, and Support diagnostics remain distinct.
5. Units, formatting, grouping, ordering, charts, descriptions, condition wording, thresholds, colors, icons, and formulas remain frontend responsibilities. Installation-specific friendly names and locations come from provisioning.
6. Frontend metadata must not become a shadow per-device inventory. No hard-coded inventory or production build-profile fallback may hide missing or failed provisioning.
7. Capability access remains authenticated; no public capability exposure is permitted. Device assignment remains separate from capability and health, and this design does not change Balcony02's assignment.
8. Gen1 and Gen2 storage contracts remain intact. Firmware retains watering authority and safety shutoff. Hosted pages remain read-only for watering. Major visual modernization is deferred.

These boundaries also preserve [ADR 0009](../adr/0009-hosted-readonly-dashboard.md), [ADR 0016](../adr/0016-gen2-modular-sensor-architecture.md), [ADR 0017](../adr/0017-gen2-measurement-batch-storage.md), [ADR 0020](../adr/0020-mvp-customer-setup-access-and-local-control-boundary.md), and [ADR 0022](../adr/0022-gen2-endpoint-responsibility-and-contract-cleanup.md).

## Selected rollout

Adoption begins on the authenticated Support page. The Support client reads authorized rows from `public.support_device_capabilities`, not the base table. Balcony02 is the first validation device and remains Support-visible/customer-hidden.

Customer adoption waits until an authorized customer-visible commissioned device exists. A separate customer loader will read `public.customer_device_capabilities`; Balcony02 must not be reassigned for testing.

The current public Demo is not an architecture constraint and receives no capability access. Preserve it if practical during later implementation. If shared-code changes make it incompatible, hiding or altering it requires explicit disclosure and approval. A future real Demo uses deterministic, non-live showcase data, not production telemetry.

## Shared internal model and identities

Authorization-specific Support and future customer loaders normalize their rows into the same internal capability type: one object per commissioned logical sensor containing `device_id`, logical-sensor identity, sensor family, logical channel, expected stored measurement array, friendly name, location label, optional physical identity, and effective/retirement lifecycle fields. Physical identity and lifecycle administration remain primarily Support-oriented.

Keep these identities distinct:

| Identity | Meaning |
| --- | --- |
| Logical sensor | Durable commissioned position such as `sen0308_m01` or `bme280_air`. |
| Stored measurement series | Logical sensor plus stored measurement name. |
| Card | Stable presentation identity produced by an explicit mapping. |
| Chart series | Stable history identity, which may differ from card identity. |
| Physical sensor | Optional installed-piece/service evidence; never the logical key. |

Do not expand each expected measurement into a separate commissioned sensor. One BME280 declaration remains one logical sensor even though it produces three cards and three chart series.

## Lifecycle, loading, and caching

The Support loader normalizes authorized lifecycle rows, then the operational dashboard keeps only declarations effective now. Future-effective and retired rows create no current cards. Retirement does not create a "Not Installed" card; historical lifecycle and measurement evidence remain separate from the current dashboard.

Capabilities are intentional configuration, not telemetry. Fetch once per device when first needed in an active session, cache in frontend memory by `device_id`, and reuse while navigating. Fetch another device only when first selected. Refetch after full reload or a new application session. Do not persist the first implementation's cache indefinitely in browser storage. A future provisioning workflow may explicitly invalidate it.

Do not refetch capabilities during five-minute measurement refresh, hidden/visible transitions, manual measurement Refresh, history-window changes, or chart-selection changes. Preserve five-minute visible measurement refresh, pause while hidden, immediate refresh on visibility return, manual Refresh, last-refreshed display, overlapping-request protection, history windows, and existing query mechanics. Do not redesign query granularity.

A full page reload is the expected way to observe an intentional lifecycle change until explicit invalidation exists.

## Explicit Balcony02 mappings

Mappings must be exact. Do not use fuzzy substring matching.

### BME280

`bme280_air` is one logical sensor expecting `air_temperature`, `relative_humidity`, and `barometric_pressure`. It creates three separate existing Air cards: Air Temperature, Humidity, and Atmospheric Pressure; and three independent history series. Each value has independent validity, freshness, and availability. This is not one compound Air card. Universal unit/garden-wide Air labels take precedence over its installation-friendly name.

### DS18B20

`ds18b20_temperature` creates the Soil Temperature card. Production expects `soil temp`, matching ADR 0022. Gen2 history also contains legacy DS18B20 `temperature` rows, so the adapter uses a narrow explicit alias from `temperature` to the declared soil-temperature meaning where required. It must not use broad "contains temperature" matching.

### SEN0308

`sen0308_m01`, `sen0308_m02`, and `sen0308_m03` each expect `raw_adc` and create the existing frontend-derived Relative Moisture Index presentation. Raw ADC remains evidence and Support-oriented detail. RMI is not another commissioned sensor. M04 does not appear.

### SEN0562

`sen0562_l01`, `sen0562_l02`, and `sen0562_l03` each expect `ambient_light` and create existing lux cards. No L04 or LUX04 appears.

### SEN0204

`sen0204_wl01` expects `reservoir_liquid_detected` and creates the existing Reservoir Water detected/not-detected presentation.

## Layout, naming, and ordering

Preserve the literal-world section order: Light, Air, Water, Soil. Preserve existing within-section order and repeated-channel physical sequence L01/L02/L03 and M01/M02/M03. Friendly-name changes never reorder cards. The current model deliberately uses one BME280 logical sensor and three Air cards.

Naming priority is universal frontend terminology for unit-wide readings; provisioned friendly name for location-specific sensors; provisioned location label; then a deterministic fallback such as `Moisture M01` or `Light L02`. Never hide a commissioned sensor because friendly name or location is blank. User ordering, drag-and-drop, custom layout, and SQL presentation-order metadata are deferred.

## Evidence states and derived values

| State | Required treatment |
| --- | --- |
| Commissioned and normal | Show current valid evidence ordinarily. |
| Stale | Keep the card and last good value; identify age/staleness. |
| Invalid | Keep the card and last good value; distinguish the invalid current attempt. |
| Absent from latest batch | Keep the card and last good value; show informational absence. |
| Never reported | Keep the card with a neutral unavailable/awaiting-evidence state. |
| Present but undeclared | Do not create an ordinary card; retain for future Support diagnostics. |
| Commissioned but presentation unsupported | Show safe generic Support representation without guessed units or conversions. |
| Derived calculation unavailable | Retain the commissioned representation and last good derived value when available. |

Always preserve and use the last good reading when one exists, clearly distinguishing it from current evidence. One missing or invalid reading is informational, not an emergency; do not immediately flash severe red or imply an alert. Later health work may escalate by last-good age and persistent consecutive failures. Exact thresholds, counts, alerts, and severity are deferred. Never use "Not Installed" for a commissioned sensor.

RMI remains in the first implementation as a presentation calculation from commissioned `raw_adc`, not a capability. If unavailable, retain the underlying representation and last good RMI when available. Feels Like, Dew Point, and other new interpretations are deferred; future versions derive them from compatible valid Air evidence and do not provision them unless a later contract explicitly changes that rule.

A future measurement-quality slice must address implausible evidence such as `362 F` and decide the correct firmware, ingestion, storage-validity, and frontend boundaries. Phase 8C.1 does not solve it.

## Frontend metadata and history

Frontend definitions may specify units, conversions, decimals, generic labels, grouping/order, charts, descriptions, environmental wording, thresholds, colors, icons, formulas, and explicit legacy aliases. They map declared capabilities to presentation but never assert which sensors a particular device has. Supabase provisioning owns commissioned logical sensors, expected measurements, family, channel, installation names/location, optional physical identity, and lifecycle.

Capabilities determine which expected history series are eligible. Measurements do not enumerate or commission series. A commissioned series remains eligible when a period has no records; show an empty state without implying uninstalled hardware. Undeclared history creates no chart choices. BME280 creates three series from one sensor, and SEN0308 history retains derived RMI. Preserve current fetching, windows, charts, polling, and refresh behavior; more declarations do not automatically load more history.

## No-fallback configuration states

1. While loading, show a neutral configuration-loading state.
2. On failure, show `Unable to load device configuration.` Support technical detail may be available, but fabricate no cards.
3. On success with zero effective capabilities, show `No commissioned sensors are configured for this device.` Fabricate no cards.

Measurements cannot establish card presence when authoritative capabilities fail or are absent. Never fall back to hard-coded Balcony02 inventory, a build profile, firmware `/capabilities`, current observations, or historical measurement enumeration.

## Gen1 strategy

The first integration makes no Gen1 changes. Existing Gen1 routes and adapters remain unchanged; do not provision, adapt, refactor, or clean them up. A later evidence-based phase decides what is universal, isolated, obsolete, or migration-worthy. Gen1 needs explicit Supabase provisioning before future capability adoption; never reconstruct it from build profiles, hard-coded cards, firmware, or observations. Gen1 and Gen2 may later normalize into shared presentation while retaining distinct storage adapters/contracts. No production build-profile fallback is allowed.

## Scope separation

Architecture covers capability clients, shared types, normalization, exact mappings, identity, lifecycle, caching, and adapters. Behavior/presentation covers evidence wording, last-good display, severity, thresholds, derived values, and condition language. Visual modernization (new layouts, responsive redesign, drag-and-drop, custom ordering, and broad styling) is deferred. Deferred diagnostics include undeclared measurements, expected-measurement absence, firmware comparison, physical sensor diagnosis, and provisioning tools; diagnostics never mutate commissioning automatically.

## Implementation sequence

- **Phase 8C.1 design closeout (current):** documentation only; no runtime changes.
- **Phase 8C.2 Support Vertical Slice (complete):** Support client, shared types, session cache, effective filtering, explicit Balcony02 mappings, declaration-driven cards, evidence attachment, existing history integration, failure states, tests, and production validation passed.
- **Optional automation work:** Local Schedule Foundation and Sensor-Assisted Scheduled Watering remain outside this capability-integration design. The current roadmap now defers them to Phase 9A/9B as a distinct secondary product direction; this supersedes the former Phase 8D/8E labels.
- **Evidence-state and health:** age/consecutive-failure escalation, restrained severity, last-good semantics, and informational versus actionable concern; no alerts without separate approval.
- **Measurement quality:** implausible-value handling and correct firmware/ingestion/storage/frontend boundary.
- **Customer adoption:** only after an authorized customer-visible commissioned device exists; do not reassign Balcony02.
- **Deterministic Demo:** future non-live showcase data without protected configuration.
- **Presentation:** future wording, colors, Feels Like, Dew Point, naming refinements, and additional RMI work.
- **Gen1 cleanup/preservation:** future evidence-based inventory; do not begin now.
- **Visual modernization:** future layout, responsive, accessibility, customization, and interaction work.
- **Support diagnostics:** future capability/measurement/firmware mismatch and provisioning support, subject to Phase 8C bounded-query and production read-only `EXPLAIN` requirements.

## Acceptance contract for the Phase 8C.2 Support Vertical Slice

The completed slice was accepted against this contract:

- Support reads `support_device_capabilities`, normalizes the authorized selected-device rows, filters `effective_from`/`effective_to`, and caches once per device per session.
- Balcony02 renders only approved declarations: three BME280 Air cards, Soil Temperature, three RMI cards, three lux cards, and Reservoir Water, in approved layout/order. M04/L04/LUX04 never appear, and BME280 is not a compound card.
- Missing, stale, invalid, latest-batch-absent, and never-reported evidence cannot remove commissioned representation; last-good evidence is preserved and honestly identified.
- Undeclared measurements create no ordinary cards; unsupported commissioned measurements get safe generic Support treatment without guessed units or conversions.
- Loading, failure, and successful-zero states are distinct and no fallback fabricates cards.
- Measurement polling, visibility behavior, manual refresh, history windows/charts, and query mechanics remain intact and never trigger capability refresh.
- Hosted watering stays read-only; assignment stays unchanged; customer adoption stays deferred; no public access is added.
- Tests cover normalization, lifecycle, exact aliases/mappings, order, cache, evidence states, history eligibility, and no-fallback behavior; production validation uses authenticated Support access to Balcony02.

## Production-validation checkpoint

On August 16, 2026, `HEAD`, `main`, and `origin/main` agreed at deployed commit `b1eea01c484d6838e66598f6fd5b0eeae3c2d251` (`Implement Phase 8C.2 Support capabilities`), and the working tree was clean before this documentation closeout. Deployment used the normal post-push hosted-page update; no manual deployment occurred. Automated validation passed 15/15 tests, lint, the TypeScript/Vite production build, and `git diff --check`; the existing Vite large-chunk advisory remained non-blocking.

Jeremy completed and approved the manual production smoke test. Directly observed on authenticated Support:

- Balcony02 rendered eleven capability-driven cards from nine commissioned logical sensors in Light, Air, Water, Soil order.
- Light rendered L01, L02, and L03. Air rendered separate Air Temperature, Humidity, and Atmospheric Pressure cards from BME280. Water rendered Reservoir Water. Soil rendered M01, M02, M03, and Soil Temperature.
- M04 and L04/LUX04 did not appear.
- Live values, state/status pills, trends, last-refreshed information, Manual Refresh, Sensor Details, and History functioned.
- Prototype01 displayed the successful zero-capability state without fabricated cards.
- The public Demo remained available and materially unchanged.

The following were not deliberately reproduced in production and remain supported by committed tests and implementation inspection: capability-query failure; future-effective and retired filtering; unknown commissioned-measurement fallback; undeclared measurement exclusion; evidence-state fixtures; once-per-device session caching; capability/measurement-refresh separation; hidden-tab polling; and concurrency protection.

Result: **Pass**. The post-push checkpoint is complete, and Phase 8C.2 is operationally closed. Balcony02 remains Support-only and customer-hidden. Prototype01 firmware/provisioning, customer adoption pending an authorized customer-visible commissioned device, evidence-state/health refinement, measurement-quality gates, Gen1 cleanup/adoption, deterministic Demo work, and major visual modernization remain separate future work. Optional schedule persistence and sensor-assisted watering are now deferred to Phase 9A/9B.

## Prohibited changes in the Phase 8C.2 Support Vertical Slice

Do not change SQL, schema, data, policies, grants, capabilities, assignments, firmware, pins, sensors, IDs, profiles, thresholds, cadence, watering, safety, Gen1 behavior, public capability access, hosted watering authority, history-query granularity, broad layout/styling, or the public Demo without disclosure and approval. Do not add a per-device frontend inventory, automatic reconciliation, deployment without its own approval, or any claim that firmware/measurements are commissioning authority.

## Closeout

Phase 8C.1 closed the documentation design under ADR 0024 and authorized no runtime implementation by itself. Phase 8C.2 subsequently passed implementation and production validation and is operationally closed. This documentation-only closeout changed no runtime behavior, tests, fixtures, dependencies, configuration, styling, assets, SQL/Supabase state, firmware, devices, assignments, watering, Demo behavior, deployment, provisioning, or upload state.
