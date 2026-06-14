# Phase 7N.3B - SEN0308 Single-Operator MSA And Channel-Swap Screen

Date: 2026-06-14

Status: analysis complete / documentation closeout pending review and commit.

## Purpose And Boundary

Phase 7N.3B followed the Phase 7N.3A screen with a more structured single-operator measurement-system screen and M02/M03 physical channel-swap challenge.

The purpose was to separate gross sensor behavior from handling/contact variation, evaluate repeatability, insertion variation, directionality, state separation, and sensor-to-sensor agreement, and determine whether the Phase 7N.3A M02 concern followed physical SEN0308-M02 or stayed with ADS1115 A1 / logged `sen0308_m02`.

This is not calibration. It does not set production watering thresholds, replace GPIO34, grant SEN0308 watering authority, justify supplier return, or disqualify any SEN0308 sensor.

## Fixture And Evidence

The fixture was a foam probe-spacing fixture. It improved repeatability over hand placement, but it may flex and should be treated as a bench fixture, not a precision lab fixture.

Ignored runtime evidence CSVs:

- `field_readings/phase7n3b_gate1_sen0308_current_wiring_msa_20260612_164649.csv`
- `field_readings/phase7n3b_gate2_m02_m03_channel_swap_20260613_120008.csv`

Optional context CSV:

- `field_readings/phase7n3a_sen0308_measurement_system_screen_20260612_093331.csv`

No `field_readings/` files are source documentation or intended commit artifacts.

## Gate 1 - Current Wiring

Gate 1 used the original current wiring:

| Logged key | Physical sensor | Analog path |
| --- | --- | --- |
| `sen0308_m01` | `SEN0308-M01` | ADS1115 A0 |
| `sen0308_m02` | `SEN0308-M02` | ADS1115 A1 |
| `sen0308_m03` | `SEN0308-M03` | ADS1115 A2 |
| `sen0308_m04` | `SEN0308-M04` | ADS1115 A3 |
| `soil_moisture_analog` | `LEGACY-GPIO34` | GPIO34 |

Valid Gate 1 states:

- `dry_soil_reference`
- `damp_soil_reference`
- `saturated_drained_reference_retest`
- `saturated_drained_reference_overnight_undisturbed`
- `water_glass`

The original `saturated_drained_reference` rows remain in the CSV but are accidental same-insertion stability evidence only because the fixture was not physically removed/reinserted between insertion groups.

Gate 1 showed M02 as the original watch item: physical M02 on A1 had high insertion spread in dry and saturated-drained soil, moved drier/higher raw overnight in the saturated same-position check, but collapsed correctly to a direct-water wet floor.

## Gate 2 - M02/M03 Channel Swap

Gate 2 physically swapped M02 and M03 at the ADS1115 inputs while firmware labels remained channel-based:

| Logged key | Physical sensor | Analog path |
| --- | --- | --- |
| `sen0308_m01` | `SEN0308-M01` | ADS1115 A0 |
| `sen0308_m02` | `SEN0308-M03` | ADS1115 A1 |
| `sen0308_m03` | `SEN0308-M02` | ADS1115 A2 |
| `sen0308_m04` | `SEN0308-M04` | ADS1115 A3 |
| `soil_moisture_analog` | `LEGACY-GPIO34` | GPIO34 |

Valid Gate 2 states:

- `damp_soil_reference`
- `damp_soil_reference_overnight_same_insertion`
- `wet`
- `wet_removed_unwiped_immediate_air`
- `final_air_wiped_clean_recovery`

Gate 2 showed physical M02 looked acceptable on A2/logged `sen0308_m03`, while physical M03 on A1/logged `sen0308_m02` showed larger wet-state insertion variation. A1 recovered cleanly in final wiped-air recovery, so the evidence does not prove A1 is electrically failed.

## Data Health

- Gate 1 rows analyzed: `288`.
- Gate 2 rows analyzed: `150`.
- Invalid/missing selected records: `0`.
- Every sample group had the expected 6 selected records.
- Gate 1 and Gate 2 metadata matched their intended physical/logged/channel maps.
- Gate 2 `damp_soil_reference` has `n=7` because insertion 3 was one immediate operator-requested sample, not a full 3-sample insertion block.

## Combined Summary

Values are `mean (range / stddev)`.

| Run/state | M01 | M02 logged | M03 logged | M04 | GPIO34 raw / index |
| --- | ---: | ---: | ---: | ---: | ---: |
| G1 dry | 17154 (330 / 137) | 16646 (902 / 389) | 17343 (111 / 49) | 17397 (608 / 271) | 2846 / 33.6 |
| G1 damp | 11619 (694 / 312) | 11801 (961 / 406) | 12262 (2677 / 1165) | 11691 (208 / 89) | 2121 / 63.1 |
| G1 saturated retest | 8456 (2490 / 1065) | 11101 (2637 / 1300) | 10353 (1506 / 646) | 7851 (1960 / 884) | 1550 / 86.3 |
| G1 saturated overnight | 8328 (269 / 137) | 11844 (205 / 103) | 10042 (13 / 7) | 6620 (21 / 12) | 1382 / 93.3 |
| G1 water | 14.7 (1 / 0.5) | 20.0 (0 / 0) | 14.0 (0 / 0) | 14.9 (1 / 0.3) | 1226 / 99.4 |
| G2 damp | 11059 (3287 / 1597) | 12206 (2779 / 1152) | 11414 (1642 / 593) | 11090 (58 / 24) | 2061 / 65.6 |
| G2 damp overnight | 12808 (2 / 1) | 9842 (8 / 4) | 12234 (29 / 16) | 10687 (1 / 1) | 2092 / 64.3 |
| G2 wet | 9811 (3209 / 1432) | 9121 (3382 / 1471) | 10190 (1076 / 498) | 7380 (2115 / 994) | 1679 / 81.3 |
| G2 unwiped air | 17059 (47 / 26) | 16903 (161 / 81) | 16731 (53 / 27) | 16787 (122 / 61) | 2767 / 37.0 |
| G2 wiped air | 18360 (6 / 3) | 18595 (5 / 3) | 18301 (17 / 9) | 18748 (3 / 2) | 2996 / 27.3 |

## Insertion Variation

True insertion R&R states:

- Gate 1 `dry_soil_reference`
- Gate 1 `damp_soil_reference`
- Gate 1 `saturated_drained_reference_retest`
- Gate 2 `wet`

Within-insertion readings were generally much tighter than between-insertion readings. The largest movements were between insertion means, not sample-to-sample noise inside one insertion.

Selected between-insertion mean ranges:

| Run/state | Path | Between-insertion mean range |
| --- | --- | ---: |
| G2 wet | logged `sen0308_m02` / physical M03 on A1 | 3377 |
| G2 wet | `sen0308_m01` / physical M01 on A0 | 3171 |
| G1 damp | `sen0308_m03` / physical M03 on A2 | 2668 |
| G1 saturated retest | `sen0308_m02` / physical M02 on A1 | 2609 |
| G1 saturated retest | `sen0308_m01` / physical M1 on A0 | 2455 |
| G2 wet | `sen0308_m04` / physical M4 on A3 | 2079 |

Main conclusion: Phase 7N.3B did not identify a dead SEN0308 sensor or a clearly failed ADS1115 channel. The dominant observed variation was insertion/contact/media variation, especially between independent insertions in soil states. Within-insertion readings were generally much tighter than between-insertion readings.

## Directionality

For SEN0308 raw ADC, lower raw means wetter. For GPIO34, lower raw ADC means wetter and legacy `moisture_index` increases as wetter because of the existing inverse mapping.

Gate 1 directionality from dry to damp to saturated retest to water was broadly coherent across all four SEN0308 channels and GPIO34. M02 was less clean in saturated and overnight same-position evidence, but it reached the direct-water wet floor.

Gate 2 directionality from damp to wet to unwiped air to wiped air was also coherent: wet states moved lower/raw-wetter, and both unwiped and wiped air states moved higher/raw-drier. The final wiped-air state was tight across all SEN0308 channels.

## Physical Sensor Vs Channel Interpretation

The Gate 1 concern did not cleanly follow physical SEN0308-M02 after the Gate 2 swap. Physical M02 moved to A2/logged `sen0308_m03` and looked acceptable in wet and final-air recovery. It hit the direct-water wet floor and recovered cleanly in air.

The concern also did not prove ADS1115 A1 / logged `sen0308_m02` is electrically bad. In Gate 2, physical M03 on A1 showed larger wet-state variation, but A1 recovered cleanly in final wiped-air recovery and was not dead or stuck wet. Evidence suggests possible contact/media/channel interaction, not a confirmed electrical fault.

Physical SEN0308-M03 remains a useful comparator electrically. It behaved well in water/final-air recovery but became variable when placed on A1 in wet soil, supporting the interpretation that soil/contact/channel interaction dominates the apparent sensor difference.

## Sensor Conclusions

### M02

Physical SEN0308-M02 remains a watch item but is not disqualified. In Gate 1, M02 on A1 was the original concern. In Gate 2, physical M02 moved to A2/logged `sen0308_m03` and looked acceptable in wet and final-air recovery. It hit the direct-water wet floor and recovered cleanly in air. The concern did not cleanly follow physical M02.

### M03

Physical SEN0308-M03 remains a useful comparator electrically. It behaved well in water/final-air recovery but became variable when placed on A1 in wet soil, supporting the interpretation that soil/contact/channel interaction dominates the apparent sensor difference.

### M04

SEN0308-M04 remains a watch item for insertion spread but is not disqualified. It hit the direct-water wet floor, recovered cleanly in air, and its earlier questionable saturated behavior improved after corrected retesting.

## GPIO34 Comparison

The legacy GPIO34 path remained directionally coherent. GPIO34 raw ADC decreased as media became wetter, while legacy `moisture_index` increased because of the existing inverse mapping. GPIO34 also showed insertion/media variation, supporting the conclusion that the pot/fixture/contact condition was a major variable.

## Recovery Behavior

Wet to unwiped immediate-air to wiped clean-air recovery was strong. SEN0308 channels recovered from wet-state means to high raw air-like values immediately after removal, and tightened further after wiping/cleaning. No channel stayed falsely wet.

GPIO34 recovered dryward too: raw ADC increased from wet to unwiped air to wiped air, while legacy `moisture_index` decreased.

## Moisture-Index Strategy Discussion

No firmware mapping or thresholds were changed.

Candidate A - air/water electrical health index:

- Formula direction: `index = 100 * (air_raw - current_raw) / (air_raw - water_raw)`, where air is `0` and water is `100`.
- Useful for electrical health checks and sanity testing.
- Water is too extreme for normal product soil meaning, so this should not become the customer/product soil moisture value by itself.

Candidate B - dry-soil to saturated/wet-soil product index:

- Better product language than water-as-endpoint because it uses soil states.
- Needs better fixture/media control before product calibration.
- Should remain separate from watering authority until validated with a real control-quality process.

Candidate C - multi-sensor value:

- Median of qualified SEN0308 indices, 2-of-3 voting, or outlier-reject-then-average is safer than relying on one probe.
- This aligns with the observed insertion/contact/media variation.
- Requires freshness gates, settling windows, and sensor-health evidence before any automatic watering use.

## Product-Control Implications

Phase 7N.3B argues against single-probe absolute threshold watering control for the future product. The safer future control path is likely a qualified multi-sensor strategy with median/voting/outlier rejection, freshness gates, settling windows, and sensor-health evidence before any automatic watering authority is granted.

## Non-Calibration Warning

Phase 7N.3B is a measurement-system screen, not calibration. It does not define production moisture scale, plant water need, watering thresholds, field placement, sensor disqualification, supplier return, or control authority.

## Disqualification And Supplier Return

No SEN0308 sensor should be disqualified from this evidence alone. No supplier-return claim is justified yet. The evidence points more strongly to soil/contact/insertion sensitivity than to a dead or nonfunctional sensor.

## Recommended Next Action

Stop active SEN0308 testing for now. Gate 3 is not required immediately. Before more SEN0308 qualification testing, improve fixture/media control or define the next specific decision question. Near-term next phases should consider Prototype01 profile cleanup and a follow-on moisture-index design phase.

Avoid open-ended testing.

## Non-Changes

- No firmware edit.
- No firmware upload.
- No SQL or schema change.
- No deploy.
- No commit or push.
- No frontend or hosted change.
- No schema snapshot update.
- No field-unit change.
- No `/water-now` call.
- No wiring change by Codex.
- No watering behavior, threshold, duration, cooldown, cadence, pin, device ID, GPIO34 mapping, SEN0308 calibration constant, moisture mapping, 5V behavior, or `control_eligible` change.
