# My Balcony Gardener Phase Backlog

> **Current I2C wiring authority (effective 2026-07-03):** MBG internal short-range I2C wiring uses RED = 3.3V, BLACK = GND, GREEN = GPIO21 / SDA, and WHITE = GPIO22 / SCL. GPIO21 remains SDA and GPIO22 remains SCL. Factory SEN0562 leads are exceptions, including BLUE = GND and YELLOW = SCL; they do not redefine the MBG internal convention. See ADR 0023.

This document captures deferred work that should not be mixed into the current implementation phase.

It is a planning guide, not an implementation approval. Each item still requires normal inspection, design, review, validation, and commit discipline before implementation.

## Phase 8.0 - Product Direction and Backlog Visual Rebaseline

Phase 8 reframes My Balcony Gardener around a schedule-first customer product, with sensor evidence used carefully and progressively instead of treating every new sensor as immediate watering authority.

### Product Direction

| Layer | Product meaning | Near-term implication |
| --- | --- | --- |
| Base product | Timer / reservoir / spigot controller. | The product should be useful as a reliable local watering timer even before sensor authority is mature. |
| Sensor assist | Skip or allow scheduled watering. | Sensors should initially help a scheduled watering decision, not create an always-on autonomous plant doctor. |
| Advanced mode | Collect data, map balcony microclimates, learn dry-down, compare sensor readings to human judgment. | Balcony02 and Prototype01 evidence should teach the product what sensor readings mean across real balcony conditions. |
| Future intelligence | Use history to improve the threshold/window model. | Historical telemetry can later improve fixed thresholds/windows after enough trusted evidence exists. |

## Current Roadmap Snapshot

The compact roadmap near the top is the current planning view. The detailed phase history below remains historical evidence and may be reorganized in a later Phase 8F documentation cleanup.

Legend:

- ✅ COMPLETE — closed / validated / merged or otherwise complete
- 🔵 CURRENT — current documentation or transition phase
- ➡️ NEXT — next intended implementation phase
- 🟡 PLANNED — planned near-future work
- 🧊 PARKED — intentionally deferred / not now
- ⚠️ WATCH — known issue, risk, or evidence still needed

| Status | Phase | Name | Current meaning |
| --- | --- | --- | --- |
| ✅ COMPLETE | Foundation through Phase 7L.4 | Local control, hosted read-only visibility, telemetry/diagnostics, auth/RLS, and customer read-only path | ESP32 local firmware owns watering decisions and pump shutoff; hosted path stays read-only. |
| ✅ COMPLETE | Phase 7M through Phase 7N sensor evidence | Balcony02 planning plus SEN0308/SEN0562 measurement-system evidence | SEN0308 insertion/contact/media variation supports fixed-sensor/window thinking before watering authority expands. |
| ✅ COMPLETE | Phase 7O.1 / 7P.1 evidence | Watering-event evidence and physical-button proof work | Useful evidence for Phase 8 safety/cadence work; broader unattended control maturity remains future. |
| ⚠️ WATCH | Phase 7N.5 learnings | SEN0308 Relative Moisture Index / moisture analytics direction | Preserve raw ADC as evidence while moving product display toward provisional meaning, confidence, and fixed-sensor analysis. |
| ✅ COMPLETE | Phase 8.0 | Product Direction and Backlog Visual Rebaseline | Documentation-only pivot alignment completed; no runtime behavior changed in this phase. |
| ✅ COMPLETE | Phase 8A.1 | Prototype01 Installed Sensor Profile Cleanup | Prototype01 reports expected installed/not-installed sensor truth; no watering authority changed. |
| ✅ COMPLETE | Phase 8A | Relative Moisture Index and Hosted Card Cleanup | Hosted Support View uses the accepted display-only gardener moisture index and cleaned trust/card/chart behavior. |
| ✅ COMPLETE | Phase 8B | Balcony02 Gen2 Controller Deployment and Endpoint Contract Cleanup | Phase 8B.1 through Phase 8B.6 are complete at their recorded evidence levels; Phases 8B.5 and 8B.6 are production validated. |
| ✅ COMPLETE | Phase 8B.1 | Balcony02 Gen2 Physical Buildout and Runtime Prove-Out | Physical build and commissioning closed August 12, 2026; installed soak, measurement, hydraulic, metadata, storage, and retirement/refactor evidence continue as follow-on streams. |
| ✅ COMPLETE | Phase 8B.2 | Gen2 `/measurements` Contract Cleanup and End-to-End Deployment | Clean 11-record contract deployed and validated locally, through Supabase storage/views, and on the hosted Support View. |
| ✅ COMPLETE | Phase 8B.3 | Gen2 `/capabilities` Static Contract Cleanup | Live-device-validated static configured-hardware manifest performs no reads or scans and preserves installed-state and control-authority boundaries. |
| ✅ COMPLETE | Phase 8B.4 | Gen2 `/status` Nested Diagnostics Contract Cleanup | LIVE DEVICE, CLOUD, AND HOSTED-DIAGNOSTICS VALIDATED on 2026-07-17 without changing watering ownership. |
| ✅ COMPLETE | Phase 8B.5 | Gen2 Endpoint Integration and Closeout | COMPLETE / PRODUCTION VALIDATED in commits `a291be6` and `a8b282e`. |
| ✅ COMPLETE | Phase 8B.6 | Hosted Short History Window Expansion | Commit `9b8eb0f` added `3h`, `6h`, and `12h` with `24h` preserved as default; local hosted-readonly and deployed production validation passed without changing hosted read-only or local watering authority. |
| 🟡 PLANNED | Phase 8C | Safety, Cadence, and Control-Error Prevention | Continue unattended-control maturity and prevent repeated bad-data watering decisions without weakening local ownership or safety gates. |
| 🟡 PLANNED | Phase 8D | Local Schedule UI and Schedule Persistence | Provide visible local schedule configuration and controller-side persistence. |
| 🟡 PLANNED | Phase 8E | Sensor-Assisted Timer Mode | Schedule-first watering with fixed-sensor skip/allow logic after the required safety and evidence gates are proven. |
| 🟡 PLANNED | Phase 8F | Roadmap and Documentation Reorganization | Larger later cleanup of accumulated roadmap, source-pack, build, service, and product documentation. |
| 🧊 PARKED | Future intelligence / broader product tracks | Use history to improve threshold/window models after enough trusted evidence exists | Do not pull future intelligence, hosted command/control, or full docs reorganization into Phase 8.0. |

### Early Phase 8 Sequence

#### Phase 8.0 - Product Direction and Backlog Visual Rebaseline

- Documentation-only roadmap orientation.
- No runtime behavior changes.

#### Phase 8A - Prototype01 Relative Moisture Index and Card Cleanup

- Phase 8A.1 prerequisite cleanup is complete: Prototype01 now reports installed/expected sensor truth for the final bench topology.
- Implemented and accepted for closeout. Product closeout: [`docs/product/phase8a-hosted-support-view-card-cleanup-closeout.md`](./product/phase8a-hosted-support-view-card-cleanup-closeout.md).
- Defined provisional Gen2 Relative Moisture Index for display only.
- Define the first-draft gardener-facing scale in [`docs/product/phase8a-relative-moisture-index-first-draft.md`](./product/phase8a-relative-moisture-index-first-draft.md): practical dead-dry soil maps to `0`, wet-drained / saturated-drained soil maps to `90`, and `100+` remains wetter-than-normal / saturated / water-like evidence.
- Hosted Support View card and chart derive `gardener_moisture_index = 90 * (14820 - current_raw) / (14820 - 11230)` from Prototype01 SEN0308 ADS1115 A0 raw ADC evidence (`sensor_key = sen0308_m01`, `measurement_name = raw_adc`).
- Display labels are `< 0: Check Sensor`, `0-20: Too Dry`, `20-40: Dry`, `40-70: Moist`, `70-90: Well-watered`, `90-105: Very Wet`, and `> 105: Saturated`.
- Cleaned measurement cards around product meaning: Soil Conditions, Light Conditions, and Air Conditions.
- Disabled/profile-not-installed channels are no longer promoted as main red cards, expected `profile_not_installed` rows no longer make Device Status yellow, and chart tooltip units are measurement-specific.
- Preserve raw ADC as advanced/debug evidence.
- Light daily exposure/mapping remains future learning/mapping work; full graphic dashboard redesign is deferred.
- No watering authority changes.

#### Phase 8A.1 - Prototype01 Firmware/Profile Installed Sensor Cleanup

- Runtime validated on `Prototype01` / `bench-proto-gen2` at `10.0.0.192`.
- Prototype01 expected installed sensors are BME280, DS18B20, SEN0562-L01, ADS1115 + I2C mux, and SEN0308 on ADS1115 A0 only.
- Prototype01 profile disables VEML6030 and legacy GPIO34 soil moisture; Balcony01 / `balcony-installed-gen2` keeps GPIO34 moisture and control behavior unchanged.
- Prototype01 SEN0308 A0 keeps firmware key `sen0308_m01` and reports physical sensor ID `SEN0308-M02`; SEN0308 A1/A2/A3 report `not_installed` / `profile_not_installed` with `measurement_value:null`, `valid:false`, `control_eligible:false`, and `details.physical_sensor_id:null`.
- Prototype01 SEN0562-L01 reports installed / `read_ok`; SEN0562-L02/L03 report `not_installed` / `profile_not_installed` with `measurement_value:null`, `valid:false`, `control_eligible:false`, and `details.physical_sensor_id:null`.
- Runtime validation on 2026-06-17 confirmed `/status`, `/capabilities`, and `/measurements` returned the cleaned profile truth while preserving provider/channel/mux metadata.
- Build validation passed `pio run -e bench-proto-gen2`, `pio run -e balcony-installed-gen2`, and `pio run -e balcony-sensor-scout-01`.
- No frontend card work, SQL/RLS, hosted-readonly, deploy, field-unit upload, watering behavior, pins, device IDs, thresholds, cadence, cooldown, Supabase command/control, or Balcony01 GPIO34/control-path changes.

#### Phase 8B - Balcony02 Gen2 Controller Deployment and Endpoint Contract Cleanup — COMPLETE

- Phase 8B.1 Balcony02 Gen2 Physical Buildout and Runtime Prove-Out — COMPLETE. Physical commissioning closed August 12, 2026. Authoritative record: [`docs/production/MBG_Balcony02_As_Built_and_Commissioning_v1.0_2026-08-12.md`](./production/MBG_Balcony02_As_Built_and_Commissioning_v1.0_2026-08-12.md); fillable BOM: [`docs/production/MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx`](./production/MBG_Balcony02_As_Built_BOM_v0.1_2026-08-12.xlsx).
- Phase 8B.1 follow-on evidence streams remain open and are not construction punch-list: installed soak and reliability observation; intermittent DS18B20 missing-reading investigation; SEN0308 moisture measurement-system/dry-down/manual-watering evaluation; WL01 elevation optimization during natural reservoir drawdown; one-gallon reservoir marking/calibration; hydraulic delivered-volume and distribution characterization; bogus-reading/plausibility handling; customer-facing sensor/location metadata; Supabase storage-growth investigation; evidence-based Gen1-remnant retirement/refactor review; and a later major website redesign. This closeout does not claim any of these field prove-out items complete.
- Phase 8B.2 Gen2 `/measurements` Contract Cleanup and End-to-End Deployment — COMPLETE / END-TO-END VALIDATED. Commits `b17bf1a` and `2096394` were pushed to `main`; the coordinated SQL migration was manually applied on 2026-07-16; local, repeated storage, heartbeat, and hosted Support View validation passed.
- Phase 8B.3 Gen2 `/capabilities` Static Contract Cleanup — COMPLETE / LIVE DEVICE VALIDATED.
- Phase 8B.4 Gen2 `/status` Nested Diagnostics Contract Cleanup — COMPLETE / LIVE DEVICE, CLOUD, AND HOSTED-DIAGNOSTICS VALIDATED on 2026-07-17.
- Phase 8B.5 Gen2 Endpoint Integration and Closeout — COMPLETE / PRODUCTION VALIDATED in commits `a291be6` (`Refine hosted readings and restore multi-axis trends`) and `a8b282e` (`Polish hosted trend colors and watering labels`).
- The final Phase 8B.5 hosted frontend presents deterministic Garden Readings, separate Quality and Diagnostics evidence, ten independent series with five non-exclusive family shortcuts, mixed-family unit-driven axes, unique stable series colors, deterministic watering-label lanes, and production-validated responsive behavior while preserving hosted read-only and local watering-authority boundaries.
- Phase 8B integrated endpoint/frontend closeout is complete, deployed, and production validated at its recorded evidence level.
- Phase 8B.6 Hosted Short History Window Expansion is COMPLETE / PRODUCTION VALIDATED in commit `9b8eb0f`. The exact Window contract is `3h`, `6h`, `12h`, `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, `all`, with `24h` preserved as default and expected package counts `12`, `24`, `48`, `96`, and `672` for `3h`, `6h`, `12h`, `24h`, and `7d`. Hosted short-window ticks use local hour/minute labels, existing longer formats and tooltip behavior remain, and a 60-row 3-hour response correctly collapsed to 12 unique `measured_at` packages. Local hosted-readonly validation and Jeremy's deployed production visual confirmation passed; no firmware, SQL/schema, mux, Gen1-removal, watering/control-authority, or chart-contract change occurred.
- A broader hosted visual/accessibility redesign remains future work; it was not implemented in Phase 8B.5, and no accessibility certification is claimed.
- Derived weather metrics remain future work. Dew point and heat index are not implemented and were not part of Phase 8B.5 or Phase 8B.6 scope.
- Balcony02 is built and runtime proven with 3 moisture sensors, 3 currently detected light sensors, air context, soil temperature, WL01 reservoir interlock, and the permanent local hold-to-water/test switch. L01's bad connector was replaced on 2026-07-17; the distribution board was not at fault. Phase 8B.2's explicit L01-missing records remain historical evidence. No three-sensor voting logic was introduced.
- Phase 8B.3 isolated the exact static response to `balcony02-gen2`; existing non-Balcony02 capability aggregation remains unchanged. Installed state comes from existing profile flags, and the Balcony02 call path performs no sensor/GPIO reads, I2C or mux scans, detection probes, or provider conversions.
- All four Gen2 profiles built successfully; only Balcony02 was uploaded. Live validation on `Balcony02` (`7e5bd328-ad68-4389-a71a-fa5cd01b3813`, controller, `phase8b-balcony02-proveout`, `balcony02-gen2`, `10.0.0.69`) confirmed ten ordered modules: `bme280_air`, `ds18b20_temperature`, `sen0308_m01`, `sen0308_m02`, `sen0308_m03`, `sen0308_m04`, `sen0562_l01`, `sen0562_l02`, `sen0562_l03`, and `sen0204_wl01`. M04 is `installed:false`, L01 remains `installed:true`, and WL01 alone declares `control_role:"watering_interlock"`.
- Two live capability responses matched after normalizing only `reported_at`; the validator ended with `All /measurements and /capabilities contract assertions passed.` The frozen `/measurements` contract passed unchanged, `/status` remained unchanged/deferred, and no frontend, SQL, Supabase, Cloudflare, hardware, sensor, or watering behavior changed.
- Phase 8B.4 firmware `phase8b4-gen2-status-contract` built in all seven environments. Balcony02 (`COM5`, `10.0.0.69`) passed the full endpoint validator and Prototype01 (`318fab98-89ad-4f36-9100-3134a04e0be5`, `bench`, `bench-proto-gen2`) passed status-only validation; both validators ended with `All requested Gen2 endpoint contract assertions passed.`
- The live nested status contract, raw heartbeat, and protected hosted diagnostics aligned on ordered fields, code/label pairs, nullable history, nonnegative counters/uptimes, cloud successes, watering state/history, heap evidence, and current firmware/profile. Hosted-safe views exclude IP and MAC. Three physical-button cycles completed in `11`, `7`, and `11` seconds without granting automatic SEN0308 watering authority.
- Deferred status evidence remains controlled disconnected state, nonzero lightweight reconnect counting, full recovery, and failed cloud posts. Deferred watering regression evidence remains reservoir absence/loss, Wi-Fi loss, and cloud failure.

Balcony02 is both a product-development and garden-mapping platform, and the main evidence path for deciding whether single-sensor sensor-assisted timer behavior is good enough for the customer MVP.

#### Phase 8C - Safety/Cadence/Control-Error Prevention

- Prevent known bad-data watering decision classes before unattended control maturity.
- Separate local sampling, control evaluation, telemetry cadence, and watering event evidence as needed.
- Preserve local firmware ownership of watering decisions and pump shutoff.

#### Phase 8D - Local Schedule UI and Schedule Persistence

- User-visible local schedule configuration.
- Local unit schedule storage.
- No hosted command/control.

#### Phase 8E - Sensor-Assisted Timer Mode

- Schedule-first watering.
- Single fixed-sensor skip/allow logic.
- Conservative fallback behavior if sensor evidence is missing/stale/bad.

#### Phase 8F - Full Roadmap/Docs Reorganization

- Larger later documentation cleanup organized around product tracks.

### Phase 8 Guardrails

- Hosted/customer product path remains read-only unless separately approved.
- Supabase remains telemetry/history/diagnostics/evidence storage only and must not become command/control.
- Local ESP32 firmware owns watering decisions and pump shutoff.
- Phase 8.0 does not change firmware, frontend runtime code, SQL, pins, sensors, thresholds, mappings, cadence, device IDs, `control_eligible`, watering duration, cooldown, or watering behavior.

## Current Active Branch Context

- Current repo context: Phase 7L.4 customer auth, garden membership, and RLS implementation is complete, merged to `main`, pushed, Cloudflare production auto-deployed from `main`, and production/credentialed browser validated at `https://mybalconygardener.boileragency.com`.
- Current Phase 6A status: merged to `main`; Cloudflare Pages Production and custom domain validated
- Current Phase 6B status: complete; device identity and bench unit readiness convention documented
- Current Phase 6C status: complete; PlatformIO device identity build-profile bridge validated
- Current Phase 6D status: complete; bench ESP32 identity flash validation passed
- Current Phase 6E status: complete; hosted read-only Device and Window selectors validated locally and on the custom domain
- Current Phase 6F status: complete, merged to `main`, deployed, and validated on the hosted custom domain
- Current Phase 6G status: complete, merged to `main`; bench build/flash and normal Wi-Fi boot validation passed, and offline/no-Wi-Fi behavior is code-hardened and static-inspected
- Current Phase 6H status: complete; raw soil ADC visibility implemented in commit `8157e66 Add raw soil ADC diagnostic telemetry` and validated on the bench and Supabase history path
- Current Phase 6J.0 status: complete; frontend multi-unit visibility and local control target safety implemented and documented
- Current Phase 6J.1 status: complete; design/ADR documentation pass with no firmware, SQL, frontend runtime, `SensorLogRow`, watering, or local control behavior changes
- Current Phase 6J.2 status: bench validated / complete; local read-only `GET /status` endpoint implemented in `src/main.cpp`
- Current Phase 6J.3 status: SQL/RLS MVP complete / manually validated; `docs/sql/phase6j3-device-heartbeats.sql` creates `public.device_heartbeats`
- Current Phase 6J.4 status: bench validated / complete; firmware periodic heartbeats post to `public.device_heartbeats`
- Current Phase 6J.5 status: manually validated / complete; `public.device_registry` centralizes provisioned-device insert allowlists
- Current Phase 6J.6 status: complete and merged to `main`; hosted read-only diagnostics display uses limited view `public.hosted_device_diagnostics`
- Phase 7A status: accepted documentation/design phase
- Phase 7B status: runtime validated / complete on `bench-proto-gen2`
- Phase 7C status: runtime validated / complete; Live Measurements Local Frontend MVP
- Phase 7D status: runtime validated / complete; Gen2 Measurement Batch Storage MVP
- Phase 7E status: runtime validated / complete and merged to main; Field Units Gen2 Compatibility Migration
- Phase 7F.1 status: runtime/browser validated / complete pending commit; Hosted Gen2 UI Flexibility and Trend Charting
- Phase 7F.3 status: validated / complete pending commit; Hosted Device Status Gen2 Freshness Fix
- Phase 7G.0 status: validated / complete pending commit; Field Gen2 Soil Temperature and Scout BME280 Swap
- Phase 7G.1 status: complete / committed; calibration control validation baseline
- Phase 7G.2 status: complete / committed; Gen2 calibration evidence review
- Phase 7G.3 status: complete / committed; Gen2 control-quality rule design
- Phase 7G.4 status: firmware implementation committed / build-validated
- Phase 7G.5 status: complete and present on `main` in commit `1ea2f5a Document Phase 7G.5 control gate runtime validation`
- Phase 7K status: complete and present on `main`; hosted Gen2 Live Measurements cards show display-only at-a-glance trend cues
- Phase 7K.5 status: complete and present on `main` in commit `4863eac Add Phase 7K.5 runtime Wi-Fi recovery diagnostics`
- Phase 7K.6 status: validated / complete pending final commit/push; hosted-readonly plain-English runtime diagnostics, matched top-panel UI, manually applied hosted diagnostics SQL, and transient-read recent-good display fallback
- Phase 7L status: complete and present on `main` in commit `c34e1bd Define MVP customer setup access and local control boundary`
- Phase 7L.1 status: complete and present on `main` in commit `2d74588 Add customer site access simulation`; hosted-readonly customer/site access simulation over real Balcony01 and Scout01 telemetry
- Phase 7L.2 status: implemented pending Jeremy review, commit approval, and merge approval; hosted-readonly site shell visually prioritizes Jeremy Balcony Pilot / Savannah Balcony while preserving a small pilot simulation note
- Phase 7L.3 status: implemented pending validation, Jeremy review, commit approval, and merge approval; hosted-readonly `/` is now a minimal public landing page with an embedded compact real-data snapshot, `/demo` is the fuller public read-only demo with a dismissible visitor guide and no prominent site-assignment shell, `/mygarden` preserves the customer `My Garden` shell without the prominent site-assignment shell, `/app` remains a backward-compatible alias, `/login` opens the placeholder login dialog, and `/support` is a temporary read-only support review route by direct URL
- Phase 7L.4 status: complete and present on `main` in commit `1706798 Add customer auth garden membership RLS`; branch `phase7l4-customer-auth-garden-rls` was fast-forward merged, `main` was pushed, Cloudflare production auto-deployed from `main`, and production/credentialed browser validation passed on `https://mybalconygardener.boileragency.com`.
- Phase 7M status: documentation/design complete and present on `main` in commit `cb37ef7 Document Balcony02 sensor upgrade build-out plan`
- Phase 7N.1 status: runtime validated / complete; Prototype01 proved the 3.3V-only MUX01 and ADS1115 channel-0 detection topology on the bench.
- Phase 7N.2A status: runtime validated / complete pending push; SEN0308-M01 raw diagnostic record on ADS1115 A0 with ADS1115 as provider and SEN0308 as sensor-family module.
- Phase 7N.2B status: runtime validated / documentation closeout pending commit; SEN0308-M01/M02/M03/M04 four-channel ADS1115 wiring proof completed on Prototype01 with all four records diagnostic-only and GPIO34 preserved separately.
- Phase 7N.3A status: complete and present on `main` in commit `c10b89e Document SEN0308 measurement-system analysis`; SEN0308 measurement-system screen over free-air, dry-soil, damp-soil, wet-drained-soil, saturated-soil, water-glass, and exploratory humidity-container states.
- Phase 7N.3B status: complete and present on `main` in commit `c10b89e Document SEN0308 measurement-system analysis`; SEN0308 single-operator MSA and M02/M03 channel-swap screen found insertion/contact/media variation dominant over dead-sensor or confirmed A1 electrical-fault evidence.
- Phase 7N.4A status: SEN0562 light-sensor proof work, runtime validated / complete pending review and commit; SEN0562-L01 controlled 3.3V proof succeeded on MUX01 channel 1 on Prototype01 only.
- Phase 7N.4B status: complete and present on `main` in commit `cf844f9 Add three-channel SEN0562 mux proof`; SEN0562 three-sensor muxed light proof passed on Prototype01.
- Phase 7N.5 status: current working analysis path / future implementation; SEN0308 Relative Moisture Index, Moisture Data Analytics, and MSA Roadmap for Balcony02 moisture-control readiness.
- Phase 7O.1 status: backend/firmware evidence path runtime validated; Phase 7O.2 hosted customer/support display implemented pending review
- Phase 7P.1 status: bench physical button push-to-water proof runtime validated / complete pending commit; broader Phase 7P hardware safety maturity remains future
- Phase 7R.1 status: documentation-only ADR/source-pack compression implemented pending Jeremy review; no firmware, frontend runtime, SQL/RLS behavior, hosted behavior, watering/control, pin, sensor, device ID, or command/control changes.
- Phase 7S.1 status: documentation-only live Supabase public-schema snapshot implemented pending Jeremy review; no SQL, schema, data, RLS, grant, function, view, trigger, firmware, frontend, hosted, watering/control, pin, sensor, device ID, or `control_eligible` changes.
- Phase 8.0 status: COMPLETE.
- Phase 8A.1 status: COMPLETE; Prototype01 installed sensor profile cleanup disables removed VEML6030 and GPIO34 legacy moisture for `bench-proto-gen2`, reports SEN0308/SEN0562 not-installed channel truth, preserves provider/channel metadata, and changes no watering authority or Balcony01 GPIO34/control behavior.
- Phase 8A status: COMPLETE; hosted Support View derives a display-only gardener Moisture Index from Prototype01 SEN0308 A0 raw ADC, cleans the main cards into Soil/Light/Air Conditions, keeps raw ADC as supporting evidence, treats expected `profile_not_installed` rows as non-warning top-level status evidence, and changes no watering authority.
- Phase 8B parent status: COMPLETE. Phase 8B.1 through Phase 8B.4 retain their recorded completion evidence; Phase 8B.5 is COMPLETE / PRODUCTION VALIDATED in commits `a291be6` and `a8b282e`; Phase 8B.6 Hosted Short History Window Expansion is COMPLETE / PRODUCTION VALIDATED in commit `9b8eb0f`.
- Phase 8C, Phase 8D, Phase 8E, and Phase 8F status: PLANNED.
- Code commit already exists: `a7488ba Add hosted read-only dashboard mode`
- Production branch status: `main`
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`
- Custom domain status: configured and validated at `https://mybalconygardener.boileragency.com`

## Historical Recommended Phase Order

The top `Current Roadmap Snapshot` is now the current planning view. This older phase-order list remains as historical context until a later Phase 8F documentation cleanup.

1. Phase 5D Validation - complete
2. Phase 5D Closeout / merge - complete and merged to main
3. Phase 5E — History Graph Event Semantics - validated/complete
4. Phase 5F — Telemetry Integrity Hardening - complete and merged to main
5. Phase 6A - Hosted Read-Only Dashboard MVP - complete and merged to main
6. Phase 6B — Device Identity / Bench Unit Readiness - complete
7. Phase 6C — Prototype Device Identity Build Profiles - complete
8. Phase 6D - Bench ESP32 Device Identity Flash Validation - complete
9. Phase 6E - Hosted Device/Window Controls - complete
10. Phase 6F - Hosted Read-Only Device Status / Telemetry Quality - complete and merged to `main`
11. Phase 6G - Offline Autonomy / Wi-Fi Recovery - complete and merged to `main`
12. Phase 6H - Sensor Fault Detection / Raw ADC Visibility - complete
13. Phase 6J.0 - Multi-Unit Visibility / Local Control Target Safety - complete
14. Phase 6J.1 - Device Diagnostics / Heartbeats / Reliability Evidence - DESIGN / ADR
15. Phase 6J.2 - Local Read-Only `/status` Endpoint MVP - bench validated / complete
16. Phase 6J.3 - Supabase `device_heartbeats` SQL/RLS MVP - manually validated / complete
17. Phase 6J.4 - Firmware Heartbeat Posting MVP - bench validated / complete
18. Phase 6J.5 - Supabase Device Registry / Table-Driven Provisioned Device Allowlist - manually validated / complete
19. Phase 6J.6 - Hosted Read-Only Diagnostics Display MVP - complete and merged to `main`
20. Phase 7A — Gen2 Modular Sensor Architecture Lock - complete
21. Phase 7B — Gen2 Bench Platform Bring-Up - complete
22. Phase 7C — Live Measurements Local Frontend MVP - complete
23. Phase 7D — Gen2 Measurement Storage MVP - complete
24. Phase 7E — Field Units Gen2 Compatibility Migration - runtime validated / complete and merged to main
25. Phase 7F.1 — Hosted Gen2 UI Flexibility and Trend Charting - runtime/browser validated / complete pending commit
26. Phase 7F.3 - Hosted Device Status Gen2 Freshness Fix - validated / complete pending commit
27. Phase 7G.0 - Field Gen2 Soil Temperature and Scout BME280 Swap - validated / complete pending commit
28. Phase 7G.1 - Calibration / Control Validation Baseline - complete / committed
29. Phase 7G.2 - Gen2 Calibration Evidence Review - complete / committed
30. Phase 7G.3 - Gen2 Control-Quality Rule Design - complete / committed
31. Phase 7G.4 - Gen2 Local Control-Quality Gates Firmware Implementation - committed / build-validated
32. Phase 7G.5 - Gen2 Local Control-Quality Gates Runtime Validation - complete and present on `main`
33. Phase 7H - MVP Field Deployment Backlog Rebaseline - documentation/planning only
34. Phase 7I - Hosted Measurement Trust & Plausibility Guardrails - future
35. Phase 7J - Official Pinout, Wiring, and From-To Documentation - future
36. Phase 7K - Hosted At-a-Glance Measurement Trends - complete and present on `main`
37. Phase 7K.5 - ESP32 Runtime / Wi-Fi Recovery Incident Review - complete and present on `main`
38. Phase 7K.6 - Hosted Runtime Diagnostics Plain-English Visibility - validated / complete pending final commit/push
39. Phase 7L - MVP Customer Setup, Access, and Local-Control Boundary - complete and present on `main`
40. Phase 7L.1 - Customer/Site Access Simulation MVP - complete and present on `main`
41. Phase 7L.2 - Hosted Customer View Shell and UI Mode Boundary - implemented pending Jeremy review
42. Phase 7L.3 - Minimal Landing Page with Embedded Live Demo and Hosted App Route Shell - implemented pending validation and review
43. Phase 7L.4 - Customer Auth, Garden Membership, and RLS Implementation - complete and present on `main`
44. Phase 7M - Sensor Upgrade Decision Matrix and Balcony02 Build-Out Plan - documentation/design complete and present on `main`
45. Phase 7N.1 - Bench I2C/ADC/MUX Electrical Bring-Up and Topology Proof - runtime validated / complete
46. Phase 7N.2A - SEN0308-M01 ADS1115 A0 Diagnostic Proof - runtime validated / complete pending push
47. Phase 7N.2B - SEN0308-M02/M03/M04 Four-Channel Wiring Proof - runtime validated / documentation closeout pending commit
48. Phase 7N.3A - SEN0308 Measurement-System Screen - complete and present on `main` in commit `c10b89e`
49. Phase 7N.3B - SEN0308 Single-Operator MSA and Channel-Swap Screen - complete and present on `main` in commit `c10b89e`
50. Phase 7N.4A - SEN0562-L01 Controlled 3.3V Light-Sensor Proof - runtime validated / complete pending review and commit
51. Phase 7N.4B - SEN0562 Three-Sensor Muxed Light Proof - complete and present on `main`
52. Phase 7N.5 - SEN0308 Relative Moisture Index / Moisture Data Analytics / MSA Roadmap - current working analysis path / future implementation
53. Future separate review - SEN0204 Liquid-Level Electrical Feasibility
54. Phase 7O - Local Sampling, Control Evaluation, and Telemetry Cadence Decoupling - future
55. Phase 7O.1 - Watering Event Evidence and Cadence Separation Design - backend/firmware evidence path runtime validated; Phase 7O.2 hosted display implemented pending review
56. Phase 7P - Hardware Safety Maturity - future; Phase 7P.1 bench physical button proof runtime validated / complete pending commit
57. Phase 7Q - Pilot Deployment Package - future
58. Phase 7R.1 - ADR Source-Pack Compression and Decision Digest - documentation-only pending Jeremy review
59. Phase 7S.1 - Supabase Live Schema Inventory Snapshot - documentation-only pending Jeremy review
60. Phase 8A.1 - Prototype01 Firmware/Profile Installed Sensor Cleanup - complete
61. Phase 8A - Prototype01 Relative Moisture Index and Hosted Support View Card Cleanup - complete
62. Phase 8B.1 - Balcony02 Gen2 Physical Buildout and Runtime Prove-Out - complete
63. Phase 8B.2 - Gen2 `/measurements` Contract Cleanup and End-to-End Deployment - complete / end-to-end validated
64. Phase 8B.3 - Gen2 `/capabilities` Static Contract Cleanup - complete / live device validated
65. Phase 8B.4 - Gen2 `/status` Nested Diagnostics Contract Cleanup - complete / live device, cloud, and hosted-diagnostics validated
66. Phase 8B.5 - Gen2 Endpoint Integration and Closeout - complete / production validated
67. Phase 8B.6 - Hosted Short History Window Expansion - complete / production validated

Phase 5F, Phase 6A, Phase 6B, Phase 6C, Phase 6D, Phase 6E, Phase 6F, and Phase 6G are complete and merged to `main`; Phase 6H is complete. Phase 6J.0, Phase 6J.1, Phase 6J.2, Phase 6J.3, Phase 6J.4, Phase 6J.5, and Phase 6J.6 are complete. Phase 7A is accepted. Phase 7B is runtime validated on the Gen2 bench mule. Phase 7C Live Measurements Local Frontend MVP is runtime validated / complete. Phase 7D Gen2 Measurement Storage MVP is runtime validated / complete. Phase 7E Field Units Gen2 Compatibility Migration is runtime validated / complete and merged to main. Phase 7F.1 Hosted Gen2 UI Flexibility and Trend Charting is runtime/browser validated / complete pending commit. Phase 7F.3 Hosted Device Status Gen2 Freshness Fix is validated / complete pending commit. Phase 7G.0 Field Gen2 Soil Temperature and Scout BME280 Swap is validated / complete pending commit. Phase 7G.1 Calibration / Control Validation Baseline, Phase 7G.2 Gen2 Calibration Evidence Review, and Phase 7G.3 Gen2 Control-Quality Rule Design are complete and committed. Phase 7G.4 Gen2 Local Control-Quality Gates Firmware Implementation is committed and build-validated. Phase 7G.5 Gen2 Local Control-Quality Gates Runtime Validation is complete and present on `main` in commit `1ea2f5a Document Phase 7G.5 control gate runtime validation`. Phase 7K Hosted At-a-Glance Measurement Trends is complete and present on `main`. Phase 7K.5 ESP32 Runtime / Wi-Fi Recovery Incident Review is complete and present on `main` in commit `4863eac Add Phase 7K.5 runtime Wi-Fi recovery diagnostics`. Phase 7K.6 Hosted Runtime Diagnostics Plain-English Visibility is validated / complete pending final commit/push. Phase 7L MVP Customer Setup, Access, and Local-Control Boundary is complete and present on `main` in commit `c34e1bd Define MVP customer setup access and local control boundary`. Phase 7L.1 Customer/Site Access Simulation MVP is complete and present on `main` in commit `2d74588 Add customer site access simulation`. Phase 7L.2 Hosted Customer View Shell and UI Mode Boundary is implemented pending Jeremy review. Phase 7L.3 Minimal Landing Page with Embedded Live Demo and Hosted App Route Shell is implemented pending validation and review. Phase 7L.4 Customer Auth, Garden Membership, and RLS Implementation is complete and present on `main` in commit `1706798 Add customer auth garden membership RLS`, with Cloudflare production auto-deployed from `main` and credentialed browser validation passed on `https://mybalconygardener.boileragency.com`. Phase 7M Sensor Upgrade Decision Matrix and Balcony02 Build-Out Plan is documentation/design complete and present on `main` in commit `cb37ef7 Document Balcony02 sensor upgrade build-out plan`. Phase 7N.1 Bench I2C/ADC/MUX Electrical Bring-Up and Topology Proof is runtime validated / complete. Phase 7N.2A SEN0308-M01 ADS1115 A0 Diagnostic Proof is runtime validated / complete pending push. Phase 7N.2B SEN0308-M02/M03/M04 Four-Channel Wiring Proof is runtime validated / documentation closeout pending commit. Phase 7N.3A SEN0308 Measurement-System Screen and Phase 7N.3B SEN0308 Single-Operator MSA and Channel-Swap Screen are complete and present on `main` in commit `c10b89e Document SEN0308 measurement-system analysis`, with insertion/contact/media variation dominant over dead-sensor or confirmed A1 electrical-fault evidence. Phase 7N.4A and Phase 7N.4B are SEN0562 light-sensor proof work, not the moisture analytics phase; Phase 7N.4B is complete and present on `main` in commit `cf844f9 Add three-channel SEN0562 mux proof`. Phase 7N.5 SEN0308 Relative Moisture Index / Moisture Data Analytics / MSA Roadmap remains historical context for Balcony02 moisture-control readiness. Phase 7P.1 Bench Physical Button Push-to-Water Proof is runtime validated / complete pending commit, while broader Phase 7P hardware safety maturity remains future. Phase 8.0, Phase 8A.1, Phase 8A, and Phase 8B.1 through Phase 8B.6 are complete at their recorded evidence levels; Phases 8B.5 and 8B.6 are complete / production validated, and Phases 8C through 8F are planned. Future work remains organized around this question: what must be true before MBG can be deployed at someone else's balcony without Jeremy babysitting it?

## Phase 7K.6 - Hosted Runtime Diagnostics Plain-English Visibility - VALIDATED / COMPLETE PENDING FINAL COMMIT/PUSH

Outcome:

- Phase 7K.6 implementation was committed and merged to `main` in commit `986720a Add hosted runtime diagnostics plain-English visibility`; Cloudflare production auto-deployed from `main`.
- The Phase 7K.6 SQL artifact `docs/sql/phase7k6-hosted-runtime-diagnostics-view.sql` was manually applied in the Supabase SQL Editor after merge/deploy as a controlled database step.
- Hosted dashboard reads expanded live diagnostics from `public.hosted_device_diagnostics` successfully.
- Device Diagnostics explains diagnostics freshness, cloud reporting, connection/recovery state, and watering capability in plain English before raw details.
- Device Status and Device Diagnostics now use matched compact top pills and polished card-based overlay/popover panels in the shared top-panel area.
- Only one top panel opens at a time, and neither top panel pushes Live Measurements down.
- Raw heartbeat/status evidence remains preserved behind expandable advanced/details sections.
- Hosted Live Measurements recent-good display fallback uses already-fetched `hosted_gen2_measurements` rows for transient failed latest reads, preserves failed latest evidence in details, and can show a recent good same-identity value.
- Recent-good fallback remains presentation only: it does not change raw storage, authorize watering, change `control_eligible`, hide failed evidence, loosen moisture/control evidence, or reinterpret Raw ADC as calibrated moisture.
- Recent-good fallback was code-reviewed and build-validated, but no real sampled latest-failed/recent-good same-identity case was found during validation.

Out of scope:

- Firmware changes, firmware upload, deploy command, Supabase command/control, Remote Water Now, hosted local ESP32 calls, sensor/pin/threshold/duration/cooldown/device-ID changes, plant diagnosis, or sensor-root-cause diagnosis.
- SQL execution beyond the separately approved/manual Supabase SQL Editor application of the reviewed Phase 7K.6 hosted diagnostics view artifact.

## Phase 5D Validation — FIELD VALIDATED / COMPLETE

Validation Results (feature branch `phase5d-telemetry-logging-cadence`):

- ✅ Firmware compiles and uploaded successfully.
- ✅ ESP32 restarted successfully after upload.
- ✅ Local `/logs` endpoint working.
- ✅ Manual Water Now triggers correctly from local UI.
- ✅ Pump starts on Manual Water Now trigger.
- ✅ 15-second pump shutoff validated.
- ✅ Phase 5C cooldown behavior remains intact.
- ✅ Supabase telemetry still posts.
- ✅ Normal 15-minute telemetry cadence validated.
- ✅ Immediate watering-start telemetry with `data.watering: true` posts to Supabase immediately.
- ✅ Immediate watering-completion telemetry with `data.watering: false` posts to Supabase immediately.
- ✅ `lastWateringDuration` populated upon completion (~15 seconds).
- ✅ `sensor_logs` shape unchanged; contains top-level `device_id`, `timestamp`, nested `data`.
- ✅ `sensor_events` unchanged and not used by firmware.
- ✅ Local dashboard updates frequently from live `/logs` polling.
- ✅ Supabase normal telemetry shows ~15-minute cadence.
- ✅ Automatic watering tied to 15-minute cadence (pump did not activate immediately with manual threshold probe; consistent with cooldown eligibility).

Out of scope:

- Frontend graph marker polish (deferred to Phase 5E).
- Admin page.
- Settings page.
- Supabase schema changes.
- Remote command/control.

## Phase 5D Closeout / Merge - COMPLETE AND MERGED TO MAIN

Scope:

- Phase 5D behavior was field validated.
- Phase 5D closeout documentation was completed before Phase 5E work.
- Phase 5D was merged to `main` before Phase 5E began.

## Phase 5E — History Graph Event Semantics - VALIDATED / COMPLETE

Scope:

- The apparent point replacement/reordering was determined to be chart label/window interpretation, not a firmware or Supabase cadence failure.
- The graph now uses explicit chronological timestamp sorting.
- Watering-start rows are displayed as vertical event markers using `sensor_logs.data.watering = true`.
- Hover tooltip behavior is preserved.
- Chart dots remain hidden.
- The local live/control path and Manual Water Now were preserved.
- No watering-completion markers were added because the history graph resolution does not justify that complexity.
- Future UI polish may explore a local-vs-remote mode indicator:
  - **Local Control Mode:** ESP32 local network, fast live readings from frequent polling, Water Now enabled, real-time telemetry visibility.
  - **Remote Read-Only Mode:** Supabase-only, no Water Now, clear visual mode indicator, sparse ~15-minute telemetry cadence.
- Preserve the local ESP32 live/control path.
- Preserve the read-only Supabase history path.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Schema changes unless separately approved.
- Admin page.

## Phase 5F — Telemetry Integrity Hardening - COMPLETE AND MERGED TO MAIN

Scope:

- Firmware compiled successfully with `pio run`, uploaded to the ESP32, and was validated after upload.
- ESP32 rebooted cleanly after upload and after repeated USB power disconnect/reconnect cycles.
- Local dashboard showed the expected unavailable warning while the ESP32 was offline and recovered after the ESP32 returned.
- `/logs` works with the DHT connected.
- `/logs` works with the DHT disconnected after at least one good DHT reading has populated the cache.
- During DHT failure, temperature/humidity use cached last-known-good DHT values.
- During DHT failure, soil moisture remains a fresh analog read and is not cached.
- Manual Water Now still works, and the pump still stops after approximately `15` seconds.
- Supabase watering-start and watering-completion telemetry post immediately during DHT failure using cached DHT values plus fresh moisture.
- Supabase payload shape remains unchanged with top-level `device_id`, `timestamp`, and nested `data.temperature`, `data.humidity`, `data.moisture`, `data.watering`, `data.lastWateredTime`, and `data.lastWateringDuration`.
- No frontend changes or Supabase schema changes were made.

Out of scope:

- Sensor calibration experiments.
- Graph UI polish.
- Settings UI.
- Hardware safety sensors.

## Phase 6A - Hosted Read-Only Dashboard MVP - COMPLETE AND MERGED TO MAIN

Scope:

- Cloudflare Pages project `my-balcony-gardener` is GitHub-connected.
- Branch `phase6a-hosted-readonly-dashboard` was merged to `main`.
- Cloudflare Pages Production deployment is validated from `main`.
- Production hosted dashboard URL: `https://my-balcony-gardener.pages.dev`.
- Custom domain is configured and validated: `https://mybalconygardener.boileragency.com`.
- The custom domain was moved from the obsolete old `mybalconygardener` Cloudflare Pages/Tunnel setup to the current `my-balcony-gardener` Pages project.
- Hosted read-only mode is controlled by `VITE_MBG_DASHBOARD_MODE=hosted-readonly`.
- Hosted read-only build requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The single displayed device is controlled by `VITE_MBG_DEVICE_ID`.
- Hosted read-only mode renders Sensor History from Supabase.
- Hosted read-only Supabase history requests filter by `device_id` when `VITE_MBG_DEVICE_ID` is configured.
- Hosted read-only mode does not render `LiveStats`.
- Hosted read-only mode does not show Water Now.
- Hosted read-only mode does not call local `/logs` or `/water-now`.
- Hosted read-only production build scan found no `Water Now`, `/water-now`, `/logs`, or `10.0.0.200` strings after the lazy/dynamic import fix.
- Hosted custom-domain validation confirmed Garden check-in mode is visible, `LiveStats` and Water Now are hidden, Sensor History is visible, Supabase `sensor_logs` requests are visible, and there are no `/logs`, `/water-now`, or `10.0.0.200` requests.
- Local/default dashboard mode still renders `LiveStats`, local `/logs` polling, local Manual Water Now, and Sensor History.
- The local ESP32 live/control path and hosted read-only Supabase history path remain separate.
- Supabase remains telemetry/history only and is not command/control.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Multi-device UI.
- Admin or Settings behavior.
- Supabase schema changes.

## Advanced Sensor Health / Fault Detection

Deferred future work, not part of Phase 6F Device Status:

- Track repeated bad sensor reads.
- Track repeated low moisture readings after watering.
- Alert when a sensor appears stuck, disconnected, saturated, or implausible.
- Possibly require N consecutive low fresh moisture readings before automatic watering.
- Possibly require a post-watering stabilization period before trusting moisture again.
- Phase 6F Device Status is a basic read-only data-quality indicator and does not perform fault diagnosis.

## Hosted Read-Only Dashboard Follow-Up

Scope:

- Keep hosted dashboard read-only.
- Consider future polish only as separately approved work.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Multi-device UI unless separately approved.
- Admin or Settings behavior.

## Phase 6E - Hosted Device/Window Controls - VALIDATED / COMPLETE

Scope:

- Hosted read-only dashboard now has Device and Window selectors for Sensor History.
- Device selector supports Installed Balcony Unit (`balcony`, `550e8400-e29b-41d4-a716-446655440000`) and Bench Prototype Unit (`bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`).
- Window selector supports `24h`, `7d`, `1m`, `3m`, `6m`, `1y`, and `all`.
- URL query-string state supports valid combinations such as `?device=balcony&window=24h` and `?device=bench&window=7d`.
- Invalid query values safely fall back to Installed Balcony Unit / `24h`.
- `VITE_MBG_DEVICE_ID` remains the fallback/default hosted device behavior.
- Supabase history queries filter server-side by selected `device_id`.
- Supabase history queries filter by selected timestamp lower bound except for `all`, which applies no lower timestamp bound.
- Hosted read-only mode still does not render `LiveStats`, show Water Now, call local ESP32 `/logs`, or call local ESP32 `/water-now`.
- Supabase remains telemetry/history only and is not command/control.
- Local/default dashboard mode still renders `LiveStats`, local `/logs` polling, local Manual Water Now, and Sensor History.
- Manual Water Now remains local only.
- Chart X-axis labels adapt by selected history window.
- Chart tooltip shows full date/time.
- Local browser validation passed for balcony and bench devices across history windows.
- Invalid query fallback validation passed.
- `npm run lint` and `npm run build` passed.
- Hosted-readonly production bundle guardrail scan returned no output for `water-now`, `Water Now`, `/logs`, `Currently Watering`, `LiveStats`, `VITE_ESP32_URL`, or `VITE_WATER_ENDPOINT`.
- Cloudflare/custom-domain production validation passed at `https://mybalconygardener.boileragency.com`.
- No firmware changes were made.
- No Supabase schema changes were made.
- `sensor_events` was unchanged.
- The canonical `SensorLogRow` shape was unchanged.
- Watering logic and local Manual Water Now behavior were unchanged.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Supabase schema changes.
- Firmware changes.
- Watering logic changes.
- Advanced sensor health / fault detection.
- Calibration.
- Alerts.
- Auth/login.
- Device registry.
- Settings/provisioning UI.

## Phase 6F - Hosted Read-Only Device Status / Telemetry Quality - COMPLETE AND MERGED TO MAIN

Scope:

- Added pure helper `mbg_dashboard/src/telemetryHealth.ts`.
- Added presentational `mbg_dashboard/src/components/SensorHealthPanel.tsx`.
- Added component CSS `mbg_dashboard/src/components/SensorHealthPanel.css`.
- Wired Device Status into `SensorLogViewer.tsx` using already-fetched rows only.
- No second Supabase query.
- No firmware changes.
- No Supabase schema changes.
- No `SensorLogRow` shape changes.
- No `sensor_events` changes.
- No Water Now / Remote Water Now.
- No local live/control behavior changes.
- Device Status evaluates latest report age, row count, expected row count, coverage, largest gap, broad latest-reading plausibility, and watering history marker count.
- User-facing indicator is "Device Status" with green/yellow/red behavior.
- Hosted-readonly guardrail scan passed.
- Local hosted-readonly browser validation passed.
- Cloudflare preview validation passed.
- Production/custom-domain validation passed after merge to `main`.

Out of scope:

- Sensor calibration.
- Plant diagnosis.
- Fault diagnosis beyond basic data-quality status.
- Alerts/notifications.
- Responsive hosted dashboard polish.
- Firmware changes.
- Supabase command/control.

## Phase 6G - Offline Autonomy / Wi-Fi Recovery - COMPLETE ON BRANCH

Scope:

- Firmware no longer restarts solely because Wi-Fi is unavailable during boot.
- ESP32 continues into local-control/offline mode when Wi-Fi is unavailable.
- Wi-Fi reconnect is retried periodically without blocking local control.
- Pump shutoff is checked before client/server/network/telemetry work.
- Relay shutoff remains local and occurs before watering-completion telemetry.
- Supabase remains telemetry/history only and is not command/control.
- Hosted read-only dashboard may show stale or no recent data when telemetry stops.
- Bench profile built successfully.
- Bench profile flashed successfully.
- Bench unit booted successfully on normal Wi-Fi.
- Bench unit served valid `/logs`.
- Offline/no-Wi-Fi behavior is code-hardened and static-inspected, but not physically no-Wi-Fi tested in this phase because Wi-Fi/router disruption was not available.

Out of scope:

- AP/captive portal provisioning.
- Stored customer credentials.
- Setup/reset mode.
- Status indication.
- Offline log buffering.
- Hardware safety changes.
- Supabase schema changes.
- Frontend runtime changes.

## Phase 6H - Sensor Fault Detection / Raw ADC Visibility - COMPLETE

Scope:

- Raw soil ADC visibility was implemented and validated in commit `8157e66 Add raw soil ADC diagnostic telemetry`.
- Firmware build passed with `pio run`.
- Frontend lint passed.
- Frontend build passed.
- Local bench `/logs` showed `data.soilRawAdc`.
- Supabase `sensor_logs.data` received `soilRawAdc`.
- Before correcting the moisture signal wire, bench Supabase telemetry for device `318fab98-89ad-4f36-9100-3134a04e0be5` at `2026-05-14T19:52:12Z` showed moisture index `100` with `soilRawAdc: 0`; this specific mapped `100` was caused by raw ADC `0`, but it does not prove all mapped `100` values are raw ADC `0`.
- After moving the bench moisture signal wire to the firmware-defined `SOIL_PIN`, local `/logs` at `2026-05-14 16:01:51` showed moisture index `30` with `soilRawAdc: 2925`, moving from a pinned `0` condition to a plausible analog value.
- A later Supabase row after pin correction at `2026-05-14T20:07:12Z` showed moisture index `30` with `soilRawAdc: 2921`.
- The sensor sitting on the bench, not in soil or water, triggered automatic relay logic because mapped moisture was below `MOISTURE_THRESHOLD`.
- Moist bench soil later showed local `/logs` at `2026-05-14 16:09:25` with moisture index `73` and `soilRawAdc: 1889`.
- Local dashboard was run against the bench unit and displayed Raw Soil ADC successfully.
- Sensor History for the bench unit showed usable data across the 7-day window with a few DHT dropouts visible.
- `sensor_events` was used manually to record the raw ADC validation, pin correction, clarification that one reading was not in soil, sensor placement into moist bench soil, and moist-soil reference reading.
- `data.moisture` remains a derived moisture index, not a calibrated soil-moisture percentage.
- `data.soilRawAdc` is diagnostic raw ESP32 ADC evidence.
- Moisture mapping, thresholds, watering duration, cooldown, pump shutoff behavior, and Manual Water Now behavior were unchanged.

Out of scope:

- Calibration.
- Filtering.
- Repeated-reading validation.
- Invalid-reading rejection.
- Quiet hours.
- Hardware safety.
- Supabase command/control.
- Remote Water Now.

## Phase 6J.0 - Multi-Unit Visibility / Local Control Target Safety - COMPLETE / CURRENT CLOSEOUT

Scope:

- Hosted-safe frontend device registry now covers Installed Balcony Unit, Bench Prototype Unit, and Balcony Sensor Scout 01.
- Local-only control target metadata keeps local IP/manual-action information out of hosted history code.
- Hosted/history Device selector includes scout01 and remains read-only.
- Local/default dashboard has a distinct Local Control Target selector.
- Local live polling can switch between known ESP32 units from one local Vite site.
- Manual action is gated by selected target and live `/logs` `device_id` match.
- Installed Balcony Unit uses Water Now wording only when identity is verified.
- Bench Prototype Unit uses relay-test wording only when identity is verified.
- Balcony Sensor Scout 01 remains manual-action disabled.
- Supabase `sensor_logs` RLS INSERT policy was manually updated to allow scout01 telemetry.
- A near-live scout01 Sensor History row was observed after the RLS update.
- No firmware, Supabase schema, `SensorLogRow`, watering duration, threshold, cooldown, or sensor logic changes were made.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Supabase schema migration.
- Firmware behavior changes.
- Production provisioning database.

## Phase 6J.1 - Device Diagnostics / Heartbeats / Reliability Evidence - DESIGN / ADR

Scope:

- ADR 0014 defines a separate diagnostics/heartbeat architecture for ESP32 device-health evidence.
- `device_heartbeats` is the recommended future append-only historical heartbeat/evidence table.
- `device_heartbeats` remains separate from `sensor_logs` plant/environment telemetry and `sensor_events` manual operational context.
- Future `GET /status` is recommended as a read-only local diagnostics endpoint.
- Diagnostics should exist on every deployed unit, including controller, sensor-only/scout, and bench units.
- Recommended diagnostic fields cover identity/configuration, runtime, Wi-Fi, Supabase/cloud posting, sensor read health, watering/control safety, local-only diagnostics, and deferred/future fields.
- Recommended MVP heartbeat cadence is boot when Wi-Fi/time allows plus periodic 15-minute heartbeats.
- Future event-triggered heartbeats after Wi-Fi reconnect and cloud recovery are deferred.
- Hosted dashboard diagnostics display is deferred until `/status` and `device_heartbeats` are proven.
- No firmware, frontend runtime, SQL schema, `SensorLogRow`, watering duration, threshold, cooldown, pin, sensor, moisture mapping, or local control behavior changes are included in this design pass.

Follow-up implementation slices, requiring separate approval:

- Add firmware heartbeat posting.
- Add hosted read-only diagnostics display after the diagnostics path is proven.
- Add latest-status `device_status_current` table/view if append-only evidence proves useful.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Anonymous update/delete policies.
- Firmware behavior changes.
- SQL migrations.
- Frontend runtime changes.
- `SensorLogRow` changes.
- Hosted-readonly control boundary changes.

## Phase 6J.2 - Local Read-Only `/status` Endpoint MVP - BENCH VALIDATED / COMPLETE

Scope:

- Implemented local read-only `GET /status` diagnostics endpoint in `src/main.cpp`.
- `/status` reports existing runtime state and lightweight ESP32/Wi-Fi diagnostics.
- `/status` does not read DHT or soil sensors.
- `/status` is local diagnostics only and does not post to Supabase.
- Bench validation passed on Bench Prototype Unit UUID `318fab98-89ad-4f36-9100-3134a04e0be5` at IP `10.0.0.192`.
- `/status` returned valid JSON.
- `/status` reported `wifi_connected: true`.
- `/status` reported `wifi_rssi: -45`.
- `/status` reported `hasLastGoodDht: true`.
- `/status` reported `free_heap: 235028` and `min_free_heap: 186292`.
- `/status` reported `currently_watering: false`.
- No Supabase `device_heartbeats` table was added.
- No Supabase heartbeat posting was added.
- No frontend runtime behavior changed.
- No `SensorLogRow` change was made.
- No intentional `/logs` behavior change was made.
- No `/water-now` behavior change was made.
- No watering duration, threshold, cooldown, moisture mapping, pin, or sensor logic changed.

Follow-up implementation slices, requiring separate approval:

- Add firmware heartbeat posting.
- Add hosted read-only diagnostics display after the diagnostics path is proven.
- Add latest-status `device_status_current` table/view if append-only evidence proves useful.

Out of scope:

- Supabase command/control.
- Remote Water Now.
- SQL migrations.
- Firmware heartbeat posting.
- Frontend runtime changes.
- Hosted dashboard behavior changes.
- `SensorLogRow` changes.
- Watering behavior changes.

## Phase 6J.3 - Supabase `device_heartbeats` SQL/RLS MVP - MANUALLY VALIDATED / COMPLETE

Scope:

- Added SQL artifact `docs/sql/phase6j3-device-heartbeats.sql`.
- The SQL artifact defines `public.device_heartbeats` as an append-only diagnostics/evidence table.
- RLS is enabled.
- Anon INSERT policy is limited to known provisioned device IDs.
- No anon SELECT policy is included in Phase 6J.3.
- No UPDATE policy is included.
- No DELETE policy is included.
- Constraints and indexes are included.
- Manual validation SQL is kept as a commented block in the SQL artifact.
- Supabase validation was performed manually in the SQL Editor.
- `public.device_heartbeats` was created successfully.
- Manual validation insert succeeded for Bench Prototype Unit.
- Validation row used bench `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`, `device_label` `Bench Prototype Unit`, `device_role` `bench`, and `heartbeat_reason` `manual_sql_validation`.
- `select` from `public.device_heartbeats` ordered by `heartbeat_at desc` returned the validation row.
- SQL Editor validation proves the table, constraints, indexes, and owner/admin insert path.
- SQL Editor validation does not fully prove anon REST/RLS insert behavior because SQL Editor usually runs with elevated privileges.
- Anon insert validation is deferred until firmware heartbeat posting or a dedicated REST test is approved.
- No firmware heartbeat posting was added.
- No hosted diagnostics display was added.
- No Supabase command/control was introduced.

Follow-up implementation slices, requiring separate approval:

- Phase 6J.4 firmware heartbeat posting MVP.
- Dedicated anon REST/RLS insert validation if not covered by firmware heartbeat validation.
- Hosted read-only diagnostics display after the diagnostics path is proven.
- Latest-status `device_status_current` table/view if append-only evidence proves useful.

Out of scope:

- Firmware changes.
- Frontend runtime changes.
- Hosted dashboard diagnostics display.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` changes.
- Watering behavior changes.
- Supabase command/control.
- Remote Water Now.

## Phase 6J.4 - Firmware Heartbeat Posting MVP - BENCH VALIDATED / COMPLETE

Scope:

- Added firmware posting from local diagnostics state to `public.device_heartbeats`.
- Added `HEARTBEAT_INTERVAL_MS` default `900000`.
- Added `lastHeartbeatPostTime`.
- Added `DEVICE_ROLE` through `MBG_DEVICE_ROLE` in `src/device_identity.h`.
- Added `MBG_DEVICE_ROLE` build flags in `platformio.ini`: `balcony-installed` is `controller`, `bench-prototype` is `bench`, and `balcony-sensor-scout-01` is `sensor-scout`.
- Added periodic-only `sendDeviceHeartbeatToSupabase("periodic")`.
- Heartbeat posting occurs after pump shutoff priority, after `maintainWiFiConnection()`, after `server.handleClient()`, and after the regular sensor logging / automatic watering eligibility block.
- Existing `sendDataToSupabase()` remains unchanged.
- No boot heartbeat was added.
- No Wi-Fi reconnect heartbeat was added.
- No cloud recovery heartbeat was added.
- No offline buffering or aggressive retry was added.
- All PlatformIO builds passed.
- Bench profile upload succeeded.
- No upload was performed to `balcony-installed` or `balcony-sensor-scout-01` because those units are collecting field data.
- Bench `/status` still worked after upload.
- Bench `/logs` still worked after upload.
- Bench firmware inserted a new row into `public.device_heartbeats`.
- Firmware heartbeat row used `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`, `device_role` `bench`, `heartbeat_reason` `periodic`, `uptime_seconds` `901`, `wifi_connected` `true`, `wifi_rssi` `-52`, `free_heap` `238348`, `min_free_heap` `190036`, `currently_watering` `false`, `last_watering_duration` `0`, and `details` `{"phase":"6J.4","source":"firmware"}`.
- The successful firmware heartbeat validates anon REST/RLS insert behavior for the bench device.
- No Supabase command/control was introduced.

Follow-up implementation slices, requiring separate approval:

- Hosted diagnostics display.
- Latest-status `device_status_current` table/view.
- Supabase device registry / table-driven provisioned device allowlist.

Out of scope:

- Frontend runtime changes.
- Hosted dashboard behavior changes.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` behavior changes.
- Watering duration, threshold, cooldown, moisture mapping, pin, sensor, or automatic watering logic changes.
- Supabase command/control.
- Remote Water Now.

## Phase 6J.5 - Supabase Device Registry / Table-Driven Provisioned Device Allowlist - MANUALLY VALIDATED / COMPLETE

Scope:

- ADR 0015 defines `public.device_registry` as the Supabase provisioned-device registry.
- SQL artifact `docs/sql/phase6j5-device-registry.sql` creates and seeds the registry for Installed Balcony Unit, Bench Prototype Unit, and Balcony Sensor Scout 01.
- Registry-backed RLS replaces repeated hardcoded UUID allowlists for device-originated inserts.
- `sensor_logs` INSERT is allowed only when the registry row is active and `telemetry_insert_enabled`.
- `device_heartbeats` INSERT is allowed only when the registry row is active and `heartbeat_insert_enabled`.
- `public.device_registry` has no anon SELECT, INSERT, UPDATE, or DELETE policy in this phase.
- SECURITY DEFINER helper functions allow RLS policies to check registry state without granting broad registry read access.
- Policy replacement is intentionally scoped to anon/public INSERT policies on `sensor_logs` and `device_heartbeats`; SELECT, UPDATE, DELETE, and authenticated-only policies are not targeted.
- Registry flags authorize telemetry and heartbeat inserts only and are not command/control.
- Hosted diagnostics display remains deferred.
- Limited read-only registry view remains deferred.
- Latest-status `device_status_current` table/view remains deferred.
- Sensor calibration remains deferred and is now tracked in the Phase 7N deployment-readiness roadmap; it is not part of this device-registry phase.
- Supabase validation confirmed `public.device_registry` exists.
- Registry rows exist for Installed Balcony Unit (`balcony`, `controller`, `550e8400-e29b-41d4-a716-446655440000`), Bench Prototype Unit (`bench`, `bench`, `318fab98-89ad-4f36-9100-3134a04e0be5`), and Balcony Sensor Scout 01 (`scout01`, `sensor-scout`, `28f4e6e3-5979-4af4-9753-34e185d8e47e`).
- All three registry rows are active with `telemetry_insert_enabled`, `heartbeat_insert_enabled`, and `hosted_visible` set to `true`.
- Supabase validation confirmed `sensor_logs` INSERT policy is registry-backed.
- Supabase validation confirmed `device_heartbeats` INSERT policy is registry-backed.
- The existing public/anon `sensor_logs` SELECT policy remains.
- `device_registry` has no anon SELECT policy.
- Helper function validation passed: bench telemetry allowed is `true`, bench heartbeat allowed is `true`, fake telemetry allowed is `false`, and fake heartbeat allowed is `false`.
- After registry-backed RLS, `device_heartbeats` continued receiving firmware heartbeat rows.
- After registry-backed RLS, `sensor_logs` continued receiving rows from known provisioned devices.
- No Supabase command/control or Remote Water Now was introduced.

Follow-up validation and implementation slices, requiring separate approval:

- Hosted diagnostics display.
- Add a limited read-only device registry view later only if hosted/frontend labels need Supabase-backed registry reads.

Out of scope:

- Remote Water Now.
- Supabase command/control.
- Hosted diagnostics display.
- Firmware behavior changes.
- Frontend runtime changes.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` changes.
- Watering duration, threshold, cooldown, moisture mapping, pin, sensor, or automatic watering logic changes.

## Phase 6J.6 - Hosted Read-Only Diagnostics Display MVP - COMPLETE AND MERGED TO MAIN

Scope:

- Add SQL artifact `docs/sql/phase6j6-hosted-device-diagnostics-view.sql`.
- Create limited read-only view `public.hosted_device_diagnostics`.
- Join active, hosted-visible `public.device_registry` rows to the latest `public.device_heartbeats` row per device.
- Expose only safe hosted diagnostics fields: device identity label/key/role, hosted visibility, latest heartbeat time/age/reason, uptime, Wi-Fi connected/RSSI, heap evidence, latest heartbeat watering evidence, and last watering duration.
- Grant SELECT on the view to `anon` and `authenticated`.
- Keep base `public.device_registry` anon SELECT unapproved.
- Add frontend `fetchDeviceDiagnostics(selectedDeviceId = '')` using `public.hosted_device_diagnostics`, selected `device_id` filtering, and `maybeSingle()`.
- Add read-only `DeviceDiagnosticsPanel` near Sensor History / Device Status.
- Show Diagnostics Fresh, Diagnostics Stale, or No Diagnostics Yet using `DIAGNOSTIC_HEARTBEAT_WARNING_THRESHOLD_SECONDS = 35 * 60`.
- Phrase watering as latest heartbeat evidence only, not guaranteed live pump state.
- Wire diagnostics fetching into `SensorLogViewer` without changing existing Sensor History, selectors, `SensorHealthPanel`, or `DualAxisChart` behavior.

Out of scope:

- Firmware changes.
- `SensorLogRow` changes.
- `/status`, `/logs`, or `/water-now` changes.
- Watering behavior, threshold, duration, cooldown, moisture mapping, pin, sensor, `LiveStats`, `DualAxisChart`, or `SensorLogRow` changes.
- Base registry anon read.
- INSERT policy weakening.
- UPDATE or DELETE policies.
- Supabase command/control or Remote Water Now.
- Plant health diagnosis, sensor calibration diagnosis, root-cause diagnosis, alerts, or live pump-state guarantees.

## Phase 7A - Gen2 Modular Sensor Architecture Lock - ACCEPTED

Scope:

- Create ADR 0016 to define Gen2 as a modular grow-environment platform where sensors, capabilities, and control authority are independently discoverable, optional, and replaceable.
- Preserve Gen1/current compatibility through the existing `SensorLogRow` / `sensor_logs` telemetry history contract.
- Keep expanded Gen2 measurements separate from legacy `SensorLogRow`, likely through a future `public.sensor_measurements` measurement-list/table path.
- Define sensor modules as independent software components with their own detection, read timing, validity, quality, reason, and control eligibility reporting.
- Define the standard Gen2 measurement record fields: `device_id`, `measured_at`, `sensor_key`, `sensor_type`, `measurement_name`, `measurement_value`, `measurement_unit`, `valid`, `quality`, `reason`, `control_eligible`, and `details`.
- Clarify that valid for display is not the same as valid for control.
- Require watering control to use only measurements explicitly marked `control_eligible`.
- Retire GPIO5 from future Gen2 relay/pump control designs without changing the installed balcony unit in this phase.
- Approve I2C SDA/SCL as a short-range local sensor-module bus.
- Defer long-distance sensing to separate ESP32 sensor nodes or a future deliberate fieldbus design, such as RS-485/Modbus, after separate evaluation.
- Keep local ESP32 firmware as the owner of watering decisions and pump shutoff.
- Keep Supabase as telemetry/history/diagnostics storage only, with no command/control or Remote Water Now.

Follow-up placeholders, requiring separate approval:

- Phase 7B — Gen2 Bench Platform Bring-Up
- Phase 7C — Live Measurements Local Frontend MVP
- Phase 7D — Gen2 Measurement Storage MVP
- Phase 7E — Field Units Gen2 Compatibility Migration
- Phase 7F.1 — Hosted Gen2 UI Flexibility and Trend Charting
- Phase 7H - MVP Field Deployment Backlog Rebaseline
- Phase 7I - Hosted Measurement Trust & Plausibility Guardrails
- Phase 7J - Official Pinout, Wiring, and From-To Documentation
- Phase 7K - Hosted At-a-Glance Measurement Trends
- Phase 7K.5 - ESP32 Runtime / Wi-Fi Recovery Incident Review
- Phase 7L - MVP Setup / Provisioning Boundary
- Phase 7M - Sensor Upgrade Decision Matrix
- Phase 7N - Sensor Calibration / Measurement-System Evaluation
- Phase 7O - Local Sampling, Control Evaluation, and Telemetry Cadence Decoupling
- Phase 7P - Hardware Safety Maturity
- Phase 7Q - Pilot Deployment Package

Out of scope:

- Firmware code changes.
- Firmware upload.
- Frontend runtime behavior changes.
- Supabase SQL changes.
- Creating `sensor_measurements`.
- Adding BME280, DS18B20, VEML6030, light, pressure, soil temperature, reservoir level, flow, PAR, or extra moisture readings into `SensorLogRow.data`.
- Changing watering duration, watering threshold, cooldown, moisture mapping, automatic watering logic, Manual Water Now behavior, hosted-readonly boundary, Supabase command/control boundary, or existing Gen1 local control safety.
- Changing the installed balcony unit's relay/pump control design in this phase.

## Phase 7B - Gen2 Bench Platform Bring-Up - RUNTIME VALIDATED / COMPLETE

Scope:

- Added `bench-proto-gen2` as the Gen2 bench PlatformIO profile.
- Kept `bench-prototype` as the retained Gen1 fallback/reference PlatformIO profile.
- The physical bench ESP32 UUID remains `318fab98-89ad-4f36-9100-3134a04e0be5`.
- The physical bench ESP32 is now acting as the Gen2 mule after Gen2 rewire and `bench-proto-gen2` flash.
- Added local Gen2 `/capabilities` and `/measurements` endpoints.
- For Gen2, `/measurements` is authoritative for measurement data.
- `/logs` remains a Gen1 compatibility endpoint and is intentionally not registered for `bench-proto-gen2`; it returns `404` on the Gen2 bench.
- Added Gen2 not-found observability that identified external legacy `/logs` polling after old tabs/Vite were closed.
- Added modular Gen2 support for BME280, DS18B20, VEML6030, and analog soil moisture.
- BME280 emits `air_temperature`, `relative_humidity`, and `barometric_pressure`.
- DS18B20 emits `temperature`.
- VEML6030 emits `ambient_light`.
- Analog soil moisture emits `moisture_index` and `raw_adc`.
- Gen2 I2C scan reports `0x48` and `0x76`.
- All Gen2 measurement records are `control_eligible:false`.
- Phase 7B Gen2 measurements are local-only.
- No `public.sensor_measurements` table exists yet.
- Gen2 no longer runs the legacy DHT / `sensor_logs` / automatic-watering interval block.
- Device heartbeats continue posting with `details.phase = "7B"`.
- On `bench-proto-gen2`, `/water-now` remains the simulated production watering endpoint and toggles the GPIO25 bench output through `RELAY_PIN`; no pump is attached.
- Earlier Phase 6J relay-test wording remains historical Gen1 bench safety language. Phase 7B intentionally keeps watering terminology for `bench-proto-gen2` because the bench now simulates the production watering function while remaining physically pump-free.
- The protected untracked CSV `field_readings/phase6k1_b3e1_vs_b6e2_60s_watering_response_20260521_180127.csv` remains untouched.

Validation:

- `/status` works.
- `/capabilities` works.
- `/measurements` works.
- `/logs` returns `404` because it is not registered for Gen2.
- BME280, DS18B20, VEML6030, analog soil moisture, and I2C scan diagnostics were runtime validated on the Gen2 bench mule.

Out of scope:

- `SensorLogRow` changes.
- Supabase SQL changes.
- Creating `public.sensor_measurements`.
- Hosted dashboard changes.
- Frontend runtime changes.
- Supabase command/control or Remote Water Now.
- Installed balcony controller upload.
- Scout upload.
- Adding Gen2 measurement values to `SensorLogRow.data`.

## Phase 7C - Live Measurements Local Frontend MVP - RUNTIME VALIDATED / COMPLETE

Scope:

- Added local-only `LiveMeasurements` frontend component with user-facing title `Live Measurements`.
- Added local-only types/API helpers for `/status`, `/capabilities`, and `/measurements`.
- Added local default-mode rendering only.
- Preserved existing `LiveStats` `/logs` path.
- Preserved hosted-readonly guardrails.
- Moved technical diagnostics, module details, and raw records behind collapsed advanced sections after visual review.
- Kept `Water Now` wording and `/water-now` semantics for bench simulation with no pump attached.

Validation:

- Runtime validation passed against `bench-proto-gen2` at `10.0.0.192`.
- Rendered BME280 `air_temperature`, BME280 `relative_humidity`, and BME280 `barometric_pressure`.
- Rendered DS18B20 `temperature`.
- Rendered VEML6030 `ambient_light`.
- Rendered analog soil moisture `moisture_index` and `raw_adc`.
- Hosted-readonly production bundle guardrail scan passed and did not bundle local Live Measurements, bench IP, local endpoint strings, `/logs`, or `/water-now`.

Out of scope:

- No measurement storage was created.
- No `public.sensor_measurements`.
- No `SensorLogRow` change.
- No SQL change.
- No firmware change.
- No hosted-readonly behavior change.
- No watering behavior change.
- Protected CSV remained untouched.

## Phase 7D - Gen2 Measurement Batch Storage MVP - RUNTIME VALIDATED / COMPLETE

Scope:

- Added ADR 0017 for Gen2 measurement batch storage.
- Added SQL artifact `docs/sql/phase7d-sensor-measurement-batches.sql`.
- Gen2 raw measurement storage uses `public.sensor_measurement_batches`.
- One database row equals one complete Gen2 `/measurements` package from one device at one measured time.
- The full `records[]` array is stored as `jsonb`.
- Added `public.sensor_measurements_flat` as the derived chart/query view that unnests `records[]`.
- Firmware posts one batch object to `/rest/v1/sensor_measurement_batches`.
- Registry-backed RLS uses `public.is_device_telemetry_insert_enabled(device_id)`.
- Phase 7D adds no anon SELECT, UPDATE, or DELETE policies.
- Hosted read-only measurement display remains deferred to a future frontend phase.
- JSONB/GIN indexing on `records` is deferred until real query patterns justify it.
- Unique physical sensor inventory / sensor assignment tracking is deferred to a later phase.
- `sensor_events` remains an operational note log, not the source of truth for defining installed physical sensors.

Validation:

- Supabase SQL validation passed for `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, manual owner/admin insert, flat-view expansion, and registry helper behavior.
- `bench-proto-gen2` uploaded successfully to COM5; no other firmware environment was uploaded.
- Firmware batch insert validated on bench UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Validated firmware batch had `record_count = 7`, `device_role = bench`, `source_endpoint = /measurements`, and `batch_details` `{"phase":"7D","source":"firmware","post_cadence_ms":900000}`.
- Validated measurement names: `air_temperature`, `relative_humidity`, `barometric_pressure`, `temperature`, `ambient_light`, `moisture_index`, and `raw_adc`.
- All current Gen2 records remain `control_eligible:false`.
- Initial runtime boot Wi-Fi timed out and firmware continued in local-control/offline mode; Wi-Fi later recovered because measurement batch POST and heartbeat POST succeeded.
- Codex/workstation HTTP checks to `10.0.0.192:80` failed even though browser/serial evidence showed Gen2 runtime activity.
- Serial showed an unexpected external `Manual watering triggered` event during validation, likely from an open local UI or other local client still targeting the bench; no pump is attached to the bench, and this is not a Phase 7D blocker.
- The earlier abandoned long/narrow `public.sensor_measurements` validation table was cleaned up manually in Supabase if Jeremy confirms it has been dropped.

Out of scope:

- `SensorLogRow` changes.
- `sensor_logs` changes.
- Gen1 `/logs` behavior changes.
- `/water-now` semantics changes.
- Hosted read-only UI changes.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering logic, or control eligibility changes.
- Making any new sensor control watering.
- JSONB/GIN indexing on `records`.
- Unique physical sensor inventory / assignment tracking.

## Phase 7E - Field Units Gen2 Compatibility Migration - RUNTIME VALIDATED / COMPLETE PENDING COMMIT

Scope:

- Added the installed field-controller Gen2 profile `balcony-installed-gen2` while preserving installed UUID `550e8400-e29b-41d4-a716-446655440000` and role `controller`.
- Moved Balcony Sensor Scout 01 to Gen2 under `balcony-sensor-scout-01`, preserving UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e` and role `sensor-scout`.
- Aligned Gen2-capable profiles to the standard Gen2 pin map: GPIO25 relay/pump output, GPIO34 analog soil moisture, GPIO21 I2C SDA, GPIO22 I2C SCL, GPIO26 DHT11 / non-I2C auxiliary digital sensor, and GPIO27 DS18B20 / OneWire future soil temperature.
- Aligned `bench-proto-gen2` to the standard Gen2 pin map and made `bench-prototype` explicitly declare the relevant standard pins while keeping it non-Gen2.
- Added Gen2 DHT11 support emitting `air_temperature` in `F` and `relative_humidity` in `%`.
- Reused the Gen2 analog soil module emitting `moisture_index` and `raw_adc`.
- Added capability-gated watering authority separate from `MBG_GEN2_ENABLED`.
- Installed `Balcony01` remains watering-capable; Scout `Scout01` remains non-watering.
- Added firmware/build provenance: `firmware_version`, `build_profile`, and compile-time `device_label`.
- Added short display labels `Balcony01`, `Scout01`, and `Prototype01` for endpoint readability only. These are not user-editable names or database-driven nicknames.
- Added `device_label`, `firmware_version`, and `build_profile` to local endpoint responses where applicable.
- Gen2 batch posts now include top-level `firmware_version` and `build_profile`, plus `batch_details.phase = "7E"` and `batch_details.device_label`.
- Installed/scout Gen2 retain `/logs` temporarily through `MBG_GEN2_ENABLE_LEGACY_LOGS=1` to protect current local scripts/UI during migration.
- `bench-proto-gen2` intentionally keeps `/logs` absent.
- Hosted Gen2 read-only measurement display remains deferred to a future frontend phase.

Validation:

- Installed / `Balcony01` validated at `10.0.0.200` after upload with UUID `550e8400-e29b-41d4-a716-446655440000`, role `controller`, build profile `balcony-installed-gen2`, and firmware version `phase7e-gen2-compat`.
- Installed local endpoints `/`, `/status`, `/capabilities`, `/measurements`, and `/logs` validated.
- Installed `/measurements` returns `air_temperature`, `relative_humidity`, `moisture_index`, and `raw_adc`.
- Installed `moisture_index` is the only `control_eligible:true` measurement; DHT11 records and `raw_adc` are `control_eligible:false`.
- Scout / `Scout01` validated at `10.0.0.180` after upload with UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, role `sensor-scout`, build profile `balcony-sensor-scout-01`, and firmware version `phase7e-gen2-compat`.
- Scout local endpoints `/`, `/status`, `/capabilities`, `/measurements`, and `/logs` validated.
- Scout `/measurements` returns `air_temperature`, `relative_humidity`, `moisture_index`, and `raw_adc`.
- All scout measurements are `control_eligible:false`.
- Installed and scout `/logs` retained legacy nested `data` shape with added top-level identity fields.
- A Gen2 installed-controller firmware batch posted successfully to `public.sensor_measurement_batches`, and the flat-view validation matched record counts.
- `/water-now` was not called during final label/provenance validation.

Known deferred wart:

- Immediately after reboot, Gen2 DHT11 `/measurements` may show suspicious startup values around `32.72°F / 0%`.
- Later `/measurements` samples and `/logs` are plausible.
- DHT11 startup read qualification is deferred and is not a Phase 7E blocker because DHT11 records are not watering control inputs.

Out of scope:

- Frontend changes.
- Hosted Gen2 read-only display.
- Supabase SQL changes.
- `SensorLogRow` changes.
- `sensor_logs` changes.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering semantics, or `/water-now` semantics changes.
- Runtime provisioning, pump detection, diagnostic watering endpoints, or startup relay tests.
- The currently running two-device watering-response capture; those CSV results support later calibration/control-quality work and are not Phase 7E closeout evidence.

## Phase 7F.1 - Hosted Gen2 UI Flexibility and Trend Charting - RUNTIME/BROWSER VALIDATED / COMPLETE PENDING COMMIT

Scope:

- Added SQL artifact `docs/sql/phase7f-hosted-gen2-measurements-view.sql`.
- Added limited hosted read-only view `public.hosted_gen2_measurements`.
- Kept hosted Gen2 display on the approved Supabase read path only.
- Kept anon SELECT unavailable on `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, and `public.device_registry`.
- Added hosted-only frontend `HostedGen2Measurements` and separate Gen2-aware `HostedGen2TrendChart`.
- Made hosted Gen2 UI measurement-driven so all numeric hosted Gen2 measurements returned by `public.hosted_gen2_measurements` can display with friendly frontend labels.
- Kept `DualAxisChart` Gen1-only and did not expand `SensorLogRow` or add Gen2 measurements to `sensor_logs.data`.
- Added Gen2 Trend multi-measurement overlay using toggle pills.
- Added dynamic Y-axis groups, color-coded axes matching chart series/legend, and expert overlay mode with multiple right-side axes.
- Added display-only useful domains for temperature (`20-100F`) and barometric pressure (environmentally realistic hPa range with real-data expansion as needed).
- Prevented Gen2 Trend flashing during hosted background refresh.
- Renamed `Gen2 Measurements` to `Live Measurements`.
- Removed the device/unit name line and hosted read-only pill from the Live Measurements container.
- Renamed `Latest batch` to `Last Reading`.
- Collapsed engineering details by default while preserving sensor key, sensor type, valid, quality, reason, and control eligibility behind details.
- Added gardener-facing card status styling for Good, Watch, Check, and Neutral/category states, with full-card background/border status color.
- Prevented Live Measurements cards from clearing, flashing, jumping, or rebuilding during normal hosted refresh.
- Removed the duplicate Raw ADC callout, Raw ADC disclaimer/callout, and Recent Gen2 samples table; Raw ADC remains a normal diagnostic measurement card.

Validation:

- Supabase manual validation confirmed `public.hosted_gen2_measurements` exists and returns Gen2 rows for `Balcony01` and `Scout01`.
- Anon privilege validation returned `true, false, false, false`: anon can select `public.hosted_gen2_measurements`, and anon cannot select `public.sensor_measurement_batches`, `public.sensor_measurements_flat`, or `public.device_registry`.
- Browser validation confirmed hosted/read-only mode is visible.
- Browser validation confirmed `LiveStats`, Water Now, and local ESP32 control UI are not visible.
- Browser validation confirmed existing Gen1 Sensor History still renders.
- Browser validation confirmed Device and Window selectors still work.
- Browser validation confirmed simplified selector labels `Balcony01`, `Scout01`, and `Prototype01`.
- Browser validation confirmed Gen2 Trend renders, trend toggles work, expert overlay mode works, and the chart does not flash during refresh.
- Browser validation confirmed `Live Measurements` renders, `Last Reading` is present, details are collapsed by default, full-card status colors are visible, cards do not jump/rebuild during refresh, duplicate Raw ADC callout is gone, and Recent Gen2 samples table is gone.
- Browser validation confirmed `Balcony01` moisture index shows control eligibility as local firmware evidence only.
- Browser validation confirmed `Scout01` shows control eligibility false as local firmware evidence only.
- Network guardrail validation observed Supabase REST requests to `hosted_gen2_measurements`.
- Network guardrail validation observed no `/logs`, `/water-now`, or local ESP32 IP calls in hosted-readonly mode.
- Connectivity concern from earlier local preview testing was resolved with successful DNS, TCP 443, and HTTP checks against `nkicadvdjpcjhkoluvwf.supabase.co`.
- `npm.cmd run lint` passed.
- Hosted-readonly build passed.
- Hosted forbidden bundle scan returned no matches.
- Approved hosted view string `hosted_gen2_measurements` appeared in the hosted bundle as expected.

Out of scope:

- Firmware changes.
- SQL/RLS changes during Phase 7F.1.
- `SensorLogRow` changes.
- `sensor_logs` changes.
- `DualAxisChart` behavior changes.
- Gen2 calibration or control eligibility changes.
- Sensor assignment or location UI.
- Clean View / Expert View split, seasonal axis presets, or custom axis-label rail.
- Treating Raw ADC as calibrated moisture.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering logic, `/water-now`, or local pump/control behavior changes.
- Real moisture thresholds and control eligibility remain future validation/calibration work.

## Phase 7F.3 - Hosted Device Status Gen2 Freshness Fix - VALIDATED / COMPLETE PENDING COMMIT

Scope:

- Hosted-readonly `Device Status` now uses already-fetched `hostedGen2Rows` from `public.hosted_gen2_measurements` for the selected device/window.
- Gen1/Sensor History `sensor_logs` status assumptions remain available for Gen1/local/history compatibility, but they are no longer the hosted Gen2 Device Status source.
- Gen2 status freshness uses unique parseable `measured_at` report samples, the existing 45-minute freshness threshold, 15-minute expected sample cadence, unique-sample coverage, and largest sample gap.
- Gen2 measurement-quality warnings are based on Gen2 metadata such as `valid`, `quality`, `reason`, and displayability.
- Gen2 status does not diagnose plant health, diagnose sensor root cause, treat Raw ADC as calibrated moisture, or use `control_eligible` as command/control.
- Optional Gen2 sensors remain optional; the status does not require every possible Gen2 sensor to be present.
- The hosted dashboard remains read-only.

Validation:

- `npm.cmd run lint` passed.
- Hosted-readonly build passed.
- Hosted forbidden bundle scan returned no matches.
- Approved hosted view string `hosted_gen2_measurements` appeared in the hosted bundle as expected.
- Source guardrail scan found no reads from `sensor_measurement_batches`, `sensor_measurements_flat`, or `device_registry` in `mbg_dashboard/src`.
- Source guardrail scan found no `SensorLogRow` usage in hosted Gen2 display/trend/display-helper/type files.
- `DualAxisChart.tsx` remained unchanged.

Out of scope:

- New Supabase queries.
- SQL/RLS changes.
- Firmware changes.
- `SensorLogRow` changes.
- `DualAxisChart` changes.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, moisture mapping, automatic watering logic, `/water-now`, or local pump/control behavior changes.

## Phase 7G.0 - Field Gen2 Soil Temperature and Scout BME280 Swap - VALIDATED / COMPLETE PENDING COMMIT

Scope:

- `balcony-installed-gen2` keeps DHT11 enabled, keeps BME280 disabled, enables DS18B20 on GPIO27, and keeps analog soil moisture enabled.
- `balcony-sensor-scout-01` disables DHT11, enables BME280 on GPIO21/GPIO22, enables DS18B20 on GPIO27, and keeps analog soil moisture enabled.
- Scout remains non-watering with `pump_control_available:false`, `device_can_water:false`, and all Scout Gen2 measurement records `control_eligible:false`.
- Balcony01 remains watering-capable with existing watering behavior unchanged; installed `moisture_index` remains the only `control_eligible:true` Gen2 measurement.
- Scout avoids duplicate `air_temperature` and `relative_humidity` records by keeping DHT11 disabled while BME280 is enabled.
- Scout `/logs` preserves the legacy nested `data.temperature` / `data.humidity` response shape by sourcing those fields from BME280 when DHT11 is disabled and BME280 is enabled.
- `/logs` does not add pressure or soil temperature, `SensorLogRow` is unchanged, and BME280 pressure plus DS18B20 soil temperature stay on the Gen2 `/measurements` path.
- Bench `bench-proto-gen2` keeps BME280, DS18B20, VEML6030, soil moisture support, and existing `/water-now` semantics.
- Field dependencies mirror the existing bench Gen2 library names/versions for the newly enabled BME280/DS18B20 modules.

Validation:

- Firmware compile validation passed for `balcony-installed-gen2`, `balcony-sensor-scout-01`, and `bench-proto-gen2`.
- Scout01 field validation on 2026-05-31 at `10.0.0.180` confirmed UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, profile `balcony-sensor-scout-01`, firmware `phase7e-gen2-compat`, role `sensor-scout`, I2C enabled on GPIO21/GPIO22, I2C scan `0x76`, BME02/BME280 detected at `0x76`, ST02/DS18B20 detected on GPIO27 with `device_count:1`, analog soil readings present, and all Scout01 records `control_eligible:false`.
- Scout01 good validation readings included BME02 `air_temperature` `76.44°F`, BME02 `relative_humidity` `90.29%`, BME02 `barometric_pressure` `1016.10 hPa`, ST02 soil temperature `77.79°F`, `moisture_index` `67`, and `raw_adc` `2031`.
- Balcony01 field validation on 2026-06-01 at `10.0.0.200` confirmed UUID `550e8400-e29b-41d4-a716-446655440000`, profile `balcony-installed-gen2`, firmware `phase7e-gen2-compat`, role `controller`, DHT01 on GPIO26, ST03/DS18B20 on GPIO27 with `device_count:1`, analog soil moisture on GPIO34, pump output GPIO25, `pump_control_available:true`, and `device_can_water:true`.
- Balcony01 settled good sample at `2026-06-01T16:29:59Z` included DHT01 `air_temperature` `77.90°F`, DHT01 `relative_humidity` `26.00%`, ST03 soil temperature `72.61°F`, `moisture_index` `79`, and `raw_adc` `1744`.
- The initial Balcony01 ST03 null/read_failed sample after flash is documented as a startup/settling wart similar to the known DHT startup behavior, not a hard sensor failure.
- Timestamp hygiene validation confirmed `/status.reported_at`, `/capabilities.reported_at`, and `/measurements.measured_at` semantics. Balcony01 validation observed `/status.reported_at` `2026-06-01T16:23:48Z`, `/capabilities.reported_at` `2026-06-01T16:23:48Z`, and `/measurements.measured_at` `2026-06-01T16:23:50Z`.
- Hosted Gen2 measurement display automatically discovered Scout01 Soil Temperature and Barometric Pressure after a good Gen2 batch and Balcony01 Soil Temperature after a good Gen2 batch.
- A Supabase `sensor_events` marker was uploaded for the Gen2 field-ready baseline before calibration/control validation.
- Phase 7G.0 added no watering/control/schema/frontend behavior changes beyond the local endpoint timestamp hygiene API addition.

Out of scope:

- Frontend changes.
- `DualAxisChart` changes.
- Supabase SQL/RLS changes.
- `SensorLogRow` changes.
- `sensor_logs` shape changes.
- Pressure or soil temperature in `/logs`.
- Supabase command/control or Remote Water Now.
- Watering duration, threshold, cooldown, quiet hours, automatic watering logic, relay/pump pins, sensor pins, or `/water-now` behavior changes.
- New ADR; this remains inside the existing Gen2 modular sensor architecture boundary.

## Phase 7G.1 - Calibration / Control Validation Baseline - DOCUMENTATION/QUERY BASELINE IN PROGRESS

Scope:

- Add a field-test/control-validation protocol document for Gen2 calibration and watering-control evidence.
- Add a read-only SQL analysis artifact for hosted-safe and owner/admin calibration/control-validation queries.
- Preserve the existing architecture boundary: local ESP32 firmware owns watering decisions and pump shutoff; Supabase remains telemetry/history/diagnostics storage only.

Out of scope:

- Firmware changes.
- Frontend runtime changes.
- SQL schema/RLS changes.
- Pin, sensor, device ID, watering duration, `MOISTURE_THRESHOLD`, cooldown, moisture mapping, or control eligibility changes.
- Supabase command/control or Remote Water Now.

## Phase 7G.4 - Gen2 Local Control-Quality Gates Firmware Implementation - COMMITTED / BUILD-VALIDATED ONLY

Scope:

- Phase 7G.4 implemented local Gen2 automatic watering control-quality gates in `src/main.cpp`.
- The gates are automatic-watering-only and do not block Manual Water Now.
- The implementation adds startup/settling, startup qualified sample count, latest local sample freshness, post-watering exclusion, and 2-of-3 repeated low-reading validation before the existing automatic watering path.
- The existing `MOISTURE_THRESHOLD`, `WATERING_DURATION_MS`, `WATERING_COOLDOWN_MS`, `LOG_INTERVAL_MS`, moisture mapping, raw ADC mapping, pins, sensors, device IDs, Gen2 metadata wording, and `control_eligible` behavior were not changed.
- Post-watering exclusion is `300000` ms / 5 minutes.
- Existing automatic cooldown remains unchanged at the tracked/default `900000` ms / 15 minutes, subject to ignored local config overrides.
- Build validation passed for `balcony-installed-gen2`, `balcony-sensor-scout-01`, and `bench-proto-gen2`.
- No firmware upload occurred.
- No runtime validation occurred.
- No frontend, SQL/RLS, hosted, CSV, Support-folder, or `src/config.h` changes were made.
- Runtime validation is deferred to Phase 7G.5.

Out of scope:

- Firmware upload.
- Runtime validation on Balcony01, Scout01, or Prototype01.
- Frontend changes.
- SQL/RLS changes.
- Hosted behavior changes.
- CSV or Support-folder export changes.
- `src/config.h` changes.
- Threshold, watering duration, cooldown, cadence, mapping, pin, sensor, device ID, Gen2 metadata wording, or `control_eligible` changes.

## Phase 7G.5 - Gen2 Local Control-Quality Gates Runtime Validation - COMPLETE AND PRESENT ON MAIN

Scope:

- Phase 7G.5 runtime-validated the Phase 7G.4 local Gen2 automatic watering control-quality gate firmware on the field/controller, sensor-scout, and bench-prototype profiles.
- Branch `phase7g5-gen2-control-quality-gates-runtime-validation` started from a clean `main` baseline at `a8766ef Document Phase 7G.4 firmware implementation closeout`.
- Build validation passed for `balcony-installed-gen2`, `balcony-sensor-scout-01`, and `bench-proto-gen2`.
- The reported firmware version string intentionally remains `phase7e-gen2-compat` even though the Phase 7G.4 control-quality-gate code is now uploaded.

Prototype01 smoke/runtime validation:

- Uploaded `bench-proto-gen2` to COM5 successfully as a lower-risk smoke/runtime validation target before Balcony01.
- Prototype01 returned UUID `318fab98-89ad-4f36-9100-3134a04e0be5`, label `Prototype01`, role `bench`, build profile `bench-proto-gen2`, and IP `10.0.0.192`.
- `/status`, `/capabilities`, and `/measurements` worked.
- The bench profile intentionally reports `pump_control_available:true`, `device_can_water:true`, and `watering_simulation_available:true`; it remains pump-free physical bench hardware.
- Prototype01 `moisture_index` was the only `control_eligible:true` measurement.
- No `/water-now` call occurred, and no unintended watering or relay activity was observed.
- Serial gate messages were not captured during the observation window, consistent with the 15-minute cadence and no forced trigger condition.

Balcony01 runtime validation:

- Uploaded `balcony-installed-gen2` successfully.
- Balcony01 returned UUID `550e8400-e29b-41d4-a716-446655440000`, label `Balcony01`, role `controller`, build profile `balcony-installed-gen2`, and IP `10.0.0.200`.
- `/status`, `/capabilities`, `/measurements`, and `/logs` worked.
- Balcony01 reported `pump_control_available:true`, `device_can_water:true`, `currently_watering:false`, `lastWateredTime:"N/A"`, and `lastWateringDuration:0`.
- Balcony01 `moisture_index` remained the only `control_eligible:true` measurement; DHT01, ST03 soil temperature, and raw ADC remained `control_eligible:false`.
- ST03 initially had a startup `read_failed` sample, then settled to valid/good/read_ok; settled ST03 evidence included `77.11 F`, `valid:true`, `quality:"good"`, and `reason:"read_ok"`.
- Passive checks after more than two 15-minute cadence windows showed no unintended automatic watering while moisture index remained high around `79`.
- No Manual Water Now call occurred.

Scout01 runtime validation:

- Uploaded `balcony-sensor-scout-01` successfully.
- Scout01 returned UUID `28f4e6e3-5979-4af4-9753-34e185d8e47e`, label `Scout01`, role `sensor-scout`, build profile `balcony-sensor-scout-01`, and IP `10.0.0.180`.
- `/status`, `/capabilities`, `/measurements`, and `/logs` worked.
- Scout01 reported `pump_control_available:false`, `device_can_water:false`, and `currently_watering:false`.
- All Scout01 measurements remained `control_eligible:false`; Scout01 remained telemetry-only because it is not physically connected to irrigation hardware.
- ST02 initially had a startup `read_failed` sample, then settled to valid/good/read_ok; settled ST02 evidence included `77.45 F`, `valid:true`, `quality:"good"`, and `reason:"read_ok"`.

Explicit validation limitations:

- Startup settling gate was not directly observed in serial because the 15-minute cadence means the first automatic-control pass occurs after the 60-second startup-settling window.
- Freshness gate was validated by static inspection and normal runtime operation, not by artificial delay injection.
- Repeated low-reading automatic start was not forced because field moisture was high.
- Post-watering exclusion was not physically exercised because `/water-now` was not called.
- Manual Water Now separation was validated by code inspection, not by a physical pump event in this phase.
- No Supabase command/control or Remote Water Now was introduced.

Known continuing observations:

- Balcony01 DHT01 humidity remains implausibly low compared with Scout01 BME280 humidity, supporting the existing view that DHT01 is not trustworthy. This is not a control blocker because DHT01 is not control-eligible.
- The reported `firmware_version` remains `phase7e-gen2-compat`; do not change metadata wording in this phase.

Out of scope:

- Firmware changes.
- Frontend changes.
- SQL/RLS changes.
- Hosted behavior changes.
- CSV or Support-folder export changes.
- `src/config.h` changes.
- Threshold, watering duration, cooldown, cadence, mapping, pin, sensor, device ID, Gen2 metadata wording, or `control_eligible` changes.
- `/water-now` behavior changes or Manual Water Now runtime activation.

## Device Roles / Sensor-Only Telemetry Unit

This former future-work heading is superseded by the Phase 7L MVP Setup / Provisioning Boundary and Phase 7Q Pilot Deployment Package sections below. Scout01 remains evidence-only / non-watering, and only properly equipped local firmware may own watering control.

## Phase 7H - MVP Field Deployment Backlog Rebaseline - DOCUMENTATION / PLANNING ONLY

Purpose:

- Rebaseline the future backlog around sellable/pilot field deployment readiness.
- Answer the deployment question: what must be true before MBG can be deployed at someone else's balcony without Jeremy babysitting it?
- Make clear that the next priority is field deployability, not sensor expansion by inertia.

Rebaseline principles:

- Sellable MVP readiness outranks sensor expansion.
- Customer-facing trust and dashboard clarity are MVP-critical.
- Official build/service documentation is MVP-critical.
- Installer/setup/provisioning workflow is MVP-critical.
- Sensor upgrade decisions should come before deep calibration.
- Calibration should happen after the sensor upgrade decision matrix unless Jeremy explicitly chooses to calibrate the current analog sensor for short-term evidence only.
- Hardware safety maturity is a deployability track, not optional polish.
- Future product enhancements should be separated from pilot/MVP deployment requirements.

Current evidence and limitations:

- Phase 7G.5 completed the first runtime validation of Gen2 local control-quality gates.
- The system is safer than it was before Phase 7G.4/7G.5.
- The system is still not fully proven as unattended commercial hardware.
- Startup-settling, repeated low-reading, post-watering exclusion, and Manual Water Now separation still have the explicit validation limitations documented in Phase 7G.5.
- This phase changes documentation/planning only and does not approve firmware, frontend, SQL/RLS, hosted, runtime, sensor, hardware, configuration, or command/control changes.

## Phase 7I - Hosted Measurement Trust & Plausibility Guardrails

Scope:

- Improve customer-facing hosted measurement trust before making the dashboard more visually authoritative.
- Suppress known-bad values or mark them with clear warnings.
- Avoid presenting impossible or implausible readings as normal.
- Treat Balcony01 DHT01 humidity as a known trust issue.
- Use Gen2 metadata such as `valid`, `quality`, `reason`, and displayability.
- Keep hosted status informational only.
- Do not diagnose plant health.
- Do not diagnose root cause unless supported by evidence.
- Do not use `control_eligible` as command/control.

Out of scope:

- New Supabase queries unless a later implementation phase approves them.
- Any hosted command/control.
- Remote Water Now.
- Local ESP32 endpoint calls from hosted-readonly mode.
- Treating hosted status as watering authority.

## Phase 7J - Official Pinout, Wiring, and From-To Documentation

Scope:

- Create official build/service documentation for MVP field deployment.
- Document the Gen2 pinout.
- Document physical sensor-to-controller wiring.
- Document relay/pump wiring.
- Document power wiring.
- Document the short local I2C cable standard.
- Document OneWire / DS18B20 wiring.
- Document analog moisture wiring.
- Create a controller-to-field-device From-To table.
- Document sensor IDs and physical assignment.
- Define connector/cable labeling expectations.
- Add an install/service validation checklist.

The documentation should distinguish:

- Architecture-level pin map.
- Current physical deployed wiring.
- Future production wiring standard.
- Temporary prototype/scout wiring.
- Retired/deprecated wiring such as GPIO5 for future Gen2 relay/pump control.

Out of scope:

- Changing pins.
- Changing hardware configuration.
- Creating the full pinout/from-to document without explicit approval.

## Phase 7K - Hosted At-a-Glance Measurement Trends - VALIDATED / COMPLETE PENDING MERGE

Scope:

- Phase 7K added compact display-only trend cues to hosted Gen2 `Live Measurements` cards in hosted-readonly mode.
- Trend cues use the already-fetched hosted Gen2 measurement rows for the selected hosted device/window; no new Supabase query was added.
- Trend states include Rising, Falling, Stable, Not enough data, Sparse data, Stale data, and Not trendable.
- Rising, Falling, and Stable display direction symbols (`↗ Rising`, `↘ Falling`, `→ Stable`).
- Delta appears as a deliberate second line, such as `-2.1 F over 24h`; elapsed duration formatting rounds cleanly so `23.9h` displays as `24h`.
- Trendable cards show a compact inline SVG sparkline on the trend capsule's right side; weak-data states do not show fake sparklines.
- Routine `Reading is displayable and passed hosted trust checks.` text moved into Sensor details as `Status note`; non-routine warning/check messages remain visible on cards.
- Jeremy visually reviewed the hosted-readonly preview and approved the trend cue appearance.

Validation:

- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- Hosted-readonly production build passed.
- Existing Vite large chunk warning remains unchanged/existing.
- `git diff --check` passed with CRLF warnings only.
- Hosted-readonly forbidden bundle scans returned no hits for `/water-now`, `Water Now`, `/logs`, `LiveStats`, `Currently Watering`, `VITE_ESP32_URL`, `VITE_WATER_ENDPOINT`, `10.0.0.200`, `10.0.0.180`, or `10.0.0.192`.
- Review-only endpoint scans returned no hits for `/status`, `/capabilities`, or `/measurements`.

Preserved boundaries:

- No firmware changes.
- No SQL/RLS, Supabase schema, or hosted SQL view changes.
- No new Supabase query.
- No watering/control behavior change.
- No Raw ADC meaning change.
- No control eligibility behavior change.
- Device Status, Device Diagnostics, Phase 7I hosted trust/plausibility behavior, and HostedGen2TrendChart behavior were preserved.

Deferred:

- Future hosted UX work may explore more creative at-a-glance context badges such as fast change, new low/high, long gap, recovered, or little change, but Phase 7K does not add those.

## Phase 7K.5 - ESP32 Runtime / Wi-Fi Recovery Incident Review - COMPLETE

Scope:

- Document and respond to the 2026-06-03 runtime incident where Prototype01, Scout01, and Balcony01 were powered but locally unreachable until power-cycled.
- Treat the likely failure class as runtime Wi-Fi/network/server/telemetry recovery after a shared router/AP/Wi-Fi event.
- Do not claim the incident was confirmed weak Wi-Fi or a simple power outage.
- Add in-memory Wi-Fi/network and Supabase/cloud-post diagnostics in `src/main.cpp`.
- Expose new local `/status` diagnostic evidence.
- Populate existing `device_heartbeats` evidence columns where possible.
- Add conservative runtime Wi-Fi recovery hardening with `WiFi.setAutoReconnect(true)`, `WiFi.persistent(false)`, `WiFi.setSleep(false)`, `WiFi.onEvent(...)`, bounded `WiFi.reconnect()`, and bounded `WiFi.disconnect(false) + WiFi.begin(...)` after sustained failure.
- Keep pump shutoff first priority in `loop()`.
- Do not add `ESP.restart()` in Phase 7K.5.
- Do not add periodic reboot.

Validation state:

- Prototype01 upload, endpoint validation, and 15-minute cloud-post evidence passed with `last_supabase_http_status:201`, `consecutive_supabase_failures:0`, `last_successful_telemetry_post_uptime_seconds:901`, `last_successful_diagnostics_post_uptime_seconds:903`, and `currently_watering:false`.
- Balcony01 upload, endpoint validation, and 15-minute cloud-post evidence passed with `/status`, `/capabilities`, and `/measurements` reachable, Wi-Fi connected, no reconnect or begin-recovery attempts, `last_supabase_http_status:201`, `consecutive_supabase_failures:0`, `currently_watering:false`, `pump_control_available:true`, and `device_can_water:true`.
- Scout01 upload, endpoint validation, and 15-minute cloud-post evidence passed with `/status` and `/measurements` reachable, Wi-Fi connected, no reconnect or begin-recovery attempts, `last_supabase_http_status:201`, `consecutive_supabase_failures:0`, `last_supabase_error_category:none`, telemetry and diagnostics success uptimes `2701` and `2702`, `currently_watering:false`, `pump_control_available:false`, and `device_can_water:false`.
- Scout01 `/measurements` returned valid JSON with 6 records, BME280 air temperature `78.22 F`, BME280 relative humidity `38.37%`, BME280 pressure `1024.29 hPa`, DS18B20 temperature `70.81 F`, soil moisture index `64.0`, soil raw ADC `2110`, and all records `control_eligible:false`.
- All three Phase 7K.5 targets, Prototype01, Scout01, and Balcony01, passed upload, endpoint, and 15-minute cloud-post validation; all remained reachable, no unintended watering was reported, Scout01 remained non-watering, and Balcony01 remained not watering during validation.
- Validation proves safe boot, local endpoint availability, cloud-post success, and diagnostic visibility after deployment; no controlled router/AP disruption test was performed, and this does not yet prove recovery from the exact overnight event.

Preserved boundaries:

- No SQL/RLS, Supabase schema, hosted SQL view, hosted frontend, local dashboard, production wiring doc, pin, sensor, device ID, watering duration, threshold, cooldown, `LOG_INTERVAL_MS`, moisture mapping, `control_eligible`, or `/water-now` behavior change.
- No Supabase command/control.
- No hosted calls to local ESP32 endpoints.
- Manual Water Now remains local-only.
- Scout01 remains non-watering.

Follow-up items:

- Consider last-resort controlled `ESP.restart()` policy only if evidence proves bounded recovery cannot recover.
- Consider hosted diagnostics expansion to show new network recovery evidence.
- Consider controlled network/router/AP disruption testing only with Jeremy approval.
- Continue longer field soak validation.

## Phase 7L - MVP Customer Setup, Access, and Local-Control Boundary - COMPLETE

Scope:

- Define the installer/customer setup boundary needed before MBG can leave Jeremy's bench/balcony.
- Define the future customer/site/device logical model: customers, sites/gardens/installations, devices, user-site memberships, and support/admin memberships.
- Define that customers should eventually see only their own site/device data through authenticated, RLS-filtered hosted views.
- Clarify that current URL/query device selection is convenience, not security.
- Clarify that the current device registry is a provisioned-device insert allowlist, not customer/site/auth access control.
- Define Jeremy support/admin access as explicit site membership instead of customer login sharing.
- Define device identity assignment expectations.
- Define friendly name/location assignment expectations.
- Define the Wi-Fi setup boundary.
- Preserve local-only control authority.
- Document that sensor-only units are telemetry-only because they are not physically connected to irrigation hardware.
- Record that app-based Water Now is not part of the customer product path.
- Record future physical local hold-to-water/test direction with loggable event evidence and firmware failsafe shutoff.
- Define the local dashboard future as engineering/service/setup, not customer daily-use path.
- Define registry/provisioned-device expectations.
- Separate compile-time/profile-driven values from field-configurable values.
- Identify what must wait for a later provisioning system.

Out of scope:

- Supabase command/control.
- Remote Water Now.
- Treating URL/query device selection as customer access security.
- Treating device registry hosted visibility as customer/site/auth authorization.
- App-based Water Now in the customer hosted product path.
- Firmware, frontend runtime, SQL/RLS, provisioning UI, local dashboard removal, or physical button implementation.
- Full production fleet management.

## Phase 7L.1 - Customer/Site Access Simulation MVP - COMPLETE

Status:

- Phase 7L.1 Customer/Site Access Simulation MVP is complete and present on `main` in commit `2d74588 Add customer site access simulation`.

Scope:

- Add static hosted-readonly customer/site assignment model for Jeremy Haney (`jeremy`) and `Jeremy Balcony Pilot` (`jeremy-balcony-pilot`).
- Assign only real existing devices to the pilot site: `balcony` / `Balcony01` as primary controller and `scout01` / `Scout01` as telemetry-only support evidence.
- Keep `Prototype01` / `bench` in the base frontend known-device registry for support/development use outside this pilot simulation.
- Add a hosted-readonly customer/site context header that clearly labels the view as access simulation.
- Constrain hosted pilot device selection through the Phase 7L.1 assignment layer to `Balcony01` and `Scout01`.
- Resolve hosted pilot `?device=bench` to `Balcony01` because `bench` is not assigned to the pilot site.
- Document the simulation in [`docs/product/phase7l1-customer-site-access-simulation.md`](./product/phase7l1-customer-site-access-simulation.md).

Out of scope:

- Real customer login, Supabase Auth, customer/site/device tables, membership tables, RLS-filtered customer views, support/admin authorization, or account lifecycle.
- Supabase schema/RLS changes, SQL artifacts, fake telemetry, fake `sensor_logs` rows, duplicate device IDs, or ghost physical devices.
- Firmware, local dashboard, local ESP32 endpoint, Water Now, `/water-now`, watering behavior, threshold, duration, cooldown, pin, sensor, device ID, Cloudflare configuration, deploy, or firmware upload changes.

Boundary:

- This is a customer/site experience simulation using existing hosted telemetry and diagnostics evidence, not real customer security.
- The customer product path remains hosted read-only daily visibility.
- App-based Water Now is not part of the customer product path.
- Current URL/device/window selection is navigation convenience, not security.
- Real customer access still requires auth, RLS-filtered hosted views, and customer/site/device membership.
- The Phase 7L.1 customer/site header is a temporary access-simulation scaffold.
- It is not the final customer-facing UI.
- Future customer-facing UI should be clean and site-focused, without engineering/auth disclaimers in the normal customer view.
- MBG should not fork into separate independently maintained customer and engineering sites.
- Prefer one shared dashboard codebase and shared UI components with mode/capability/context gates:
  - customer hosted read-only mode
  - support/admin read-only diagnostics mode
  - local engineering/service mode
- Customer, support/admin, and local engineering views may expose different capabilities, but they should reuse the same core layout/components where practical so the UI does not drift.
- Hosted dashboard remains read-only.
- Supabase remains telemetry/history/diagnostics storage only, not command/control.

## Phase 7L.2 - Hosted Customer View Shell and UI Mode Boundary - IMPLEMENTED PENDING REVIEW

Status:

- Phase 7L.2 Hosted Customer View Shell and UI Mode Boundary is implemented pending Jeremy review, commit approval, and merge approval.

Scope:

- Rename the hosted shell component from `CustomerSiteHeader` to `HostedSiteHeader`.
- Rename the matching stylesheet from `CustomerSiteHeader.css` to `HostedSiteHeader.css`.
- Update `SensorLogViewer` to import and render `HostedSiteHeader`.
- Rework the hosted-readonly shell copy/layout so `Jeremy Balcony Pilot`, `Savannah Balcony`, and `Read-only monitoring dashboard` are the dominant site context.
- Show assigned device roles plainly: `Balcony01` as Primary controller and `Scout01` as Telemetry-only support sensor.
- Keep a small visible note: `Pilot simulation: Static site assignment. Real login and customer isolation are deferred.`
- Document the phase in [`docs/product/phase7l2-hosted-customer-view-shell.md`](./product/phase7l2-hosted-customer-view-shell.md).
- Update [`docs/CURRENT_STATE.md`](./CURRENT_STATE.md) and this backlog with the Phase 7L.2 state.

Boundary:

- This is a hosted-readonly shell refinement over the static Phase 7L.1 pilot assignment.
- It does not create real customer login, customer isolation, customer/site/device tables, membership tables, RLS-filtered customer views, support/admin authorization, or account lifecycle.
- Device/window URL query state remains navigation convenience only, not security.
- Hosted pilot device selection remains constrained to `Balcony01` and `Scout01`; `Prototype01` / `bench` remains in the base registry for support/development contexts outside this pilot shell.
- If hosted pilot mode receives `?device=bench`, the selected device still falls back to `Balcony01`.
- The app-level `App.tsx` brand/header structure remains unchanged in this phase.
- MBG still prefers one shared dashboard codebase and shared UI components with mode/capability/context gates, not a forked customer app.

Out of scope:

- Supabase Auth, customer/site/device SQL tables, membership SQL tables, RLS policies, database migrations, real login/logout, account invites, support/admin UI with real privileges, Cloudflare Access, role-based routing, customer billing/account lifecycle, provisioning UI, settings/admin implementation, watering-event capture fix, telemetry event-capture changes, fake telemetry, fake `sensor_logs` rows, duplicate device IDs, ghost physical devices, firmware, `src/main.cpp`, `src/config.h`, `platformio.ini`, pins, sensors, sensor assignments, device IDs, firmware metadata wording, watering duration, `MOISTURE_THRESHOLD`, cooldown, `LOG_INTERVAL_MS`, moisture mapping, `control_eligible` behavior, `/water-now` behavior, local dashboard behavior, Supabase schema/RLS, SQL artifacts, production wiring docs, field readings, CSV field-capture files, support-folder exports, Cloudflare configuration, deploy, commit, or merge.

## Phase 7L.3 - Minimal Landing Page with Embedded Live Demo and Hosted App Route Shell - IMPLEMENTED PENDING VALIDATION

Status:

- Phase 7L.3 Minimal Landing Page with Embedded Live Demo and Hosted App Route Shell is implemented pending validation, Jeremy review, commit approval, and merge approval.

Scope:

- Add a lightweight hosted-readonly route shell in `App.tsx` using `window.location.pathname`.
- Route `/` to a minimal public landing page with an embedded compact live telemetry snapshot.
- Route `/demo` to a fuller public read-only live demo using existing hosted dashboard/data components.
- Route `/app` to the existing hosted customer dashboard shell from Phase 7L.2.
- Route `/login` to a placeholder stating customer login is coming next and pilot access is managed by Jeremy.
- Route `/support` to a temporary read-only support view for reviewing connected garden units by direct URL while real login protection remains future work.
- Add Cloudflare Pages SPA fallback file `mbg_dashboard/public/_redirects` with `/* /index.html 200`.
- Document the phase in [`docs/product/phase7l3-public-landing-page-and-hosted-route-shell.md`](./product/phase7l3-public-landing-page-and-hosted-route-shell.md).

Boundary:

- The landing-page live snapshot uses real hosted telemetry from Balcony01 (`balcony`, `550e8400-e29b-41d4-a716-446655440000`) through existing hosted read-only fetch helpers.
- Missing or unavailable live snapshot values are shown as unavailable and are not faked.
- `/demo` and `/app` preserve the current pilot assignment constraint to Balcony01 and Scout01.
- Prototype01 / bench is not exposed in public or customer routes.
- URL/query/path selection remains navigation convenience only, not security.

Out of scope:

- Supabase Auth, customer/site/device SQL tables, membership SQL tables, RLS policies, database migrations, real login/logout, account invites, support/admin UI with real privileges, Cloudflare Access, role-based routing, customer billing/account lifecycle, provisioning UI, settings/admin implementation, watering-event capture fix, telemetry event-capture changes, fake telemetry, fake `sensor_logs` rows, duplicate device IDs, ghost physical devices, firmware, `src/main.cpp`, `src/config.h`, `platformio.ini`, pins, sensors, sensor assignments, device IDs, firmware metadata wording, watering duration, `MOISTURE_THRESHOLD`, cooldown, `LOG_INTERVAL_MS`, moisture mapping, `control_eligible` behavior, `/water-now` behavior, local dashboard behavior, Supabase schema/RLS, SQL artifacts, production wiring docs, field readings, CSV field-capture files, support-folder exports, Cloudflare deploy command, deploy, push, commit, merge, or firmware upload.

## Phase 7L.4 - Customer Auth, Garden Membership, and RLS Implementation - COMPLETE

- Commit: `1706798 Add customer auth garden membership RLS`.
- Branch merged: `phase7l4-customer-auth-garden-rls`.
- Production custom domain: `https://mybalconygardener.boileragency.com`.
- Phase 7L.4 was merged to `main`, pushed, Cloudflare production auto-deployed from `main`, and production/credentialed browser validation passed.
- SQL artifact `docs/sql/phase7l4-customer-auth-garden-membership-rls.sql` was drafted, hash-reviewed, and manually applied in Supabase SQL Editor.
- Manual seed validation passed: `customer_garden_devices` returns Balcony01 and Scout01 with no Bench01; `support_garden_devices` returns Balcony01, Scout01, and Bench01 / Prototype01.
- Frontend auth was implemented with Supabase email/password login and sign out.
- Header login from `/` or `/demo` redirects to `/mygarden`; direct logged-out `/support` login returns to `/support`; `/login` redirects to `/mygarden` after successful login.
- `/mygarden` uses `customer_*` protected views, `/support` uses `support_*` protected views, and `/app` behaves like `/mygarden`.
- `/demo` remains public and uses public demo-safe views. `/support` remains hidden from normal navigation.
- Production credentialed validation confirmed logged-out `/`, `/demo`, `/mygarden`, `/app`, and `/support` behavior; Login redirects; customer/support device visibility; hidden Support navigation; and Sign out behavior.
- Hosted routes remain read-only. No Remote Water Now, Supabase command/control, local ESP32 calls, firmware changes, firmware upload, or manual deploy command occurred.
- During production-validation closeout, no SQL was run, no firmware was touched, and no manual deploy command was run. Cloudflare production deployment came from pushing `main`.
- Before adding external customer devices, public demo visibility should be narrowed so public demo views cannot accidentally expose non-demo customer data.

## Phase 7M - Sensor Upgrade Decision Matrix and Balcony02 Build-Out Plan

Scope:

- Create product/design decision matrix [`docs/product/phase7m-sensor-upgrade-decision-matrix.md`](./product/phase7m-sensor-upgrade-decision-matrix.md).
- Maintain the proposed Balcony02 wiring/build-out planning artifact as [`docs/production/MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md`](./production/MBG_Balcony02_Buildout_Wiring_Plan_v0.2_2026-08-04.md), reissued from its June 4, 2026 planning baseline and still labeled proposed/not-as-built/not-implemented.
- Inspect the existing current/as-built Gen2 production workbook without modifying it.
- Compare incoming sensors before deep calibration work or hardware modification.
- Record incoming Digi-Key parts as not yet installed: 4x DFRobot SEN0308 waterproof capacitive moisture, 5x DFRobot SEN0562 IP68 I2C ambient light, 2x DFRobot SEN0390 ambient light / optical module, and 2x DFRobot SEN0204 non-contact liquid level.
- Prefer Option C: build a new Balcony02 candidate unit first for side-by-side validation, then modify Balcony01 only after comparison evidence and explicit approval.
- Preserve Balcony01 as the current installed baseline.
- Treat SEN0308 as a strong MVP comparison candidate, not a control-approved replacement.
- Treat SEN0562 as the stronger light-sensing MVP/evaluation candidate because it is IP68.
- Treat SEN0390 as comparison/evaluation or deferred unless weatherproofing and mounting prove practical.
- Treat SEN0204 as an MVP-worthy reservoir-level safety/serviceability candidate, but not an alert source or dry-run interlock yet.
- Define momentary physical hold-to-water/test switch requirements only.
- Think through Balcony02 I2C topology for three SEN0562 sensors, including a possible TCA9548A-style I2C multiplexer if addresses conflict.
- Think through Balcony02 analog moisture topology for 2-3 SEN0308 sensors, including ESP32 ADC1-capable pins versus an external ADS1115/ADS1015-style ADC, and avoiding ADC2 pins during Wi-Fi operation.
- Identify power distribution, common ground, connector, cable gland, enclosure penetration, strain relief, labeling, and weatherproof mounting needs.
- Separate plant/environment insight telemetry from watering safety.
- Define evidence needed for moisture calibration, watering-response review, reservoir-level physical tests, light mapping, and future control validation.

Out of scope:

- Purchasing or installing sensors by documentation implication.
- Treating incoming sensors as installed, wired, configured, provisioned, dashboard-visible, or control-approved.
- Treating light sensing as watering safety or plant diagnosis.
- Treating reservoir level as alerting, dry-run protection, or pump-control authority.
- Implementing pin/wiring assignments, physical wiring, a Balcony02 UUID, build profile, device registry row, dashboard selector, or provisioning entry.
- Editing the current/as-built Gen2 production wiring workbook.
- Firmware, frontend runtime, SQL/RLS, hosted behavior, `control_eligible`, watering duration, `MOISTURE_THRESHOLD`, cooldown, cadence, moisture mapping, `/water-now`, or Manual Water Now behavior changes.
- Switch firmware or sensor firmware implementation.
- Calibration or control-validation claims before side-by-side evidence exists.
- ADR 0021 creation unless separately proposed and approved.

## Phase 7N.1 - Bench I2C/ADC/MUX Electrical Bring-Up and Topology Proof - RUNTIME VALIDATED / COMPLETE

Status:

- Product note: [`docs/product/phase7n1-bench-i2c-adc-mux-electrical-bringup.md`](./product/phase7n1-bench-i2c-adc-mux-electrical-bringup.md).
- `Prototype01` / `bench-proto-gen2` proved MUX01 at `0x70` on the 3.3V-only bench topology.
- ADC01 / ADS1115 was detected at `0x48` through MUX01 channel 0 when direct upstream `0x48` was temporarily removed.
- The ADS1115 ambiguity guard was validated when upstream VEML6030 at `0x48` was present; firmware reported `ambiguous` instead of falsely confirming ADS1115.
- VEML6030 was restored to the normal upstream I2C bus after the clean ADS1115 test and returned valid light measurement evidence.
- Existing BME280, DS18B20, VEML6030, GPIO34 moisture index, and raw ADC measurements remained healthy after restoration.

Non-changes:

- No watering behavior, thresholds, durations, cooldowns, telemetry cadence, pins, device IDs, firmware metadata, hosted frontend, SQL, deployment, field-unit upload, ADS1115 raw reads, ADS1115 values replacing GPIO34, or `control_eligible` behavior changed.

## Phase 7N.2A - SEN0308-M01 ADS1115 A0 Diagnostic Proof - RUNTIME VALIDATED / COMPLETE PENDING PUSH

Status:

- Product note: [`docs/product/phase7n2a-sen0308-ads1115-a0-diagnostic-proof.md`](./product/phase7n2a-sen0308-ads1115-a0-diagnostic-proof.md).
- `Prototype01` / `bench-proto-gen2` proved SEN0308-M01 raw diagnostic reads through ADS1115 A0 behind MUX01 channel 0.
- `gen2_ads1115` is the low-level ADS1115 analog input provider.
- `gen2_sen0308` is the physical SEN0308 sensor-family module.
- The SEN0308-M01 measurement record uses `sensor_key` `sen0308_m01`, `sensor_type` `sen0308`, `measurement_name` `raw_adc`, and `control_eligible:false`.
- Provider details preserve `analog_provider: ads1115`, `provider_channel: A0`, mux/ADS address metadata, and physical sensor ID `SEN0308-M01`.
- The ADS1115 provider refuses to return a raw count when upstream `0x48` is present, preserving the VEML6030/ADS1115 ambiguity guard.
- GPIO34 legacy moisture index/raw ADC remains separate and unchanged.

Out of scope:

- Treating ADS1115 values as watering-control inputs before calibration/control validation.
- Changing `MOISTURE_THRESHOLD`, moisture mapping, watering duration, cooldown, or `control_eligible` behavior.

## Phase 7N.2B - SEN0308-M02/M03/M04 Four-Channel Wiring Proof - RUNTIME VALIDATED / DOCUMENTATION CLOSEOUT PENDING COMMIT

Status:

- Product note: [`docs/product/phase7n2b-sen0308-four-channel-wiring-proof.md`](./product/phase7n2b-sen0308-four-channel-wiring-proof.md).
- `Prototype01` / `bench-proto-gen2` proved four-channel SEN0308 diagnostic reads through ADS1115 A0-A3 behind MUX01 channel 0.
- `sen0308_m01` maps to `SEN0308-M01` on ADS1115 A0.
- `sen0308_m02` maps to `SEN0308-M02` on ADS1115 A1.
- `sen0308_m03` maps to `SEN0308-M03` on ADS1115 A2.
- `sen0308_m04` maps to `SEN0308-M04` on ADS1115 A3.
- All four current SEN0308 records use sensor_type `sen0308`, measurement_name `raw_adc`, measurement_unit `count`, quality `diagnostic`, reason `read_ok`, and `control_eligible:false`.
- GPIO34 legacy/reference `soil_moisture_analog` `moisture_index` and `raw_adc` records remained present and separate.
- VEML6030 remains intentionally disconnected for the clean ADS1115 proof.
- Hosted 24h views may temporarily show old `sen0308_ads1115` historical rows from Phase 7N.2A; those are stale history, not a current sixth sensor or current firmware record shape.
- Hosted Raw ADC plausibility/trust display should become ADS1115-aware so ESP32 GPIO34 raw ADC bounds are not incorrectly applied to ADS1115-backed SEN0308 raw counts.

Out of scope:

- Calibration.
- Watering-control use.
- Replacing GPIO34 as the legacy/reference moisture path.
- Wet/dry threshold claims.
- SQL/RLS changes.
- Hosted/frontend code changes.
- Field-unit firmware uploads.
- Cloudflare deploy.

## Phase 7N.3A - SEN0308 Measurement-System Screen - COMPLETE AND PRESENT ON MAIN

Scope:

- Screen the existing Prototype01 SEN0308 measurement system using the already-flashed firmware and local `GET /measurements`.
- Capture `sen0308_m01`, `sen0308_m02`, `sen0308_m03`, and `sen0308_m04` diagnostic `raw_adc` records.
- Capture existing GPIO34 `soil_moisture_analog` `raw_adc` and `moisture_index` records as the legacy comparison path.
- Treat the result as measurement-system evidence only, not calibration or control authority.
- Product note: [`docs/product/phase7n3a-sen0308-measurement-system-screen.md`](./product/phase7n3a-sen0308-measurement-system-screen.md).
- Evidence CSV: `field_readings/phase7n3a_sen0308_measurement_system_screen_20260612_093331.csv`.

Runtime capture:

- Captured five samples per state at approximately 15-second spacing from Prototype01 `http://10.0.0.192/measurements`.
- Captured `free_air` with the ceiling fan on low, then `free_air_no_fan` after Jeremy turned the fan off.
- Captured `dry_soil` from a composite of old pots that had not been watered in a long time; probes were inserted in one push, in the same relative orientation and recommended depth, and were not re-oriented despite expected soil variance.
- Captured `damp_soil` from raised bed Miracle-Gro soil directly from the bag.
- Captured `wet_drained_soil` after light, as-even-as-practical watering and roughly 20 minutes of settling.
- Captured additional operator-requested states: `saturated_soil`, `water_glass`, `humidity_container_initial`, `humidity_container_30min`, and `humidity_container_heated_towel`.
- The humidity-container states included BME280 temperature/humidity context and are exploratory humidity/condensation/context observations only, not soil calibration points or control-quality evidence.

Result:

- All selected SEN0308 and GPIO34 rows were `valid:true` and `quality:"diagnostic"`.
- SEN0308 raw ADC means moved downward from free air to dry soil to damp soil across all four channels.
- `sen0308_m03` showed the cleanest directionality through dry, damp, wet-drained, saturated, and water states.
- `sen0308_m01` also showed strong directionality and reached the low/raw floor in saturated soil and water.
- `sen0308_m04` remained broadly directional but had a less-low saturated-soil mean (`2850.60`) than M01/M03.
- `sen0308_m02` rose from damp soil mean `12586.00` to wet-drained soil mean `13676.00`, remained elevated in saturated soil mean `4771.40`, but dropped to the low/raw floor in water mean `15.80`; this makes direct liquid response good but soil/contact/media behavior still ambiguous.
- GPIO34 legacy comparison included in-air testing: raw ADC was `3031.00` in `free_air` and `3019.20` in `free_air_no_fan`; legacy `moisture_index` was `26.20` in `free_air` and `26.60` in `free_air_no_fan`.
- GPIO34 raw ADC decreased with wetter states to `1299.00` in `water_glass`, while uncalibrated legacy `moisture_index` increased to `96.60` because of the existing mapping.
- Practical future Balcony02 candidate ranking from this screen is `sen0308_m03`, `sen0308_m01`, `sen0308_m04`, then `sen0308_m02`; this is triage for future testing, not production assignment.

Out of scope:

- Replacing the current control sensor.
- Treating SEN0308 values as calibrated soil-moisture percentage.
- Treating this screen as sensor equivalence, field suitability, threshold, or watering-control evidence.
- Changing `MOISTURE_THRESHOLD`, moisture scaling, watering duration, cooldown, cadence, mapping, pins, device IDs, or `control_eligible`.
- Firmware edit/upload, SQL/RLS/schema change, frontend/hosted change, deploy, commit, push, field-unit upload, `/water-now`, or watering action.

Status:

- Complete and present on `main` in commit `c10b89e Document SEN0308 measurement-system analysis`.

## Phase 7N.3B - SEN0308 Single-Operator MSA and Channel-Swap Screen - COMPLETE AND PRESENT ON MAIN

Scope:

- Follow Phase 7N.3A with a structured single-operator measurement-system screen and M02/M03 physical channel-swap challenge.
- Use the same Prototype01 `/measurements` path and diagnostic-only SEN0308/GPIO34 records.
- Compare current wiring against an M02/M03 physical swap to determine whether the M02 concern followed the physical sensor or stayed with ADS1115 A1 / logged `sen0308_m02`.
- Capture insertion R&R behavior, same-insertion stability, wet follow-up behavior, direct-water floor behavior, and wet-to-air recovery.
- Product note: [`docs/product/phase7n3b-sen0308-single-operator-msa-channel-swap-screen.md`](./product/phase7n3b-sen0308-single-operator-msa-channel-swap-screen.md).
- Evidence CSVs: `field_readings/phase7n3b_gate1_sen0308_current_wiring_msa_20260612_164649.csv` and `field_readings/phase7n3b_gate2_m02_m03_channel_swap_20260613_120008.csv`.

Result:

- Phase 7N.3B did not identify a dead SEN0308 sensor or a clearly failed ADS1115 channel.
- The dominant observed variation was insertion/contact/media variation, especially between independent soil insertions; within-insertion readings were generally tighter than between-insertion readings.
- Physical SEN0308-M02 remains a watch item, not disqualified. The concern did not cleanly follow physical M02 after the M02/M03 swap.
- ADS1115 A1 / logged `sen0308_m02` remains a watch path, not a proven electrical fault. Physical M03 on A1 showed larger wet-state variation, but A1 recovered cleanly in final wiped-air.
- Physical SEN0308-M03 was a useful comparator; its A1 wet variability supports a contact/channel/media interaction rather than a simple dead-sensor conclusion.
- SEN0308-M04 remains a watch item, not disqualified; it showed soil-state variation but reached the direct-water floor and recovered cleanly in air.
- GPIO34 remained directionally coherent: raw ADC decreased as media got wetter, while `moisture_index` increased because of the existing mapping. GPIO34 also showed insertion/media variation.
- Recovery evidence was strong from wet soil to unwiped immediate air to wiped clean air; no SEN0308 channel stayed falsely wet after removal and wiping.
- The result argues against single-probe absolute threshold watering control for a future product. A safer future path is likely multi-sensor median/voting/outlier rejection with freshness gates, settling windows, and sensor-health evidence before watering authority.

Out of scope:

- Calibration, production moisture scale, field placement, plant water-need inference, wet/dry watering thresholds, sensor disqualification, supplier-return claim, or automatic-watering authority.
- Firmware edit/upload, SQL/RLS/schema change, schema snapshot/digest update, frontend/hosted change, deploy, commit, push, field-unit upload, `/water-now`, wiring change, watering behavior change, 5V action, threshold, cooldown, duration, cadence, pin, device ID, GPIO34 mapping, SEN0308 calibration constant, moisture mapping, or `control_eligible` change.

Status:

- Complete and present on `main` in commit `c10b89e Document SEN0308 measurement-system analysis`.

## Phase 7N.4A - SEN0562-L01 Controlled 3.3V Light-Sensor Proof - RUNTIME VALIDATED / COMPLETE PENDING REVIEW AND COMMIT

Scope:

- Added bench-only firmware support for one SEN0562-L01 light sensor behind MUX01 channel 1.
- Added `gen2_bh1750` as the low-level BH1750 provider and `gen2_sen0562` as the physical SEN0562 sensor-family module.
- `bench-proto-gen2` enables SEN0562 at expected address `0x23`, MUX01 channel `1`, and the controlled 3.3V proof flag.
- SEN0562-L01 records use `sensor_key` `sen0562_l01`, `sensor_type` `sen0562`, `measurement_name` `ambient_light`, `measurement_unit` `lux`, and `control_eligible:false`.
- SEN0562 capability `present` reflects runtime read status and is not hard-coded.
- SEN0562 details record `module_supply_documented_by_vendor: 5V`, `bench_proof_supply: 3.3V`, `electrical_boundary: 3.3V_only`, `no_5v: true`, mux address `0x70`, mux channel `1`, and sensor address `0x23`.
- Build validation passed for `bench-proto-gen2`, `balcony-installed-gen2`, and `balcony-sensor-scout-01`.
- The first upload attempt to Prototype01 on COM5 failed mid-flash with `Serial data stream stopped`; the second upload to Prototype01 on COM5 succeeded and hard-reset the ESP32.
- Disconnected SEN0562 validation passed: `/status`, `/capabilities`, and `/measurements` responded, and SEN0562-L01 emitted non-breaking missing evidence.
- An initial wiring mistake landed SEN0562-L01 on the upstream breadboard SDA/SCL path; firmware correctly reported `upstream_address_conflict` after `0x23` appeared in the upstream I2C scan, preventing a false mux-channel proof.
- Corrected wiring placed SEN0562 green on MUX01 channel 1 SDA / SD1, yellow on MUX01 channel 1 SCL / SC1, red on 3.3V only, and blue on GND.
- Runtime proof passed after corrected wiring: `/measurements` at `2026-06-10T23:27:38Z` reported `sen0562_l01` `ambient_light` `78.33 lux`, `valid:true`, `quality:"diagnostic"`, and `reason:"read_ok"`.
- Cover/uncover behavior moved in the expected direction: covered at `2026-06-10T23:30:01Z` reported `0.00 lux`; uncovered at `2026-06-10T23:30:28Z` reported `50.00 lux`.
- A later SEN0562-L01 missing / `not_detected` episode after several hours was traced to hardware wiring and connection faults, including a bad crimp on the SEN0562 yellow SCL wire and a temporary reversed-polarity rewiring mistake.
- After replacing the bad SCL connection and correcting polarity, Jeremy measured ESP32 3.3V to GND at `3.282V` and SEN0562 connector VCC/GND at `3.17V`.
- SEN0562-L01 revalidated after correction: `/measurements` at `2026-06-11T16:20:58Z` reported `sen0562_l01` `ambient_light` `238.33 lux`, `valid:true`, `quality:"diagnostic"`, `reason:"read_ok"`, mux channel `1`, sensor address `0x23`, `upstream_expected_address_present:false`, and `selected_channel_expected_address_present:true`.
- Treat the hosted 24h chart interval around the June 11 late-morning local electrical fault, roughly between the `11:00` and `11:15` readings by visual review, as troubleshooting evidence only; it is not valid calibration, sensor-comparison, watering-response, or control-quality data.
- The `238.33 lux` revalidation is bright indoor workbench-light evidence, not outdoor daylight or sunlight-level evidence; a manual Supabase `sensor_events` operational note is recommended as a separately approved operator step.
- Existing BME280, DS18B20, GPIO34, and SEN0308-M01/M02/M03/M04 records stayed present; VEML6030 remained missing / `not_detected` and out of the proof path.
- This proves one DFRobot SEN0562-L01 can operate at 3.3V on Prototype01 when wired behind MUX01 channel 1; the later missing episode was a wiring/connection fault, not an unresolved soak instability claim. It does not claim vendor-supported 3.3V operation, field installation readiness, long-cable behavior, waterproof connector readiness, PAR, calibrated lux, sunlight scoring, plant recommendations, or watering authority.

Out of scope:

- Firmware upload, SQL, deploy, commit, push, or field-unit upload.
- 5V wiring or 5V fallback.
- Moving ADS1115 off MUX01 channel 0.
- VEML6030 routing.
- Watering behavior, threshold, cadence, device ID, moisture mapping, or `control_eligible` behavior changes.

## Phase 7N.4B - SEN0562 Three-Sensor Muxed Light Proof - COMPLETE AND PRESENT ON MAIN

Scope:

- Extend the bench-only SEN0562 firmware proof from one sensor to three configured physical sensors on Prototype01.
- Preserve `SEN0562-L01` / `sen0562_l01` on MUX01 channel `1`.
- Add `SEN0562-L02` / `sen0562_l02` on MUX01 channel `2`.
- Add `SEN0562-L03` / `sen0562_l03` on MUX01 channel `3`.
- Reserve `SEN0562-L04`; it is not configured.
- Preserve ADS1115/SEN0308-M01-M04 on MUX01 channel `0`.
- Preserve GPIO34 moisture records, BME280, DS18B20, and VEML6030 disconnected/out of the proof path.
- Keep all SEN0562 records diagnostic-only with `measurement_name` `ambient_light`, `measurement_unit` `lux`, runtime-derived capability `present`, and `control_eligible:false`.
- Emit non-breaking missing / `not_detected` evidence for disconnected optional SEN0562 sensors.
- Product note: [`docs/product/phase7n4b-sen0562-multi-channel-mux-proof.md`](./product/phase7n4b-sen0562-multi-channel-mux-proof.md).

Runtime validation:

- Pre-upload `pio run -e bench-proto-gen2` succeeded.
- First upload to Prototype01 on COM5 failed with `Serial data stream stopped`; COM5 was confirmed still present, and the single approved retry succeeded and hard-reset Prototype01.
- Disconnected optional-sensor proof passed: L01 was valid at `144.17 lux` on MUX01 channel `1`; L02/L03 were configured but not wired and emitted missing / `not_detected` evidence with `sensor_not_detected_on_selected_channel` on channels `2` and `3`.
- Jeremy confirmed L02/L03 wiring and approved continuation.
- Wired proof passed: L01 reported `162.50 lux` on channel `1`, L02 reported `16.67 lux` on channel `2`, and L03 reported `135.00 lux` on channel `3`.
- One-at-a-time cover/uncover proof passed: covering L01, L02, and L03 individually dropped only the covered sensor to `0.00 lux`, and each sensor rose again after uncovering.
- SEN0308-M01/M02/M03/M04 stayed valid through ADS1115 on MUX01 channel `0`; GPIO34 moisture records stayed present/separate; BME280 and DS18B20 stayed valid; VEML6030 stayed missing / `not_detected` and out of the proof path; final `/status` showed `currently_watering:false`.

Out of scope:

- Moving VEML6030 behind the mux by implication.
- Treating light sensing as watering safety or plant diagnosis without a separate approved control/trust phase.
- SQL, RLS, Supabase schema snapshot updates, frontend/hosted behavior, deploy, field-unit upload, Prototype01 upload without separate approval, commit, push, watering behavior, relay behavior, `/water-now`, 5V fallback, light calibration, PAR conversion, sunlight scoring, final balcony placement labels, field installation assumptions, or long-cable claims.

## Phase 7N.5 - SEN0308 Relative Moisture Index / Moisture Data Analytics / MSA Roadmap - CURRENT WORKING ANALYSIS PATH / FUTURE IMPLEMENTATION

Scope:

- Compare SEN0308 moisture sensors against the current analog moisture baseline over controlled media, repeated insertions, wetting/dry-down, and longer observation windows.
- Evaluate SEN0308 measurement behavior, sensor-to-sensor variation, air/hand/proximity response, inserted-media behavior, wetting response, dry-down response, and whether any SEN0308-derived value can ever become control-quality evidence.
- Perform gage R&R or a suitable measurement-system evaluation.
- Distinguish display moisture index from validated control input.
- Determine whether software adjustment, filtering, sensor replacement, or no action is appropriate.
- Define a Relative Moisture Index and confidence model before any SEN0308 value receives new watering-control authority.
- Keep Balcony02 as the main correction path, using multiple SEN0308 sensors, sensor agreement/confidence scoring, a new physical build, and measured evidence rather than legacy single-sensor GPIO34 thresholds.
- Treat the June 14-15 automatic watering / display evidence section as backlog capture only; it should inform this analysis path without pivoting the project away from Phase 7N.5 or Balcony02.

Out of scope:

- Changing `MOISTURE_THRESHOLD` without evidence and explicit approval.
- Changing moisture scaling without documentation and approval.
- Bundling watering-duration changes into calibration unless explicitly approved.
- Firmware behavior changes, frontend behavior changes, SQL/schema changes, watering/control changes, deploy, firmware upload, `/water-now`, commit, or push without separate approval.

## Future Separate Review - SEN0204 Liquid-Level Electrical Feasibility

Scope:

- Review SEN0204 electrical compatibility, power, mounting, and safety before any wiring.
- Decide whether reservoir-level evidence belongs in MVP field safety/serviceability.

Out of scope:

- Wiring SEN0204, treating it as an alert source, or using it for dry-run interlock or pump-control authority before separate approval.

## Phase 7O.1 - Watering Event Evidence and Cadence Separation Design - BACKEND/FIRMWARE EVIDENCE PATH RUNTIME VALIDATED; PHASE 7O.2 HOSTED DISPLAY IMPLEMENTED PENDING REVIEW

Purpose:

- Record the inspection finding that Gen2 watering events are not currently represented as reliable hosted customer/support event evidence.
- Recommend a hybrid event-evidence model: preserve legacy `sensor_logs` watering markers, add future canonical device-originated `watering_events`, keep Gen2 measurements as measurement evidence, keep heartbeats as diagnostics evidence, and keep `sensor_events` as manual operational context.
- Define cadence separation direction before implementation: local sensor sampling, local control evaluation, routine cloud telemetry, immediate event telemetry, and hosted dashboard refresh are separate concepts.
- Preserve local ESP32 ownership of watering decisions and pump shutoff.
- Preserve Supabase as telemetry/history/diagnostics/event-evidence storage only.

Status:

- Product/design artifact: [`docs/product/phase7o1-watering-event-evidence-and-cadence-separation.md`](./product/phase7o1-watering-event-evidence-and-cadence-separation.md).
- ADR: [`docs/adr/0021-watering-event-evidence-and-cadence-separation.md`](./adr/0021-watering-event-evidence-and-cadence-separation.md).
- SQL artifact created and manually executed: [`docs/sql/phase7o1-watering-events.sql`](./sql/phase7o1-watering-events.sql).
- `public.watering_events` table and protected customer/support watering event views were validated.
- Firmware event posting was implemented in `src/main.cpp`.
- Balcony01 upload was validated using `balcony-installed-gen2`.
- One real local Manual Water Now generated device-originated `watering_started` and `watering_completed` event evidence.
- Phase 7O.2 hosted customer/support display reads protected `customer_watering_events` / `support_watering_events` views for `/mygarden`, `/app`, and `/support`.
- The hosted watering event display uses the selected device/window, keeps chart markers as the primary visual watering indicator, and shows a compact Watering History table below the chart with `Start Time`, `Duration`, and `Watering Type` columns.
- Customer-facing watering labels use `Manual Watering`, `Automatic Watering`, `Button Watering`, and rare/fallback `Device Safety` nomenclature; the hosted control label now reads `Device History`.
- The Watering History panel removed defensive read-only copy/pill, improved table contrast, and visually aligns its outer shell and compact table with the Live Measurements and chart panels.
- `/demo` does not read protected watering-event views; public demo watering history remains deferred until a curated public demo-safe watering-event view is approved.
- Frontend validation passed lint, default build, hosted-readonly build, and hosted bundle forbidden-string scan; Jeremy visually reviewed `/mygarden` locally before commit.
- No hosted local ESP32 calls were added.
- No Supabase command/control was introduced.

Remaining out of scope until separately approved:

- Deployment.
- Changing pins, sensors, device IDs, watering duration, `MOISTURE_THRESHOLD`, cooldown, `LOG_INTERVAL_MS`, moisture mapping, `control_eligible`, firmware metadata wording, or local dashboard Water Now behavior.
- Supabase command/control, Remote Water Now, hosted Water Now, hosted local ESP32 calls, app-based watering commands, fake telemetry rows, or fake watering rows.

## June 14-15 Automatic Watering / Display Evidence Follow-Ups - FUTURE / BACKLOG

Purpose:

- Capture the June 14-15 automatic-watering and display-evidence issues as future work only.
- Preserve the current Phase 7N.5 SEN0308 moisture-index / measurement-system analysis path as the main correction path.
- Avoid treating this backlog capture as approval for immediate implementation.

Findings and future work:

- Watering chart completeness: the hosted trend chart currently does not display all watering events that appear in the Watering History table. A future fix must preserve all watering event evidence. If many events make the chart visually noisy, improve the visual treatment with grouping, stacking, or count-preserving markers rather than hiding events. Watering logic problems should remain visible, not masked by the dashboard.
- Automatic watering no-response lockout: the June 14-15 incident showed repeated automatic 60-second watering events while an empty reservoir or ineffective watering produced no believable wetting response. Future control logic should require plausible post-watering moisture response before repeated automatic watering is allowed. Prefer evidence-based safeguards over arbitrary daily caps. A hard cap may still be useful as a final failsafe, but the primary rule should be logical: no repeat automatic watering without valid evidence that watering is still required and that previous watering had a plausible effect.
- Logical-range guardrails for future moisture control: out-of-range or physically suspicious values must be treated as diagnostic evidence, not watering evidence. Future Relative Moisture Index values below the dry reference, above the saturated/wet upper guard band, or based on conflicting sensor agreement must not authorize automatic watering. Single low readings must not authorize watering without repeated-reading validation and sensor-confidence checks. This should align with the existing ADR 0018 control-quality/freshness gate direction.
- Legacy GPIO34 / old scale risk: the current or legacy GPIO34 moisture scale can map non-soil or air-like conditions to low moisture-index values, such as around 25 when the GPIO34 probe is in air. This was acceptable only as temporary diagnostic/control evidence during earlier phases. Future Balcony02 / SEN0308 work should replace this interpretation with the Relative Moisture Index and confidence model before any new control authority is granted.
- Bench automatic relay behavior: Bench/Prototype01 may have triggered relay or watering-simulation events when GPIO34 was in air and below the old threshold. This is not necessarily mysterious sensor failure; it is evidence that old single-sensor threshold logic can trigger on invalid or non-soil conditions. Future bench behavior should remain safe and clearly labeled as simulation/testing only.
- Prototype01 local-responsiveness and relay-jumper observation: on 2026-06-15, Prototype01 / Bench01 stopped reporting to the hosted view after approximately 10:20 AM, and local endpoint reads initially failed while the ESP32 remained visible over USB as COM5. Opening serial monitor reset the ESP32; after reset, boot was clean and local endpoints recovered. Serial boot showed BME280 detected, DS18B20 device count `1`, VEML6030 missing, SEN0562-L01/L02/L03 detected, physical button enabled on GPIO32, Wi-Fi connected, IP `10.0.0.192`, and web server started. After reset, `/status`, `/capabilities`, and `/measurements` were good. The GPIO25-to-relay signal jumper was found disconnected and reconnected, likely explaining why a prior physical-button event around 10:30 AM appeared in hosted/event evidence but did not light or click the relay. That event evidence confirmed firmware command/event behavior, not physical relay actuation. After reconnecting GPIO25 and after reset, a short physical-button test threw the relay and posted watering events; serial showed `Physical button watering started`, `Physical button watering stopped. Duration: 3 seconds`, `Posting watering event: watering_started / physical_button`, `Watering event sent to Supabase`, `Posting watering event: watering_completed / physical_button`, and `Watering event sent to Supabase`. Treat this as a known bench reliability/runtime observation unless it repeats.
- Future physical water-delivery evidence: future production design should distinguish commanded watering/event evidence from physical water-delivery evidence. Evidence options may include relay feedback, pump-current sensing, flow sensing, reservoir-level sensing, or post-watering moisture-response validation. This supports, but should not derail, the current Balcony02 / Relative Moisture Index / multi-sensor confidence path.
- Legacy `/logs` noise: serial showed a legacy `GET /logs` request after recovery. For `bench-proto-gen2`, `/logs` is not part of the Gen2 bench measurement contract, so treat this as legacy polling/noise unless it becomes associated with repeated lockups.
- Provider-specific plausibility bounds: hosted/raw ADC plausibility checks appear to flag ADS1115 SEN0308 raw values around 16,000-18,000 counts as outside physical plausibility bounds. Those values are normal for ADS1115/SEN0308 evidence from Phase 7N testing. Future UI/diagnostics should use provider- and sensor-specific plausibility ranges rather than applying old ESP32 GPIO34-style expectations to ADS1115 channels.
- Wi-Fi/recovery monitoring: all three units showed high Wi-Fi disconnect/recovery event counts, but diagnostics also showed successful recovery, good RSSI, HTTP 201 posts, and zero consecutive cloud failures. Treat Wi-Fi event count as a monitoring/diagnostics follow-up, not the primary cause of the watering incident unless future evidence proves otherwise.
- Weatherproofing / exterior sensor common-mode risk: heavy rain, storm, dew, or condensation may have contributed to strange field-unit behavior. Future Balcony02 and pilot package work should include waterproof connector/cable routing, enclosure sealing, strain relief, and sensor exposure notes.
- Balcony02 remains the main correction path: do not pivot the project away from Phase 7N.5 and Balcony02. Many of these issues are expected to be addressed by the planned path: Relative Moisture Index, multiple SEN0308 sensors, sensor agreement/confidence scoring, new physical build, and eventual downgrade of Balcony01 to data-gathering/scout behavior after Balcony02 proves itself.

Out of scope until separately approved:

- Firmware behavior changes.
- Frontend behavior changes.
- SQL/schema changes.
- Watering/control changes.
- Deployment.
- Firmware upload.
- `/water-now`.
- Immediate implementation approval.

## Phase 7O - Local Sampling, Control Evaluation, and Telemetry Cadence Decoupling - FUTURE

Purpose:

- Decouple local sensor sampling cadence, local control-evaluation cadence, and cloud telemetry posting cadence.
- Avoid treating one interval such as `LOG_INTERVAL_MS` as the single answer for reading sensors, making control decisions, and posting history.
- Preserve local firmware ownership of watering decisions and pump shutoff.
- Preserve Supabase as telemetry/history/diagnostics storage only.
- Improve field deployability by reducing unnecessary local reads/posts while retaining enough local evidence for trust, control-quality gates, fallback handling, and future alerts.

Candidate future direction:

- Normal local sampling may be slower than the temporary 5-second validation cadence, likely around 30-60 seconds for most environmental readings.
- Normal cloud posting can remain approximately 15 minutes for customer history and hosted charting.
- Local control evaluation should be its own decision cadence, probably based on recent local samples rather than every hosted telemetry row.
- Watering events should still post immediate start/stop evidence.
- Watering event visibility now has a hosted read-only foundation: Phase 7O.2 reads protected customer/support watering-event views without creating fake rows, without introducing Supabase command/control, and without changing local watering behavior.
- After watering, during validation/debug mode, or when a sensor looks questionable, firmware may temporarily sample faster.
- Future firmware should consider a small local rolling buffer, such as the latest 6-12 readings per relevant measurement, to support repeated-reading validation, last-good fallback, local rate checks, stuck-sensor detection, and future trend/alert logic without posting every local sample.
- Future firmware should evaluate a recent last-good fallback window based on local sample age, with honest metadata such as fallback age and reason. Short recent fallback may be acceptable within a defined synchronization tolerance; stale fallback must not be presented as a fresh measurement.

Candidate modes:

- Normal customer mode.
- Debug/validation mode.
- Post-watering observation mode.
- Sensor-suspect confirmation mode.

Out of scope until separately approved:

- Changing current firmware cadence values.
- Changing `LOG_INTERVAL_MS`.
- Changing watering threshold, watering duration, cooldown, moisture mapping, pins, sensors, device IDs, or current control eligibility.
- Posting every local sample to Supabase.
- Replacing failed/null chart evidence with silent fallback values.
- Supabase command/control.
- Remote Water Now.
- Firmware upload.
- SQL/RLS/schema changes.
- Alerts/notifications implementation.

This future phase is not part of Phase 7I implementation except for backlog capture.

## Phase 7P - Hardware Safety Maturity

### Phase 7P.1 - Bench Physical Button Push-to-Water Proof - RUNTIME VALIDATED / COMPLETE PENDING COMMIT

Product note:

- [`docs/product/phase7p1-bench-physical-button-push-to-water-proof.md`](./product/phase7p1-bench-physical-button-push-to-water-proof.md)

Scope:

- Added a bench-only GPIO32 physical button proof on `Prototype01` / `bench-proto-gen2`.
- Used a normally-open switch to GND with `INPUT_PULLUP` active-low logic.
- Validated BLACK = ESP32 GND and WHITE = GPIO32 / SW1 physical-button signal on COM + NO switch terminals.
- Kept NC, 12V, pump voltage on GPIO32, and illuminated switch LED wiring out of scope.

Runtime validation:

- Uploaded `bench-proto-gen2` to `COM5`; device booted at `10.0.0.192` as UUID `318fab98-89ad-4f36-9100-3134a04e0be5`, role `bench`, build profile `bench-proto-gen2`.
- Proved press-to-start, release-to-stop, hold-to-run, 15-second physical-button safety timeout, and release-to-rearm behavior.
- Confirmed physical-button watering does not use `/water-now` and does not use the preset `WATERING_DURATION_MS` path.
- Confirmed queued physical-button event evidence posts only after local shutoff/release conditions clear.
- Evidence counts: 41 `physical_button` start events, 36 `physical_button` completion events, and 5 `firmware_safety` timeout events.
- All timeout events had `duration_seconds = 15`.
- Normal completed durations ranged from 0-6 seconds during rapid bench testing.
- `created_at` may lag `event_at` because queued evidence posts only after local safety conditions clear.
- Normal Gen2 measurement cadence remained separate at approximately 15 minutes.

Non-changes:

- No Balcony01 behavior changes.
- No Scout01 behavior changes.
- No hosted watering control.
- No Supabase command/control.
- No SQL.
- No frontend.
- No ADC, I2C mux, moisture-sensor, or light-sensor implementation.

Known limitation:

- Rapid repeat presses may appear delayed by synchronous queued physical-button event flushing after release. This is not a relay shutoff safety issue because release, timeout, and release-to-rearm remain local.

Scope:

- Treat hardware safety maturity as field deployability and product safety work, not optional polish.
- Evaluate reservoir low-water / dry-run protection.
- Evaluate leak detection.
- Evaluate overflow detection.
- Evaluate flow sensing.
- Evaluate pump-current sensing.
- Evaluate disconnected tubing detection.
- Evaluate blocked outlet detection.
- Gather physical failure/serviceability evidence.

Out of scope:

- Treating MVP as fully unattended-safe before hardware protections are validated.
- Changing watering duration, pins, firmware, or hardware configuration without explicit approval.

## Phase 7Q - Pilot Deployment Package

Scope:

- Assemble the complete pilot deployment bundle.
- Add an install checklist.
- Add a service checklist.
- Add a troubleshooting workflow.
- Link the pinout/from-to reference once created.
- Add a provisioning/setup checklist.
- Define customer-facing dashboard trust rules.
- Include watering event capture/visibility as a pilot trust requirement; hosted customer/support views must not imply watering evidence exists when local manual watering events were not captured in telemetry.
- Define field validation acceptance criteria.
- Document known limitations.
- Define the support workflow.
- Define what "safe enough for a supervised pilot" means.

Out of scope:

- Claiming unattended commercial readiness before Phase 7I through Phase 7P evidence supports it.
- Supabase command/control.
- Remote Water Now.

## Phase 6B — Device Identity / Bench Unit Readiness

Scope:

- Lock device identity convention before adding bench or field units.
- Keep installed balcony unit UUID `550e8400-e29b-41d4-a716-446655440000` for history continuity.
- Future ESP32 units require unique, stable, non-null UUIDs before deployment.
- Friendly names are separate field/user labels.
- Hosted read-only dashboard uses `VITE_MBG_DEVICE_ID` to select the displayed UUID.
- No Supabase schema change.

Out of scope:

- Multi-device UI.
- Settings/provisioning UI.
- Supabase schema changes.
- SensorLogRow changes.
- Remote Water Now.
- Supabase command/control.
- Sensor calibration.
- Hardware safety sensors.
- Commercial fleet management.

## Phase 6C — Prototype Device Identity Build Profiles

Scope:

- Add PlatformIO build profiles for intentional prototype device identity.
- Keep `src/config.h` ignored/local-only for secrets.
- Use tracked `src/device_identity.h` as the no-secrets identity bridge.
- Preserve installed balcony UUID for `balcony-installed`.
- Add bench-prototype UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Validate `pio run` and explicit profile builds.
- Validate built firmware binaries contain only the expected UUID.

Out of scope:

- Firmware upload without explicit approval.
- Production provisioning database.
- Device registry table.
- Supabase schema changes.
- SensorLogRow changes.
- Multi-device UI.
- Settings/provisioning UI.
- Remote Water Now.
- Supabase command/control.
- Sensor calibration.
- Hardware safety sensors.
- Graph duration controls.
- Broad frontend refactor.

## Phase 6D - Bench ESP32 Device Identity Flash Validation - COMPLETE

Scope:

- Bench ESP32 was flashed using the explicit PlatformIO profile command `pio run -e bench-prototype -t upload --upload-port COM5`.
- Generic upload command was not used.
- Bench firmware profile used UUID `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Installed balcony unit UUID remains `550e8400-e29b-41d4-a716-446655440000`.
- Bench ESP32 booted successfully, connected to Wi-Fi, and was observed at `10.0.0.192`.
- Bench local `/logs` endpoint returned valid data with `device_id` `318fab98-89ad-4f36-9100-3134a04e0be5`.
- Initial Supabase insert failed because the `sensor_logs` RLS insert policy only allowed the installed balcony UUID.
- Supabase RLS insert policy was updated to allow both known provisioned UUIDs: `550e8400-e29b-41d4-a716-446655440000` and `318fab98-89ad-4f36-9100-3134a04e0be5`.
- After the RLS policy correction, bench telemetry posted successfully to Supabase `sensor_logs`.
- Installed balcony unit remained unaffected and continued using its original UUID.
- Bench unit is now on the BJ1 test bench, powered, and `/logs` reports good data.
- No pump was connected to the bench unit during identity validation.
- No firmware behavior changes were made.
- No frontend behavior changes were made.
- No Supabase schema changes were made.

Out of scope:

- Firmware behavior changes.
- Frontend behavior changes.
- Supabase schema changes.
- Watering logic changes.
- Remote Water Now.
- Multi-device UI.
- Device registry.

## Deferred Non-Roadmap Notes Superseded By Phase 7H Rebaseline

The older standalone deferred sections for sensor calibration, provisioning/settings, and hardware safety are superseded by the Phase 7H MVP field-deployment roadmap:

- Sensor upgrade decisions move to Phase 7M.
- Sensor calibration and measurement-system evaluation move to Phase 7N.
- Local sampling, control evaluation, and telemetry cadence decoupling move to Phase 7O.
- Setup/provisioning boundary work moves to Phase 7L.
- Hardware safety maturity moves to Phase 7P.
- Pilot packaging and support readiness move to Phase 7Q.

Hydraulic prove-out and watering scheduling remain useful future physical/product questions, but they are not approved implementation work in this rebaseline. They must not be bundled into calibration or dashboard phases, and any watering duration, quiet-hours, or scheduling change still requires explicit evidence, approval, and the normal architecture/change-control path.

## Explicitly Deferred / Not MVP

- Remote Water Now through Supabase.
- Supabase command/control.
- Using `sensor_events` for every telemetry row.
- Admin page for `sensor_events`.
- Multi-device read-only UI.
- Auth/login, settings/provisioning, alerts, and commercial production hardening.
- Full production provisioning.
- Full commercial multi-device fleet management.
