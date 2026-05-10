# ADR 0007: Telemetry Logging Cadence

- Status: Accepted
- Date: 2026-05-08

## Context

Phase 5A restored current ESP32-to-Supabase telemetry logging. Phase 5B added `sensor_events` as a separate manual operational event log. Phase 5C locked the watering-control philosophy and added a validated automatic-watering cooldown guard.

The ESP32 firmware remains the local owner of watering decisions, Manual Water Now, and pump shutoff. Supabase remains telemetry/history storage only and must not be used for command/control.

The current firmware has historically used `LOG_INTERVAL_MS` for normal sensor reads, Supabase telemetry posts, and automatic watering eligibility checks. The current local `src/config.h` value is 5000 ms, which creates temporary 5-second telemetry logging.

That 5-second telemetry cadence is useful during prove-out and debugging, but it is too noisy as the normal long-term telemetry cadence. A 15-minute cadence produces 96 normal telemetry rows per day per device, which is a practical baseline for history graphs and trend analysis.

For MVP, checking automatic watering eligibility every 15 minutes is acceptable because the system waters outdoor containers using fixed-duration batch watering, and soil/container/weather conditions do not normally require second-by-second automatic start decisions.

However, pump shutoff must not depend on the telemetry cadence. Once watering starts, the firmware must continue to stop the pump locally based on `WATERING_DURATION_MS`.

Short watering events may be missed by normal 15-minute telemetry rows unless the firmware intentionally logs watering start and watering completion.

## Decision

- Normal Supabase telemetry cadence is 15 minutes for MVP.
- Automatic watering eligibility may remain tied to the normal telemetry cadence for MVP.
- ESP32 firmware must keep pump shutoff independent from telemetry cadence.
- Pump shutoff remains local and based on `WATERING_DURATION_MS`.
- Manual Water Now remains local/supervised and unchanged.
- The Phase 5C automatic-watering cooldown behavior remains unchanged.
- Firmware `isWatering` state remains required for local pump-state handling.
- The canonical `SensorLogRow.data.watering` field remains unchanged.
- Supabase `watering` telemetry must not be treated as a reliable live remote status.
- Watering-start telemetry should be written immediately with `watering: true`.
- Watering-completion telemetry should be written immediately with `watering: false` and the final `lastWateringDuration`.
- Future graph work should represent watering as event markers or event dots, not as a reliable remote "currently watering" indicator.
- No Supabase schema changes are approved by this ADR.
- No `sensor_events` changes are approved by this ADR.
- No frontend graph-marker UI work is approved by this ADR.

## Consequences

- Normal Supabase telemetry volume drops from temporary 5-second prove-out logging to practical long-term 15-minute logging.
- Automatic watering may start up to one telemetry interval after soil moisture first crosses the threshold.
- This start delay is acceptable for MVP container watering.
- Pump runtime remains bounded by local firmware logic and does not become 15 minutes.
- Immediate watering-start and watering-completion telemetry rows preserve visibility into short pump cycles.
- The local ESP32 `/logs` endpoint may still expose current local watering state.
- Hosted/read-only history views should not present Supabase `watering` as a dependable live status.
- Future settings/admin work should evaluate moving user-adjustable behavior values into persistent device settings instead of relying only on ignored local `src/config.h`.
- Future graph work may use `data.watering`, `lastWateredTime`, and `lastWateringDuration` to show watering markers.
