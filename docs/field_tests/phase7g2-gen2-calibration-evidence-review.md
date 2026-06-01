# Phase 7G.2 - Gen2 Calibration Evidence Review

## Purpose

Phase 7G.2 reviews the first exported Gen2 calibration/control-validation evidence set for Balcony01 and Scout01. The goal is to separate historical context from current field hardware evidence before any design work changes automatic watering behavior.

This review is evidence-only. It does not approve a control change.

## No-Change Boundary

Phase 7G.2 made no firmware, frontend runtime, SQL schema/RLS, watering behavior, pin, sensor, device ID, `MOISTURE_THRESHOLD`, duration, cooldown, moisture mapping, or `control_eligible` changes.

Supabase remains telemetry/history/diagnostics storage only. Hosted dashboard behavior remains read-only. Local ESP32 firmware remains the owner of watering decisions and pump shutoff.

## Exported Evidence

Support-folder export location:

```text
C:\AIProjects\projects\my-balcony-gardener_support\exports
```

Exported files reviewed:

- `phase7g2_balcony01_scout01_gen2_measurements_20260601_193343Z.csv` - 1558 rows.
- `phase7g2_watering_events_20260601_193343Z.csv` - 0 rows.
- `phase7g2_sensor_events_context_20260601_193343Z.csv` - 0 rows.
- `phase7g2_device_heartbeat_context_20260601_193343Z.csv` - 2 rows.

The exported CSVs remain outside the repo and are not committed.

## Time Windows Reviewed

Full reviewed window:

```text
2026-05-31T00:00:00Z through 2026-06-01T19:33:43Z
```

Actual measurement range in the Gen2 measurement export:

```text
2026-05-31T00:08:42Z through 2026-06-01T19:25:27Z
```

The full 1558-row measurement export is not treated as fully representative of the latest Gen2 field hardware/firmware configuration. Gen2 field hardware changed during this evidence window, so this review separates:

- Full-window historical context.
- Current Scout01 BME02/ST02 Gen2 configuration evidence.
- Current Balcony01 ST03 Gen2 configuration evidence.

## Devices Included

Balcony01:

- UUID: `550e8400-e29b-41d4-a716-446655440000`.
- Role: `controller`.
- Current field configuration: DHT01 on GPIO26, ST03 DS18B20 soil temperature on GPIO27, analog soil moisture on GPIO34, relay/pump output on GPIO25.
- `moisture_index` is the only `control_eligible:true` Gen2 measurement.
- DHT01, ST03, and raw ADC remain `control_eligible:false`.

Scout01:

- UUID: `28f4e6e3-5979-4af4-9753-34e185d8e47e`.
- Role: `sensor-scout`.
- Current field configuration: BME02 BME280 at I2C address `0x76` on GPIO21/GPIO22, ST02 DS18B20 soil temperature on GPIO27, analog soil moisture on GPIO34.
- Scout01 is non-watering. All Scout01 records remain `control_eligible:false`.
- Previous DHT11/DHT02 rows before the BME02/ST02 window are historical context only.

## Full-Window Context

Across the full measurement export:

- Balcony01 reported 171 `moisture_index` rows and 171 `raw_adc` rows.
- Scout01 reported 168 `moisture_index` rows and 168 `raw_adc` rows.
- Balcony01 full-window `moisture_index` ranged from `23` to `80`, averaging about `67.98`.
- Balcony01 full-window raw ADC ranged from `1712` to `3102`, averaging about `2002.57`.
- Scout01 full-window `moisture_index` ranged from `12` to `93`, averaging about `74.04`.
- Scout01 full-window raw ADC ranged from `1384` to `3378`, averaging about `1853.09`.

These full-window ranges include pre-current-configuration rows and startup/settling candidates. They are useful for historical context, outlier review, and exclusion-rule design, but they should not be used as final current-configuration stability metrics.

Earlier Balcony01 low readings around `moisture_index 23` and raw ADC around `3100` occurred on `2026-05-31` before the current ST03-equipped Balcony01 evidence window. Treat them as historical/pre-current-ST03 context, not proof of current ST03-era behavior.

## Current Scout01 BME02/ST02 Evidence

Current Scout01 BME02/ST02 evidence begins around:

```text
2026-05-31T20:26:32Z
```

The first current-configuration sample at `2026-05-31T20:26:32Z` is a startup/settling exclusion candidate:

- `moisture_index`: `12`.
- `raw_adc`: `3378`.
- BME280 rows: `not_detected`.
- DS18B20 row: `not_detected`.

Settled current-configuration evidence runs roughly:

```text
2026-05-31T20:56:32Z through 2026-06-01T19:25:26Z
```

Scout01 settled current-configuration moisture/raw ADC evidence:

- 90 moisture/raw ADC samples.
- `moisture_index` min/max: `65-70`.
- `moisture_index` average: about `67.86`.
- `moisture_index` stdev: about `0.95`.
- Raw ADC min/max: `1954-2067`.
- Raw ADC average: about `2004.22`.
- Raw ADC stdev: about `22.45`.

Scout01 settled current-configuration evidence is directionally stable over this window. Absolute values should not be compared directly to Balcony01 because different baskets, probe placements, and local conditions can dominate absolute readings.

## Current Balcony01 ST03 Evidence

Current Balcony01 ST03-era evidence begins around:

```text
2026-06-01T14:59:52Z
```

Balcony01 current ST03-era evidence through:

```text
2026-06-01T19:25:27Z
```

Balcony01 current ST03-era moisture/raw ADC evidence:

- 18 moisture/raw ADC samples.
- `moisture_index` min/max: `77-79`.
- `moisture_index` average: about `78.06`.
- `moisture_index` stdev: about `0.42`.
- Raw ADC min/max: `1736-1775`.
- Raw ADC average: about `1756.67`.
- Raw ADC stdev: about `9.67`.

Balcony01 current ST03-era evidence is stable over this short window. The sample count is still small, and it does not include watering-response evidence.

## Invalid, Degraded, And Startup Evidence

Invalid/degraded/startup candidate rows found in the export:

- `2026-05-31T20:26:32Z` Scout01 BME280 `air_temperature`, `relative_humidity`, and `barometric_pressure`: `valid:false`, `quality:missing`, `reason:not_detected`.
- `2026-05-31T20:26:32Z` Scout01 DS18B20 `temperature`: `valid:false`, `quality:missing`, `reason:not_detected`.
- `2026-05-31T20:41:32Z` Scout01 DS18B20 `temperature`: `valid:false`, `quality:failed`, `reason:read_failed`.
- `2026-06-01T16:25:26Z` Scout01 DS18B20 `temperature`: `valid:false`, `quality:failed`, `reason:read_failed`.

The `2026-05-31T20:26:32Z` Scout01 sample also contains the moisture/raw ADC outlier pair of `moisture_index 12` and `raw_adc 3378`, so it is a strong startup/settling exclusion candidate for analysis.

Balcony01 current ST03-era rows reviewed in this evidence set did not show invalid ST03 rows.

## Freshness And Gap Findings

Across the full measurement export:

- Balcony01: 171 unique report samples, median gap about `15` minutes, max gap about `51.12` minutes, one gap over 30 minutes, no gap over 60 minutes.
- Scout01: 168 unique report samples, median gap about `15` minutes, max gap about `86.95` minutes, one gap over 30 minutes, one gap over 60 minutes.

These gaps support designing explicit freshness-window logic. Supabase row age is evidence only and should not become watering authority; future control logic should use local measurement freshness.

## Watering-Response Evidence

The watering event export returned 0 rows.

The `sensor_events` context export returned 0 rows.

The heartbeat export returned 2 rows:

- Scout01 reported `currently_watering:false` and `last_watering_duration:0`.
- Balcony01 reported `currently_watering:false` and `last_watering_duration:0`.

No post-watering response or post-watering settling curve is proven by this export set.

Watering-duration interpretation:

- Actual flashed watering duration is not proven by these exports.
- The tracked/default/example duration remains `15000` in `src/config.h.example`.
- Phase 7G.1 recorded a local ignored `src/config.h` observation of `60000`.
- Older ADR references still describe the historical `15000` duration.

Any future watering-response interpretation must clearly distinguish actual flashed duration, tracked/default/example duration, and historical ADR duration.

## Findings

- Current Scout01 BME02/ST02 settled moisture/raw ADC evidence is stable after excluding the first startup/settling candidate.
- Current Balcony01 ST03-era moisture/raw ADC evidence is stable over the short reviewed window.
- Raw ADC and mapped `moisture_index` move inversely as expected under the current mapping.
- Balcony01 and Scout01 do not provide enough evidence for absolute-value matching; compare trend direction and response timing, not numeric equality.
- `valid`, `quality`, and `reason` metadata are useful and should be part of future exclusion logic.
- `control_eligible` metadata remains correctly scoped: Balcony01 `moisture_index` is control-eligible, Balcony01 raw ADC/environment rows are not, and Scout01 rows are not.
- Startup/settling and read-failed candidates exist and should be handled before trusting readings for automatic watering decisions.
- Freshness gaps exist and justify designing explicit local freshness-window rules.
- No watering-response evidence was captured in this export set.

## Limitations

- The full 1558-row measurement export spans hardware/configuration transitions and should not be treated as one homogeneous current-field dataset.
- Scout01 previous DHT11 rows before the BME02/ST02 window are historical context only.
- Balcony01 rows before the current ST03-era window are historical/pre-current-ST03 context.
- Balcony01 current ST03-era evidence includes only 18 moisture/raw ADC samples.
- No watering event rows were present.
- No `sensor_events` operational context rows were present.
- Actual flashed watering duration is not proven by the exports.
- The evidence does not include a controlled watering-response test, visual plant/container notes, pump-flow confirmation, runoff/drip notes, rain notes, or deliberate probe-placement experiments.
- `moisture_index` remains a mapped index, not calibrated volumetric soil moisture.
- Raw ADC remains diagnostic evidence, not calibrated moisture.

## Decision And Recommendation

This evidence is sufficient to justify moving into a design-only phase for repeated-reading validation, startup/settling exclusion, freshness-window logic, and post-watering trust-window design.

This evidence is not sufficient to:

- Change `MOISTURE_THRESHOLD`.
- Change watering duration.
- Change cooldown.
- Trust a single mapped low moisture reading.
- Infer post-watering response.
- Validate final automatic watering behavior.
- Treat `moisture_index` as calibrated volumetric soil moisture.
- Treat raw ADC as calibrated moisture.

Recommended next phase: design-only repeated-reading, freshness-window, startup/settling exclusion, and post-watering trust-window rules before any firmware-control patch is proposed.
