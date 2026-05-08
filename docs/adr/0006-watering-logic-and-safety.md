# ADR 0006: Watering Logic And Safety Philosophy

- Status: Accepted
- Date: 2026-05-07

## Context

Phase 5A restored current ESP32-to-Supabase telemetry logging. Phase 5B added `sensor_events` as a separate manual operational event log.

Phase 5C replaces the previously planned logging-cadence phase because watering-control safety needs to be separated from telemetry cadence.

The ESP32 firmware currently owns local live/control behavior. Supabase is telemetry/history storage only and must not be used for remote command/control. Pump shutoff must remain local and must not depend on Supabase.

Automatic watering is currently tied to a moisture threshold and fixed duration. Current firmware uses `MOISTURE_THRESHOLD = 35` and `WATERING_DURATION_MS = 15000`.

The current mapped moisture value is a derived index from `analogRead(SOIL_PIN)`, not a proven calibrated soil-moisture percentage. The current moisture mapping uses raw ADC endpoints and `constrain()`, so invalid or suspicious raw readings can be hidden as plausible 0-100 values.

The system is installed outdoors where rain and water are expected, but MVP v1.0 should still be treated as supervised prove-out until additional hardware protections are evaluated.

## Decision

- ESP32 firmware owns watering decisions locally.
- Supabase remains telemetry/history only.
- Supabase does not make watering decisions, authorize pump operation, or control pump behavior.
- Automatic watering is fixed-duration batch watering only.
- Automatic watering must not run continuously until the moisture reading crosses a target.
- A post-watering soak/cooldown period is required before another automatic watering cycle may start.
- 15 minutes is the current MVP cooldown candidate for anti-chatter/soak protection, pending validation.
- Current 15-second watering duration remains unchanged for the first safety patch.
- 30, 45, and 60 seconds are future manual hydraulic prove-out candidates; 45 seconds is likely the next practical candidate but is not approved as a code change in this ADR.
- Quiet hours are accepted as a product/control requirement, with 10:00 PM to 8:00 AM as the current candidate window, but implementation is deferred until time handling is reviewed.
- Manual Water Now remains a local, supervised, testing/hydraulic-prove-out feature.
- Manual Water Now may bypass quiet hours because it is user-initiated.
- Remote Water Now through Supabase is not an MVP goal.
- Soil moisture validity checks are required before automatic watering is considered mature.
- Future automatic watering should use validated raw ADC behavior and confirmed repeated or filtered readings, not a single constrained mapped value.
- Dry-run protection is deferred to later physical/hardware safety design.
- Leak, overflow, disconnected tubing, and failure detection are deferred to later physical/hardware safety design.
- MVP v1.0 is an outdoor supervised prove-out system, not a fully unattended-safe product.

## Consequences

- Phase 5C may add a small firmware cooldown guard after documentation review.
- Phase 5C must not change telemetry cadence unless separately approved.
- Phase 5C must not alter `SensorLogRow` or `sensor_events`.
- Later phases should evaluate soil sensor raw ADC behavior, repeated-reading validation, filtering, quiet-hours time handling, reservoir-level sensing, leak detection, flow sensing, and pump-current sensing.
- Future documentation should distinguish display moisture index from validated control input.
- Watering duration changes should be tested as controlled hydraulic experiments, not bundled with the first cooldown safety patch.
