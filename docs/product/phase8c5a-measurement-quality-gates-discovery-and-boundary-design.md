# Phase 8C.5A — Measurement-Quality Gates Discovery and Boundary Design

Date: 2026-08-17

Status: Documentation design approved

## Purpose

Phase 8C.5A defines how implausible or suspicious measurements are classified without changing stored evidence, commissioned capability, customer access, or firmware watering authority. It closes the discovery and boundary-design step only. It does not implement a gate.

The motivating Balcony02 example is an intermittently faulty BME280 that produced values near `362 F`. Current firmware can report such a finite value as `valid:true`, `quality:"good"`, and `reason:"read_ok"`. Append-only storage preserves it, and the current capability-driven Support frontend can classify it as usable, show a `Current` evidence pill, display the value, and let it drive full-card environmental `Check` treatment. That behavior proves that device-reported validity, evidence freshness, and presentation trust are distinct.

## Authority and classification boundaries

Keep the following concepts separate:

1. **Commissioned capability** — Supabase positive lifecycle declarations determine which hosted cards and expected measurements exist.
2. **Measurement existence** — a stored observation is evidence, not commissioning authority.
3. **Device-reported metadata** — `valid`, `quality`, and `reason` describe the producer's read outcome and must remain visible as reported.
4. **Numeric finiteness** — necessary for numeric presentation, but not proof of physical plausibility.
5. **Provider electrical possibility** — provider-specific electrical or conversion limits, never a generic rule based only on `raw_adc`.
6. **Sensor physical plausibility** — a broad sensor-family constraint supported by repository evidence or an explicitly approved authoritative source.
7. **Installation or calibration expectation** — commissioned installation evidence and calibration context, not universal sensor validity.
8. **Recent-behavior anomaly** — comparison with the same measurement identity's history; a heuristic, not a rewrite of the raw observation.
9. **Evidence freshness** — continues to use `measured_at` and remains independent from plausibility.
10. **Environmental-condition interpretation** — condition wording and full-card treatment only after the selected evidence is presentation-eligible.
11. **Support diagnostic concern** — may expose original value, metadata, physical identity, provider context, and derived concern.
12. **Customer display eligibility** — future customer-safe treatment without raw engineering details.
13. **Firmware watering/control eligibility** — remains local firmware authority and is not decided by hosted presentation gates.

No derived classification may silently rewrite stored evidence, device-reported metadata, capability lifecycle, assignment, or watering authority.

## Obsolete raw-ADC rule removal

The generic raw-ADC trust rules in the frontend are obsolete remnants from a failed moisture-sensor path. They are not part of the Gen2 product, have no compatibility requirement, and must be removed rather than adapted or propagated.

Specifically:

- do not infer an electrical range from the measurement name `raw_adc` alone;
- do not copy any generic raw-ADC bound or display band into Gen2 gates;
- do not activate, import, or treat `mbg_dashboard/src/hostedMeasurementTrust.ts` as an approved source of truth;
- do not reuse its undocumented hard bounds or recent-behavior thresholds without separate evidence and approval; and
- remove the obsolete moisture path instead of retaining it.

`hostedMeasurementTrust.ts` is currently unimported, unexecuted, and directly untested. Its generic raw-ADC rule is unrelated to the commissioned ADS1115-backed SEN0308 system and makes the module unsuitable for direct integration. A later implementation should replace the relevant trust boundary deliberately and remove obsolete code instead of carrying it forward.

## Provider-specific findings

### ADS1115-backed SEN0308 raw counts

Balcony02 SEN0308 M01–M03 use ADS1115 channels A0–A2 and a signed 16-bit conversion. Future electrical checks must be designed directly for that provider and the installed SEN0308 measurement system. The ADC's representable type domain alone is not an approved SEN0308 physical-plausibility, installation, or calibration range.

The existing Relative Moisture Index is a frontend-derived installation interpretation using `PRACTICAL_DRY_RAW = 14820`, `WET_DRAINED_RAW = 11230`, and `WET_DRAINED_INDEX = 90`. Those constants are not universal electrical or sensor-validity bounds. RMI remains tied to its exact usable raw source and retains no watering authority.

### BME280

Current firmware rejects only `NaN` after a successful provider read. It applies no physical plausibility bounds to air temperature, relative humidity, or pressure. A finite implausible value may therefore retain good device metadata. Phase 8C.5A approves no numeric BME280 threshold; later implementation must cite repository evidence or an explicitly approved authoritative source.

### DS18B20

Current firmware rejects the provider's disconnected sentinel and `NaN`. It applies no broader soil-temperature plausibility range. No new range is approved here.

### SEN0562/BH1750

Current firmware accepts a successful provider lux conversion. No universal or installation-specific lux plausibility bound is approved here. Existing light bands remain environmental presentation, not validity.

### SEN0204

The current record is binary reservoir-detection evidence. Presentation may require exactly `0` or `1`. Firmware retains ownership of the reservoir watering interlock, including blocking and active-cycle interruption.

## Selected evidence-preservation design

Raw Gen2 batches remain append-only evidence, including valid, invalid, failed, missing, diagnostic, and suspicious observations. Flattened and protected views continue to expose original values and device metadata. No historical backfill, deletion, correction, or stored presentation flag is required.

A later presentation gate may derive a result from an already-fetched row and its commissioned descriptor:

- `eligible` — may supply ordinary current value and environmental condition;
- `presentation concern` — retain the row for Support, but do not present it as trusted current environmental evidence;
- `unavailable` — no finite/device-usable row exists; and
- `insufficient authority` — no approved provider/sensor rule exists, so do not invent one.

Exact naming remains subject to the implementation slice. The result is frontend-derived and ephemeral.

When the latest row has a presentation concern:

- the commissioned card remains;
- the original observation remains visible in authenticated Support diagnostics;
- device-reported `valid`, `quality`, and `reason` remain unchanged and visible;
- the ordinary value/condition path must not call the row trusted or let it drive environmental coloring;
- the last presentation-eligible evidence may remain visible with its honest timestamp and age;
- evidence health must distinguish freshness from the plausibility concern; and
- customer wording, when customer adoption exists, must omit raw ADC, physical identity, formulas, constants, and engineering diagnostics.

For the `362 F` example, the intended later outcome is: preserve the raw row and metadata; retain the commissioned Air Temperature card; show the concern and original evidence to authorized Support; do not label `362 F` as trusted current environmental evidence; do not let it drive ordinary environmental condition coloring; and use an honestly timestamped last presentation-eligible value when available.

## Query and Disk IO contract

The preferred first implementation uses only the capability descriptors, measurements, and diagnostics already fetched for the selected device/window.

It must add:

- no query;
- no per-card or last-good recovery query;
- no history-window expansion;
- no polling change;
- no SQL, view, function, index, trigger, or stored flag;
- no historical backfill or mutation; and
- no production Disk IO beyond the existing bounded reads.

A later proposal that adds provider fields to hosted projections, compares runtime capabilities, expands history, or adds a diagnostic query requires separate SQL/security review and a production read-only `EXPLAIN` before implementation.

## Candidate slice separation

1. **Phase 8C.5A — discovery and boundary design:** this documentation-only decision.
2. **Deterministic frontend presentation gate:** separately approve rules supported by identified authority, integrate them into capability-driven cards, and add direct tests.
3. **Firmware/provider validation:** separately decide whether future device metadata should reject electrically impossible or physically implausible reads.
4. **Ingestion/storage validity:** deferred unless evidence demonstrates a need beyond append-only preservation and derived presentation classification.
5. **Support diagnostics presentation:** separately decide detailed concern wording and visibility.
6. **Production validation and closeout:** separately approve after implementation validation.

These slices must not be automatically combined.

## Acceptance criteria for a later frontend implementation

- Provider/sensor identity selects the rule; `raw_adc` alone never does.
- No obsolete generic raw-ADC rule is propagated into Gen2 logic.
- Every hard bound cites repository evidence or an explicitly approved authoritative source.
- Installation ranges and recent-behavior heuristics are labeled as such, not as electrical impossibility.
- A suspicious finite value cannot receive ordinary trusted-current environmental treatment solely because device metadata says valid/good.
- Stored evidence and device metadata remain unchanged.
- Commissioned cards remain visible, and undeclared measurements create no ordinary cards.
- Last-good evidence retains honest source time and age.
- Support and future customer detail remain separated.
- Watering/control eligibility remains firmware-owned.
- Direct deterministic tests cover `362 F`, provider-specific raw ADC behavior, last-good recovery, and evidence preservation.
- The implementation uses already-fetched rows and adds no query or Disk IO.

## Explicit exclusions

- Runtime code or test changes.
- Firmware changes, upload, or device operation.
- SQL, Supabase mutation, schema, view, RLS, grant, index, trigger, or stored flag changes.
- Scientific threshold invention.
- Customer capability adoption.
- Demo architecture changes.
- Feels Like, Dew Point, alerting, calibration, watering changes, Gen1 cleanup implementation, major visual modernization, or Phase 8D work.
- Deployment, commit, or push.

## Closeout

Phase 8C.5A approves the boundary design only. It changes no runtime behavior and does not claim that implausible measurements are currently gated. The next implementation scope requires separate approval.
