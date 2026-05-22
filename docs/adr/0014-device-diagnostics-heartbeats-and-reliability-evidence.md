# ADR 0014: Device Diagnostics, Heartbeats, and Reliability Evidence

- Status: Accepted
- Date: 2026-05-22

## Context

Phase 6J.0 established multi-unit visibility and local control target safety. The repo now distinguishes installed controller, bench prototype, and sensor-scout roles while preserving the local-control and hosted-read-only boundaries.

Current telemetry and operational history are intentionally split:

- `sensor_logs` stores plant/environment telemetry and watering event visibility.
- `sensor_events` stores manual operational notes and human-entered context.
- Device-health evidence needs a separate diagnostics path so machine reliability data does not reshape `SensorLogRow` or blur telemetry with command/control.

Every deployed MBG ESP32 should eventually expose and/or report diagnostic evidence such as uptime, reset reason, Wi-Fi health, Supabase posting health, firmware version, device role, and sensor-read health. This applies to controller units, sensor-only/scout units, and bench units. Bench units may eventually report extra verbose diagnostics, but core diagnostics should not be bench-only.

## Decision

Add a separate future diagnostics architecture centered on an append-only Supabase table named `device_heartbeats`.

`device_heartbeats` should be historical heartbeat/evidence storage, not only a latest-status upsert table. A later `device_status_current` table or view may summarize latest status, but that is deferred until the append-only evidence path is proven.

Add a future read-only local endpoint:

```http
GET /status
```

`/status` is diagnostic-only. It must not control watering, alter runtime state, trigger relay behavior, change thresholds, or expose command authority.

Diagnostics are separate from the existing paths:

- `sensor_logs`: plant/environment telemetry and watering event visibility.
- `sensor_events`: manual operational notes and human-entered context.
- `device_heartbeats`: machine/device health evidence.

Supabase remains telemetry/history/diagnostics storage only. It must not become command/control.

## Recommended MVP Fields

Each field should be documented during implementation as one of:

- Already available: can be derived from current firmware state or existing config with minimal reshaping.
- Easy firmware addition: can be added from ESP32/Arduino APIs or simple counters without persistent storage.
- Requires persistent storage: needs NVS/Preferences, RTC memory, or another durable device-local mechanism.
- Future/deferred: useful but not part of the MVP diagnostics slice.

### Identity / Configuration

| Field | Recommended status | Notes |
| --- | --- | --- |
| `device_id` | Already available | Stable UUID from `DEVICE_ID`; required. |
| `device_label` | Easy firmware addition | Friendly label may come from build profile or future provisioning. |
| `device_role` | Easy firmware addition | Values such as `controller`, `bench`, or `sensor-scout`; capability label only. |
| `firmware_version` | Easy firmware addition | Compile-time firmware/build identifier. |
| `build_profile` | Easy firmware addition | PlatformIO environment or equivalent build profile when available. |
| `heartbeat_reason` | Easy firmware addition | Examples: `boot`, `periodic`, `wifi_reconnected`, `cloud_recovered`. |

### Runtime

| Field | Recommended status | Notes |
| --- | --- | --- |
| `uptime_seconds` | Easy firmware addition | Derived from `millis()` with wraparound awareness. |
| `boot_count` | Requires persistent storage | Needs NVS/Preferences or another durable counter. |
| `reset_reason` | Easy firmware addition | Use ESP32 reset-reason APIs. |
| `free_heap` | Easy firmware addition | Use ESP32 heap APIs. |
| `min_free_heap` | Easy firmware addition | Use ESP32 minimum-free-heap APIs where available. |

### Wi-Fi

| Field | Recommended status | Notes |
| --- | --- | --- |
| `wifi_connected` | Already available | Derived from `WiFi.status()`. |
| `wifi_rssi` | Easy firmware addition | Valid when connected. |
| `wifi_reconnect_attempt_count` | Easy firmware addition | Increment when firmware requests reconnect. |

### Supabase / Cloud Posting

| Field | Recommended status | Notes |
| --- | --- | --- |
| `last_supabase_http_status` | Easy firmware addition | Track latest HTTP status from telemetry/diagnostics posts. |
| `consecutive_supabase_failures` | Easy firmware addition | Reset after successful post. |
| `last_supabase_error_category` | Easy firmware addition | Coarse categories such as `wifi_unavailable`, `http_error`, `timeout`, `auth_or_rls`, or `unknown`. |
| `last_successful_telemetry_post_at` | Easy firmware addition | Best effort; timestamp quality depends on time availability. |
| `last_successful_diagnostics_post_at` | Easy firmware addition | Best effort; timestamp quality depends on time availability. |

### Sensor Read Health

| Field | Recommended status | Notes |
| --- | --- | --- |
| `last_sensor_read_at` | Easy firmware addition | Best effort; timestamp quality depends on time availability. |
| `dht_fresh_read_ok` | Already available | Current DHT fallback path can distinguish fresh success from failure. |
| `dht_using_cached_values` | Already available | True when last-known-good DHT values are being reused. |
| `dht_failure_count` | Easy firmware addition | Increment on failed DHT reads. |
| `soil_raw_adc_last` | Already available | Current firmware already reads raw soil ADC for `/logs` and telemetry. |

### Watering / Control Safety

| Field | Recommended status | Notes |
| --- | --- | --- |
| `currently_watering` | Already available | Diagnostic state only; not command authority. |
| `last_watering_started_at` | Already available | Current `lastWateredTime` exists, but timestamp quality should be reviewed. |
| `last_watering_completed_at` | Easy firmware addition | Track completion time after pump shutoff. |
| `last_watering_duration` | Already available | Current firmware tracks last watering duration in seconds. |
| `pump_control_available` | Easy firmware addition | Capability flag for whether the unit has pump/relay control hardware. |
| `device_can_water` | Easy firmware addition | Capability/safety flag for whether this device is allowed to water locally. This does not grant remote command authority. |

### Local-Only Diagnostic Fields

These fields are useful on `/status` but should be handled carefully before posting to Supabase:

| Field | Recommended status | Notes |
| --- | --- | --- |
| `ip_address` | Already available | Useful for local troubleshooting; local-only MVP. |
| `mac_address` | Easy firmware addition | Useful for provisioning/debugging; consider privacy and inventory policy before cloud storage. |
| `wifi_ssid` | Future/deferred | Omit or mask. Do not expose raw customer SSIDs by default. |

### Deferred / Future Fields

- `last_wifi_disconnect_reason`
- `last_wifi_disconnected_at`
- `loop_health`
- `soil_read_ok`
- `sensor_status_summary`
- `automatic_watering_enabled`
- Hosted dashboard diagnostics display
- `device_status_current` latest-status table/view
- Supabase device registry integration
- Alerting/notifications
- Offline buffering

## Heartbeat Cadence

Recommended MVP cadence:

- Post on boot when Wi-Fi/time allows.
- Post periodic heartbeat every 15 minutes.
- Defer event-triggered heartbeat after Wi-Fi reconnect.
- Defer event-triggered heartbeat after cloud recovery.
- Avoid a 5-minute default diagnostics cadence for MVP unless later evidence justifies the extra write volume and noise.

The diagnostics cadence should not change existing `sensor_logs` telemetry cadence, `/logs` behavior, watering cadence, watering thresholds, watering duration, cooldown behavior, moisture mapping, relay pins, sensor pins, or local control behavior.

## RLS And Security

`device_heartbeats` should have RLS enabled.

Recommended MVP security posture:

- Inserts should be limited to known provisioned `device_id` values.
- No anonymous update.
- No anonymous delete.
- No command/control fields.
- No remote Water Now.
- No table fields that ask firmware to perform an action.

A future Supabase device registry or table-driven allowlist may replace hardcoded RLS UUID lists, but that remains deferred.

## Capability And Role Boundaries

Diagnostics should exist on every deployed unit:

- Controller units report core diagnostics.
- Sensor-only/scout units report core diagnostics.
- Bench units report core diagnostics and may later report extra verbose diagnostics.

Fields such as `pump_control_available` and `device_can_water` distinguish device capability without granting command authority. They are evidence fields, not control switches.

## Hosted Dashboard Boundary

Hosted dashboard display of diagnostics is deferred until both `/status` and `device_heartbeats` are proven.

When implemented later, hosted diagnostics display must remain read-only and must not import local control targets, call local ESP32 endpoints, expose Water Now, introduce Supabase command/control, or change hosted-readonly control boundaries.

## Consequences

- `SensorLogRow` remains unchanged.
- `sensor_logs` remains plant/environment telemetry and watering event visibility.
- `sensor_events` remains manual operational context.
- `device_heartbeats` becomes the recommended future diagnostics/evidence table.
- `/status` becomes the recommended future local read-only diagnostics endpoint.
- No firmware code, SQL migration, frontend runtime behavior, watering behavior, local `/logs` behavior, or local `/water-now` behavior is changed by this ADR.
- Local ESP32 firmware remains the owner of watering decisions and pump shutoff.
- Pump shutoff remains the highest-priority local action.
- Supabase remains telemetry/history/diagnostics storage only, not command/control.
