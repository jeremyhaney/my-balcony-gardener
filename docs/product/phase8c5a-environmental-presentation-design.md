# Phase 8C.5A — Environmental Presentation Design

Date: 2026-08-18

Status: Approved design; documentation only

## Purpose

Phase 8C.5A defines the approved gardener-facing condition names, exact boundaries, and measurement-specific card-color meanings for each commissioned Gen2 measurement before runtime behavior changes. Phase 8C.5B is the separately approved implementation slice.

This design changes no runtime code, CSS, tests, query, polling path, SQL, Supabase object or data, storage, firmware, device, watering behavior, control authority, Demo behavior, customer adoption, or deployment.

## Discovery summary

The current Support presentation contains several color authorities:

- full cards use generic `good`, `watch`, `check`, and `neutral` tones;
- evidence pills independently use neutral, informational, caution, and actionable severity;
- chart series use fixed measurement-identity colors; and
- transport and unavailable states can affect full-card treatment.

Current environmental rules are inconsistent. Air and soil temperature share generic wording and bands; humidity also uses generic wording; absolute pressure uses Low/Normal/High/Check despite elevation and trend affecting interpretation; light and Relative Moisture Index already use measurement-specific descriptions; and reservoir presentation follows a binary product contract.

The stylesheet defines `failed`, `unavailable`, `insufficient-data`, and `diagnostic` card treatments, but the current catalog card model emits only `good`, `watch`, `check`, and `neutral`. Phase 8C.5B may remove or consolidate rules proven unreachable after direct inspection, without broadening into general UI modernization.

Existing tests cover Phase 8C.4 eligibility, evidence fallback, honest timestamps, RMI source rejection, trend exclusion, and the SEN0562 ceiling concern. They do not directly cover every environmental boundary, exact wording, condition-to-tone mapping, or responsive/color acceptance.

## Authority separation

The presentation pipeline preserves these concepts in order:

1. Protected capability declarations determine which commissioned cards exist.
2. Phase 8C.4 determines whether a row may supply an ordinary value, condition, derived RMI, or trend point.
3. Phase 8C.3 determines Current, Last Good, Last Reliable, invalid, omitted, stale, unavailable, and escalation state.
4. Only presentation-eligible evidence current under the existing evidence policy receives gardener interpretation.
5. Card color communicates approved measurement-specific environmental interpretation when condition currency is true; otherwise it is neutral.
6. The evidence pill independently communicates evidence health under unchanged severity and escalation rules.
7. Support diagnostics may expose provider, identity, original metadata/value, eligibility authority, diagnostic code, ceiling concern, formula, and provenance.
8. Future customer presentation uses restrained gardener wording and omits Support-only engineering details.
9. Firmware watering and safety authority remains local and is never granted or modified by hosted conditions, colors, trends, or RMI.

Manufacturer envelopes from Phase 8C.4 are eligibility backstops, not gardener-facing condition boundaries. These bands are broad balcony-gardening descriptions, not species-specific prescriptions, alerts, sensor capability claims, or watering thresholds.

## Approved environmental presentation matrix

Brackets are inclusive and parentheses are exclusive.

| Measurement | Approved condition | Exact eligible interval | Card-color meaning |
| --- | --- | --- | --- |
| Ambient light | Night / Very Low Light | `[0, 100)` lux | Muted blue-gray |
| Ambient light | Shade | `[100, 2,500)` lux | Soft cool gray |
| Ambient light | Filtered Light | `[2,500, 10,000)` lux | Pale neutral daylight |
| Ambient light | Bright Light | `[10,000, 25,000)` lux | Soft warm yellow |
| Ambient light | Direct Sun | `[25,000, 65,535]` lux | Brighter sunlit yellow |
| Air temperature | Very Cold | `[0, 40)` °F | Blue |
| Air temperature | Cool | `[40, 55)` °F | Cyan |
| Air temperature | Mild | `[55, 85)` °F | Green |
| Air temperature | Hot | `[85, 95)` °F | Orange |
| Air temperature | Extreme Heat | `[95, 130]` °F | Red |
| Relative humidity | Very Dry | `[0, 25)` %RH | Amber |
| Relative humidity | Dry | `[25, 35)` %RH | Yellow |
| Relative humidity | Moderate Humidity | `[35, 70)` %RH | Green |
| Relative humidity | Humid | `[70, 85)` %RH | Blue |
| Relative humidity | Very Humid | `[85, 100]` %RH | Deep blue/purple |
| Barometric pressure | Local Pressure | `[300, 1,100]` hPa | One neutral purple measurement tone; no absolute good/warning/failure judgment |
| Soil temperature | Cold Root Zone | `[10, 40)` °F | Blue |
| Soil temperature | Cool Root Zone | `[40, 55)` °F | Cyan |
| Soil temperature | Active Root Zone | `[55, 85)` °F | Green |
| Soil temperature | Warm Root Zone | `[85, 95)` °F | Orange |
| Soil temperature | Hot Root Zone | `[95, 130]` °F | Red |
| Relative Moisture Index | Check Sensor | `(-∞, 0)` index | Neutral sensor-review tone outside the environmental scale |
| Relative Moisture Index | Too Dry | `[0, 20]` index | Muted dry tan |
| Relative Moisture Index | Dry | `(20, 40]` index | Tan/olive transition |
| Relative Moisture Index | Moist | `(40, 70]` index | Soft sage |
| Relative Moisture Index | Well-watered | `(70, 90]` index | Muted teal |
| Relative Moisture Index | Very Wet | `(90, 105]` index | Blue-teal |
| Relative Moisture Index | Saturated | `(105, +∞)` index | Deep wet blue |
| Reservoir | Refill Reservoir | exact value `0` | Red actionable product state |
| Reservoir | Water Detected | exact value `1` | Green/blue available-water state |

The RMI intervals preserve the accepted existing unclamped first-draft scale. They are installation interpretation, not a generic raw-ADC rule or watering authority.

Full-card color is supported by a compact scale pill in every card footer, aligned opposite Sensor Details and sized comparably to the upper-right status pill. The footer pill shows the complete measurement-specific color ramp and a marker for the displayed value. It has an accessible name that states the scale and current condition. When a value is unavailable, the scale remains visible without a false marker.

The upper-right pill follows an assume-current-unless-not rule. For an ordinary current eligible reading, it shows the environmental condition instead of the redundant word `Current`; the separate `Condition:` line is omitted. When evidence is not current or uses a fallback/fault path, the pill shows the evidence state such as `Last Good`, `Last Reliable`, `Not Current`, or `Reading Unavailable` rather than the historical condition. A current card without an approved environmental interpretation shows no redundant `Current` pill. The page-level Latest reading timestamp remains the ordinary currency cue.

Absolute pressure does not receive Low/Normal/High gardener judgment because station elevation and local baseline materially affect meaning. Rising, Falling, or Stable trend evidence remains separate and does not change card color.

## Evidence, fallback, and neutral behavior

Phase 8C.3 remains the sole freshness and escalation policy:

- expected reporting cadence remains 15 minutes;
- condition currency remains inclusive through 50 minutes (`3 × cadence + 5-minute delivery grace`);
- the device-active actionable boundary remains greater than 95 minutes (`6 × cadence + 5-minute delivery grace`);
- one invalid reading remains informational and two consecutive invalid readings remain cautionary;
- one or two latest-package omissions remain informational and three consecutive omissions remain cautionary; and
- no new environmental freshness threshold, counter, or escalation is introduced.

When the latest row is invalid, omitted, or presentation-ineligible:

- it cannot supply environmental wording or color;
- the newest already-fetched presentation-eligible Last Good or Last Reliable value may supply the displayed value;
- if that selected value is no more than 50 minutes old, its condition wording and environmental card color remain visible;
- if it is more than 50 minutes old, the condition is suppressed and the card becomes neutral;
- the pill independently reports the approved evidence state; and
- the fallback retains its honest source timestamp and age.

Unavailable, non-finite, future-dated, unparseable-time, no-window-evidence, derived-unavailable, dashboard/query-error, and transport-only states cannot receive environmental coloring. They use neutral card treatment while text and pill communicate the evidence state.

## Measurement-specific decisions

### SEN0562 ceiling

`65535 lux` remains presentation-eligible and receives `Direct Sun`. Its measurement-ceiling concern does not change environmental color. Support details may disclose the concern, original value, and authority. Future customer presentation omits provider engineering details.

### Relative Moisture Index and trends

RMI derives only from the exact selected presentation-eligible SEN0308 source row. It cannot outlive or rehabilitate a rejected source. Raw ADC remains Support engineering evidence and never receives generic 12-bit, GPIO34, or Gen1 assumptions.

Trends use only presentation-eligible points. Direction, sparse, stale, and insufficient states never determine card color or authorize watering. Pressure trend is weather context, not an absolute plant-health judgment.

### Reservoir

Reservoir color represents a discrete product state, not plant comfort or sensor severity. `Refill Reservoir` remains red because it is actionable product information. Evidence freshness remains independently visible in the pill. Hosted presentation does not change the firmware-owned watering interlock or safety behavior.

## Accessibility and responsive contract

- Color is never the sole carrier of meaning; explicit condition and evidence text remains.
- Phase 8C.5B must meet WCAG AA contrast for normal text and meaningful UI components.
- Existing visible keyboard focus for Sensor Details remains.
- Pills and condition names must wrap without clipping or covering values, trends, or details.
- Footer scale pills must remain aligned with Sensor Details, expose their scale/current-condition meaning to assistive technology, and never overflow the card.
- The current mobile single-column details layout remains usable.
- Decorative sparklines remain hidden from assistive technology while direction remains textual.
- Review covers mobile (`≤640 px`), tablet (`641–980 px`), and desktop (`≥981 px`) without beginning major modernization.

## Deterministic Phase 8C.5B acceptance cases

Phase 8C.5B must directly test:

1. Every exact matrix boundary and representative values immediately below and above every transition.
2. Distinct air- and soil-temperature terminology.
3. Absolute pressure always uses `Local Pressure` and the neutral purple measurement tone.
4. A fresh eligible row receives its measurement-specific condition and tone.
5. Last Good or Last Reliable evidence aged 15, 30, 45, and exactly 50 minutes retains condition wording and color.
6. Selected evidence aged 50 minutes plus 1 millisecond has no condition and uses neutral treatment.
7. Existing invalid, omission, 50-minute, and 95-minute pill boundaries remain unchanged.
8. A rejected latest row with a current eligible fallback shows Last Reliable, fallback value/provenance/condition/color, and the rejection concern in Support details.
9. A rejected latest row without fallback shows no condition or environmental tone.
10. `0 lux` produces Night / Very Low Light; `65535 lux` produces Direct Sun plus a Support ceiling concern; out-of-envelope lux produces no condition.
11. Reservoir `0` and `1` receive only their approved discrete states; any other value remains ineligible.
12. Every RMI boundary is exact and requires an eligible source row.
13. Rejected rows cannot enter condition, RMI, or trend paths, and trend direction never changes card color.
14. Dashboard/query error, loading, unavailable, invalid, omitted-without-fallback, stale, and no-window states cannot receive environmental coloring.
15. Meaning remains available as text without color, and mobile wrapping, details layout, keyboard focus, and WCAG AA contrast pass review.
16. Every supported card family renders its complete scale pill, uses a bounded current-position marker when a display value exists, omits the marker when unavailable, and does not overflow at supported breakpoints.
17. Current eligible cards show concise condition wording in the upper-right pill with no separate `Condition:` line; non-current and exception cards show evidence-state wording instead, and no card displays a redundant healthy `Current` pill.

## Bounded Phase 8C.5B implementation plan

1. Introduce a typed environmental-presentation contract for exact commissioned identities.
2. Replace generic temperature, humidity, and pressure wording with the approved evaluators.
3. Preserve the existing RMI formula and approved boundaries.
4. Map current eligible conditions to approved measurement-specific card tokens.
5. Preserve Phase 8C.3 `conditionIsCurrent`, pill severity, counts, 50-minute, and 95-minute behavior unchanged.
6. Preserve Phase 8C.4 eligibility, Last Reliable provenance, diagnostics, ceiling concern, and trend filtering unchanged.
7. Remove or consolidate only presentation rules proven unreachable in the catalog-card path.
8. Add direct boundary, wording, precedence, tone-class, responsive, and accessibility coverage.
9. Run deterministic tests, ESLint, production build, `git diff --check`, and local visual review before any deployment, commit, or push approval.

## Query and Disk I/O disclosure

Phase 8C.5B is frontend-only presentation over already-fetched descriptors, rows, and evidence results.

- New or per-card query: none.
- Expanded history or polling change: none.
- SQL, view, function, index, trigger, RLS, grant, stored flag, backfill, mutation, or storage change: none.
- Expected Supabase query increase: none.
- Expected production Disk I/O increase: none.
- Production read-only `EXPLAIN`: not required for this no-query frontend slice.

Any later proposal requiring a query or stored presentation state is outside Phase 8C.5B and requires separate review.

## Explicit exclusions

- Phase 8C.5B implementation during this design slice.
- Feels Like, Dew Point, customer adoption, deterministic Demo, Gen1 review, generic raw-ADC/12-bit assumptions, or major UI modernization.
- SQL, Supabase, storage, polling, firmware, device, watering, safety, or control-authority changes.
- Phase 9 schedule persistence or sensor-assisted watering.
- Deployment, commit, push, or new phase numbers for the post-8C.5 priority candidates.

## Approval and closeout

Jeremy approved the matrix, terminology, pressure treatment, measurement-specific palettes, WCAG AA minimum, Support/customer separation, SEN0562 ceiling behavior, reservoir treatment, and bounded implementation plan on 2026-08-18.

Jeremy amended the proposed neutral behavior: Last Good and Last Reliable values retain their environmental condition and card color while current under the existing inclusive 50-minute evidence policy. Older evidence becomes neutral. This reuses Phase 8C.3 exactly and introduces no new escalation.

During Phase 8C.5B visual review, Jeremy refined light to a quieter gray-to-daylight-to-sun scale and moisture to a continuous dry-tan-through-sage/teal-to-wet-blue scale. Red is not used at both ends of moisture and the moisture ramp is not a pass/fail judgment. Jeremy also approved a compact full-scale footer pill with a current-value marker for every card.

Jeremy further approved an assume-current-unless-not presentation: ordinary current cards put concise condition wording in the upper-right pill and remove the separate condition line, while non-current or exception cards reserve that pill for evidence state.

Phase 8C.5A is documentation-only and approved for closeout. Phase 8C.5B remains planned and requires separate implementation approval. After 8C.5B closes, the priority decision remains unnumbered among watering-event visibility/threshold presentation, Feels Like/Dew Point, customer adoption, deterministic Demo, Gen1 review, and major UI modernization.
