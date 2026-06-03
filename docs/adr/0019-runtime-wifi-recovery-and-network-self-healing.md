# ADR 0019: Runtime Wi-Fi Recovery and Network Self-Healing

Status: Accepted

Date: 2026-06-03

## Context

Phase 7K.5 responds to a runtime incident where Prototype01, Scout01, and Balcony01 were powered but locally unreachable until power-cycled.

The incident was not confirmed as weak Wi-Fi and was not confirmed as a simple power outage. The likely failure class is runtime Wi-Fi/network/server/telemetry recovery after a shared router, access point, or Wi-Fi event.

Before Phase 7K.5, firmware did not expose enough local evidence to distinguish Wi-Fi association failure, local IP recovery failure, web server unresponsiveness, cloud post failure, or another runtime recovery gap.

## Decision

Wi-Fi/network recovery is best-effort and must not preempt pump shutoff.

Pump shutoff remains first priority in `loop()`.

Firmware adds in-memory diagnostics and local `/status` visibility for Wi-Fi/network recovery and cloud-post state.

Firmware populates existing heartbeat evidence fields where possible. Supabase remains telemetry/history/diagnostics storage only.

Firmware adds conservative Wi-Fi recovery:

- `WiFi.setAutoReconnect(true)`
- `WiFi.persistent(false)`
- `WiFi.setSleep(false)`
- `WiFi.onEvent(...)`
- `WiFi.reconnect()`
- `WiFi.disconnect(false) + WiFi.begin(...)` after sustained failure

Phase 7K.5 does not add `ESP.restart()`.

Phase 7K.5 does not add periodic reboot.

Phase 7K.5 does not add Supabase command/control.

Phase 7K.5 does not add hosted calls to local ESP32 endpoints.

Manual Water Now remains local-only.

Scout01 remains non-watering.

## Recovery Hierarchy

1. Detect and expose Wi-Fi/network/cloud-post failure evidence.
2. Keep pump shutoff highest priority in `loop()`.
3. Preserve ESP32 station auto reconnect.
4. Use bounded `WiFi.reconnect()` as the first recovery action.
5. Use bounded `WiFi.disconnect(false) + WiFi.begin(...)` after sustained failure.
6. Do not reboot periodically.
7. Do not add `ESP.restart()` in Phase 7K.5.

## Diagnostics Added

Firmware records in-memory Wi-Fi/network evidence:

- Wi-Fi status code.
- Last Wi-Fi status code.
- Last Wi-Fi disconnect reason.
- Wi-Fi reconnect attempt count.
- Wi-Fi begin-recovery attempt count.
- Wi-Fi disconnect event count.
- Wi-Fi got-IP event count.
- Last Wi-Fi disconnected uptime seconds.
- Last Wi-Fi reconnected uptime seconds.
- Last network recovery action.

Firmware records in-memory cloud-post evidence:

- Last Supabase HTTP status.
- Consecutive Supabase failures.
- Last Supabase error category.
- Last successful telemetry post uptime seconds.
- Last successful diagnostics post uptime seconds.
- Best-effort UTC timestamps for successful telemetry and diagnostics posts when time is available.

Firmware exposes local `/status` diagnostics and enriches existing `device_heartbeats` rows with existing columns plus compact `details`.

## Safety Boundaries

- Pump shutoff remains before network/server/telemetry work in `loop()`.
- No watering duration change.
- No `MOISTURE_THRESHOLD` change.
- No cooldown change.
- No `LOG_INTERVAL_MS` change.
- No moisture mapping change.
- No pin change.
- No sensor change.
- No device ID change.
- No `control_eligible` behavior change.
- No `/water-now` behavior change.
- No Supabase command/control.
- No hosted local ESP32 endpoint calls.
- Scout01 remains non-watering.

## Consequences

Firmware now provides enough evidence to determine whether Wi-Fi remained connected, whether reconnect/begin-recovery actions were attempted, and whether cloud posts succeeded or failed.

The stronger station re-association recovery can run after sustained failure because it is evaluated before routine `WiFi.reconnect()`.

`WL_IDLE_STATUS` is treated as not connected and flows through the recovery ladder rather than returning forever.

The current heartbeat row can only include the previous diagnostics success timestamp because the success of the current heartbeat is not known until after the HTTP POST returns.

Runtime recovery is still bounded and non-blocking. It does not prove recovery from every possible Wi-Fi/server stack failure class.

Phase 7K.5 validation confirmed Prototype01, Scout01, and Balcony01 passed upload, endpoint, and 15-minute cloud-post validation with local `/status` diagnostics visible and `last_supabase_http_status:201`. No unintended watering was reported; Scout01 remained non-watering, and Balcony01 remained not watering during validation.

This validation proves safe boot, local endpoint availability, cloud-post success, and diagnostic visibility after deployment. It does not prove recovery from the exact overnight event because no controlled router/AP disruption test was performed.

## Deferred Items

- Last-resort controlled `ESP.restart()` policy, only if runtime/field evidence proves bounded Wi-Fi recovery cannot recover.
- Controlled router/AP disruption test, only with Jeremy approval.
- Hosted diagnostics view expansion for new fields.
- Alerting/notifications.
- Loop/server health watchdog evidence.
- Longer field soak validation.
