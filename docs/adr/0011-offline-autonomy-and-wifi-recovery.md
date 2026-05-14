# ADR 0011: Offline Autonomy and Wi-Fi Recovery

- Status: Accepted
- Date: 2026-05-13

## Context

- Power outages are expected to stop the device unless battery backup exists.
- After power returns, the ESP32 may boot faster than the router/Wi-Fi.
- Previous firmware restarted when Wi-Fi was unavailable during boot.
- That could prevent local `loop()` execution, sensor reads, automatic watering decisions, pump shutoff management, and local endpoints from starting.
- Supabase is telemetry/history only and must not control watering.

## Decision

- Wi-Fi is best-effort and must not be required for local watering control.
- ESP32 must continue booting into local-control/offline mode if Wi-Fi is unavailable.
- Firmware must retry Wi-Fi periodically without blocking local control.
- Pump shutoff must be checked before client/server/network/telemetry work.
- Local firmware remains owner of watering decisions and pump shutoff.
- Supabase remains telemetry/history only.
- Hosted dashboard remains read-only and may show stale/no recent data when telemetry stops.
- No-Wi-Fi installations are autonomous/headless for now; installer/customer provisioning through AP/captive portal is deferred.

## Consequences

- Power-return-before-router should no longer cause a reboot loop.
- No-Wi-Fi operation can continue local automatic watering, but local dashboard/manual control require reachable network access.
- Internet/Supabase outages may interrupt telemetry but must not prevent local watering logic.
- Timestamp quality may degrade without NTP/internet.
- Future work should evaluate AP setup mode, captive portal provisioning, stored credentials, status indicators, offline log buffering, and hardware safety protections.
