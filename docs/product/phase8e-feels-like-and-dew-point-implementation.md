# Phase 8E — Feels Like and Dew Point Implementation

Date: 2026-08-19

Status: Implemented and locally validated; deployment, authenticated hosted validation, and closeout are not yet performed.

## Outcome

Phase 8E adds two familiar air cards and two optional Temperature chart series:

- **Feels Like** uses the U.S. National Weather Service Heat Index when its approved applicability screen is met. Otherwise it uses the paired air temperature. Above `112 °F` it displays `Above supported range` and does not extrapolate.
- **Dew Point** uses the WMO Magnus water-phase equation with constants `17.62` and `243.12 °C`.

Both values use only already-fetched protected measurement rows. They have no watering, threshold, control, health, diagnostic, alert, or safety authority. Firmware, ingestion, telemetry cadence, polling, pagination, selected-device filtering, selected-window filtering, and local watering behavior are unchanged.

## Formula contract

### Feels Like

Established formula facts come from the [NWS/WPC Heat Index equation](https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml) and [NWS Heat Safety guidance](https://www.weather.gov/safety/heat-index). The implementation:

1. calculates the NWS simple Heat Index and averages it with air temperature for the applicability screen;
2. uses the Rothfusz regression only when unrounded air temperature is at least `80 °F`, no more than `112 °F`, and the unrounded screened value is at least `80 °F`;
3. applies the NWS low-humidity and high-humidity adjustments at their exact boundaries;
4. otherwise returns the paired air temperature with method `Using air temperature`; and
5. returns no numeric value above `112 °F`.

The actual-temperature behavior and the `112 °F` display boundary are approved MBG product decisions. This is not wind chill; MBG has no trustworthy wind measurement.

### Dew Point

The equation follows the water-phase Magnus form in the [WMO Guide to Instruments and Methods of Observation, Annex 4.B](https://www.weather.gov/media/epz/mesonet/CWOP-WMO8.pdf):

```text
TC = (TF - 32) × 5 / 9
gamma = ln(RH / 100) + (17.62 × TC) / (243.12 + TC)
TdC = (243.12 × gamma) / (17.62 - gamma)
TdF = TdC × 9 / 5 + 32
```

Inputs and the calculated dew point must remain within the WMO water-phase range `-45..60 °C`. Relative humidity must be finite and greater than `0%` and no more than `100%`. Formula applicability is evaluated before display rounding. Both derived values display in `°F` with exactly one decimal place.

## Exact paired-evidence contract

The shared implementation in `mbg_dashboard/src/derivedAirEvidence.ts` is the only formula and pairing authority used by cards and charts.

A pair is valid only when it contains exactly one row for each of these identities:

| Source | Required identity | Unit |
| --- | --- | --- |
| Air temperature | `sensor_key=bme280_air`, `sensor_type=BME280`, `measurement_name=air_temperature` | `F` |
| Relative humidity | `sensor_key=bme280_air`, `sensor_type=BME280`, `measurement_name=relative_humidity` | `%` |

Both rows must:

- share the exact `device_id`, `measured_at`, and `batch_created_at` provenance;
- share `batch_id` when that optional field is available to the frontend;
- contain parseable source time and, when present, stored time;
- pass their existing Phase 8C.4 presentation-eligibility rules; and
- contain finite values with device-valid, approved-quality metadata.

The current hosted views already expose the batch row's exact `batch_created_at` on every flattened record. Therefore `device_id + measured_at + batch_created_at` is the existing frontend package identity when `batch_id` is not projected. No timestamp tolerance exists. Rows with different source or stored times do not form a pair. Duplicate source identities within one package make it ambiguous. A selected-window boundary or row limit that exposes only part of a package does not combine it with another package and triggers no recovery query; card evidence may retain the last complete reliable pair.

For duplicate packages at one source timestamp, the complete package evaluation—not independently selected source rows—is chosen by later `batch_created_at`, then lexical `batch_id` when available. If that chosen package is unusable, the chart excludes that timestamp.

Read-only production evidence on 2026-08-19 confirmed this is the ordinary path, not a relaxed guess: Balcony02 had `102/102` recent BME280 packages containing exactly one air-temperature row and one relative-humidity row, both with the same recorded source and stored times, no incomplete pairs, and no duplicate source rows. Their source-time difference within each package was `0 seconds`; separate package events were `900–901 seconds` apart, matching the 15-minute firmware cadence.

## Evidence and fallback behavior

- Derived age is the pair's shared `measured_at`; `batch_created_at` remains storage provenance only.
- Current/not-current boundaries reuse the Phase 8C.3 `50`-minute freshness and `95`-minute actionable-age constants.
- A stale but otherwise valid latest pair displays its own value as `Not Current` or `Check Sensor`; it is not replaced by a newer input from another batch.
- Missing or device-invalid latest paired evidence may recover `Last Good` only from a previously valid complete pair.
- Presentation-ineligible, mismatched, ambiguous, wrong-unit, or formula-input-invalid evidence may recover `Last Reliable` only from a previously valid complete pair.
- Independently recovered temperature and humidity rows are never combined.
- `RH=0%` produces no current derived value and never invokes the Feels Like air-temperature fallback.
- A trustworthy Feels Like pair above `112 °F` displays `Above supported range` instead of an older value.
- A trustworthy Dew Point pair outside the approved WMO formula range displays unavailable instead of an older value.
- The selected device and selected window remain the complete frontend evidence boundary.

## Presentation

The existing three primary Air cards remain unchanged. Feels Like and Dew Point sit directly below them without a separate technical group heading. They follow the ordinary environmental-card rules where those rules are meaningful:

- two cards on tablet/desktop and one column on mobile;
- concise gardener-facing labels without visible formula explanations or authority disclaimers;
- the standard condition pill, full-card color, trend summary, sparkline, footer scale, evidence-exception wording, expandable `Reading details`, responsive behavior, and accessible text;
- Feels Like reuses the Air Temperature condition labels and cold-to-hot color scale because both values are temperatures intended to describe how the air feels;
- Dew Point uses a moisture-oriented dry-to-muggy scale rather than Air Temperature labels. The product bands are `Dry & Comfortable` at or below `55 °F`, `Getting Muggy` above `55 °F` and below `65 °F`, `Muggy` from `65 °F` through below `75 °F`, and `Very Muggy` at `75 °F` and above; and
- evidence exceptions replace the condition pill exactly as they do on the existing cards, so color is never the only meaning.

The Dew Point semantics follow National Weather Service guidance that dew point is the better measure of how dry or humid air feels and that summer air progresses from dry/comfortable at `55 °F` or below to sticky/muggy between `55 °F` and `65 °F`, then increasingly oppressive at `65 °F` and above. The `75 °F` `Very Muggy` subdivision and the reuse of MBG's existing humidity palette are explicit MBG presentation decisions. Sources: [NWS Tampa Dew Point Statistics](https://www.weather.gov/tbw/dewpoint) and [NWS La Crosse Heat Index and Dew Point Comfort](https://www.weather.gov/arx/heat_index).

Feels Like and Dew Point are optional Temperature chart series. Existing default selections are unchanged. Their stable colors are supplementary to text labels and legends. Feels Like tooltips state `Heat Index` or `Air temperature fallback`, and the Recharts accessibility layer is enabled.

## Code and contract locations

| Boundary | Location |
| --- | --- |
| Hosted row type and exact batch identity | `mbg_dashboard/src/types/hostedGen2Measurements.ts` |
| Existing selected-device/window query, unchanged paging/filtering | `mbg_dashboard/src/api.ts` |
| Existing hosted measurement projection and explicit absent optional batch UUID | `mbg_dashboard/src/hostedGen2MeasurementQueryContract.ts` |
| Formulas, pairing, duplicate resolution, evidence states, chart rows | `mbg_dashboard/src/derivedAirEvidence.ts` |
| Capability-gated chart descriptors | `mbg_dashboard/src/capabilityPresentation.ts`, `mbg_dashboard/src/hostedGen2Presentation.ts` |
| Cards, conditions, trends, scales, provenance details, terminology | `mbg_dashboard/src/components/HostedGen2Measurements.tsx` |
| Card color and responsive layout | `mbg_dashboard/src/components/HostedGen2Measurements.css` |
| Feels Like and Dew Point condition/scale rules | `mbg_dashboard/src/hostedGen2EnvironmentalPresentation.ts` |
| Derived-card trend deadbands | `mbg_dashboard/src/hostedGen2TrendSummary.ts` |
| Derived chart transformation and tooltip method provenance | `mbg_dashboard/src/components/HostedGen2TrendChart.tsx` |
| Chart control/accessibility presentation | `mbg_dashboard/src/components/HostedGen2TrendChart.css` |
| Formula, boundary, pairing, recovery, selected-window, and chart exclusions | `mbg_dashboard/tests/derivedAirEvidence.test.ts` |
| Capability and hosted query boundary tests | `mbg_dashboard/tests/capabilityEvidence.test.ts`, `mbg_dashboard/tests/hostedGen2MeasurementQueryContract.test.ts` |

## Query and Disk I/O impact

Phase 8E adds no query, request, recovery fetch, polling, history, or client Disk I/O. It uses the existing selected-device/window response, including the already-projected exact source time and batch storage time. Device filter, source-window lower bound, sort, pagination, row limit, and payload are unchanged. No SQL, schema, view, RLS, grant, ingestion, firmware, or telemetry-cadence change is required.

## Local validation

- `npm.cmd run test`: `59/59` passing.
- `npm.cmd run lint`: passing.
- Default TypeScript/Vite production build: passing; the pre-existing large-chunk warning remains.
- Hosted-readonly TypeScript/Vite production build: passing; forbidden local-control bundle scan returned no hits.
- `git diff --check`: passing after documentation finalization.
- Local hosted-readonly visual review at `360`, `820`, and `1280` pixels found no page-level horizontal overflow; derived cards rendered `1`, `2`, and `2` columns respectively, and all `12` labeled chart controls remained present.
- Final local hosted-readonly browser validation against the current public demo view showed all existing readings plus `Feels Like 96.9 °F` and `Dew Point 62.8 °F` from the current `95.5 °F / 34.2%` BME280 package, with no query-error banner. Feels Like rendered with the Air Temperature `Extreme Heat` condition and red scale; Dew Point rendered with `Getting Muggy` and the moisture-oriented blue scale. Both cards included the ordinary trend, sparkline, scale, accessible condition text, and reading-details behavior. Both derived chart controls were present. At `360` and `1280` pixels there was no page-level horizontal overflow; the cards rendered in one and two columns respectively, with no technical derived heading or chart explainer. This proves the local frontend against the current public hosted contract; it does not prove a deployed bundle or authenticated customer/support behavior.
- Jeremy approved the final local gardener-facing card presentation on 2026-08-19.

## Remaining approval and proof boundary

Recommended next action: deploy the locally validated Phase 8E frontend for authenticated hosted validation.

That action will prove the deployed customer/support views render Feels Like and Dew Point from their existing exact package provenance while preserving current readings, responsive presentation, selected-device/window behavior, and the read-only authority boundary. It will not change or prove firmware watering behavior, sensor accuracy beyond the stored evidence, or any command/control capability.
