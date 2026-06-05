# MBG Balcony02 Buildout Wiring Plan v0.1

Status: PROPOSED / NOT AS-BUILT / NOT IMPLEMENTED

Date: 2026-06-04

Phase: Phase 7M - Sensor Upgrade Decision Matrix and Balcony02 Build-Out Plan

## Purpose

This artifact captures proposed Balcony02 wiring logic so Phase 7M can identify hardware needs before physical build work begins.

This is not an as-built wiring document. It does not change Balcony01, the current Gen2 production workbook, firmware, SQL/RLS, frontend runtime behavior, device registry, provisioning, dashboard selectors, watering behavior, or `control_eligible`.

## Proposed Planning-Level GPIO / Bus Allocation

Phase 7M proposes a Balcony02 GPIO, bus, mux, ADC, and wiring topology for review. These assignments are planning-level only and are not implemented in firmware or current as-built wiring docs.

| Pin / GPIO | Planning-level allocation | Phase 7M note |
| --- | --- | --- |
| GPIO25 | Future relay/pump output | Preserves the existing Gen2 relay/pump convention. Not implemented or changed in Phase 7M. |
| GPIO21 | I2C SDA | Proposed ESP32 main I2C bus SDA. |
| GPIO22 | I2C SCL | Proposed ESP32 main I2C bus SCL. |
| GPIO27 | DS18B20 / OneWire convention | Reserved if soil or reservoir temperature is included later. |
| GPIO26 | DHT / non-I2C auxiliary convention | Reserved unless needed by a later approved design. |
| GPIO32 | Momentary hold-to-water/test switch input candidate | Proposed planning candidate only, subject to later firmware and wiring approval. |
| GPIO34 | Existing primary analog moisture convention | Not sufficient by itself for 2-3 SEN0308 sensors. |

## Proposed Balcony02 Sensor Package

| Proposed item | Quantity | Purpose | Planning status |
| --- | --- | --- | --- |
| DFRobot SEN0562 IP68 I2C ambient light | 3 | Balcony light mapping across multiple exposure positions | Proposed / not installed |
| DFRobot SEN0308 waterproof capacitive moisture | 2-3 | Moisture comparison, wetting response, and dry-down mapping | Proposed / not installed |
| BME280 or BME-style environmental sensor | 1 | Air temperature, humidity, and pressure context | Proposed / not installed |
| Physical momentary hold-to-water/test switch | 1 | Future local hold-to-run manual test input | Requirements/planning only |
| Relay/pump output path | Future | Local watering hardware only after approval | Deferred |

No proposed item is control-approved in Phase 7M.

## Proposed I2C Topology

Baseline:

- ESP32 GPIO21 is the proposed I2C SDA source.
- ESP32 GPIO22 is the proposed I2C SCL source.
- ESP32 GPIO21/GPIO22 main I2C bus should support a TCA9548A-style I2C multiplexer for the three SEN0562 light sensors if fixed-address conflicts exist.
- I2C remains short-range local sensor-module wiring unless a later fieldbus strategy is approved.
- Outdoor cable length, routing, shielding, waterproof transitions, and connector behavior must be validated before field installation.

Three SEN0562 light sensors may require an I2C multiplexer if the modules share a fixed I2C address. The likely planning part class is:

- TCA9548A or equivalent I2C multiplexer.

Candidate topology:

| Bus segment | Proposed device(s) | Notes |
| --- | --- | --- |
| ESP32 GPIO21/GPIO22 main I2C | TCA9548A I2C multiplexer | Recommended if SEN0562 addresses conflict. |
| Mux channel 0 | SEN0562 light sensor, position A | Candidate sun/exposure position. |
| Mux channel 1 | SEN0562 light sensor, position B | Candidate partial-shade/intermediate position. |
| Mux channel 2 | SEN0562 light sensor, position C | Candidate shaded/reference position. |
| Direct I2C or mux channel 3 | BME280 / BME-style sensor | Direct or muxed depending on final address/topology and physical routing. |

Planning concerns:

- Confirm each SEN0562 operating voltage and I2C pull-up expectations by datasheet.
- Confirm BME sensor address and voltage.
- Mount the BME280/BME-style sensor shaded, vented, and weather-protected, not trapped inside a warm sealed electronics box.
- Avoid long unprotected I2C runs.
- Consider connectorized branches from an internal mux board to each light sensor cable gland.
- Keep cable labels tied to physical position, not just sensor model.

## Proposed Analog Moisture Topology

The proposed Balcony02 package uses 2-3 SEN0308 analog moisture sensors. A single GPIO34 input is not enough for simultaneous multi-sensor comparison.

Preferred strategy:

- Use an external ADC such as ADS1115 or ADS1015 for multiple SEN0308 channels, preferably mounted inside the enclosure and connected over I2C.
- Prefer this over consuming several ESP32 ADC pins because it is cleaner, more expandable, easier to document as a repeatable multi-sensor topology, and avoids ADC2/Wi-Fi issues.
- Preserve per-sensor raw ADC evidence in any later firmware implementation.

Alternative strategy:

- Use ESP32 ADC1-capable input pins only if an external ADC is not selected.
- Avoid ESP32 ADC2 pins for Wi-Fi-era moisture sensing.
- Avoid using pins already reserved by the Gen2 baseline, including relay/pump, I2C, DHT/auxiliary digital, and OneWire conventions.

Candidate topology:

| Analog source | Preferred destination | Purpose |
| --- | --- | --- |
| SEN0308 moisture sensor A | ADS1115/ADS1015 channel 0 | Direct comparison to current-style placement. |
| SEN0308 moisture sensor B | ADS1115/ADS1015 channel 1 | Alternate depth/location wetting response. |
| SEN0308 moisture sensor C | ADS1115/ADS1015 channel 2 | Optional dry-down mapping or second container position. |
| External ADC I2C interface | ESP32 GPIO21/GPIO22, direct or behind mux depending topology | Requires address/topology review with SEN0562 and BME devices. |

Planning concerns:

- Confirm SEN0308 output range and supply voltage.
- Confirm external ADC input range relative to sensor output.
- Confirm shared ground and noise behavior near pump/relay wiring.
- Record raw readings per sensor; do not collapse sensors into one generic moisture value.
- Do not mark any SEN0308 measurement `control_eligible` until later evidence and approval.

## Proposed Momentary Switch Topology

Switch requirements:

- Momentary pushbutton.
- Normally-open contact preferred.
- Hold-to-run human interaction.
- Outdoor/weather-rated panel or enclosure mount.
- Wet-finger and light-glove usable.
- Mounted for local access without accidental activation.

Planning-level electrical strategy:

- GPIO32 is a proposed planning candidate for the normally-open physical hold-to-water/test switch input, subject to later firmware and wiring approval.
- Pull-up or pull-down strategy should be documented in the later implementation design.
- Normally-open wiring can be designed as active-low with pull-up or active-high with pull-down; final choice should match noise, cable length, and firmware debounce design.
- Include serviceable connector and strain relief.

Future firmware requirements:

- Debounce the input.
- Run pump only while the physical input is held.
- Log start/stop evidence.
- Enforce a hard failsafe maximum runtime if the input remains active.
- Keep pump shutoff as first-priority firmware logic.

Phase 7M does not implement the switch in firmware, does not wire it physically, and does not grant pump authority.

## Power And Connector Planning

Power assumptions requiring datasheet confirmation:

- Confirm whether each SEN0562, SEN0308, BME sensor, ADC, and I2C mux should be powered from 3.3V or 5V.
- Preserve ESP32-safe signal levels.
- Use common ground across ESP32, sensors, ADC/mux modules, and any relay-control interface.
- Keep pump power and sensor signal wiring physically organized to reduce noise and service confusion.

Hardware planning needs:

- TCA9548A or equivalent I2C multiplexer if SEN0562 addresses conflict.
- ADS1115 or ADS1015 external ADC for multiple SEN0308 sensors.
- Weatherproof enclosure capacity for ESP32, mux, ADC, terminal blocks, and power distribution.
- Cable glands or sealed bulkhead connectors for each external sensor/switch run.
- Serviceable connectors for each light sensor, moisture sensor, BME sensor, and switch.
- Strain relief for all outdoor cable entries.
- Clear field labels for position, sensor type, and channel.
- 3.3V/5V distribution decision after datasheet confirmation.
- Common-ground distribution point.
- Spare connector positions for later service or sensor swap.

## Physical Placement Strategy

Light sensors:

- Position A: high/direct-sun candidate exposure.
- Position B: partial-shade/intermediate exposure.
- Position C: shaded/reference or plant-canopy-adjacent exposure.
- Mount so water, dirt, and shadows from the enclosure do not dominate readings.

Moisture sensors:

- Sensor A: comparable placement to current Balcony01-style moisture location.
- Sensor B: alternate depth or container location for wetting-response comparison.
- Sensor C: optional second comparison point for dry-down mapping or sensor-to-sensor variation.
- Record depth, orientation, container location, soil contact, and any movement.

BME sensor:

- Mount in shaded, vented, weather-protected air.
- Do not mount inside a warm sealed electronics box.
- Avoid direct rain and direct sun.

Momentary switch:

- Mount where a person can intentionally hold it while observing the unit.
- Avoid locations where brushing, carrying, rain cover movement, or cable handling could activate it.
- Label as local test/hold-to-water when implemented later.

## Evidence To Preserve In Later Implementation

Later firmware and capture work should preserve:

- Per-sensor identity or channel.
- Raw ADC evidence for every SEN0308 channel.
- Mapped moisture values only after mapping is explicitly designed.
- Light sensor position identity.
- I2C mux channel and device address evidence where practical.
- BME physical mounting notes.
- Switch start/stop event evidence if implemented later.
- Sensor movement, cleaning, replacement, connector changes, and placement notes through operational events or equivalent field notes.

## Boundary Notes

- This wiring plan is proposed only.
- This plan is not as-built.
- This plan is not implemented.
- This plan does not change Balcony01.
- This plan does not modify the current Gen2 production wiring workbook.
- This plan does not assign Balcony02 UUID, build profile, registry entry, dashboard identity, or firmware profile.
- This plan does not implement firmware.
- This plan does not implement SQL/RLS.
- This plan does not implement frontend runtime behavior.
- This plan does not approve new watering control authority.
- This plan does not change `control_eligible`.
- This plan does not claim calibration.
- This plan does not approve physical installation.
- This plan does not approve alerting or dry-run protection.
- This plan does not approve hosted dashboard command/control.
- Supabase remains telemetry/history/diagnostics only.

## Review Questions Before Build Approval

- Do the SEN0562 sensors share a fixed I2C address?
- Should the BME sensor sit direct on I2C or behind the mux?
- Is ADS1115 or ADS1015 preferred for SEN0308 comparison sampling?
- Which enclosure size supports ESP32, mux, ADC, connectors, and future service access?
- How many enclosure penetrations are acceptable before a junction box or connector panel is needed?
- Which connector family is practical for repeated outdoor service?
- Which switch size and mounting style best balances usability and accidental-press resistance?
- Are 3 light positions and 2-3 moisture positions physically achievable without excessive cable exposure?
