# ADR 0012: Sensor Diagnostic Telemetry and Raw ADC Visibility

## Status

Accepted

## Date

2026-05-14

## Context

- Current moisture is a derived index from `analogRead(SOIL_PIN)`, not a calibrated soil-moisture percentage.
- Raw ADC is currently discarded after mapping/constrain.
- Bad, disconnected, miswired, saturated, or out-of-range moisture readings can be hidden as plausible `0`-`100` values.
- Bench unit has shown suspicious stuck/high mapped moisture behavior, and raw ADC is needed for diagnosis.
- DHT11 temperature/humidity do not expose comparable ESP32 raw ADC data; DHT diagnostics should be handled later as freshness/fallback/failure/quality metadata, not as raw ADC.
- CoAP is deferred; Phase 6H stays on current HTTP/Supabase transport.
- Future telemetry should become SenML-inspired, using measurement-list or measurement-table concepts before adding additional sensors such as light, pressure, flow, water level, or additional moisture sensors.

## Decision

- Add optional `soilRawAdc` to the canonical `SensorLogRow.data` contract.
- Include `soilRawAdc` in local `/logs`.
- Include `soilRawAdc` in Supabase `sensor_logs.data`.
- Keep existing moisture mapping unchanged.
- Keep existing watering thresholds/durations/cooldown unchanged.
- Keep automatic watering decisions based on current mapped moisture for this phase.
- Do not add filtering, calibration, or invalid-reading rejection in Phase 6H.
- Keep Supabase telemetry/history only; no command/control.
- Treat `data.moisture` as a moisture index, not a calibrated percentage.
- Make frontend support backward-compatible with old rows that do not have `soilRawAdc`.

## Consequences

- New rows will include diagnostic raw ADC evidence.
- Old rows without `soilRawAdc` remain valid.
- Hosted history can eventually display or use `soilRawAdc` for diagnostics.
- This is a deliberate canonical contract change from ADR 0003.
- Future sensor expansion should not keep adding endless fixed top-level fields; before adding additional sensor types, evaluate a SenML-inspired measurement-list or measurement-table model.
- No Supabase command/control is introduced.
- No watering behavior is changed.
