# My Balcony Gardener — Balcony02 As-Built and Commissioning Record

Document version: 1.0  
Commissioning date: August 12, 2026  
Installation: Savannah Balcony / Balcony02  
Status: Phase 8B.1 physical commissioning complete; supervised field prove-out underway

## 1. Closeout Statement

Balcony02 completed installed end-to-end physical commissioning on August 12, 2026. The controller and relay/reservoir enclosures were permanently mounted, their cables dressed and strain-relieved, and the enclosures closed and sealed. All installed sensor paths produced valid readings in the final commissioning batch. The water-level interlock, physical watering button, local relay control, actual pump operation, and 15-second safety cutoff were functionally tested.

This record closes the physical build and initial commissioning stage. It does not claim that moisture calibration, water-level placement, hydraulic delivery, reservoir gallon calibration, watering schedule, or long-term reliability optimization is complete. Those are supervised field prove-out activities that follow commissioning without reopening the construction stage.

## 2. Device Identity

| Field | As-built value |
|---|---|
| Device label | `Balcony02` |
| Device ID | `7e5bd328-ad68-4389-a71a-fa5cd01b3813` |
| Device role | `controller` |
| Firmware version | `phase8b4-gen2-status-contract` |
| PlatformIO build profile | `balcony02-gen2` |
| Control authority | Local ESP32 firmware |
| Hosted control | Disabled/read-only boundary preserved |
| Commissioning IP | `10.0.0.69` |
| Commissioning MAC | `8C:94:DF:90:22:A8` |

## 3. Naming Method

Three identifiers are intentionally kept separate:

1. **Physical marking** — the number or distinguishing mark written on the sensor itself. This follows the component through handling and troubleshooting.
2. **Balcony02 identity** — the stable firmware/telemetry identity. These keys must not be renamed merely because the physical installation location changed.
3. **Customer-facing label** — the actual monitored location or function. This is the name that should appear on ordinary Garden cards, selectors, legends, and reports.

Basket numbering follows the CAD drawing from left to right. Firmware identifiers were assigned left to right among the installed monitored baskets, even where the physical sensor markings could not match the basket number.

## 4. Installed Sensor and Presentation Map

| Actual location | Function | Physical marking | Balcony02 identity | Connection | Customer-facing label |
|---|---|---|---|---|---|
| Basket 1 | Ambient light | `L02` | `sen0562_l01` / L01 | TCA9548A channel 1, address `0x23` | Basket 1 Sunlight |
| Basket 1 | Soil moisture | `M1` | `sen0308_m01` / M01 | ADS1115 A0 | Basket 1 Soil Moisture |
| Basket 3 | Ambient light | `L03` | `sen0562_l02` / L02 | TCA9548A channel 2, address `0x23` | Basket 3 Sunlight |
| Basket 3 | Soil moisture | `M4` | `sen0308_m02` / M02 | ADS1115 A1 | Basket 3 Soil Moisture |
| Basket 3 | Soil temperature | `ST04` | `ds18b20_temperature` / ST | OneWire on GPIO27 | Basket 3 Soil Temperature |
| Basket 6 | Ambient light | `L01` | `sen0562_l03` / L03 | TCA9548A channel 3, address `0x23` | Basket 6 Sunlight |
| Basket 6 | Soil moisture | `M3` | `sen0308_m03` / M03 | ADS1115 A2 | Basket 6 Soil Moisture |
| Near controller / house side | Air temperature, relative humidity, and pressure | Red Sharpie on PCB edges | `bme280_air` | TCA9548A channel 4, address `0x76` | Balcony Air Conditions |
| Reservoir | Minimum usable water interlock | Unlabeled | `sen0204_wl01` / WL01 | GPIO26, HIGH = liquid detected | Reservoir Water Available |

`sen0308_m04` remains intentionally declared `installed:false` on ADS1115 A3. It is not an incomplete installed sensor.

## 5. Final Electrical Topology

| Function | Final assignment |
|---|---|
| Pump relay output | GPIO25, active HIGH |
| Physical watering button | GPIO32, active LOW |
| Reservoir liquid detection | GPIO26, HIGH = liquid detected |
| Soil temperature | GPIO27, OneWire with 4.7 kΩ pull-up |
| I²C SDA | GPIO21 |
| I²C SCL | GPIO22 |
| TCA9548A address | `0x70` |
| ADS1115 address/channel | `0x48`, mux channel 0 |
| BME280 | Mux channel 4, address `0x76` |
| Light sensors | Mux channels 1–3, address `0x23` on each isolated channel |
| Moisture sensors | ADS1115 A0–A2; A3 not installed |

Pump power is switched through the relay's COM and normally-open contacts so the unpowered/default state leaves the pump off. The permanent pump-power extension uses 16 AWG stranded copper conductors with separately sealed adhesive-lined heat-shrink splices. The motor suppression diode remains across the pump-side positive and negative conductors with cathode/striped end toward positive.

## 6. Commissioning Evidence

Final installed measurement batch: `2026-08-12T17:03:41Z`

| Installed measurement | Final value | Result |
|---|---:|---|
| Air temperature | 83.41 °F | Valid / `read_ok` |
| Relative humidity | 75.82% | Valid / `read_ok` |
| Barometric pressure | 1016.89 hPa | Valid / `read_ok` |
| Basket 3 soil temperature | 79.14 °F | Valid / `read_ok` |
| Basket 1 moisture raw ADC | 8,521 counts | Valid diagnostic / `read_ok` |
| Basket 3 moisture raw ADC | 9,357 counts | Valid diagnostic / `read_ok` |
| Basket 6 moisture raw ADC | 9,195 counts | Valid diagnostic / `read_ok` |
| Basket 1 light | 1,609.17 lux | Valid diagnostic / `read_ok` |
| Basket 3 light | 3,700.83 lux | Valid diagnostic / `read_ok` |
| Basket 6 light | 2,521.67 lux | Valid diagnostic / `read_ok` |
| Reservoir liquid detected | 1 / detected | Valid / `read_ok` |

Final status evidence at approximately `2026-08-12T17:03:44Z`:

- Wi-Fi connected at `-53 dBm`.
- Cloud reporting returned HTTP `201 Created`.
- Consecutive cloud failures: `0`.
- Free heap: `233,240` bytes.
- Minimum free heap: `178,772` bytes.
- `can_water:true`, consistent with WL01 detecting liquid.
- A brief startup `auth_expire` disconnect at uptime 6 seconds recovered with IP acquisition at uptime 8 seconds; no ongoing operating fault was present in the captured state.

Functional commissioning also proved:

- Physical button command reaches the local firmware without hosted command authority.
- Relay switches the actual pump.
- Pump moves water through the installed hydraulic path.
- Reservoir liquid present permits watering.
- Reservoir no-liquid state blocks watering, and loss of liquid during watering stops the active cycle.
- Maximum 15-second watering cutoff executed in prior commissioning testing.
- Final closed-enclosure pump test passed.

## 7. Photo Record

Final photograph package: `_support/Photos/Balcony02 - Gen2/B02 Complete.zip`

The August 12 package contains 15 photographs and adequately records:

- Overall completed balcony installation and monitored basket context.
- Closed and mounted Balcony02 controller enclosure.
- Closed relay/reservoir enclosure and reservoir assembly.
- Visible cable, hose, and power routing.
- Basket 1, Basket 3, and Basket 6 sensor placement/context.
- Wide views establishing left-to-right basket position and overall presentation.

Earlier August 7–11 build photographs provide the internal controller layout, board arrangement, cable glands, relay-box construction, and pump-power-splice evidence. The sealed enclosures do not need to be reopened for additional photography.

## 8. Deviations and Resolved Build Issues

- The originally planned 10–12 ft BME280 extension proved unreliable. The sensor was moved near the controller and the cable shortened substantially.
- The original intermittently faulty BME280 board produced impossible historical values near 362 °F and was discarded. The replacement board had not reproduced that failure as of this closeout.
- Physical sensor markings do not match the left-to-right Balcony02 identities in every basket. Section 4 is the authoritative cross-reference.
- The connector board was constructed in a mirrored/upside-down physical orientation. Electrical function is unchanged; service documentation must use the as-built orientation.
- WL01 is installed and functionally proven, but its final elevation remains subject to an optimization check as the reservoir naturally draws down.

## 9. Open Field Prove-Out — Not Construction Punch-List

These items remain active without reopening physical commissioning:

1. Continue the installed stability soak and monitor BME, mux, DS18B20, Wi-Fi, and cloud-post behavior.
2. Determine why soil-temperature measurements are intermittently absent and ensure missing evidence is presented honestly.
3. Evaluate M01–M03 repeatability, dry-down response, manual finger assessment, inexpensive meter comparison, and post-watering behavior.
4. Optimize the WL01 elevation when the reservoir reaches the current cutoff naturally.
5. After level-sensor optimization, fill the reservoir one gallon at a time and mark actual volume levels.
6. Measure cycle drawdown and delivered volume; evaluate hydraulic distribution among containers.
7. Use collected evidence before approving changes to watering schedule, duration, moisture gates, or unattended control behavior.
8. Prevent implausible sensor values from being presented as ordinary trusted measurements while preserving fault evidence.

## 10. Closeout Boundaries

This documentation closeout makes no firmware, SQL/RLS, frontend runtime, pin, sensor, device-ID, watering-duration, cooldown, telemetry-cadence, threshold, moisture-mapping, or control-authority change.

The separate fillable as-built BOM workbook is an inventory and pricing artifact. Incomplete manufacturer, model, serial, supplier, and cost fields do not block this commissioning closeout.

## 11. Related Production Documents

- Fillable as-built BOM: [`MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx`](./MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx)
- Historical proposed plan, superseded for implementation and service use by this record: [`MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md`](./MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md)
