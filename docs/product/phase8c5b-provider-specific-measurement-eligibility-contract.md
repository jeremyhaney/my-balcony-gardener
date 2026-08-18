# Phase 8C.5B — Provider-Specific Measurement Eligibility Contract

Date: 2026-08-17

Status: Complete, committed, and pushed

Authority: [Phase 8C.5A](./phase8c5a-measurement-quality-gates-discovery-and-boundary-design.md)

## Purpose

Phase 8C.5B defines the smallest deterministic provider-specific contract for deciding whether an already-fetched Gen2 measurement may supply an ordinary current value and environmental condition. It replaces the direction of the inactive `mbg_dashboard/src/hostedMeasurementTrust.ts` without activating or adapting that module.

The approved implementation changes Support/frontend presentation and deterministic tests only. It changes no query, polling path, SQL, Supabase object or row, firmware, device, watering behavior, customer adoption, Demo architecture, deployment, commit, or push.

## Selected first implementation boundary

The implementation evaluates only deterministic facts available from the current commissioned descriptor and measurement row:

1. exact commissioned logical sensor and canonical measurement identity;
2. device-reported `valid`, `quality`, and `reason`;
3. numeric finiteness;
4. product-context plausibility where an explicit operating policy is approved;
5. provider/sensor documented measurement envelope as a secondary electrical/provider backstop; and
6. exact discrete-value contract where the measurement is categorical.

Recent-behavior rate, median, outlier, stuck-sensor, cross-sensor agreement, installation expectation, and calibration heuristics are excluded. They require separate evidence and must not be smuggled into a deterministic hard gate.

## Proposed result contract

The implementation returns a structured result rather than a single overloaded trust label:

```ts
type MeasurementPresentationEligibility = {
  presentationEligible: boolean
  classification:
    | 'eligible'
    | 'device-metadata-unusable'
    | 'non-finite'
    | 'outside-product-plausibility-range'
    | 'outside-provider-measurement-envelope'
    | 'invalid-discrete-value'
    | 'rule-not-defined'
  concerns: Array<'measurement-ceiling'>
  authority: 'device-metadata' | 'numeric' | 'manufacturer' | 'product-policy' | 'product-contract' | 'field-evidence' | 'none'
  diagnosticCode: string
}
```

Exact names may be refined during implementation, but the dimensions must remain separate. The result is frontend-derived and ephemeral. It does not overwrite the row.

`rule-not-defined` means no additional provider plausibility rejection is applied. It must not fabricate a threshold. Device metadata and numeric requirements still apply.

## Evaluation order

1. If the row is absent, use the existing unavailable/no-window evidence path.
2. If device metadata is unusable, use the existing invalid/missing/failed path.
3. If the value is not finite numeric, reject ordinary numeric presentation.
4. Select a deterministic rule by exact commissioned logical sensor and canonical measurement name.
5. Apply the approved product-context plausibility rule when one exists.
6. Apply the provider measurement envelope as a secondary backstop, not the primary product-reality rule.
7. If no rule is defined, return `rule-not-defined` without inventing a concern.
8. Record non-rejecting concerns, such as a light sensor reaching its measurement ceiling, separately from eligibility.
9. Only a presentation-eligible row may supply ordinary current value and environmental condition.

Commissioning, freshness, last-good recovery, and evidence-health severity remain outside this evaluator and continue to use their existing authorities.

## Product policy, manufacturer, and field authority

Manufacturer measurement ranges answer whether the device is designed to report a value. They do not answer whether that value is believable or useful for the My Balcony Gardener installation. Temperature eligibility must therefore use an approved broad product-context plausibility window as its primary rule, with the provider range retained only as a secondary backstop and Support diagnostic fact.

Jeremy approved deliberately broad Balcony02 product-context windows on 2026-08-17: air temperature `0..130 °F` and soil temperature `10..130 °F`. These are the primary presentation-eligibility rules. They are outdoor-garden reality checks, not plant comfort bands, alert thresholds, or claims about the sensors' full laboratory capability.

### BME280 air temperature

Bosch documents a BME280 operating/measurement envelope of `-40` to `85 °C`, which is `-40` to `185 °F`. This is a secondary provider backstop, not the primary Balcony02 plausibility window.

The rule is selected only for commissioned logical sensor `bme280_air` and canonical measurement `air_temperature` with the current Fahrenheit contract. It is not a generic temperature rule.

Source: [Bosch BME280 datasheet](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf) and [Bosch BME280 product page](https://www.bosch-sensortec.com/en/products/environmental-sensors/humidity-sensors-bme280).

The historical `362 F` example is plainly outside both the provider envelope and any reasonable future Balcony02 product window. Its stored row and device metadata remain intact, but it is ineligible to supply ordinary current Air Temperature value or environmental condition.

The primary air-temperature window is `0..130 °F`, inclusive.

### BME280 relative humidity

Bosch documents the humidity measurement range as `0..100 %RH`. Because relative humidity itself is defined on that bounded scale, the first deterministic gate may reject a BME280 `relative_humidity` value outside `0..100`.

This is a measurement-envelope rule, not an installation comfort band. Existing environmental humidity bands remain separate presentation interpretation.

Source: [Bosch BME280 datasheet](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf).

### BME280 barometric pressure

Bosch documents the BME280 pressure range as `300..1100 hPa`. The first deterministic gate may reject a BME280 `barometric_pressure` value outside that range.

This is not the existing environmental Normal/Low/High Pressure interpretation.

Source: [Bosch BME280 product page](https://www.bosch-sensortec.com/en/products/environmental-sensors/humidity-sensors-bme280) and [Bosch BME280 datasheet](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf).

### DS18B20 soil temperature

Analog Devices documents the DS18B20 measurement envelope as `-55..125 °C`, which is `-67..257 °F`. This is a secondary provider backstop, not the primary Balcony02 soil-temperature plausibility window. A porch or container-soil value can be nonsensical for this product while remaining numerically inside the sensor's capability.

The primary soil-temperature window is `10..130 °F`, inclusive. The existing DS18B20 disconnected sentinel remains firmware-owned read-failure handling.

Source: [Analog Devices DS18B20 product page](https://www.analog.com/en/products/ds18b20.html) and [DS18B20 datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/DS18B20.pdf).

### ADS1115-backed SEN0308

DFRobot documents SEN0308 output voltage as `0..2.9 VDC`. Current firmware configures ADS1115 single-ended channels with PGA bits `001`, selecting `±4.096 V`; Texas Instruments documents `125 µV` per code for that range. The direct documented conversion envelope is therefore approximately `0..23200` counts for the installed sensor/provider configuration.

Sources: [DFRobot SEN0308 specification](https://wiki.dfrobot.com/sen0308/) and [Texas Instruments ADS1115 datasheet](https://www.ti.com/lit/gpn/ads1115).

This rule is selected only for commissioned `sen0308_m01`, `sen0308_m02`, and `sen0308_m03`, canonical `raw_adc`, sensor family `sen0308`, under the exact current ADS1115 firmware configuration. It is not a generic raw-ADC rule.

Implementation must define conversion rounding explicitly. A conservative integer envelope of `0..23200` is proposed for deterministic tests. Before runtime integration, implementation inspection must confirm that the committed configuration constants still select the documented PGA range.

This electrical envelope does not classify soil condition, sensor calibration, recent behavior, saturation, insertion quality, or watering eligibility. The RMI formula remains a separate installation interpretation and cannot make an electrically rejected source eligible.

### Relative Moisture Index

RMI is frontend-derived from the exact selected eligible SEN0308 row. It has no independent provider gate and cannot outlive or override its raw source. The current formula remains unclamped presentation behavior. Values outside ordinary interpretation bands may produce existing `Check Sensor` condition wording, but that is not a stored-evidence rewrite or watering decision.

### SEN0562/BH1750 ambient light

DFRobot documents SEN0562/BH1750 measurement coverage as `1..65535 lux`. Jeremy has directly observed installed light sensors report `0` at night and reach or clip at the maximum during full-sun exposure. Repository Phase 7N.4B evidence also records a deliberately covered sensor reporting `0.00 lux` and recovering after uncovering.

The product contract is therefore:

- `0 lux` is valid darkness and remains presentation-eligible;
- values from `0` through `65535 lux` remain presentation-eligible subject to metadata, finiteness, and freshness;
- `65535 lux` is a measurement-ceiling/saturation concern, not a failed or invalid reading;
- a ceiling value may still drive the existing `Full Sun` environmental condition;
- authenticated Support may identify that the sensor reached its measurement ceiling; and
- values below `0` or above `65535` are outside the product/provider envelope and presentation-ineligible.

Source reviewed: [DFRobot SEN0562 product documentation](https://wiki.dfrobot.com/sen0562/).

### SEN0204 reservoir detection

The active product contract defines exactly `1 = liquid detected` and `0 = liquid not detected`. Any other finite value is `invalid-discrete-value` and cannot supply ordinary reservoir presentation.

This presentation rule does not change the firmware-owned watering interlock, blocking, active-cycle interruption, or safety shutoff.

## Card and last-good behavior

For a fresh row that device metadata accepts but the provider rule rejects:

- keep the commissioned card;
- keep the original row visible in authenticated Support details;
- show original `valid`, `quality`, `reason`, value, unit, and timestamp;
- do not call the rejected row ordinary trusted current evidence;
- do not let it supply environmental-condition wording or full-card condition color;
- search only the already-fetched rows for the newest presentation-eligible row;
- show that last eligible value with its original timestamp and age when available; and
- keep evidence freshness and the plausibility concern separately visible.

The existing `lastGoodRow` concept currently means finite plus device-valid plus approved quality. The implementation must either rename it or add a separate `lastPresentationEligibleRow`; it must not silently redefine device-reported good evidence as if the device had reported different metadata.

## Support and future customer wording

Authenticated Support may receive:

- `Latest device reading outside the approved product plausibility range` or `outside the provider measurement envelope`, as applicable;
- the original value and timestamp;
- original device metadata;
- the provider/sensor rule and authority; and
- last presentation-eligible provenance.

Future customer presentation should use restrained wording such as `Reading unavailable` or `Using last reliable reading`, subject to the later customer-adoption design. It must not expose provider codes, raw ADC, physical identity, formulas, constants, or engineering thresholds.

Neither route may label a commissioned sensor `Not Installed` because of rejected evidence.

## Query, polling, SQL, and Disk IO

The proposed evaluator and last-eligible search use the existing fetched capability descriptors and selected-window measurement rows.

- New query: none.
- Expanded history: none.
- Per-card recovery query: none.
- Polling change: none.
- SQL/view/function/index/trigger/stored flag: none.
- Backfill or mutation: none.
- Production read-only `EXPLAIN`: not required for this frontend-only design.
- Expected Supabase query or Disk IO increase: none.

If a later design requires provider identity not derivable from the commissioned descriptor and exact logical identity, that must be a separate protected-contract/SQL slice with read-only `EXPLAIN` review.

## Deterministic acceptance matrix

The later implementation must directly test at least:

| Identity | Example | Expected result |
| --- | ---: | --- |
| BME280 air temperature | `362 F`, valid/good/read_ok | preserved Support evidence; ordinary presentation ineligible |
| BME280 air temperature | inside approved product-context window | eligible |
| BME280 air temperature | inside provider envelope but outside product-context window | presentation ineligible |
| BME280 humidity | below `0` or above `100` | presentation ineligible |
| BME280 pressure | outside `300..1100 hPa` | presentation ineligible |
| DS18B20 soil temperature | inside provider envelope but outside approved product-context window | presentation ineligible |
| SEN0308 M01–M03 | within exact proposed electrical envelope | not rejected by electrical gate |
| SEN0308 M01–M03 | outside exact proposed electrical envelope | presentation ineligible |
| unrelated `raw_adc` identity | any finite value | no SEN0308 rule applied |
| RMI | source rejected | derived value unavailable |
| SEN0562 | `0 lux` | eligible darkness |
| SEN0562 | `65535 lux` | eligible Full Sun plus measurement-ceiling concern |
| SEN0562 | below `0` or above `65535` | presentation ineligible |
| SEN0204 | `0` or `1` | eligible subject to metadata/freshness |
| SEN0204 | any other numeric value | presentation ineligible |
| any identity | invalid/failed device metadata | existing invalid path, not plausibility rewrite |
| any identity | non-finite value | ordinary numeric presentation ineligible |

Tests must also prove that the commissioned card remains, stored row fields are unchanged, last presentation-eligible evidence retains its honest timestamp, and environmental condition cannot use the rejected latest row.

## Implemented sequence

1. Apply the approved Balcony02 air-temperature `0..130 °F` and soil-temperature `10..130 °F` product-context plausibility windows.
2. Replace the inactive trust module with a small provider-aware eligibility module; do not import it as-is.
3. Add direct unit tests for the evaluator and authority matrix.
4. Add `lastPresentationEligibleRow` selection over already-fetched exact-identity rows.
5. Integrate eligibility into commissioned Support card value and environmental-condition selection.
6. Preserve original latest-row evidence in Sensor Details with a separate derived concern.
7. Verify trends do not present rejected points as ordinary usable measurements; exact chart treatment must be disclosed in the implementation review.
8. Run deterministic tests, ESLint, the TypeScript/Vite production build, and `git diff --check`.
9. Review the complete runtime diff before any deployment, production validation, commit, or push.

## Explicit exclusions

- Recent-behavior heuristics, rate thresholds, rolling medians, and outlier scoring.
- Cross-sensor agreement or anomaly scoring.
- Installation/calibration ranges beyond the existing RMI formula.
- Firmware/provider metadata changes.
- Ingestion or storage validity changes.
- SQL, Supabase, query, polling, or history expansion.
- Alerts or notifications.
- Customer adoption or Demo redesign.
- Feels Like, Dew Point, watering/control changes, visual modernization, or Phase 8D.

## Validation and closeout

Validation passed 28/28 deterministic tests, ESLint, the TypeScript/Vite production build, and `git diff --check`. The existing Vite large-chunk advisory remained non-blocking. Jeremy also confirmed that the local site looked and worked correctly and approved documentation closeout, commit, and push.

The completed slice preserves original stored evidence and device metadata, uses only already-fetched rows, and adds no query, polling, SQL, storage, Supabase mutation, firmware, device, watering, control-authority, Demo, or customer-adoption change. No production behavior validation or manual deployment is claimed by this closeout.
