# Phase 8C.3C — Evidence-State Implementation

Date: 2026-08-16

Status: Production-validated and operationally closed

## Purpose

Phase 8C.3C implements the evidence-state model approved through Phase 8C.3A discovery/decisions and Phase 8C.3B design closeout. It refines the authenticated Support presentation created by Phase 8C.2. Hosted commissioned capabilities continue to determine which logical sensors and expected measurements exist. Measurements remain evidence, never commissioning authority. Missing, invalid, stale, or unavailable evidence cannot remove a commissioned card.

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

## Production validation and operational closeout

The Phase 8C.3C runtime implementation was pushed on `main` as `c87fa34782e6bcc603e7d76c1d3d1bdf7ff4c20b` (`Refine commissioned measurement evidence health`) and reached production through the normal Cloudflare post-push update path; no manual deployment command was used. Phase 8C.3D subsequently closed the narrow derived-unavailable deterministic-test evidence gap in commit `de7e5de8bcc9e1d73bc72333939225210b273843` (`Validate Support evidence fault states`).

Jeremy's authenticated production Support validation on 2026-08-17 passed for Balcony02 at the 24-hour window. Directly observed:

- exactly eleven commissioned cards rendered in Light, Air, Water, Soil order;
- L01/L02/L03, separate Air Temperature/Humidity/Atmospheric Pressure, Reservoir Water, M01/M02/M03, and Soil Temperature were present;
- M04, L04, and LUX04 were absent;
- every Support evidence pill showed `Current`, while full-card environmental condition wording remained separate;
- values, units, timestamps, trends, History controls, and Sensor Details were available;
- Sensor Details showed Support-only commissioning, provenance, physical identity, quality/reason, raw ADC, and RMI formula evidence as applicable;
- Garden Reading Quality used commissioned expectations and reported 11 of 11 expected readings, 9 of 9 physical sensors, 96 of 96 expected reports, and all 11 latest readings usable;
- Manual Refresh advanced the last-refreshed time and completed normally;
- no hosted Water Now control, M04/L04/LUX04 card, or browser-console error appeared; and
- the public Demo loaded normally, remained Balcony02-only, and produced no browser-console error.

Invalid, omitted, stale, future-timestamp, repeated-failure, derived-unavailable, device-inactive, and bounded-count states were not induced in production. They remain deterministic-test-supported. No SQL, Supabase mutation, firmware or device operation, sensor fault, capability or assignment change, watering action, query expansion, or manual deployment occurred.

Result: **Pass**. Phase 8C.3C implementation is complete; Phase 8C.3D owns production validation and operational closeout.
