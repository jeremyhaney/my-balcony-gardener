# ADR 0016: Gen2 Modular Sensor Architecture

- Status: Accepted
- Date: 2026-05-26

## Context

The current MBG system is a Gen1-compatible controller architecture. It uses ESP32 firmware to read the currently installed sensors, own local watering decisions, expose local live/control endpoints, and post history telemetry to Supabase `sensor_logs`.

The canonical `SensorLogRow` contract is intentionally small and stable for current compatibility. It supports the installed/current telemetry path with top-level `device_id`, `timestamp`, and nested `data` fields for temperature, humidity, moisture, optional raw soil ADC evidence, watering evidence, and watering duration/timing. This contract must remain compatible with current Gen1 history, dashboard, and firmware behavior.

Future MBG hardware needs a Gen2 architecture that can support optional and replaceable sensor modules without repeatedly expanding `SensorLogRow.data` with fixed fields for every new sensor. Candidate future measurements include BME280 temperature/humidity/pressure, DS18B20 soil or reservoir temperature, VEML6030 light, reservoir level, flow, pressure, PAR, and additional moisture readings. These measurements need independent discovery, quality, validity, and control eligibility so display telemetry and watering-control inputs do not blur together.

Gen2 also needs a clear hardware and control boundary. GPIO5 has been used in existing work, but it should be retired from future Gen2 relay/pump control designs. I2C SDA/SCL is useful for short local sensor modules, but it is not the long-distance field wiring strategy. Local ESP32 firmware must continue to own watering decisions and pump shutoff, and Supabase must remain telemetry/history/diagnostics storage only.

## Decision

Define Gen1 as the current compatibility architecture centered on the existing local ESP32 control path and the canonical `SensorLogRow` / Supabase `sensor_logs` telemetry history contract.

Define Gen2 as a modular grow-environment platform where sensors, capabilities, and control authority are independently discoverable, optional, and replaceable.

Gen2 sensor modules are independent software components. Each module is responsible for its own sensor detection, read timing, raw-to-measurement conversion, validity, quality, reason reporting, and whether any emitted measurement is eligible for control. A sensor module may represent a physical device, a channel on a physical device, or a logical measurement source.

Each optional Gen2 sensor can be:

- present
- missing
- disabled
- failed
- not installed

Gen2 device behavior must be capability-driven. Firmware and UI behavior should depend on explicitly reported capabilities and measurement metadata, not on assumptions that a named sensor is always installed or working.

Gen2 expanded measurements should eventually use a separate measurement-list/table path, likely `public.sensor_measurements`, instead of adding fixed fields to `SensorLogRow.data` for every future sensor.

The standardized Gen2 measurement record fields are:

- `device_id`
- `measured_at`
- `sensor_key`
- `sensor_type`
- `measurement_name`
- `measurement_value`
- `measurement_unit`
- `valid`
- `quality`
- `reason`
- `control_eligible`
- `details`

Field meanings:

- `valid` means the measurement is structurally usable for its declared purpose at read time. It does not automatically mean the measurement is safe for watering control.
- `quality` is a coarse quality label for interpretation, such as good, degraded, estimated, stale, missing, failed, disabled, or not installed.
- `reason` is a short machine-readable explanation for the current validity or quality state.
- `control_eligible` means the measurement has been explicitly approved as usable by local firmware control logic for the relevant control decision.

Valid for display is not the same as valid for control. A measurement may be useful for history, diagnostics, trend display, or human inspection while still being ineligible for watering decisions.

Watering control may only use measurements explicitly marked `control_eligible`. New sensors such as BME280, DS18B20, VEML6030, reservoir level, flow, pressure, PAR, and additional moisture sensors are not approved to affect watering control until separately validated and explicitly approved.

The legacy `SensorLogRow` / `sensor_logs` path remains stable for Gen1/current compatibility. `SensorLogRow.data` must not keep expanding with fixed fields for every future sensor.

GPIO5 is retired from future Gen2 relay/pump control designs. This does not change the installed balcony unit in this phase.

I2C SDA/SCL is approved as a local short-range sensor-module bus. Long-distance sensing should use separate ESP32 sensor nodes or a future deliberate fieldbus design, such as RS-485/Modbus, after separate evaluation.

Gen2 must continue operating when optional sensors are missing or failed.

Local ESP32 firmware remains the owner of watering decisions and pump shutoff. Supabase command/control and Remote Water Now remain prohibited. Supabase remains telemetry/history/diagnostics storage only and must not become command/control.

## Consequences

- Gen1/current `sensor_logs` compatibility is preserved.
- Expanded Gen2 measurements are separated from the legacy `SensorLogRow` contract.
- Future sensor additions can be modeled as optional modules and measurement records instead of fixed `SensorLogRow.data` fields.
- Display, diagnostics, and control eligibility become separate concepts.
- New sensors can be installed, omitted, disabled, or failed without breaking the Gen2 device model.
- Watering behavior, watering duration, watering threshold, cooldown, moisture mapping, automatic watering logic, Manual Water Now behavior, hosted-readonly behavior, Supabase command/control boundaries, and Gen1 local control safety are unchanged by this ADR.
- No firmware code, frontend runtime behavior, Supabase SQL, `sensor_measurements` table, `SensorLogRow` shape change, or sensor-specific implementation is approved by this ADR.
- Future Gen2 implementation phases must separately validate hardware, measurement storage, display behavior, hosted read-only rendering, calibration, and control eligibility.
