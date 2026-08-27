# Watering-Event Graph Visibility Repair — Frontend Phase Slice

Date: 2026-08-27

Status: Complete, locally validated, and Jeremy visually accepted; phone-sized and post-push authenticated hosted validation remain open

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
- Add a compact summary in the chart header:
  - one watering centers its plain-language type and duration directly over its dashed line in the matching type color;
  - many waterings center the exact count over the graph and direct people to Watering History for complete details.
- Preserve existing chart scrolling and phone breakpoint heights.

## Deliberate presentation decision

The graph carries watering timing, count, and type tone through its dashed lines. A single watering centers its plain-language type and duration over the corresponding line. A dense window replaces individual names with one centered exact-count summary and sends the reader to Watering History. Complete names, timestamps, durations, and types remain in Watering History.

Customer-facing normal labels are `Auto Watering`, `Button Watering`, and `Manual Watering`. Prototype02's pump-free evidence is `Button Test` so the interface does not claim that water was delivered. Exceptional outcomes remain explicit as `Button Safety Stop`, `Reservoir Safety Stop`, or `Device Safety Stop`.

A marker tooltip is excluded from this first slice. Recharts measurement tooltips do not inherently expose `ReferenceLine` details, and adding a separate interactive hit-target layer would enlarge the accessibility and touch-interaction scope. The existing Watering History remains the canonical complete named surface.

## Exclusions and safety boundaries

- No watering-event pairing, classification semantics, sorting, selected-device, or selected-window change. Customer-facing wording was deliberately simplified without rewriting stored evidence.
- No query, polling, API, Supabase, SQL, schema, RLS, grant, storage, or data mutation.
- No firmware build or upload; no sensor, relay, pump, reservoir, or physical-device mutation.
- No watering threshold, duration, cadence, cooldown, safety logic, command/control, or watering-authority change.
- No customer assignment, public-demo data exposure, or production deployment command.
- No general chart or hosted-interface redesign.

## Validation completed

- Dashboard test suite: `71/71` passing.
- ESLint: passing.
- TypeScript and default Vite production build: passing.
- Hosted-read-only production build: passing.
- `git diff --check`: passing.
- The existing bundle-size warning remains and is unrelated to this slice.
- Public/local route inspection confirmed that protected watering history is not exposed on the public example, preserving the established read-only/public-data boundary.
- Jeremy visually accepted the final desktop single-watering and dense 17-watering presentations on 2026-08-27, including the fixed plot height, centered summary placement, count preservation, matching single-line color, and complete Watering History rows. Prototype02 wording was also reviewed from the authenticated Support presentation.

## Validation still required

- Inspect the final presentation at a phone-sized viewport with authorized watering evidence.
- After the pushed `main` commit is deployed through the existing Cloudflare path, perform authenticated Customer and Support hosted validation without generating watering or fabricated production evidence.

## Acceptance criteria

- The chart top margin and measurement plot height do not vary with watering-event count.
- Zero, one, and many events do not hide or collapse marker lines.
- The many-watering summary reports the exact number of in-window dashed lines.
- A single event remains understandable by short name and duration without opening history.
- Watering History retains complete event names, start times, durations, and types.
- Existing event semantics, selected-device/window behavior, read-only boundaries, and local firmware watering authority remain unchanged.
- Desktop single- and dense-watering inspection passes; phone-sized and post-push hosted checks remain release follow-ups rather than claims in this record.

## Decisions requiring Jeremy

No product decision remains open. Jeremy accepted the final presentation and authorized commit and push on 2026-08-27. The push may trigger the established Cloudflare deployment path, but this record does not claim deployment or hosted correspondence until separately observed.

## Expected system effects

| Surface | Expected effect |
| --- | --- |
| Frontend | Small chart presentation change only |
| Firmware | None |
| Database / Supabase | None |
| Hardware / device upload | None |
| Watering authority | None; local firmware remains authoritative |
| Deployment | No deployment command; pushing `main` may trigger the established Cloudflare path, with hosted validation still required |
