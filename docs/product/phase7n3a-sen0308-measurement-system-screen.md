# Phase 7N.3A - SEN0308 Measurement-System Screen

Date: 2026-06-12

Status: runtime capture complete; documentation-only closeout pending review.

## Purpose And Boundary

Phase 7N.3A screens four SEN0308 raw ADS1115 channels against the legacy GPIO34 moisture path across bench states. It evaluates directionality, stability, sensor-to-sensor agreement, and obvious outlier behavior. It does not calibrate moisture, set watering thresholds, replace GPIO34, or grant SEN0308 watering authority.

Captured primary records:

- `sen0308_m01` / `raw_adc`
- `sen0308_m02` / `raw_adc`
- `sen0308_m03` / `raw_adc`
- `sen0308_m04` / `raw_adc`
- `soil_moisture_analog` / `raw_adc`
- `soil_moisture_analog` / `moisture_index`

Evidence CSV:

- `field_readings/phase7n3a_sen0308_measurement_system_screen_20260612_093331.csv`

## Captured States

Each state was captured from `http://10.0.0.192/measurements` using 5 samples spaced approximately 15 seconds apart.

- `free_air`: initial free-air run with the ceiling fan on low.
- `free_air_no_fan`: second free-air run after the ceiling fan was turned off.
- `dry_soil`: composite dry soil from several old pots that had not been watered in a long time; all probes inserted once, in the same relative orientation and recommended depth, with no re-orientation despite expected soil variance.
- `damp_soil`: raised bed Miracle-Gro soil directly from the bag.
- `wet_drained_soil`: damp soil lightly and as-evenly-as-practical watered, then settled for roughly 20 minutes before capture.
- `saturated_soil`: additional operator-requested saturated soil check.
- `water_glass`: additional operator-requested glass-of-water sanity check.
- `humidity_container_initial`: wet paper towel enclosed in a container with the BME280 included.
- `humidity_container_30min`: same container after approximately 30 minutes.
- `humidity_container_heated_towel`: heated wet-towel container check.

The humidity-container tests were exploratory sanity/edification checks. They should be treated as humidity/condensation/context observations only, not soil calibration points and not control-quality evidence.

## Summary Statistics

All selected SEN0308 and GPIO34 rows were `valid:true` and `quality:"diagnostic"`.

| State | Sensor / measurement | N | Mean | Min | Max | Range | Std dev |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| free_air | sen0308_m01 raw_adc | 5 | 18433.00 | 18424 | 18438 | 14 | 6.20 |
| free_air | sen0308_m02 raw_adc | 5 | 18359.40 | 18355 | 18368 | 13 | 5.18 |
| free_air | sen0308_m03 raw_adc | 5 | 18633.00 | 18626 | 18636 | 10 | 4.24 |
| free_air | sen0308_m04 raw_adc | 5 | 18812.40 | 18808 | 18819 | 11 | 4.16 |
| free_air | GPIO34 raw_adc | 5 | 3031.00 | 3017 | 3041 | 24 | 10.56 |
| free_air | GPIO34 moisture_index | 5 | 26.20 | 26 | 27 | 1 | 0.45 |
| free_air_no_fan | sen0308_m01 raw_adc | 5 | 18428.40 | 18423 | 18434 | 11 | 4.51 |
| free_air_no_fan | sen0308_m02 raw_adc | 5 | 18351.80 | 18348 | 18353 | 5 | 2.17 |
| free_air_no_fan | sen0308_m03 raw_adc | 5 | 18639.40 | 18634 | 18644 | 10 | 4.77 |
| free_air_no_fan | sen0308_m04 raw_adc | 5 | 18814.60 | 18813 | 18816 | 3 | 1.14 |
| free_air_no_fan | GPIO34 raw_adc | 5 | 3019.20 | 3006 | 3037 | 31 | 12.28 |
| free_air_no_fan | GPIO34 moisture_index | 5 | 26.60 | 26 | 27 | 1 | 0.55 |
| dry_soil | sen0308_m01 raw_adc | 5 | 15227.80 | 15210 | 15245 | 35 | 14.31 |
| dry_soil | sen0308_m02 raw_adc | 5 | 14293.60 | 14276 | 14321 | 45 | 17.83 |
| dry_soil | sen0308_m03 raw_adc | 5 | 14618.00 | 14612 | 14625 | 13 | 4.64 |
| dry_soil | sen0308_m04 raw_adc | 5 | 15022.40 | 15014 | 15031 | 17 | 8.05 |
| dry_soil | GPIO34 raw_adc | 5 | 2344.20 | 2335 | 2359 | 24 | 10.66 |
| dry_soil | GPIO34 moisture_index | 5 | 53.80 | 53 | 54 | 1 | 0.45 |
| damp_soil | sen0308_m01 raw_adc | 5 | 13973.40 | 13943 | 14049 | 106 | 43.68 |
| damp_soil | sen0308_m02 raw_adc | 5 | 12586.00 | 12523 | 12658 | 135 | 49.89 |
| damp_soil | sen0308_m03 raw_adc | 5 | 12296.40 | 12288 | 12301 | 13 | 5.03 |
| damp_soil | sen0308_m04 raw_adc | 5 | 14112.40 | 14102 | 14123 | 21 | 8.73 |
| damp_soil | GPIO34 raw_adc | 5 | 1904.40 | 1878 | 1926 | 48 | 19.83 |
| damp_soil | GPIO34 moisture_index | 5 | 71.80 | 71 | 73 | 2 | 0.84 |
| wet_drained_soil | sen0308_m01 raw_adc | 5 | 10037.80 | 9971 | 10073 | 102 | 41.00 |
| wet_drained_soil | sen0308_m02 raw_adc | 5 | 13676.00 | 13631 | 13740 | 109 | 46.73 |
| wet_drained_soil | sen0308_m03 raw_adc | 5 | 10223.00 | 10215 | 10231 | 16 | 7.18 |
| wet_drained_soil | sen0308_m04 raw_adc | 5 | 12811.20 | 12805 | 12818 | 13 | 5.93 |
| wet_drained_soil | GPIO34 raw_adc | 5 | 1642.00 | 1600 | 1680 | 80 | 31.17 |
| wet_drained_soil | GPIO34 moisture_index | 5 | 82.60 | 81 | 84 | 3 | 1.14 |
| saturated_soil | sen0308_m01 raw_adc | 5 | 15.60 | 15 | 16 | 1 | 0.55 |
| saturated_soil | sen0308_m02 raw_adc | 5 | 4771.40 | 4654 | 4860 | 206 | 80.37 |
| saturated_soil | sen0308_m03 raw_adc | 5 | 14.00 | 14 | 14 | 0 | 0.00 |
| saturated_soil | sen0308_m04 raw_adc | 5 | 2850.60 | 2817 | 2884 | 67 | 25.28 |
| saturated_soil | GPIO34 raw_adc | 5 | 1603.80 | 1559 | 1662 | 103 | 39.75 |
| saturated_soil | GPIO34 moisture_index | 5 | 84.20 | 82 | 86 | 4 | 1.64 |
| water_glass | sen0308_m01 raw_adc | 5 | 19.00 | 19 | 19 | 0 | 0.00 |
| water_glass | sen0308_m02 raw_adc | 5 | 15.80 | 15 | 16 | 1 | 0.45 |
| water_glass | sen0308_m03 raw_adc | 5 | 14.00 | 14 | 14 | 0 | 0.00 |
| water_glass | sen0308_m04 raw_adc | 5 | 22.00 | 22 | 22 | 0 | 0.00 |
| water_glass | GPIO34 raw_adc | 5 | 1299.00 | 1276 | 1357 | 81 | 33.10 |
| water_glass | GPIO34 moisture_index | 5 | 96.60 | 94 | 98 | 4 | 1.52 |
| humidity_container_initial | sen0308_m01 raw_adc | 5 | 17879.40 | 17869 | 17886 | 17 | 6.35 |
| humidity_container_initial | sen0308_m02 raw_adc | 5 | 17484.60 | 17478 | 17495 | 17 | 7.20 |
| humidity_container_initial | sen0308_m03 raw_adc | 5 | 17855.80 | 17848 | 17862 | 14 | 5.12 |
| humidity_container_initial | sen0308_m04 raw_adc | 5 | 17977.40 | 17960 | 17997 | 37 | 13.59 |
| humidity_container_initial | GPIO34 raw_adc | 5 | 3077.20 | 3049 | 3135 | 86 | 33.39 |
| humidity_container_initial | GPIO34 moisture_index | 5 | 24.00 | 22 | 25 | 3 | 1.22 |
| humidity_container_30min | sen0308_m01 raw_adc | 5 | 17679.80 | 17676 | 17685 | 9 | 3.35 |
| humidity_container_30min | sen0308_m02 raw_adc | 5 | 17612.60 | 17608 | 17626 | 18 | 7.80 |
| humidity_container_30min | sen0308_m03 raw_adc | 5 | 17703.80 | 17696 | 17709 | 13 | 7.12 |
| humidity_container_30min | sen0308_m04 raw_adc | 5 | 17755.60 | 17750 | 17758 | 8 | 3.21 |
| humidity_container_30min | GPIO34 raw_adc | 5 | 3065.60 | 3036 | 3088 | 52 | 26.35 |
| humidity_container_30min | GPIO34 moisture_index | 5 | 24.80 | 24 | 26 | 2 | 1.10 |
| humidity_container_heated_towel | sen0308_m01 raw_adc | 5 | 18353.00 | 18296 | 18393 | 97 | 39.39 |
| humidity_container_heated_towel | sen0308_m02 raw_adc | 5 | 18212.60 | 18171 | 18258 | 87 | 32.88 |
| humidity_container_heated_towel | sen0308_m03 raw_adc | 5 | 18381.40 | 18339 | 18413 | 74 | 31.41 |
| humidity_container_heated_towel | sen0308_m04 raw_adc | 5 | 18368.80 | 18318 | 18424 | 106 | 43.31 |
| humidity_container_heated_towel | GPIO34 raw_adc | 5 | 3034.40 | 3009 | 3054 | 45 | 17.57 |
| humidity_container_heated_towel | GPIO34 moisture_index | 5 | 26.00 | 25 | 27 | 2 | 0.71 |

## BME280 Humidity Context

The humidity-container states also captured `bme280_air` temperature and relative humidity context.

| State | BME measurement | N | Mean | Min | Max | Range | Std dev |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| humidity_container_initial | air_temperature F | 5 | 74.01 | 74.01 | 74.01 | 0.00 | 0.00 |
| humidity_container_initial | relative_humidity % | 5 | 74.82 | 74.82 | 74.82 | 0.00 | 0.00 |
| humidity_container_30min | air_temperature F | 5 | 74.01 | 74.01 | 74.01 | 0.00 | 0.00 |
| humidity_container_30min | relative_humidity % | 5 | 74.82 | 74.82 | 74.82 | 0.00 | 0.00 |
| humidity_container_heated_towel | air_temperature F | 5 | 131.14 | 74.01 | 359.67 | 285.66 | 127.75 |
| humidity_container_heated_towel | relative_humidity % | 5 | 79.86 | 74.82 | 100.00 | 25.18 | 11.26 |

The heated-towel BME context includes one extreme `359.67 F` / `100.00%` sample at `2026-06-12T16:39:11Z`. Treat this as exploratory context and possible thermal/condensation/proximity artifact, not as a soil or moisture calibration point.

## Directionality And Sensor Notes

- All four SEN0308 channels moved downward from free air to dry soil to damp soil.
- `sen0308_m01` moved downward again in wet-drained soil and reached the low/raw floor in saturated soil and water.
- `sen0308_m03` showed the cleanest directionality: downward from free air through dry, damp, wet-drained, saturated, and water, with very low within-state noise.
- `sen0308_m04` moved downward through wet-drained soil and reached the low/raw floor in water, but saturated soil remained higher than M01/M03.
- `sen0308_m02` moved downward from free air to dry to damp, then rose in wet-drained soil and remained elevated in saturated soil, but dropped to the low/raw floor in water.
- The M02 damp-to-wet-drained reversal is not repeated in the water-glass test; water proves M02 can respond strongly to direct liquid. The saturated-soil value remains elevated, so the practical interpretation is still ambiguous soil/contact/media behavior, with M02 the least clean candidate from this screen.

## GPIO34 Comparison

The legacy GPIO34 moisture path was included in the in-air tests.

- GPIO34 raw ADC was `3031.00` in `free_air` and `3019.20` in `free_air_no_fan`.
- GPIO34 legacy `moisture_index` was `26.20` in `free_air` and `26.60` in `free_air_no_fan`.
- GPIO34 raw ADC decreased with wetter states: `3031.00` free air, `2344.20` dry soil, `1904.40` damp soil, `1642.00` wet-drained soil, `1603.80` saturated soil, and `1299.00` water.
- GPIO34 `moisture_index` moved the opposite direction because of the existing legacy mapping: `26.20` free air, `53.80` dry soil, `71.80` damp soil, `82.60` wet-drained soil, `84.20` saturated soil, and `96.60` water.
- This comparison supports directional screening only. It does not validate either path as calibrated volumetric water content.

## Outlier And Noise Observations

- Free-air and fan-off free-air repeatability were tight for all four SEN0308 channels.
- Inserted-media variability was higher than free air, especially `sen0308_m02` in damp/saturated soil and `sen0308_m01` in damp/wet-drained soil.
- `sen0308_m02` is the main outlier in behavior: wet-drained rose relative to damp, and saturated soil stayed much higher than M01/M03 despite water-glass falling to the low/raw floor.
- `sen0308_m04` is a secondary caution: it behaved directionally but had a higher saturated-soil mean than M01/M03.
- The humidity-container tests looked mostly like air/proximity context rather than soil moisture response; heated towel increased SEN0308 variability and produced the BME outlier noted above.

## Practical Candidate Ranking

For future Balcony02 evaluation, based only on this bench screen:

1. `sen0308_m03`: strongest candidate; clean monotonic directionality, tight stability, and clear saturated/water floor behavior.
2. `sen0308_m01`: strong candidate; large useful dynamic range and clear saturated/water floor behavior, with somewhat more inserted-media variability than M03.
3. `sen0308_m04`: usable candidate; broadly directional, but saturated-soil response was less low than M01/M03.
4. `sen0308_m02`: least preferred candidate for now; direct water response is good, but wet-drained and saturated-soil behavior were less consistent.

This ranking is a triage result for future testing, not a production sensor assignment.

## Non-Calibration Warning

This screen supports continued SEN0308 evaluation. It does not establish calibration, equivalence among sensors, true soil-moisture percentage, field suitability, watering thresholds, control quality, or automatic-watering eligibility. Any future use of SEN0308 for watering decisions still requires a separate approved calibration/control-quality phase.

## Follow-Up

Phase 7N.3B performed a deeper single-operator MSA and M02/M03 channel-swap screen using the same SEN0308 family and Prototype01 measurement path. The Phase 7N.3A early M02/M04 watch read was refined by Phase 7N.3B: no SEN0308 sensor was disqualified, no supplier-return claim was justified, and the dominant observed variation was insertion/contact/media variation rather than a dead sensor or clearly failed ADS1115 channel.

Phase 7N.3B product note:

- [`docs/product/phase7n3b-sen0308-single-operator-msa-channel-swap-screen.md`](./phase7n3b-sen0308-single-operator-msa-channel-swap-screen.md)

## Non-Changes

- No firmware edit.
- No firmware upload.
- No SQL or schema change.
- No deploy.
- No commit or push.
- No frontend change.
- No schema snapshot update.
- No field-unit change.
- No `/water-now` call.
- No watering behavior, threshold, duration, cooldown, cadence, pin, mapping, device ID, GPIO34 mapping, SEN0308 calibration constant, moisture mapping, 5V action, or `control_eligible` change.
