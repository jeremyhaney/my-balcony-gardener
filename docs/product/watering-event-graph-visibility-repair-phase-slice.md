# Watering-Event Graph Visibility Repair — Frontend Phase Slice

Date: 2026-08-27

Status: Implemented and deterministically locally validated; desktop/phone dense-event and authenticated hosted validation remain open

Authority: [`../PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md)

## Reconciliation

Phase 8D is already complete and hosted-validated. It restored trustworthy, count-preserving watering-cycle evidence, including safety terminals, stored start times, honest sub-second wording, type/color semantics, selected-device/window behavior, chart markers, and complete Watering History. This follow-on repair does not reopen that evidence contract.

The current graph implementation preserved every marker line but placed text on up to ten events. A collision planner assigned overlapping labels to vertical lanes, then increased the chart top margin by one lane height for every occupied lane. Because the chart frame has a fixed height, dense watering events reduced the measurement plot—the defect identified by the current roadmap.

At implementation time, the local branch was one commit behind `origin/main`. The newer remote commit was Phase 8G.4 documentation/SQL-proposal work and did not change the inspected chart implementation. The worktree also contained roadmap/backlog documentation edits; the graph repair preserved them. Jeremy subsequently authorized the complete documentation and graph-repair change set for commit and push on 2026-08-27.

## Objective

Keep the measurement plot at a stable useful height for zero, one, or many selected-window watering cycles while retaining one chart marker per cycle and complete named evidence in Watering History.

## Included work

- Keep every selected-window watering-cycle `ReferenceLine`, including its existing time, type-derived color, and event identity.
- Remove variable-height SVG marker labels and their collision-lane layout.
- Use the fixed base chart margin regardless of event count.
- Add a compact summary immediately above the fixed-height chart:
  - one event includes the complete short marker name and duration;
  - many events show the exact marker count;
  - both direct people to Watering History for complete details.
- Preserve existing chart scrolling and phone breakpoint heights.

## Deliberate presentation decision

The graph carries event timing, count, and type tone through marker lines. The compact summary carries the exact count and, when only one event is present, its short name and duration. Complete names, timestamps, durations, and types remain in Watering History.

A marker tooltip is excluded from this first slice. Recharts measurement tooltips do not inherently expose `ReferenceLine` details, and adding a separate interactive hit-target layer would enlarge the accessibility and touch-interaction scope. The existing Watering History remains the canonical complete named surface.

## Exclusions and safety boundaries

- No watering-event pairing, classification, wording, sorting, selected-device, or selected-window change.
- No query, polling, API, Supabase, SQL, schema, RLS, grant, storage, or data mutation.
- No firmware build or upload; no sensor, relay, pump, reservoir, or physical-device mutation.
- No watering threshold, duration, cadence, cooldown, safety logic, command/control, or watering-authority change.
- No customer assignment, public-demo data exposure, production deployment, commit, or push.
- No general chart or hosted-interface redesign.

## Validation completed

- Dashboard test suite: `71/71` passing.
- ESLint: passing.
- TypeScript and default Vite production build: passing.
- The existing bundle-size warning remains and is unrelated to this slice.
- Public/local route inspection confirmed that protected watering history is not exposed on the public example, preserving the established read-only/public-data boundary.

## Validation still required

- Render a deterministic dense fixture or use authorized authenticated evidence to inspect one-event and many-event cases at desktop and phone-sized viewports.
- Confirm that every visible Watering History cycle has one corresponding chart line in the same selected device/window.
- Confirm Customer and Support surfaces render the same count-preserving result.
- Re-run the hosted-read-only build before any deployment.
- Deploy only with separate authorization, then perform authenticated hosted validation without generating watering or fabricated production evidence.

## Acceptance criteria

- The chart top margin and measurement plot height do not vary with watering-event count.
- Zero, one, and many events do not hide or collapse marker lines.
- The many-event summary reports the exact number of in-window cycle markers.
- A single event remains understandable by short name and duration without opening history.
- Watering History retains complete event names, start times, durations, and types.
- Existing event semantics, selected-device/window behavior, read-only boundaries, and local firmware watering authority remain unchanged.
- Desktop and phone-sized dense-event inspection passes on both Customer and Support surfaces.

## Decisions requiring Jeremy

No product decision is required to continue local verification. Jeremy authorized commit and push on 2026-08-27. Production deployment remains separately controlled. Jeremy's authenticated observation is also required for final Customer/Support hosted closeout unless an approved deterministic protected-route test fixture is added in a separately bounded slice.

## Expected system effects

| Surface | Expected effect |
| --- | --- |
| Frontend | Small chart presentation change only |
| Firmware | None |
| Database / Supabase | None |
| Hardware / device upload | None |
| Watering authority | None; local firmware remains authoritative |
| Deployment | None in this slice |
