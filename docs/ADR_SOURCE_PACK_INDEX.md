# ADR Source Pack Index

## Purpose

This index is a human-readable ADR inventory and source-pack selection guide. It does not replace the ADRs in [`docs/adr`](./adr), rename them, move them, or delete them.

Use this file to decide which raw ADRs to load for future ChatGPT/Codex phases. For most work, start with [`docs/ADR_ACTIVE_DECISION_DIGEST.md`](./ADR_ACTIVE_DECISION_DIGEST.md) and load raw ADRs only when changing or deeply reviewing that topic.

## Inventory

ADR files found in `docs/adr`: 25. ADR 0001 through ADR 0025 are all present in this repo, including ADR 0001, ADR 0002, and ADR 0019. No ADR numbers are missing in the current 0001-0025 range.

| ADR | Title | Date | Repo status | Current relevance | Amended / superseded / implemented by | Source-pack treatment |
| --- | --- | --- | --- | --- | --- | --- |
| 0001 | Local Working Baseline | 2026-03-27 | Present, accepted | Historical/foundational local ESP32 live/control baseline | Preserved by all later local-control boundaries | Historical foundation |
| 0002 | History Restoration Boundary | 2026-03-27 | Present, accepted | Historical/foundational separation of restored history from local live/control | Preserved by ADR 0004, 0006, 0009, 0016, 0020 | Historical foundation |
| 0003 | Canonical SensorLog Contract | 2026-03-28 | Present, accepted | Gen1/current `SensorLogRow` compatibility contract | Amended by ADR 0012; Gen2 separation anchored by ADR 0016 and 0017 | Historical compatibility |
| 0004 | Current Supabase Logging | 2026-05-07 | Present, accepted | Active telemetry/history logging boundary | Refined by ADR 0007, 0015, 0016, 0021 | Covered by digest |
| 0005 | Sensor Events Operational Log | 2026-05-07 | Present, accepted | Active manual operational context boundary | Kept separate by ADR 0014, 0017, 0021 | Covered by digest |
| 0006 | Watering Logic And Safety Philosophy | 2026-05-07 | Present, accepted | Historical Phase 5 automatic-watering safety philosophy | Current executable boundary superseded by ADR 0025; historical evidence retained | Historical control evidence |
| 0007 | Telemetry Logging Cadence | 2026-05-08 | Present, accepted | Active telemetry cadence separation | ADR 0021 separates watering event cadence further | Covered by digest |
| 0008 | Telemetry Integrity Hardening | 2026-05-11 | Present, accepted | Active firmware telemetry integrity boundary | Raw ADC evidence added by ADR 0012 | Covered by digest |
| 0009 | Hosted Read-Only Dashboard Boundary | 2026-05-11 | Present, accepted | Active hosted-readonly boundary | Extended by hosted Gen2/diagnostics/customer views; preserved by ADR 0020 | Active architecture anchor |
| 0010 | Device Identity and Production Traceability | 2026-05-11 | Present, accepted | Active stable device identity convention | Implemented through build profiles and registry-backed insert allowlists | Active architecture anchor |
| 0011 | Offline Autonomy and Wi-Fi Recovery | 2026-05-13 | Present, accepted | Active offline autonomy and network failure boundary | Extended by ADR 0019 runtime recovery | Active architecture anchor |
| 0012 | Sensor Diagnostic Telemetry and Raw ADC Visibility | 2026-05-14 | Present, accepted | Active optional raw ADC evidence amendment to `SensorLogRow.data` | Amends ADR 0003; future sensor expansion redirected by ADR 0016 | Covered by digest |
| 0013 | Multi-Unit Visibility and Local Control Target Safety | 2026-05-18 | Present, accepted | Active multi-device visibility and local manual-action safety boundary | Registry/backing SQL improved by ADR 0015; customer access separated by ADR 0020 | Active architecture anchor |
| 0014 | Device Diagnostics, Heartbeats, and Reliability Evidence | 2026-05-22 | Present, accepted | Active diagnostics architecture | Implemented mostly by Phase 6J.3/6J.4/6J.6 and Phase 7K.6; extended by ADR 0019 | Implementation guidance now reflected in current docs |
| 0015 | Supabase Device Registry and Table-Driven Allowlist | 2026-05-22 | Present, accepted | Active device registry and insert allowlist architecture | Implemented by `docs/sql/phase6j5-device-registry.sql`; reused by Gen2/watering evidence | Active architecture anchor |
| 0016 | Gen2 Modular Sensor Architecture | 2026-05-26 | Present, accepted | Major active Gen2 modular sensor and control-boundary anchor | Implemented/refined by ADR 0017, 0018, hosted Gen2 phases | Active architecture anchor |
| 0017 | Gen2 Measurement Batch Storage | 2026-05-28 | Present, accepted | Active Gen2 batch storage architecture | Implemented by `docs/sql/phase7d-sensor-measurement-batches.sql`; hosted by Phase 7F views | Active architecture anchor |
| 0018 | Gen2 Control Quality and Freshness Gates | 2026-06-01 | Present, accepted | Future automatic-control design evidence; not current executable behavior | Current dormant implementation retired by ADR 0025; reconsider if automation is separately approved | Load raw only for future control design |
| 0019 | Runtime Wi-Fi Recovery and Network Self-Healing | 2026-06-03 | Present, accepted | Active runtime Wi-Fi/network recovery architecture | Implemented by Phase 7K.5 and surfaced by Phase 7K.6 diagnostics | Active architecture anchor |
| 0020 | MVP Customer Setup, Access, and Local-Control Boundary | 2026-06-04 | Present, accepted | Active customer/site/support and read-only product boundary | Implemented partly by Phase 7L.4 SQL and hosted auth routes | Active architecture anchor |
| 0021 | Watering Event Evidence and Cadence Separation | 2026-06-07 | Present, accepted | Active watering event evidence and cadence-separation architecture | Implemented/proposed by Phase 7O.1 artifacts; hosted display later/current per backlog state | Active architecture anchor |
| 0022 | Gen2 Endpoint Responsibility and Contract Cleanup | 2026-07-15 | Present, accepted | Active `/measurements`, `/capabilities`, `/status`, heartbeat-alignment, and compatibility contract | Refines endpoint-shape portions of ADR 0016/0017; preserves batch storage, watering ownership, and read-only boundaries | Active architecture anchor |
| 0023 | MBG I2C Wire-Color Convention | 2026-07-03 | Present, accepted | Authoritative internal short-range I2C wire-color convention | Supersedes earlier WHT = SDA / GRN = SCL documentation; preserves GPIO21 = SDA and GPIO22 = SCL | Active wiring authority |
| 0024 | Hosted Device Capability Source of Truth and Presentation Boundary | 2026-08-14 | Present, accepted | Active hosted commissioned-capability, runtime-evidence, measurement, and presentation boundary | Extends ADR 0016, 0017, 0020, and 0022 without changing their storage, access, endpoint, or watering boundaries | Active architecture anchor |
| 0025 | Local Button Programs and Automatic-Control Retirement | 2026-08-24 | Present, accepted | Current 30/60-second local button, cancellation, reservoir-safety, and no-automatic-control boundary | Supersedes present-tense executable claims in ADR 0006/0018 while retaining their historical/design evidence | Active watering architecture anchor |

## Source-Pack Guidance

- For general planning: load the digest, this index, architecture, current state, phase backlog, and SQL schema digest.
- For watering/control work: load ADR 0025 first, plus ADR 0011, 0016, 0020, and 0021; load ADR 0006/0018 when historical or future automatic-control design context is needed.
- For hosted/customer or capability-driven presentation work: also load ADR 0009, 0013, 0020, 0024, and relevant Phase 7L/7O docs.
- For SQL/RLS/storage work: load [`docs/SQL_SCHEMA_ACTIVE_DIGEST.md`](./SQL_SCHEMA_ACTIVE_DIGEST.md) first, then raw SQL artifacts only for the affected table/view.
- For Gen2 endpoint or measurement work: load ADR 0016, 0017, and 0022, plus raw SQL for `sensor_measurement_batches` or hosted Gen2 views when changing storage/read behavior.
- For wiring, pinout, I2C, or sensor-cable work: load ADR 0016 and ADR 0023, plus the production wiring workbook and any sensor-specific factory-lead evidence.
- For diagnostics/recovery work: load ADR 0014, 0019, and 0022, plus raw SQL for `device_heartbeats` and hosted diagnostics views when changing storage/read behavior.
