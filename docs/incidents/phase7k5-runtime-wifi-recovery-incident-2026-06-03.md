# Phase 7K.5 Runtime Wi-Fi Recovery Incident

Date: 2026-06-03

## Incident Summary

Phase 7K.5 was opened after a field/runtime incident where all three ESP32 units were powered but locally unreachable until power-cycled.

The likely failure class was runtime Wi-Fi/network/server/telemetry recovery after a shared router, access point, or Wi-Fi event. The incident was not confirmed as weak Wi-Fi, and it was not confirmed as a simple power outage.

## Observed Symptoms

- Prototype01, Scout01, and Balcony01 were all powered.
- All three ESP32 units were locally unreachable before power cycling.
- Local ESP32 endpoints did not provide enough evidence at the time to distinguish Wi-Fi association failure, IP recovery failure, local web server unresponsiveness, or cloud telemetry failure.
- Devices recovered after power cycling.

## Affected Devices

- Prototype01
- Scout01
- Balcony01

## Local Reachability Evidence Before Power Cycling

The key local evidence before power cycling was absence of reachability: the devices were powered but local ESP32 endpoints were not reachable.

Phase 7K.5 documentation intentionally does not claim the root cause was weak Wi-Fi, a router outage, a power outage, Supabase failure, or firmware crash. The pre-Phase 7K.5 firmware did not expose enough runtime recovery evidence to make that distinction.

## Recovery After Power Cycling

After power cycling, the ESP32 units returned to normal local reachability. That recovery suggested a runtime recovery gap after a shared network/router/AP/Wi-Fi event, but did not prove a single root cause.

## Interpretation

The incident is best treated as a runtime Wi-Fi/network/server/telemetry recovery incident until more evidence is available.

The working hypothesis is that the firmware needed better local diagnostics and a conservative bounded recovery ladder before considering stronger last-resort behavior.

## What This Incident Was Not

- Not confirmed as weak Wi-Fi.
- Not confirmed as a simple power outage.
- Not confirmed as an intentional router/network disruption.
- Not evidence that Supabase should become command/control.
- Not a reason to add Remote Water Now or hosted calls to local ESP32 endpoints.
- Not a reason to change watering thresholds, moisture mapping, pump duration, pins, sensors, device IDs, or Scout01 watering authority.

## What Evidence Was Missing Before Phase 7K.5

- Wi-Fi status code history.
- Wi-Fi disconnect reason.
- Disconnect and reconnect event counts.
- Uptime-based disconnect and reconnect timestamps.
- Reconnect attempt counts.
- Stronger recovery attempt counts.
- Last network recovery action.
- Last Supabase HTTP status.
- Consecutive Supabase failure count.
- Last Supabase error category.
- Uptime evidence for successful telemetry and diagnostics posts.

## Phase 7K.5 Response

Phase 7K.5 adds firmware diagnostics and conservative runtime Wi-Fi recovery hardening in `src/main.cpp`.

The recovery hierarchy is:

1. Detect and expose Wi-Fi/network/cloud-post failure evidence.
2. Keep pump shutoff highest priority in `loop()`.
3. Preserve `WiFi.setAutoReconnect(true)`.
4. Add `WiFi.persistent(false)`.
5. Add `WiFi.setSleep(false)`.
6. Add `WiFi.onEvent(...)` for supported ESP32 Wi-Fi station events.
7. Use bounded `WiFi.reconnect()`.
8. Use bounded `WiFi.disconnect(false) + WiFi.begin(...)` after sustained failure.
9. Do not add `ESP.restart()` in Phase 7K.5.
10. Do not add periodic reboot.

Restart remains a possible future last-resort only if runtime/field evidence proves bounded Wi-Fi recovery cannot recover the Wi-Fi/server stack.

## Validation Evidence So Far

Prototype01 Phase 7K.5 upload and runtime validation passed:

- `device_label`: `Prototype01`
- `device_id`: `318fab98-89ad-4f36-9100-3134a04e0be5`
- `build_profile`: `bench-proto-gen2`
- `/status` reachable
- `/measurements` reachable
- `last_supabase_http_status`: `201`
- `consecutive_supabase_failures`: `0`
- `last_successful_telemetry_post_uptime_seconds`: `901`
- `last_successful_diagnostics_post_uptime_seconds`: `903`
- `currently_watering`: `false`
- `ESP.restart()` absent

Balcony01 Phase 7K.5 upload and runtime validation passed:

- `device_label`: `Balcony01`
- `device_id`: `550e8400-e29b-41d4-a716-446655440000`
- `device_role`: `controller`
- `build_profile`: `balcony-installed-gen2`
- `/status`, `/capabilities`, and `/measurements` reachable
- `wifi_connected`: `true`
- `wifi_rssi`: `-56`
- `wifi_status_code`: `3`
- `last_wifi_status_code`: `3`
- `wifi_reconnect_attempt_count`: `0`
- `wifi_begin_recovery_attempt_count`: `0`
- `wifi_disconnect_event_count`: `1`
- `wifi_got_ip_event_count`: `1`
- `last_network_recovery_action`: `wifi_got_ip_event`
- `last_supabase_http_status`: `201`
- `consecutive_supabase_failures`: `0`
- `last_supabase_error_category`: `none`
- `last_successful_telemetry_post_uptime_seconds`: `901`
- `last_successful_diagnostics_post_uptime_seconds`: `903`
- `currently_watering`: `false`
- `pump_control_available`: `true`
- `device_can_water`: `true`
- `moisture_index`: `73.0`
- `raw_adc`: `1877`
- DS18B20 soil temperature: valid / good
- DHT11 RH remains known-bad diagnostic evidence and is not control eligible

Scout01 Phase 7K.5 upload and runtime validation passed:

- `device_label`: `Scout01`
- `device_id`: `28f4e6e3-5979-4af4-9753-34e185d8e47e`
- `device_role`: `sensor-scout`
- `build_profile`: `balcony-sensor-scout-01`
- `reported_at`: `2026-06-03T19:54:16Z`
- `uptime_seconds`: `2951`
- `/status` reachable
- `/measurements` reachable
- New Phase 7K.5 `/status` fields present
- `wifi_connected`: `true`
- `wifi_rssi`: `-52`
- `wifi_status_code`: `3`
- `last_wifi_status_code`: `3`
- `wifi_reconnect_attempt_count`: `0`
- `wifi_begin_recovery_attempt_count`: `0`
- `wifi_disconnect_event_count`: `1`
- `wifi_got_ip_event_count`: `1`
- `last_network_recovery_action`: `wifi_got_ip_event`
- `last_supabase_http_status`: `201`
- `consecutive_supabase_failures`: `0`
- `last_supabase_error_category`: `none`
- `last_successful_telemetry_post_uptime_seconds`: `2701`
- `last_successful_diagnostics_post_uptime_seconds`: `2702`
- `currently_watering`: `false`
- `pump_control_available`: `false`
- `device_can_water`: `false`

Scout01 `/measurements` returned valid JSON with 6 records:

- BME280 air temperature: `78.22 F`
- BME280 relative humidity: `38.37%`
- BME280 pressure: `1024.29 hPa`
- DS18B20 temperature: `70.81 F`
- Soil moisture index: `64.0`
- Soil raw ADC: `2110`
- All records remained `control_eligible:false`

## Remaining Validation Pending

All three Phase 7K.5 targets, Prototype01, Scout01, and Balcony01, passed upload, endpoint, and 15-minute cloud-post validation.

Remaining limitations:

- No controlled router/AP disruption test was performed.
- This validation does not prove recovery from the exact overnight event yet.
- This validation proves safe boot, local endpoint availability, cloud-post success, and diagnostic visibility after deployment.

## Future Follow-Up

- Last-resort controlled `ESP.restart()` policy only if evidence proves bounded recovery cannot recover.
- Controlled router/AP disruption test only with Jeremy approval.
- Hosted diagnostics view expansion for new network recovery evidence.
- Alerting and notification design.
- Loop/server health watchdog evidence.
- Longer field soak validation.
