# Phase 8F.2 — Retire LiveStats and Local Water Now Frontend

Date: 2026-08-19

Status: Implemented and locally validated.

## Outcome

Phase 8F.2 removes the remaining direct browser-to-device frontend path. The application no longer mounts `LiveStats`, polls a selected device `/logs` endpoint every five seconds, gates a manual action through reported device identity, or posts a browser Water Now request to `/water-now`.

This is a frontend-only retirement. It does not change firmware endpoints, profiles, identities, watering thresholds, interlocks, relay behavior, pump authority, Supabase, SQL/schema/RLS, telemetry, Balcony02 hosted behavior, or Phase 8I Demo behavior.

## Reachability and ownership proof

Repository search before deletion established the exact boundary:

- `mbg_dashboard/src/App.tsx` was the only lazy import and render path for `LiveStats`, including its loading fallback.
- `mbg_dashboard/src/components/LiveStats.tsx` exclusively owned selected-target `/logs` polling, the five-second interval, browser device-identity gating, local-target labels and state, and the `/water-now` POST action.
- `LiveStats.tsx` was the only consumer of `mbg_dashboard/src/localControlTargets.ts` and its `LocalControlTarget` / `LOCAL_CONTROL_TARGETS` definitions.
- No test or fixture referenced or exclusively protected the retired implementation.
- No dedicated `LiveStats` stylesheet existed at the baseline; the component used inline presentation.
- `DEVICE_REGISTRY` had independent history, customer-site, and Demo consumers and was preserved.
- `SensorLogRow`, `fetchHistoryLogs`, `sensor_logs`, and `SensorLogViewer` had independent history consumers and were preserved.

## Removed

- the `LiveStats` lazy import, loading fallback, and render path in `App.tsx`;
- `LiveStats.tsx` and all panel-specific polling, transformation, identity-gating, copy, loading/error presentation, and manual action code; and
- `localControlTargets.ts` and its retired local IP/action metadata.

## Validation and generated assets

The pre-change baseline at `d9115683f3f69f860249ed3c4cf7e120b09409d4` confirmed `main`, `origin/main`, and upstream equality with a clean tree. Baseline validation passed `59/59` tests, ESLint, the ordinary build, the hosted-readonly build, and the hosted forbidden-string scan.

The baseline ordinary build emitted `LiveStats-DHaeRDD3.js` at `7271` bytes, `index-p0veWgWw.js` at `813471` bytes, `index-DwqZiYrA.css` at `47420` bytes, and `browser-BzSBgY_T.js` at `340` bytes.

Post-change validation passed:

- `59/59` frontend tests and ESLint;
- ordinary and hosted-readonly TypeScript/Vite production builds;
- source/test retirement scans for `LiveStats`, `localControlTargets`, `/logs`, `/water-now`, Water Now copy, and the loading label;
- the hosted forbidden-string guard for local endpoints, controls, retired component/helper names, local environment names, and retired local IPs;
- the hosted review-only scan for `/status`, `/capabilities`, and `/measurements`; and
- `git diff --check`.

The post-change ordinary build emits no `LiveStats` or `localControlTargets` chunk. Its assets are `index-CdXBKF01.js` at `813184` bytes, `index-DwqZiYrA.css` at `47420` bytes, and `browser-jtQzxwBV.js` at `340` bytes.

Hosted generated assets are exactly unchanged from baseline by filename and byte size: `index-BYXhzzuH.js` at `828992` bytes, `index-DwqZiYrA.css` at `47420` bytes, and `browser-CR0Nptm5.js` at `340` bytes. This is deterministic local evidence that the hosted-readonly generated output was unaffected by the retired code path.

## Proof limits

This evidence proves local source reachability removal, removal of the browser `/water-now` call and five-second device `/logs` polling, preservation of the local `sensor_logs` history code path, clean automated tests/lint/builds, ordinary bundle removal, and unchanged local hosted-readonly generated assets. It does not prove a Cloudflare deployment, byte-for-byte correspondence with a subsequently served production bundle, authenticated production-route behavior, live firmware endpoint behavior, physical watering behavior, sensor accuracy, or completion of later Phase 8F firmware/compatibility retirement work.
