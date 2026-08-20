# Phase 8F.3 — Retire Local Dashboard and sensor_logs Frontend Path

Date: 2026-08-20

Status: Implemented and locally validated.

## Outcome

Phase 8F.3 removes the legacy non-hosted application branch and routes ordinary and hosted-readonly builds through the same hosted Gen2 route shell. Public Demo no longer performs the redundant legacy history request, and no supported frontend route reads or presents `sensor_logs`.

This is a frontend-boundary retirement. It does not delete or change Supabase rows, tables, views, policies, historical exports, firmware posting, firmware endpoints, firmware profiles, identities, telemetry cadence, watering behavior, interlocks, relay behavior, pump authority, authentication, or authorized customer/support routing.

## Pre-change authority and baseline

The clean pre-change baseline was `main` at `42133fbf6121b682ab3977797dee5359a55e0a5b`, exactly equal to `origin/main` and its upstream with zero ahead/behind commits. The active Phase 8 roadmap and Phase 8F.1/8F.2 implementation records were read before modification.

The baseline passed 59/59 frontend tests, ESLint, the ordinary production build, and the hosted-readonly production build. Baseline generated main assets were:

| Build | Main JavaScript | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Ordinary | `index-CdXBKF01.js` | 813184 | `dd061e91164bbd3ce4e91ad963f570d7db843e12705ba6af27865e29795c53f5` |
| Hosted-readonly | `index-BYXhzzuH.js` | 828992 | `e32932b57469244f021ba3f991790fe96dded1525a24e9c3fb00e6a1e8cd20e6` |

Both baseline builds emitted `index-DwqZiYrA.css` at 47420 bytes. Baseline bundle scans showed the legacy history implementation bundled in both modes, while the direct local endpoint/control guard was clean.

## Reachability and ownership proof

Repository-wide source and test searches before deletion established:

- `App.tsx` exclusively owned the `VITE_MBG_DASHBOARD_MODE` route split and the local dashboard shell.
- `SensorLogViewer.tsx` was the only caller of `fetchHistoryLogs()` and invoked it only for Demo; customer and Support scopes already skipped it.
- `api.ts` exclusively owned the `sensor_logs` query, `SupabaseSensorLogRow`, default sensor data, and row normalization.
- `types/sensorLog.ts` was consumed only by that API adapter, `SensorLogViewer`, and the legacy telemetry-health module.
- `DualAxisChart.tsx` was rendered only by the non-hosted Sensor History branch.
- `telemetryHealth.ts` was consumed only by that branch.
- The legacy half of `SensorHealthPanel.tsx` was reachable only from `calculateTelemetryHealth`; hosted Gen2 uses the retained hosted health presentation.
- `deviceStatusHealth.ts`, `SensorHealthPanel.css`, hosted health helpers, history-window controls, the shared device registry, and `SensorLogViewer` all have surviving hosted consumers and were preserved.
- No test or fixture referenced or exclusively protected the removed modules.

## Removed and narrowed

- the non-hosted route branch, local dashboard header/footer shell, and `VITE_MBG_DASHBOARD_MODE` runtime conditional;
- the obsolete `isHostedReadonly` prop and all local-vs-hosted rendering conditionals in `SensorLogViewer`;
- Demo's `fetchHistoryLogs()` request and associated legacy row/error/loading/chart state;
- frontend `fetchHistoryLogs`, `SupabaseSensorLogRow`, `SensorLogRow`, `SensorData`, defaults, and normalization;
- `DualAxisChart.tsx`, `telemetryHealth.ts`, and `types/sensorLog.ts`;
- the legacy rendering/formatting branch in `SensorHealthPanel`; and
- local-mode device fallback options in `historyControls`; supported routes now fall back only within their available Demo or authorization-derived device set.

## Preserved behavior and I/O impact

Hosted Gen2 measurement projections, capability/evidence policy, cards, trends, Garden Reading Quality, diagnostics, watering evidence, authentication, public Demo routing, customer routes, and Support routes remain in place.

The frontend removes one Demo `sensor_logs` SELECT per initial/manual/visible scheduled refresh cycle. Customer and Support scopes already made no such request, so their query behavior is unchanged. The surviving hosted Gen2 measurement and diagnostics requests are unchanged; protected watering-event and device/capability requests remain scope-dependent as before. No database write, schema, RLS, index, retention, or firmware I/O changed.

Firmware may still post `sensor_logs`, and the table, rows, policies, historical exports, `/logs`, `/water-now`, profiles, and registry entries remain. Their later retirement or cleanup requires separate authority and evidence.

## Validation and generated assets

Post-change validation passed:

- 59/59 frontend tests;
- ESLint with no warnings;
- ordinary and hosted-readonly TypeScript/Vite production builds;
- source/test retirement scans for `fetchHistoryLogs`, `SensorLogRow`, `SensorData`, `SupabaseSensorLogRow`, `sensor_logs`, `DualAxisChart`, `calculateTelemetryHealth`, `telemetryHealth`, `Sensor History`, `isHostedReadonly`, and the build-mode conditional;
- bundle retirement scans for the same legacy history strings and for local endpoints, local IPs, retired components/helpers, and local environment names;
- positive bundle scans for hosted Gen2, protected measurement, garden-device, and watering-event view strings; and
- `git diff --check`.

Ordinary and hosted-readonly builds now produce exactly equal generated artifacts:

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `_redirects` | 19 | `6036983e5fc00f0169c9e939b1816ed771eee00e27f2fcc517b819041460b9ef` |
| `assets/browser-B0azeLnE.js` | 340 | `3259bd050695ef580eeac5dd0a1e79602782c390755340ed5a5b3d4d8992a5c0` |
| `assets/index-DFGupKnI.js` | 816616 | `d113f1d360c4ed4e1b72689ddb00ef19c5cca5fcb07e07910f37f13f20dea568` |
| `assets/index-DwqZiYrA.css` | 47420 | `7129f93a9419e53f5b66ff51b1840c4cfb297f9237e40a127de49282a9300169` |
| `index.html` | 466 | `86dada56fa4cd919d57062656f9c4fc7b1b3bddfada9da99caf64b6548c1483a` |
| `vite.svg` | 1497 | `4a748afd443918bb16591c834c401dae33e87861ab5dbad0811c3a3b4a9214fb` |

The hosted main JavaScript is 12376 bytes smaller than its baseline because the legacy history query/normalization/chart/health code is gone. The ordinary main JavaScript is 3432 bytes larger than its baseline because it now contains the full hosted route/auth/customer/support shell that the former ordinary local branch excluded; the same legacy removals partly offset that addition. The equal post-change artifacts are deterministic local evidence that build mode no longer changes the application route shell or bundled code.

## Proof limits

This validation proves local source reachability removal, absence of the frontend `sensor_logs` request path, successful automated tests/lint/builds, clean local bundle guards, and exact equality of the two locally generated build artifact sets. It does not prove a Cloudflare deployment, byte-for-byte correspondence with a subsequently served production bundle, authenticated production-route behavior, live Supabase response correctness or query plans, current applied RLS state, firmware posting or endpoint behavior, physical watering behavior, sensor accuracy, or completion of later firmware/profile/registry Gen1 retirement work.
