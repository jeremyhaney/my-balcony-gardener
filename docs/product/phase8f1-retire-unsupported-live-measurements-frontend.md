# Phase 8F.1 — Retire Unsupported LiveMeasurements Frontend

Date: 2026-08-19

Status: Implemented and locally validated.

## Outcome

Phase 8F.1 removes the obsolete Phase 7C Prototype01-only local frontend panel. Prototype01 is offline/retired, and the panel's local response types predated the current Gen2 contracts. The local/default application no longer mounts the panel or starts its hardcoded five-second polling of Prototype01 `/status`, `/capabilities`, and `/measurements`.

The removal is frontend-only. It does not remove or change the firmware endpoints themselves.

## Reachability and ownership proof

Repository search before deletion established the exact boundary:

- `mbg_dashboard/src/App.tsx` was the only lazy import and render path for the `LiveMeasurements` component.
- `mbg_dashboard/src/components/LiveMeasurements.tsx` was the only consumer of its dedicated stylesheet.
- The component was the only consumer of `mbg_dashboard/src/liveMeasurementsApi.ts`.
- The component/helper pair were the only consumers of `mbg_dashboard/src/types/liveMeasurements.ts` and its `LocalStatusResponse`, `CapabilitiesResponse`, `CapabilityModule`, `MeasurementRecord`, and `MeasurementsResponse` types.
- No test or fixture referenced or exclusively protected this implementation.
- `DEVICE_REGISTRY` and `LOCAL_CONTROL_TARGETS` had independent consumers in history selection and `LiveStats`; they were therefore preserved.
- `LiveStats` independently owns the surviving local `/logs` polling and local `/water-now` call path; it was therefore preserved.

## Removed

- the lazy import, Suspense fallback, and render path in `App.tsx`;
- `LiveMeasurements.tsx` and `LiveMeasurements.css`;
- `liveMeasurementsApi.ts` and its local endpoint request functions; and
- `types/liveMeasurements.ts` and its stale endpoint response types.

The removed panel had hardcoded the `bench` target, resolved Prototype01 at `10.0.0.192`, polled every five seconds, and exposed a bench-specific Water Now action. No other code used that implementation.

## Preserved for later Phase 8F slices

- `LiveStats`, `/logs`, and local Water Now;
- `sensor_logs` and the canonical `SensorLogRow` compatibility contract;
- the shared device registry and local-control target definitions;
- Gen1 and Gen2 firmware, firmware profiles, device identities, and local firmware endpoints;
- Balcony02 hosted behavior, hosted Gen2 queries/presentation, Supabase, SQL/schema/RLS, telemetry cadence, and watering behavior; and
- the Phase 8I Demo behavior and current public/authenticated hosted route behavior.

These survivors require their own evidence classification and separately approved bounded slices. Phase 8F.1 makes no claim that broader Gen1 retirement is complete.

## Validation

Pre-change baseline at `4bc9a50f2d9f1903d466eec0934fbedccc711186` confirmed `main`, `origin/main`, and upstream were aligned with a clean tree. The baseline passed `59/59` frontend tests, lint, the ordinary build, the hosted-readonly build, and the hosted forbidden-string guard. The ordinary build emitted `LiveMeasurements-DLRBaQf3.js` and `LiveMeasurements-Dka4-f9o.css`; the hosted build did not.

Post-change validation passed:

- `59/59` frontend tests;
- ESLint;
- the ordinary TypeScript/Vite production build, which emitted `LiveStats` but no `LiveMeasurements` JavaScript or CSS chunk;
- the hosted-readonly TypeScript/Vite production build;
- the hosted forbidden-string guard for local endpoints, controls, local IPs, `LiveStats`, and the retired component name, with no hits;
- source/test searches for the component, loading label, stale types, and exclusive request helpers, with no hits; and
- `git diff --check`.

The hosted output filenames and byte sizes remained exactly the baseline values: `index-BYXhzzuH.js` at `828992` bytes, `index-DwqZiYrA.css` at `47420` bytes, and `browser-CR0Nptm5.js` at `340` bytes. This is deterministic local evidence that the hosted-readonly bundle boundary and generated output were unchanged by the retirement.

## Proof limits

This validation proves local source reachability removal, clean automated tests/lint/builds, ordinary bundle removal, and unchanged local hosted-readonly generated assets. It does not prove a Cloudflare deployment, byte-for-byte correspondence with a subsequently served production bundle, authenticated production-route behavior, live device endpoint behavior, firmware behavior, physical watering behavior, sensor accuracy, or completion of later Phase 8F retirement work.
