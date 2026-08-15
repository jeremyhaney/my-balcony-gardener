# ADR 0024: Hosted Device Capability Source of Truth and Presentation Boundary

## Status

Accepted

Implementation note: The Phase 8C hosted capability schema and Balcony02 provisioning were executed and production-validated on 2026-08-14. See [`../product/phase8c-hosted-device-capability-production-execution-evidence.md`](../product/phase8c-hosted-device-capability-production-execution-evidence.md). The original decision rationale and staged implementation sequence below are retained as design history.

## Date

2026-08-14

## Context

The hosted frontend currently has substantially fixed sensor-card assumptions, while commissioned production devices can have different sensor complements. Measurement presence or absence cannot reliably distinguish a commissioned sensor that is healthy from one that is stale, invalid, temporarily unavailable, newly commissioned, retired, or absent from the latest batch. Nor can measurements distinguish configured expansion accommodation, experimental firmware output, Gen1 compatibility data, or historical Gen2 evidence from the device's current commissioned configuration.

ADR 0022 defines firmware `/capabilities` as the running build's static compile-time/profile manifest and `/measurements` as observations from configured installed sensors. ADR 0017 preserves Gen2 observations as append-only batches with flattened query views. ADR 0020 separates authenticated customer membership and support access from device identity and presentation metadata. None of those decisions establishes the authoritative hosted per-device capability contract.

Balcony02 illustrates the gap. Its M04 connection/profile accommodation is declared `installed:false`; that physical accommodation is not a commissioned capability. Connecting an M04 sensor would not make it appear automatically because the current firmware does not monitor that channel as a commissioned sensor. Likewise, LUX04 is not modeled merely because a different light sensor might be physically connected. Adding M04 or LUX04 requires a planned hardware, firmware, hosted-configuration, and validation rollout. Hot-plug discovery is not part of the current product contract.

Establishing the hosted source of truth changes the device/frontend responsibility boundary and therefore precedes SQL or frontend implementation.

## Decision

Use a hybrid hosted presentation architecture consisting of:

- stable frontend sensor definitions and display metadata;
- provisioned per-device commissioned capabilities in Supabase;
- Gen1 and Gen2 measurement adapters;
- derived measurement health;
- route-specific presentation policy; and
- separate Support diagnostics.

### Positive commissioned-capability declarations

The hosted capability contract declares only logical sensors commissioned for a device. Presence means a hosted frontend should expect that logical sensor. Absence makes no broader statement about what is unsupported, physically absent, theoretically possible, or intentionally omitted.

A connector, unused channel, expansion position, or physical accommodation alone is not a commissioned capability. The system must not create negative `not installed` records for every possible sensor. Hot-plug discovery and automatic promotion are outside the current product contract.

Each declaration has a commissioning/effective start and may have a retirement/effective end. Current cards use declarations currently in service. A physical replacement may retain the same logical channel when operationally appropriate; Support diagnostics should preserve physical-identity transitions where evidence permits.

### Supabase hosted authority

For hosted pages, provisioned per-device capability configuration in Supabase is authoritative for commissioned sensor capabilities. The configuration remains subject to the existing authentication, garden/device membership, customer-isolation, and support-access boundaries.

This ADR does not select a table, view, constraint, function, grant, RLS policy, seed, or provisioning design. A later independently reviewed SQL-design slice must determine those details, rollback, and validation before any execution.

### Firmware/runtime evidence boundary

Firmware `/capabilities`, or equivalent Gen2 status/capability output, reports what the running build declares. It is runtime and diagnostic evidence; it does not automatically overwrite hosted provisioning.

A mismatch between runtime evidence and Supabase provisioning is a commissioning/configuration discrepancy visible to authorized Support. It must not silently create or remove customer-facing cards. A local device page may consume the directly connected device's runtime contract, but local discovery does not become the hosted fleet source of truth.

### Measurement boundary

Recent or historical measurements never create or remove commissioned capabilities. This applies to:

- Gen1 `sensor_logs`;
- Gen2 `sensor_measurement_batches`;
- `sensor_measurements_flat` and hosted flattened projections;
- `device_heartbeats`;
- diagnostics; and
- future or unknown measurement types.

Measurements provide values, validity, and runtime evidence. They do not prove current commissioning. Missing recent evidence must never be interpreted as proof that a sensor was never installed or is no longer expected.

### Presentation concepts and ownership

The architecture keeps these concepts separate:

- stable frontend sensor definitions and generic display metadata;
- per-device commissioned capability and lifecycle;
- current and historical measurements;
- validity;
- freshness;
- derived measurement health;
- customer presentation policy; and
- Support presentation and diagnostics.

Generic sensor-family labels, units, formatting, ordering, chart metadata, condition wording, and visual styling remain frontend responsibilities unless a later decision supersedes this boundary. Visual treatment does not belong in firmware or raw measurement records. Installation-specific friendly names and location labels may belong with the commissioned declaration.

Measurement health and environmental interpretation are different. Stale, invalid, missing, or unavailable state takes precedence over current-condition wording; stale values must not be described as current conditions. Customer wording describes measured conditions, not inferred plant health. Detailed friendly names, condition bands, colors, Dew Point, and Feels Like remain frontend implementation decisions.

### Current-reading cards

Current-reading cards are generated from currently commissioned capabilities joined to the best available current measurement state. A commissioned sensor remains visible when its value is current and valid, stale, invalid, temporarily unavailable, absent from the latest Gen2 batch, or not yet reported after commissioning. Missing, stale, and invalid commissioned sensors fail visibly instead of disappearing.

Undeclared measurements do not become ordinary customer cards. Unknown or experimental measurements must not break rendering, corrupt known cards, or automatically become customer capabilities. When an existing authorized data path exposes them, preserve them as Support-facing diagnostic evidence. Customer presentation requires coordinated firmware serialization, hosted provisioning, frontend definitions/formatting, and validation.

### Route policy

- **Local device page:** may use the directly connected device's runtime capability/status contract.
- **Public Demo:** temporarily uses Balcony02 as a live containment measure. A deterministic curated Demo remains deferred.
- **My Garden/customer:** shows authorized devices and their currently commissioned customer-relevant capabilities.
- **Support:** shows authorized support devices and may additionally expose provisioned capabilities, runtime evidence, build profile, mismatches, missing commissioned measurements, undeclared measurements, physical identities, heartbeats, and diagnostics.
- **History:** may offer current and formerly commissioned logical sensors when their service intervals overlap actual historical evidence. Measurements alone do not establish those intervals.
- **Diagnostic panels:** may show undeclared measurements and mismatches without promoting them to customer cards.

These routes use shared definitions and adapters; they must not introduce duplicated route-specific card catalogs. Detailed history-selector and historical-cleanup behavior is deferred.

Device dropdown and route eligibility remain separate from sensor capability presentation. Eligibility is based on assignment/access policy, not whether measurements are current, stale, offline, or missing. The approved interim direction remains Demo: Balcony02 only; My Garden: intended Balcony02 only pending a protected Supabase assignment/configuration slice; Support: Balcony02, Prototype01, Balcony01, and Scout01. This ADR changes no assignment, and offline status alone does not determine eligibility.

Use `Prototype01` in active prose and future-facing examples. The repository-wide `Bench01` to `Prototype01` migration remains a separately inventoried compatibility change because older identifiers, profiles, documentation, and data may still use the legacy name.

### Gen1 and Gen2 compatibility

Gen1 compatibility continues through `SensorLogRow` and `sensor_logs`. Gen2 continues to store one physical `sensor_measurement_batches` row per batch, with nested records flattened through conventional SQL views. Gen1 and Gen2 adapters may feed one frontend presentation model, but neither storage model becomes capability configuration.

No Gen1 contract or consumer is removed by this decision. Actual consumers must be identified before any later removal.

### Preserved authority boundaries

- ESP32 firmware retains watering authority and safety shutoff.
- Hosted pages remain read-only for watering control.
- Supabase remains telemetry, history, diagnostics, authentication, membership, and hosted-data infrastructure; capability provisioning grants no command authority.
- `watering_events` remains watering evidence.
- `device_heartbeats` remains diagnostic evidence.
- This presentation decision changes no watering rule, identity, sensor pin, firmware cadence, telemetry cadence, or heartbeat cadence.

## Rejected Alternatives

1. **Generate cards only from returned measurements.** This hides commissioned sensors precisely when missing, stale, or invalid evidence must be visible.
2. **Use only a fixed frontend card catalog.** A global catalog cannot express the commissioned complement and lifecycle of each device.
3. **Use the latest heartbeat or firmware declaration as hosted truth.** Runtime evidence can drift from provisioning; automatic adoption would silently change customer presentation.
4. **Infer installed sensors from recent or historical measurements.** Evidence may be stale, experimental, Gen1-compatible, or retained after retirement and cannot establish a service interval.
5. **Encode all possible absent or unsupported sensors.** A negative catalog adds unbounded noise and assigns meaning to mere physical possibility.
6. **Let unknown measurements create customer cards.** This makes experimental firmware an uncontrolled product-presentation authority.
7. **Use build-profile fallback configuration in production before Supabase provisioning exists.** A fallback would create a second hosted authority and conceal incomplete provisioning. Production capability-driven hosted behavior must wait for reviewed Supabase provisioning.

## Consequences and Tradeoffs

The customer presentation becomes device-specific and honest under missing or bad evidence. Support gains a defined place to compare provisioning, runtime declarations, measurements, physical identities, and build provenance. Unknown firmware output can be retained diagnostically without destabilizing customer pages.

The tradeoff is a new provisioned lifecycle that must be designed, secured, seeded, maintained, and validated. Frontend adapters must reconcile multiple storage generations and measurement aliases. Runtime/provisioning mismatches become explicit operational work rather than silently self-healing.

The Supabase capability contract and initial Balcony02 declarations are now implemented, but existing hosted cards remain transitional because no frontend consumes the protected capability views. This ADR does not approve a production build-profile fallback or claim capability-driven cards are implemented.

## Implementation Sequence

Each step is a separately reviewed slice:

1. ADR 0024 and active-documentation alignment.
2. Supabase capability-contract design.
3. Review SQL, constraints, RLS, grants, views, migrations, seed/provisioning, rollback, and validation without execution.
4. Separately approve SQL execution and production validation.
5. Add frontend capability types and Gen1/Gen2 adapters.
6. Implement capability-driven current cards.
7. Add capability-aware history controls.
8. Add Support runtime/configuration mismatch and unknown-measurement diagnostics.
9. Add approved friendly names and condition/color presentation.
10. Add Dew Point and Feels Like.
11. Separately contain or remove legacy paths.
12. Separately audit and clean historical data, if approved.
13. Build a separate deterministic customer Demo.

Approval of this ADR approves none of the SQL, firmware, deployment, provisioning, or cleanup steps.

## Validation Expectations

Later implementation must prove that:

- provisioning and runtime evidence can disagree without silently changing customer cards;
- commissioned sensors remain visible when evidence is stale, invalid, missing, or not yet reported;
- undeclared/unknown measurements cannot break known rendering or become customer cards;
- authorization and membership are enforced for capability and diagnostic reads;
- Gen1 and Gen2 adapters produce a common presentation model without changing storage contracts;
- lifecycle intervals, aliases, physical replacements, and historical overlap behave as designed;
- customer and Support presentations remain separate; and
- watering authority, read-only hosted behavior, cadence, and safety contracts are unchanged.

## Rollback and Supersession

Before implementation, rollback consists of reverting this ADR and its active-documentation summaries. After provisioning or frontend implementation exists, rollback must be a separately reviewed plan that preserves customer isolation and historical evidence and does not infer configuration from measurements.

A later ADR may supersede this decision only by explicitly replacing the hosted authority, positive lifecycle, measurement/runtime evidence boundary, route policies, compatibility treatment, and rollback implications.

## Explicitly Deferred

- exact Supabase table, view, function, constraint, migration, seed, and provisioning design;
- SQL execution, RLS changes, and grant changes;
- capability provisioning or automatic firmware/Supabase reconciliation;
- firmware changes;
- frontend adapters and capability-driven card rendering;
- history-selector changes and detailed retired-capability behavior;
- Support diagnostic UI;
- broad friendly-name work, condition thresholds, and color scales;
- Dew Point and Feels Like;
- deterministic sample-data Demo;
- `/mygarden` assignment correction and Support default ordering;
- repository-wide `Bench01` to `Prototype01` migration;
- Gen1, Water Now, or local green-site removal;
- database retention, purge, migration, or cleanup; and
- broader visual modernization.
