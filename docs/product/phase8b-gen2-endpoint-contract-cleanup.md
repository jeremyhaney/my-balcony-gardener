# Phase 8B Gen2 Endpoint Contract Cleanup

- Phase 8B `/measurements` slice: COMPLETE / END-TO-END VALIDATED
- Phase 8B `/capabilities` slice: COMPLETE / LIVE DEVICE VALIDATED
- Phase 8B `/status` slice: COMPLETE / LIVE DEVICE, CLOUD, AND HOSTED-DIAGNOSTICS VALIDATED
- Phase 8B overall endpoint cleanup: COMPLETE
- Phase 8B parent: COMPLETE
- Phase 8B.5 Gen2 Endpoint Integration and Closeout: COMPLETE / PRODUCTION VALIDATED
- Phase 8B.6 Hosted Short History Window Expansion: COMPLETE / PRODUCTION VALIDATED
- Phase 8B.6 closeout date: 2026-07-20
- Date: 2026-07-18
- Device profile under primary validation: `balcony02-gen2`
- Device label: `Balcony02`
- Device UUID: `7e5bd328-ad68-4389-a71a-fa5cd01b3813`
- Firmware version: `phase8b4-gen2-status-contract`
- Governing ADR: [`0022-gen2-endpoint-responsibility-and-contract-cleanup.md`](../adr/0022-gen2-endpoint-responsibility-and-contract-cleanup.md)

## Purpose

This document freezes the approved external contracts and coordinated cloud/frontend semantics for the completed Gen2 endpoint cleanup.

The `/measurements`, `/capabilities`, and `/status` contracts are implemented and validated at their recorded evidence levels. The Phase 8B.5 integrated hosted frontend closeout is complete, deployed, and production validated.

It is the implementation specification for this phase. It does not authorize unrelated refactoring, pin changes, sensor changes, timing changes, watering changes, or control-policy changes.

## `/measurements` production closeout — 2026-07-16

Implementation commits `b17bf1a` (`Document Gen2 endpoint contract cleanup`) and `2096394` (`Implement Gen2 measurement contract cleanup`) were pushed to `main`.

Cloudflare Pages deployed the hosted frontend. Before the coordinated Supabase migration was applied, the hosted frontend temporarily could not query measurements. After Jeremy manually applied [`phase8b-measurement-contract-cleanup.sql`](../sql/phase8b-measurement-contract-cleanup.sql) through the Supabase SQL Editor on 2026-07-16, the hosted Support View recovered and displayed current data normally. This was the expected contract deployment boundary, not a defect.

The applied schema preserves the append-only `sensor_measurement_batches` table, `schema_version:1`, and all base measurement-table columns. `sensor_measurements_flat` derives `device_id` and `measured_at` from the batch, exposes `physical_sensor_id`, prefers the top-level value, and falls back to historical `details.physical_sensor_id`. Privileged flat evidence retains historical `details` and `control_eligible`; hosted-safe public, customer, and support views expose `physical_sensor_id` but not `details` or `control_eligible`. Existing read-only customer/support boundaries remain intact, and no Supabase command/control was introduced.

All four PlatformIO environments built successfully: `balcony02-gen2`, `bench-proto-gen2`, `balcony-installed-gen2`, and `balcony-sensor-scout-01`. Only `balcony02-gen2` was uploaded. The validated unit was `Balcony02`, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, firmware `phase8b-balcony02-proveout`, build profile `balcony02-gen2`, on `COM5` at `10.0.0.69`.

Normal boot detected the BME280 and one DS18B20, initialized WL01 on GPIO26 as `INPUT`, reported SEN0562-L01 missing and SEN0562-L02/L03 detected, enabled the active-low GPIO32 physical button with 50 ms debounce and 15000 ms maximum hold, connected Wi-Fi, and started the web server without a reboot loop.

The PowerShell validator passed every `/measurements` assertion against `http://10.0.0.69`. The exact 11-record order is:

1. `bme280_air` / `air_temperature`
2. `bme280_air` / `relative_humidity`
3. `bme280_air` / `barometric_pressure`
4. `ds18b20_temperature` / `soil temp`
5. `sen0308_m01` / `raw_adc`
6. `sen0308_m02` / `raw_adc`
7. `sen0308_m03` / `raw_adc`
8. `sen0562_l01` / `ambient_light`
9. `sen0562_l02` / `ambient_light`
10. `sen0562_l03` / `ambient_light`
11. `sen0204_wl01` / `reservoir_liquid_detected`

M04 emits no measurement. New records contain only `sensor_key`, `sensor_type`, optional `physical_sensor_id`, `measurement_name`, `measurement_value`, `measurement_unit`, `valid`, `quality`, and `reason`. They omit record-level `device_id`, record-level `measured_at`, `details`, `control_eligible`, null `physical_sensor_id`, and empty details objects. Physical IDs `SEN0308-M01`, `SEN0308-M02`, `SEN0308-M03`, `SEN0562-L01`, `SEN0562-L02`, `SEN0562-L03`, and `WL01` were validated; BME280 and DS18B20 omit `physical_sensor_id`.

SEN0562-L01 remains explicit missing evidence: `measurement_value:null`, `valid:false`, `quality:missing`, `reason:sensor_not_detected_on_selected_channel`, and `physical_sensor_id:SEN0562-L01`. It is not healthy and is not classified as uninstalled.

Repeated 15-minute production batches were stored at `2026-07-16 16:16:58+00`, `2026-07-16 16:31:58+00`, and `2026-07-16 16:46:58+00`. Each recorded firmware `phase8b-balcony02-proveout`, build profile `balcony02-gen2`, and `record_count:11`. The following heartbeat reported `last_supabase_http_status:201`, `consecutive_supabase_failures:0`, and `last_supabase_error_category:none`.

Hosted validation passed: current Balcony02 samples displayed; Soil Temperature appeared as one card; historical DS18B20 `temperature` compatibility worked; air temperature, humidity, and pressure displayed normally; hosted views loaded without errors; watering history remained read-only; no Water Now control appeared; and no hosted local-device control or Supabase command/control was introduced.

Deferred beyond this slice are merging or hiding legacy `reservoir_liquid_state`; making `reservoir_liquid_detected` the canonical new name; an obvious hosted warning when liquid is not detected; final M01/M02/M03 and L01/L02/L03 customer/support card presentation; local browser UI retirement; and remaining local Water Now retirement.

WL01 semantics remain unchanged: HIGH means liquid detected, LOW means liquid not detected, LOW blocks watering, and a HIGH-to-LOW transition during watering stops the relay.

## `/capabilities` live-device closeout — 2026-07-16

Phase 8B.3 Gen2 `/capabilities` Static Contract Cleanup is COMPLETE / LIVE DEVICE VALIDATED. At this 2026-07-16 checkpoint, Phase 8B remained IN PROGRESS; Phase 8B.4 `/status` Nested Diagnostics Contract Cleanup was next, and Phase 8B.5 integrated endpoint closeout remained planned.

All four Gen2 profiles built successfully: `balcony02-gen2`, `bench-proto-gen2`, `balcony-installed-gen2`, and `balcony-sensor-scout-01`. Only Balcony02 was uploaded. Live validation used label `Balcony02`, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, firmware `phase8b-balcony02-proveout`, profile `balcony02-gen2`, and IP `10.0.0.69`.

The exact cleaned response is isolated to `balcony02-gen2`; existing non-Balcony02 capability behavior remains unchanged. Balcony02 `/capabilities` is a static configured-hardware and control-feature response whose installed values come from existing compile-time/profile flags. Its request path performs no sensor reads, GPIO reads, I2C scans, mux scans, detection probes, or provider conversions.

The live response contained exactly ten modules in this order:

1. `bme280_air`
2. `ds18b20_temperature`
3. `sen0308_m01`
4. `sen0308_m02`
5. `sen0308_m03`
6. `sen0308_m04`
7. `sen0562_l01`
8. `sen0562_l02`
9. `sen0562_l03`
10. `sen0204_wl01`

M04 was configured with `installed:false`. L01 remained `installed:true` independently of current live detection. WL01 was the only module with `control_role:"watering_interlock"`. Two live responses were identical after normalizing only `reported_at`, and the validator ended with `All /measurements and /capabilities contract assertions passed.`

The frozen `/measurements` contract remained unchanged and passed regression validation. At this checkpoint, `/status` remained unchanged and was deferred to Phase 8B.4. No frontend, SQL, Supabase, Cloudflare, pin, sensor, watering, cadence, threshold, duration, cooldown, relay, button, or interlock behavior changed.

## /status live-device, cloud, and hosted-diagnostics closeout — 2026-07-17

Phase 8B.4 is COMPLETE / LIVE DEVICE, CLOUD, AND HOSTED-DIAGNOSTICS VALIDATED. At this checkpoint, Phase 8B.5 had not yet begun; its later integrated hosted frontend closeout is recorded below.

Firmware `phase8b4-gen2-status-contract` built successfully in all seven environments: `esp32doit-devkit-v1`, `balcony-installed`, `balcony-installed-gen2`, `bench-prototype`, `bench-proto-gen2`, `balcony02-gen2`, and `balcony-sensor-scout-01`. The firmware version applies to all four Gen2 profiles (`balcony-installed-gen2`, `bench-proto-gen2`, `balcony02-gen2`, and `balcony-sensor-scout-01`); Gen1 behavior remains unchanged.

Primary validation used Balcony02, UUID `7e5bd328-ad68-4389-a71a-fa5cd01b3813`, role `controller`, profile `balcony02-gen2`, IP `10.0.0.69`, on `COM5`. Prototype01, UUID `318fab98-89ad-4f36-9100-3134a04e0be5`, role `bench`, profile `bench-proto-gen2`, passed status-only validation. The validator added parse-only mode, `-StatusOnly`, expected identity/provenance parameters, exact property-order assertions, code/label consistency checks, null-semantics checks, nonnegative uptime checks, and recursive forbidden-field checks. Both the Balcony02 full validator and Prototype01 status-only validator ended with `All requested Gen2 endpoint contract assertions passed.`

The current Balcony02 boot detected the BME280, reported a DS18B20 device count of `1`, initialized SEN0204 WL01 on GPIO26 as `INPUT`, detected SEN0562-L01, SEN0562-L02, and SEN0562-L03, enabled the GPIO32 physical button as active-low with `50 ms` debounce and `15000 ms` maximum hold, connected Wi-Fi, and started the web server. The full `/measurements` validator separately confirmed working SEN0308 M01, M02, and M03 measurement records. L01 was repaired on 2026-07-17 by replacing its bad connector; the distribution board was not at fault. The Phase 8B.2 L01-missing observations above remain correct historical evidence.

The live response passed its exact top-level order and exact nested `network`, `cloud_reporting`, `watering`, and `system` order. Cold-boot evidence reported `last_http_status:null` with `last_http_status_label:"not_recorded"`, null measurement-success and status-success timestamp/uptime pairs, `currently_watering:false`, `active_trigger_source:null`, `last_watering_at:null`, and `last_watering_duration_seconds:null`. Network evidence showed connected status code `3`, one startup disconnect with reason code `2` / `auth_expire`, one IP acquisition, zero lightweight reconnect attempts, zero full-recovery attempts, and activity `ip_acquired`. This closeout does not claim a forced disconnected state, a nonzero reconnect, or a full-recovery test.

At local uptime `1709`, the response retained the last successful measurement post at `2026-07-17T23:07:39Z`, uptime `905`, separately from the last successful status post at `2026-07-17T23:07:41Z`, uptime `907`. The raw heartbeat at `2026-07-17 23:22:38.285407+00`, uptime `1802`, recorded the next measurement success at `2026-07-17T23:22:36Z`, uptime `1802`, while carrying the prior status success at `2026-07-17T23:07:41Z`, uptime `907`. HTTP result was `201` / `created`, consecutive failures were `0`, and error category was `none`. This proves measurement and status success evidence remain separate, watering does not become a measurement success, and a heartbeat does not self-claim a successful status post. No failed-cloud-post test is claimed.

WL01 reported value `1`, valid, `good`, and `read_ok`. Active physical-button watering reported `active_trigger_source:physical_button` and retained last-watering time and duration; idle status returned a null active trigger while preserving the last completed watering evidence. The six current-firmware/current-profile event rows were: start `2026-07-17T22:53:58+00:00` (`physical_button`, `physical_button_pressed`, null duration), completion `22:54:09` (`physical_button`, `physical_button_released`, `11` seconds), start `22:55:31` (`physical_button`, null duration), completion `22:55:39` (`physical_button`, `7` seconds), start `22:57:24` (`physical_button`, null duration), and completion `22:57:35` (`physical_button`, `11` seconds). All reported `Balcony02`, firmware `phase8b4-gen2-status-contract`, and profile `balcony02-gen2`.

The latest raw heartbeat carried current firmware/profile, uptime `1802`, reason `periodic`, RSSI `-47`, HTTP `201` / `created`, zero failures, error `none`, idle watering with a null trigger, last watering at `2026-07-17T22:57:24Z` for `11` seconds, free heap `232720`, minimum free heap `176876`, and `details:{}`. Hosted normalized diagnostics matched the raw heartbeat for the contract fields while excluding local IP and MAC. This is a data-contract validation; no new hosted browser review is claimed.

This firmware/runtime checkpoint made no further changes to the already-applied Phase 8B.4 SQL/frontend contract: the base columns, normalized output columns, hosted-view joins, filters, grants, RLS boundaries, and historical fallbacks remained unchanged during this checkpoint. It also changed no pin, sensor assignment, GPIO mode/polarity, I2C/mux topology, threshold, duration, cooldown, cadence, relay, button, reservoir interlock, local firmware watering ownership, or Gen1 endpoint contract. No automatic SEN0308 watering, Supabase command/control, hosted Water Now, or hosted IP/MAC exposure was introduced.

## Phase 8B.5 integrated hosted frontend closeout — 2026-07-18

Phase 8B.5 is COMPLETE / PRODUCTION VALIDATED. Final frontend commits `a291be6` (`Refine hosted readings and restore multi-axis trends`) and `a8b282e` (`Polish hosted trend colors and watering labels`) were pushed to `main`, deployed through the established production path, and visually validated in production on 2026-07-18.

### Final Garden Readings presentation

The main title is `Garden Readings`, visible freshness wording uses `Latest reading`, and no customer-visible package terminology remains. The visible sections are Light, Air, Water, and Soil in that order. The frozen eleven cards remain Light L01, Light L02, Light L03, Air Temperature, Humidity, Atmospheric Pressure, Reservoir Water, Moisture M01, Moisture M02, Moisture M03, and Soil Temperature. Device selection remains before the interpretation path and Window remains within the chart. No chart disclaimer or light-level interpretation labels were added.

### Quality and diagnostics

`Garden Reading Quality` and `MBG Diagnostics` remain separate evidence contracts whose closed hosted controls share a stable `240px × 58px` silhouette. Quality reports Reading Age, Sensor Availability, Reading History, and Latest Reading Checks. Diagnostics reports Device Reporting, Wi-Fi Connection, and Hosted Reporting. Their calculations were neither merged nor changed, and legacy/local generic control styling was not changed.

### Final chart interaction and identity

The chart exposes exactly ten independent native checkbox controls in descriptor order: Light L01, Light L02, Light L03, Moisture M01, Moisture M02, Moisture M03, Air Temperature, Soil Temperature, Humidity, and Atmospheric Pressure. Five non-exclusive family shortcuts appear in Light, Moisture, Temperature, Humidity, and Pressure order; partial families expose a mixed state. Air Temperature and Humidity are selected by default, no selection maximum is imposed, and arbitrary incoming measurements cannot create controls. Reservoir Water and Raw ADC are not customer chart series.

Selections persist across row refreshes, Window and Device changes, temporary evidence loss, and in-place query changes; a full route reload restores the defaults. Selected unavailable readings stay selected and are reported factually. Compound physical-series keys keep L01/L02/L03 and M01/M02/M03 independent. DS18B20 uses canonical `soil temp` with historical `temperature` compatibility only for that sensor. Strict filtering excludes invalid, failed, missing, unavailable, stale-quality, profile-not-installed, sensor-not-detected, and non-finite evidence. Numeric timestamps merge equivalent instants, duplicate choice is deterministic, tooltips use actual prepared units, and legends use friendly labels.

### Unit-driven axes

Axis assignment is driven by the actual normalized prepared unit. `F` is shared by Air Temperature and Soil Temperature; `%` is used by Humidity; `index` is shared by Moisture M01/M02/M03; `hPa` is used by Atmospheric Pressure; and `lux` is shared by Light L01/L02/L03. Unsupported or missing units are omitted rather than plotted against a misleading axis. The first present unit axis appears on the left and additional unit axes appear on the right. Multiple families and units can be viewed simultaneously, with local horizontal scrolling when required instead of page-level overflow. Window remains inside the chart.

### Relative Moisture Index

M01, M02, and M03 independently derive `90 * (14820 - raw_adc) / (14820 - 11230)`. Chart values remain internally unrounded and unclamped, and domains may expand below `0` or above `100`. Raw ADC remains supporting evidence, is not presented as a percent, and grants no watering authority.

### Chart polish and watering markers

All ten customer-chart series have unique stable colors; each series color drives its checkbox/control, line, and legend identity while axis colors remain independent and unit-based. Selection behavior did not change with this polish.

The existing maximum of six watering markers remains. Marker timestamps, wording, and blue dashed lines are unchanged. Labels sort deterministically by watering timestamp with event ID as the tie-breaker, and closely spaced labels are assigned reusable vertical lanes. Chart top margin grows with lane count; marker lines are never shifted horizontally. Production screenshots showed separated labels on populated 24-hour and 7-day charts. This is production visual evidence, not a claim of formal automated production rectangle-intersection proof.

### Validation and production evidence

ESLint, TypeScript/Vite production builds, and `git diff --check` passed. Local hosted-readonly review covered approximately `360`, `460`, `820`, and `1280` pixels. Production visual review confirmed Light/Air/Water/Soil, `Latest reading`, equal Quality and Diagnostics controls, ten series controls, five family shortcuts, mixed-family selection, simultaneous five-unit axes, unique series colors, actual tooltip units, friendly legends, separated watering labels on populated 24-hour and 7-day charts, no page-level horizontal overflow, and no hosted Water Now.

### Unchanged boundaries

Phase 8B.5 made no firmware modification or upload; no SQL, schema, Supabase, pin, sensor assignment, I2C/mux topology, threshold, cadence, duration, cooldown, watering-policy, control-authority, hosted command/control, Water Now, or Gen1 behavior change. Local firmware remains the watering authority. The recent mux/I2C interruption was neither resolved nor investigated by this phase.

## Phase 8B.6 hosted short history window closeout — 2026-07-20

Phase 8B.6 Hosted Short History Window Expansion is COMPLETE / PRODUCTION VALIDATED. Implementation commit `9b8eb0f` (`Add short hosted history windows`) was pushed to `main`, deployed through the established production path, and visually confirmed by Jeremy on 2026-07-20.

### Implementation

The shared Window contract gained `3h`, `6h`, and `12h` without duplicating hosted-only definitions. Query limits are `25`, `50`, and `100`. Existing parsing, URL update, `pushState`/`popstate`, timestamp-query, sorting, pagination, and longer-window limits remain unchanged. Missing, empty, malformed, case-mismatched, or otherwise invalid Window values still fall back internally to `24h`; valid Device and Window state survives refresh, each control preserves the other, and Back/Forward retains the existing URL-state behavior. Local-clock subtraction followed by ISO conversion remains intentional, and `all` applies no lower timestamp bound.

### Final Window contract

Exact keys are `3h`, `6h`, `12h`, `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`. Visible order is `3 hours`, `6 hours`, `12 hours`, `24 hours`, `7 days`, `1 month`, `3 months`, `6 months`, `1 year`, and `all-time`. `24h` remains the default, and every existing longer Window remains unchanged.

Hosted Gen2 `3h`, `6h`, and `12h` chart ticks use local hour/minute labels; `24h` and longer retain the existing hosted month/day/hour format. The legacy/shared chart uses time-only labels for `3h`, `6h`, `12h`, and `24h`, month/day/hour for `7d`, and month/day for `1m`, `3m`, `6m`, `1y`, and `all`. Tooltip timestamps retain full date/time. No chart series, physical-series identity, family shortcut, Air Temperature plus Humidity default, Y axis/domain, color, line, time-domain, horizontal-scrolling, watering-marker, watering-label, or label-lane behavior changed.

### Expected package and health behavior

At the unchanged normal 15-minute cadence, expected counts are `3h = 12`, `6h = 24`, `12h = 48`, `24h = 96`, and `7d = 672`; `all` has no expected count. No endpoint-inclusive extra sample is added. Hosted Gen2 coverage counts unique `measured_at` report packages rather than flattened measurement rows. The existing greater-than-45-minute gap predicate now applies exactly to `3h`, `6h`, `12h`, `24h`, and `7d`; longer Windows remain excluded. Freshness remains 45 minutes and the coverage-warning threshold remains 70%.

### Local and hosted-readonly validation

Shared/local-default validation on `/demo`, `/mygarden`, `/app`, and `/support` confirmed exact selector order, `24h` fallback/default, valid Window URL and refresh behavior, Device/Window preservation, Back/Forward behavior, expected counts, short query limits, and local-clock subtraction followed by ISO conversion. Those local history queries legitimately returned no rows, so legacy ticks and tooltips were not visually exercised; no Phase 8B.6 defect was found.

A process-scoped, nonpersistent `hosted-readonly` launch changed no `.env`, package, Vite, endpoint, or persistent environment setting and validated public `/demo`. Observed results were `3h = 12 of 12`, `6h = 24 of 24`, `12h = 48 of 48`, `24h = 96 of 96`, `7d = 672 of 672`, and `all` with no expected count or lower bound. The sampled 3-hour response contained 60 flattened rows and 12 unique `measured_at` packages; the UI correctly displayed `12 of 12`. Observed labels included `09:19 AM` for short time-only ticks, `Jul 19, 1 PM` for existing longer-window formatting, and `Jul 20, 2026, 09:34 AM` for the full tooltip timestamp.

At approximately 360, 460, 820, and 1280 pixels, validation found no page-level horizontal overflow, kept all ten options usable, kept Device outside the chart and Window with chart controls, and confirmed chart-local scrolling at narrow widths. No local ESP32 request, Water Now control, JavaScript exception, or failed hosted request occurred. The natural largest gap was 15 minutes, so a positive greater-than-45-minute warning case was not naturally available and was not generated.

### Deployed production confirmation

Jeremy visually confirmed the deployed production site after commit `9b8eb0f`. The evidence showed the full ten-option selector including `3 hours`, `6 hours`, and `12 hours`; `12 hours` selected; time-only short-window labels; the populated existing hosted Gen2 multi-axis chart; an existing watering-history marker; and no reviewed chart-area visual regression. The tested `3h`, `6h`, `12h`, `24h`, `7d`, and `all` behavior was validated locally in hosted-readonly mode; production confirmation does not claim every authenticated route or every Window was separately exercised there.

### Preserved boundaries

Phase 8B.6 changed no firmware, PlatformIO profile, endpoint payload or frozen `/measurements`, `/capabilities`, or `/status` contract, SQL/schema/table/view/RLS/grant, Supabase command/control, Cloudflare or environment configuration, device identity, sensor, pin, I2C/mux topology, threshold, duration, cooldown, sampling or telemetry cadence, relay, physical button, reservoir interlock, automatic watering authority, local firmware ownership, hosted command/control, Water Now availability, card presentation, Garden Reading Quality, MBG Diagnostics, or chart-series/axis contract. It did not investigate mux behavior or remove Gen1.

Subsequent presentation clarification, 2026-08-28: Garden Reading Quality now labels history-only coverage/gap findings as `History Gap` and `Worth Noting` when the latest readings are current and usable. Findings involving current freshness, availability, validity, usability, timestamps, or no data retain `Needs Attention`. The existing greater-than-45-minute gap predicate, 70% coverage threshold, evidence calculations, and read-only boundary are unchanged.

### Validation limitations

Authenticated customer/support routes were not bypassed or fabricated. `/mygarden`, `/app`, and `/support` remained properly authentication-gated, so protected authenticated watering queries were not independently exercised. No naturally occurring greater-than-45-minute hosted gap was available. These limitations are not discovered Phase 8B.6 defects.

The initial broad generated-bundle scan surfaced pre-existing local/Gen1 chunks containing local-control strings; review classified them as a pre-existing Gen1 condition, not code introduced by Phase 8B.6. No unrelated Gen1, route, build-configuration, or generated-bundle cleanup was pulled into this slice.

## Locked implementation boundaries

Do not change:

- hardware pins;
- installed sensors;
- installed sensor assignments;
- electrical values;
- I2C or provider channels;
- GPIO modes or polarity;
- watering thresholds;
- watering duration;
- cooldown behavior;
- control cadence;
- pump-interlock behavior;
- current variable names except coordinated external JSON contract names;
- unchanged code comments;
- local firmware ownership of watering;
- hosted read-only behavior.

Do not introduce automatic SEN0308 watering.

Do not use `device_role` as a control gate.

## Endpoint responsibility matrix

| Endpoint | Responsibility | Must not contain or perform |
| --- | --- | --- |
| `/measurements` | Sensor observations at one measurement time | Static wiring, pinout, inventory health claims, control authority, installed/uninstalled slots, prove-out notes, nested diagnostics |
| `/capabilities` | Static configured/installed/intended firmware manifest | Sensor reads, GPIO health reads, I2C scans, mux scans, live detection, provider conversions, prove-out health fields |
| `/status` | Current runtime operation and recovery evidence | Environmental measurements, configured inventory, static pinout, mux configuration, permanent watering authority, historical prove-out notes |

# `/measurements` contract

## Top-level envelope

The top-level envelope remains:

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "measured_at": "2026-07-15T21:45:00Z",
  "records": []
}
```

The envelope is the only authority for batch device identity and batch measurement time.

## Record shape

Every new measurement record uses this ordered logical shape:

```json
{
  "sensor_key": "...",
  "sensor_type": "...",
  "physical_sensor_id": "...",
  "measurement_name": "...",
  "measurement_value": 0,
  "measurement_unit": "...",
  "valid": true,
  "quality": "good",
  "reason": "read_ok"
}
```

`physical_sensor_id` is optional and is omitted entirely when no physical identity is defined.

Do not emit `physical_sensor_id:null`.

Remove from every new record:

```text
device_id
measured_at
details
control_eligible
```

Do not emit `details:{}`.

## Quality and reason

Allowed coarse `quality` values:

```text
good
diagnostic
missing
failed
```

`reason` is the most specific available cause.

Examples of specific provider reasons that must not be hidden under generic `read_failed` include:

```text
mux_not_detected
channel_select_failed
ads1115_not_detected_on_selected_channel
ads1115_conversion_read_failed
sensor_not_detected_on_selected_channel
bh1750_lux_read_failed
upstream_address_conflict
```

Use `read_failed` only when no more specific reason exists.

## Successful Balcony02 record order

The successful response contains exactly 11 records in this order:

1. BME280 `air_temperature`
2. BME280 `relative_humidity`
3. BME280 `barometric_pressure`
4. DS18B20 `soil temp`
5. SEN0308 M01 `raw_adc`
6. SEN0308 M02 `raw_adc`
7. SEN0308 M03 `raw_adc`
8. SEN0562 L01 `ambient_light`
9. SEN0562 L02 `ambient_light`
10. SEN0562 L03 `ambient_light`
11. SEN0204 WL01 `reservoir_liquid_detected`

SEN0308 M04 is not emitted as a measurement.

## BME280 records

BME280 emits three records with:

```text
sensor_key: bme280_air
sensor_type: BME280
```

The records are:

```text
air_temperature / F
relative_humidity / %
barometric_pressure / hPa
```

BME280 records omit `physical_sensor_id`.

## DS18B20 record

The stable identity remains:

```text
sensor_key: ds18b20_temperature
sensor_type: DS18B20
```

The external measurement name changes:

```text
temperature -> soil temp
```

The unit remains:

```text
F
```

DS18B20 records omit `physical_sensor_id`.

Hosted consumers must recognize both:

- canonical new `soil temp`;
- historical legacy `temperature` for DS18B20 rows.

New firmware emits only `soil temp`.

## SEN0308 records

Only installed M01, M02, and M03 are emitted.

Each record includes the matching physical identity:

```text
sen0308_m01 -> SEN0308-M01
sen0308_m02 -> SEN0308-M02
sen0308_m03 -> SEN0308-M03
```

All retain:

```text
sensor_type: sen0308
measurement_name: raw_adc
measurement_unit: count
```

M04 remains configured expansion inventory in `/capabilities` only.

## SEN0562 records

All three installed light modules are emitted:

```text
sen0562_l01 -> SEN0562-L01
sen0562_l02 -> SEN0562-L02
sen0562_l03 -> SEN0562-L03
```

All retain:

```text
sensor_type: sen0562
measurement_name: ambient_light
measurement_unit: lux
```

Runtime records do not contain voltage, vendor-supply, controlled-test, bench-proof, or wiring notes.

## SEN0204 record

The record uses:

```text
sensor_key: sen0204_wl01
sensor_type: sen0204
physical_sensor_id: WL01
measurement_name: reservoir_liquid_detected
measurement_unit: state
```

Numeric state remains:

```text
1 = liquid detected
0 = liquid not detected
```

Do not change GPIO26, input mode, polarity, or pump-interlock behavior.

## Successful example

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "measured_at": "2026-07-15T21:45:00Z",
  "records": [
    {
      "sensor_key": "bme280_air",
      "sensor_type": "BME280",
      "measurement_name": "air_temperature",
      "measurement_value": 77.86,
      "measurement_unit": "F",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "bme280_air",
      "sensor_type": "BME280",
      "measurement_name": "relative_humidity",
      "measurement_value": 58.21,
      "measurement_unit": "%",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "bme280_air",
      "sensor_type": "BME280",
      "measurement_name": "barometric_pressure",
      "measurement_value": 1014.32,
      "measurement_unit": "hPa",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "ds18b20_temperature",
      "sensor_type": "DS18B20",
      "measurement_name": "soil temp",
      "measurement_value": 74.75,
      "measurement_unit": "F",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0308_m01",
      "sensor_type": "sen0308",
      "physical_sensor_id": "SEN0308-M01",
      "measurement_name": "raw_adc",
      "measurement_value": 12480,
      "measurement_unit": "count",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0308_m02",
      "sensor_type": "sen0308",
      "physical_sensor_id": "SEN0308-M02",
      "measurement_name": "raw_adc",
      "measurement_value": 12610,
      "measurement_unit": "count",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0308_m03",
      "sensor_type": "sen0308",
      "physical_sensor_id": "SEN0308-M03",
      "measurement_name": "raw_adc",
      "measurement_value": 12542,
      "measurement_unit": "count",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0562_l01",
      "sensor_type": "sen0562",
      "physical_sensor_id": "SEN0562-L01",
      "measurement_name": "ambient_light",
      "measurement_value": 18432.5,
      "measurement_unit": "lux",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0562_l02",
      "sensor_type": "sen0562",
      "physical_sensor_id": "SEN0562-L02",
      "measurement_name": "ambient_light",
      "measurement_value": 17650.83,
      "measurement_unit": "lux",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0562_l03",
      "sensor_type": "sen0562",
      "physical_sensor_id": "SEN0562-L03",
      "measurement_name": "ambient_light",
      "measurement_value": 19005.0,
      "measurement_unit": "lux",
      "valid": true,
      "quality": "diagnostic",
      "reason": "read_ok"
    },
    {
      "sensor_key": "sen0204_wl01",
      "sensor_type": "sen0204",
      "physical_sensor_id": "WL01",
      "measurement_name": "reservoir_liquid_detected",
      "measurement_value": 1,
      "measurement_unit": "state",
      "valid": true,
      "quality": "good",
      "reason": "read_ok"
    }
  ]
}
```

# Measurement batch and Supabase contract

The firmware POST to `sensor_measurement_batches` keeps batch-level fields:

```text
device_id
measured_at
device_role
firmware_version
build_profile
schema_version
record_count
records
source_endpoint
batch_details
```

The raw batch stores the exact cleaned `records[]` array.

`public.sensor_measurements_flat` restores these values to every derived row:

```text
device_id <- batch.device_id
measured_at <- batch.measured_at
```

The flat view also extracts optional `physical_sensor_id` from each record.

Historical rows are not rewritten. Older records may retain legacy fields and the legacy DS18B20 name.

# `/capabilities` contract

## Top-level shape

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "reported_at": "2026-07-15T21:45:00Z",
  "can_water": true,
  "control_authority": "local_firmware",
  "pinout": {
    "pump_relay": 25,
    "physical_button": 32,
    "reservoir_level": 26,
    "soil_temperature": 27,
    "i2c_sda": 21,
    "i2c_scl": 22
  },
  "control_configuration": {
    "pump_relay_active_state": "HIGH",
    "physical_button_active_state": "LOW",
    "reservoir_liquid_detected_state": "HIGH"
  },
  "i2c": {
    "mux_address": "0x70",
    "ads1115_address": "0x48",
    "ads1115_mux_channel": 0
  },
  "modules": []
}
```

`can_water` externally collapses the existing separate internal compile-time gates. The internal gates remain separate.

## Module field rules

Use these fields where applicable:

```text
sensor_key
sensor_type
installed
physical_sensor_id
connection
control_role
```

Omit fields that do not apply rather than emitting diagnostic nulls.

Do not emit:

```text
enabled
present
quality
reason
control_eligible
details
```

## Balcony02 modules

```json
[
  {
    "sensor_key": "bme280_air",
    "sensor_type": "BME280",
    "installed": true,
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 4,
      "address": "0x76"
    }
  },
  {
    "sensor_key": "ds18b20_temperature",
    "sensor_type": "DS18B20",
    "installed": true,
    "connection": {
      "bus": "onewire"
    }
  },
  {
    "sensor_key": "sen0308_m01",
    "sensor_type": "SEN0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M01",
    "connection": {
      "provider": "ads1115",
      "channel": "A0"
    }
  },
  {
    "sensor_key": "sen0308_m02",
    "sensor_type": "SEN0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M02",
    "connection": {
      "provider": "ads1115",
      "channel": "A1"
    }
  },
  {
    "sensor_key": "sen0308_m03",
    "sensor_type": "SEN0308",
    "installed": true,
    "physical_sensor_id": "SEN0308-M03",
    "connection": {
      "provider": "ads1115",
      "channel": "A2"
    }
  },
  {
    "sensor_key": "sen0308_m04",
    "sensor_type": "SEN0308",
    "installed": false,
    "physical_sensor_id": "SEN0308-M04",
    "connection": {
      "provider": "ads1115",
      "channel": "A3"
    }
  },
  {
    "sensor_key": "sen0562_l01",
    "sensor_type": "SEN0562",
    "installed": true,
    "physical_sensor_id": "SEN0562-L01",
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 1,
      "address": "0x23"
    }
  },
  {
    "sensor_key": "sen0562_l02",
    "sensor_type": "SEN0562",
    "installed": true,
    "physical_sensor_id": "SEN0562-L02",
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 2,
      "address": "0x23"
    }
  },
  {
    "sensor_key": "sen0562_l03",
    "sensor_type": "SEN0562",
    "installed": true,
    "physical_sensor_id": "SEN0562-L03",
    "connection": {
      "bus": "i2c_mux",
      "mux_channel": 3,
      "address": "0x23"
    }
  },
  {
    "sensor_key": "sen0204_wl01",
    "sensor_type": "SEN0204",
    "installed": true,
    "physical_sensor_id": "WL01",
    "connection": {
      "gpio": 26
    },
    "control_role": "watering_interlock"
  }
]
```

## Removed top-level capability fields

Remove:

```text
gen2_enabled
pump_control_available
device_can_water
watering_simulation_available
local_http_watering_endpoint_available
relay_test_output_pin
supabase_command_control
i2c.enabled
i2c_scan
live mux-detection and scan fields
```

## Static-manifest proof requirement

A request to `/capabilities` must not call any function that performs:

```text
Wire.beginTransmission for scan/detection purposes
analogRead
digitalRead for live capability proof
DS18B20 conversion/read
BME280 read/detection retry
ADS1115 conversion
BH1750 conversion
mux channel scan
full address scan
```

Normal string construction and reading compile-time/profile constants are allowed.

# `/status` contract

## Top-level shape

```json
{
  "device_label": "Balcony02",
  "device_id": "7e5bd328-ad68-4389-a71a-fa5cd01b3813",
  "device_role": "controller",
  "firmware_version": "phase8b4-gen2-status-contract",
  "build_profile": "balcony02-gen2",
  "reported_at": "2026-07-15T21:45:00Z",
  "uptime_seconds": 0,
  "network": {},
  "cloud_reporting": {},
  "watering": {},
  "system": {}
}
```

## Network object

```json
{
  "wifi_connected": true,
  "wifi_rssi": -57,
  "wifi_status_code": 3,
  "wifi_status_label": "connected",
  "ip_address": "192.168.1.84",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "last_wifi_disconnect_reason": null,
  "last_wifi_disconnect_reason_label": "not_recorded",
  "wifi_reconnect_attempts_since_boot": 0,
  "wifi_full_recovery_attempts_since_boot": 0,
  "wifi_disconnects_since_boot": 0,
  "wifi_ip_acquisitions_since_boot": 1,
  "last_wifi_disconnect_uptime_seconds": null,
  "last_wifi_ip_acquired_uptime_seconds": 4,
  "last_wifi_activity": "ip_acquired"
}
```

Use Arduino/ESP-IDF constants for code-to-label mappings.

Safe label fallbacks:

```text
unknown
not_recorded
```

Do not infer a disconnect reason from current connection state.

Allowed normalized `last_wifi_activity` values:

```text
none
connected
ip_acquired
disconnected
disconnect_detected
reconnect_requested
full_recovery_started
```

Null behavior:

- `wifi_rssi` is null when unavailable/disconnected;
- `ip_address` is null when no valid local address is held;
- disconnect reason and uptime are null before a disconnect is recorded;
- IP-acquired uptime is null before an IP acquisition is recorded.

Remove duplicate `last_wifi_status_code`.

## Cloud-reporting object

```json
{
  "last_http_status": 201,
  "last_http_status_label": "created",
  "consecutive_failures": 0,
  "last_error_category": "none",
  "last_successful_measurement_post_at": "2026-07-15T21:45:00Z",
  "last_successful_measurement_post_uptime_seconds": 0,
  "last_successful_status_post_at": "2026-07-15T21:45:00Z",
  "last_successful_status_post_uptime_seconds": 0
}
```

Terminology changes:

```text
telemetry -> measurement
diagnostics -> status
Supabase-specific external field names -> cloud-reporting names
```

Never-recorded behavior:

```text
last_http_status: null
last_http_status_label: not_recorded
success timestamps: null
success uptime values: null
```

## Watering object

```json
{
  "currently_watering": false,
  "active_trigger_source": null,
  "last_watering_at": null,
  "last_watering_duration_seconds": null
}
```

Allowed active trigger values:

```text
physical_button
automatic
manual_local
firmware_safety
```

`active_trigger_source` is null while idle.

`last_watering_at` represents the most recent watering start time.

`last_watering_duration_seconds` remains null until a completed watering duration exists.

Remove static capability duplication:

```text
pump_control_available
device_can_water
```

Do not change watering behavior.

## System object

```json
{
  "free_heap_bytes": 0,
  "minimum_free_heap_bytes": 0
}
```

Remove:

```text
hasLastGoodDht
free_heap
min_free_heap
```

The internal DHT cache may remain where still required by legacy profiles, but it is not part of generic `/status`.

# Cloud heartbeat alignment

The heartbeat is the flattened cloud representation of the same runtime semantics.

The heartbeat must align with local status names and meanings for:

```text
uptime
Wi-Fi connection/status/recovery
cloud reporting
watering runtime state
heap state
```

Local-only fields that must not be exposed through hosted-safe diagnostics:

```text
ip_address
mac_address
SSID
raw heartbeat details
command/control endpoints
```

The hosted dashboard remains read-only.

# Historical compatibility

## Measurements

Historical Supabase rows may contain:

```text
record-level device_id
record-level measured_at
control_eligible
details
DS18B20 measurement_name: temperature
```

Those rows remain valid evidence.

The frontend must display both legacy DS18B20 `temperature` and canonical new `soil temp` as soil temperature.

No historical batch rewrite is part of this phase.

## Heartbeats

Historical heartbeat rows may retain old column names and details keys.

The migration should be additive and hosted views may use compatibility `coalesce(...)` expressions where old and new meanings are genuinely equivalent.

New firmware writes the new active field names only after the database accepts them.

# Required implementation slices

## Slice 1 — contract freeze

- create ADR 0022;
- create this implementation contract;
- update architecture, ADR index, and active digest;
- no firmware, SQL, or frontend edits.

## Slice 2 — measurements and ingestion

- preserve the working firmware sketch as the required plain-text `.bak`;
- clean all Gen2 record serializers;
- omit M04 measurements;
- preserve specific provider reasons;
- add `physical_sensor_id` flattening;
- update DS18B20 hosted/local consumers;
- build all relevant profiles;
- validate local and hosted measurement behavior.

## Slice 3 — static capabilities

- replace live capability probing with static profile manifests;
- update local capability types/display;
- prove no scans or reads occur;
- validate generic manifests for other profiles.

## Slice 4 — status, heartbeat, SQL, and hosted diagnostics

- add database fields/views first;
- implement nested local `/status`;
- align flattened heartbeat payload;
- update hosted API types and diagnostics display;
- validate connected, disconnected, success, failure, idle, active, and never-recorded states.

## Slice 5 — watering regression and closeout

- prove unchanged relay, button, reservoir, OneWire, and I2C pins;
- prove physical-button watering;
- prove reservoir block and cutoff;
- prove no automatic SEN0308 watering;
- prove offline local watering and best-effort cloud behavior;
- update operational and schema documentation after evidence exists.

# Validation checklist

## Measurements

- [x] Exactly 11 Balcony02 records, including explicit L01 missing evidence.
- [x] Record order matches the frozen order.
- [x] No M04 measurement.
- [x] No `details`.
- [x] No `control_eligible`.
- [x] No record-level `device_id`.
- [x] No record-level `measured_at`.
- [x] Correct physical sensor IDs.
- [x] BME280 and DS18B20 omit `physical_sensor_id`.
- [x] DS18B20 uses `soil temp`.
- [x] SEN0204 uses `reservoir_liquid_detected`.
- [x] Reservoir values remain 0/1 with unchanged meaning.
- [x] Specific provider failures appear directly in `reason`.
- [x] Flattened rows retain batch device ID and time.
- [x] Hosted Support View works and the local `/measurements` endpoint validates.
- [x] Historical DS18B20 `temperature` rows display correctly.

## Capabilities

- [x] No sensor reads.
- [x] No GPIO health read.
- [x] No I2C scan.
- [x] No mux detection scan.
- [x] Correct pins.
- [x] Correct channels and addresses.
- [x] M04 is configured but uninstalled.
- [x] Only SEN0204 declares `watering_interlock`.
- [x] No old diagnostic/prove-out fields.
- [x] Other profiles produce valid generic manifests.

## Status and heartbeat

- [x] Connected state.
- [ ] Disconnected state.
- [x] Readable Wi-Fi status labels.
- [x] Readable disconnect labels.
- [x] Never-recorded null behavior.
- [ ] Lightweight reconnect counting.
- [ ] Full recovery counting.
- [x] IP acquisition counting.
- [x] Successful cloud post.
- [ ] Failed cloud post.
- [x] Idle watering state.
- [x] Active watering state.
- [x] Correct active trigger.
- [x] Last watering time and duration evidence.
- [x] Heap evidence.
- [x] Local status and hosted heartbeat alignment.
- [x] Local IP/MAC are not exposed through hosted-safe views.

Deferred: controlled disconnected state, nonzero lightweight reconnect counting, full recovery, and failed cloud-post evidence.

## Watering regression

- [x] Relay remains GPIO25.
- [x] Physical button remains GPIO32.
- [x] Reservoir input remains GPIO26.
- [x] DS18B20 remains GPIO27.
- [x] I2C SDA/SCL remain GPIO21/GPIO22.
- [x] Physical-button watering still works.
- [ ] Reservoir absence still blocks watering.
- [ ] Reservoir loss still stops watering.
- [x] No automatic SEN0308 watering is introduced.
- [ ] Wi-Fi loss does not block local watering.
- [ ] Cloud failures remain best-effort.

Deferred: reservoir-absence blocking, reservoir-loss cutoff, Wi-Fi-loss watering, and cloud-failure watering regression evidence.

# Review and commit discipline

After each implementation slice:

1. show exact changed files;
2. run and show `git diff --check`;
3. show relevant build/test results;
4. show endpoint samples;
5. show `git status`;
6. do not commit until Jeremy approves the slice;
7. do not push until Jeremy explicitly approves the commit and push.
