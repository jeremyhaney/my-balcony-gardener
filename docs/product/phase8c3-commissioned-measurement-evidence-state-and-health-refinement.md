# Phase 8C.3 — Commissioned Measurement Evidence-State and Health Refinement

Date: 2026-08-16

Status: Implemented and locally validated; production deployment/validation pending

## Purpose

Phase 8C.3 refines the authenticated Support presentation created by Phase 8C.2. Hosted commissioned capabilities continue to determine which logical sensors and expected measurements exist. Measurements remain evidence, never commissioning authority. Missing, invalid, stale, or unavailable evidence cannot remove a commissioned card.

This slice changes no SQL, schema, Supabase data, firmware, device operation, watering authority, polling cadence, history limit, capability caching, Demo capability access, or customer capability adoption.

## Approved evidence policy

- `measured_at` is the measurement-freshness authority; `batch_created_at` remains separate transport/storage evidence.
- Expected reporting cadence is currently 15 minutes.
- Current evidence limit is `3 × cadence + 5-minute delivery grace`, currently 50 minutes.
- The second age boundary is `6 × cadence + 5-minute delivery grace`, currently 95 minutes.
- Measurement-specific actionable concern after 95 minutes requires evidence that the device remains active. Whole-device inactivity is attributed to device reporting/connectivity instead of declaring every sensor failed.
- One invalid reading is informational; two consecutive invalid readings are cautionary.
- One or two latest-package omissions are informational; three consecutive omissions are cautionary.
- Consecutive counts use only the already-fetched selected-window rows, reset on usable evidence, and are labeled `At least N` when the fetched window truncates the run.
- Last-good evidence remains visible without an additional recovery query. Its value, source timestamp, and age are identified honestly.
- `No Reading in Selected Window` replaces an unsupported lifetime claim that a commissioned sensor has never reported.

## Presentation boundary

The full card represents the environmental interpretation of the displayed value. The pill represents evidence health. A single omission or invalid reading does not erase a still-current last-good environmental condition. After 50 minutes, the environmental condition becomes neutral/unknown. After 95 minutes, an active device can produce an actionable `Check Sensor` pill.

Dashboard/query failure is presented as dashboard data unavailability, not as a failed sensor. Unsupported commissioned measurements remain commissioned and use `Presentation not supported`. A commissioned sensor is never labeled `Not Installed`.

## RMI and Support details

Relative Moisture Index remains frontend-derived presentation behavior. It is recomputed from the exact selected usable raw ADC row and cannot outlive that source. When no usable raw evidence exists, the derived value is unavailable.

Authenticated Support Sensor Details may show commissioning identity, logical channel, measurement/storage timestamps, validity/quality/reason, last-good provenance, bounded failure counts, raw ADC evidence, and the RMI formula/constants. Customer views must not expose raw ADC, physical identity, formula/constants, or engineering diagnostics.

## Device Status and query contract

Authenticated Support Device Status now evaluates the selected device's commissioned capability descriptors instead of the frozen Balcony02 catalog. Zero capabilities create no fabricated measurement expectations, and capability-query failure prevents commissioned measurement-health evaluation. Demo retains its existing catalog behavior.

The implementation adds no query, polling path, per-card query, history expansion, last-good recovery query, persistent counter, storage contract, or hidden-tab refresh. It uses the existing capability, measurement, and diagnostics results.

## Validation

Automated validation passed 20/20 tests, ESLint, the TypeScript/Vite production build, and `git diff --check`. The existing Vite large-chunk advisory remains non-blocking.

Jeremy's authenticated local Support review on 2026-08-16 confirmed Balcony02's healthy/current presentation: eleven commissioned cards remained in Light, Air, Water, Soil order; condition colors and labels appeared on the full cards; evidence pills showed `Current`; values, trends, and Sensor Details remained available. The normal sensor state could not naturally exercise invalid, omitted, stale, or device-inactive cases. Those states are covered by deterministic tests rather than forced device faults.

No production deployment or production validation is claimed by this document.
