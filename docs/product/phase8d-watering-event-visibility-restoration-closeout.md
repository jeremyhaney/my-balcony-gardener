# Phase 8D — Watering-Event Visibility Restoration Closeout

Date: 2026-08-19

Status: Complete, committed, pushed, and authenticated-hosted validated

Authority: [Phase 8 Post-8C.5 Priority Sequence](./phase8-post-8c5-priority-sequence.md)

Implementation commit: `406bce9` (`Restore hosted watering event visibility`)

## Purpose

Phase 8D repaired the recently lost or incorrect hosted watering-event display without changing watering behavior or authority. The repair preserves event timestamps, durations, types, selected-device/window behavior, chart markers, and history presentation across normal completions and firmware safety stops.

This was a frontend-only regression repair. Supabase remains evidence storage, and local ESP32 firmware remains the sole watering-decision and pump-shutoff authority.

## Production evidence and diagnosis

Jeremy performed seven physical-button watering attempts on Balcony02 on 2026-08-19. A read-only production export proved fourteen stored rows: one `watering_started` row and one terminal row for every cycle.

The terminal evidence was:

- three `watering_safety_cutoff` rows with `firmware_safety`, `duration_seconds = 15`, and `physical_button_hold_timeout`;
- one `watering_safety_cutoff` row with `firmware_safety`, `duration_seconds = 5`, and `reservoir_liquid_lost`;
- two `watering_completed` rows with `physical_button`, `duration_seconds = 0`, and `physical_button_released`; and
- one `watering_completed` row with `physical_button`, `duration_seconds = 6`, and `physical_button_released`.

All fourteen rows had the commissioned Balcony02 device identity and arrived in Supabase. Posting delays varied from roughly 2 to 19 seconds, explaining why some events appeared after a short delay rather than immediately.

The primary visibility defect was in the hosted transformation layer: it admitted only `watering_completed` terminal rows. That excluded all four safety cutoffs even though they were correctly generated, posted, stored, selected by device/window, and returned by the protected query.

Two related presentation defects were also proven:

- reconstructed start time used terminal time minus integer duration instead of the stored `watering_started.event_at`, shifting some displayed start times by one second; and
- a stored zero-second terminal duration was presented as exactly `0 seconds`, overstating the precision of a sub-second/short button cycle.

The isolated `reservoir_liquid_lost` observation was preserved as event evidence but was not treated as a proven reservoir-sensor defect or expanded into hardware investigation.

## Implemented contract

- Deterministically sorts watering evidence and pairs one start with its plausible terminal for the same device.
- Treats `watering_completed` and `watering_safety_cutoff` as displayable watering-cycle terminals.
- Uses the stored start event timestamp when it is available.
- Uses an explicitly approximate reconstructed start only when a selected-window/query boundary excludes the paired start row.
- Preserves the terminal duration and event type without rewriting stored evidence.
- Displays a stored zero duration as `Under 1 second` in history and `<1s` on the chart.
- Keeps `watering_blocked` out of the watering-cycle chart because it does not prove water application.
- Preserves all in-window chart marker lines. To contain dense-window label clutter, only the ten newest markers receive text labels; full named history remains available below the chart.

## Type presentation

Text remains the primary meaning and color is supplemental:

| Evidence | Hosted label | Tone |
| --- | --- | --- |
| Normal physical-button completion | `Button Watering` | Blue |
| Physical-button hold timeout | `Button Safety Cutoff` | Amber |
| Reservoir liquid lost while watering | `Reservoir Safety Stop` | Rose |
| Automatic completion | `Automatic Watering` | Green |
| Manual-local completion | `Manual Watering` | Purple |
| Other firmware safety terminal | `Device Safety Stop` | Slate |

The chart line, chart label, and history pill consume the same classification so their terminology and color cannot drift independently.

## Deterministic validation

Validation passed:

- `42/42` tests, including a fourteen-row fixture reproducing all seven production-evidence cycles;
- ESLint;
- TypeScript/Vite default and hosted-read-only production builds;
- `git diff --check`; and
- a local hosted bundle smoke test without new runtime errors.

The deterministic cases cover reverse query order, exact stored start timestamps, same-second start/terminal ordering, both proven safety reasons, honest sub-second wording, all seven cycles without terminal collapse, and selected-window boundary fallback.

## Hosted validation

After commit `406bce9` reached `main`, Jeremy confirmed the authenticated hosted display on 2026-08-19:

- all seven cycles appeared in Watering History;
- start times matched their stored `watering_started` rows;
- durations displayed as three 15-second cutoffs, one 5-second reservoir stop, two under-one-second completions, and one 6-second completion;
- all seven chart markers were visible in the selected three-hour window;
- chart and history colors agreed with the textual watering types; and
- the result required no additional watering or fabricated evidence.

## Query and storage impact

- New query: none.
- Query filter or polling change: none.
- SQL, schema, view, function, index, trigger, RLS, grant, or stored-data change: none.
- Backfill or mutation: none.
- Expected Supabase query or Disk I/O increase: none.

The existing protected query continues to filter by selected device and selected-window lower bound and returns the established watering-event contract.

## Explicit non-changes

- No firmware, threshold, duration, cooldown, cadence, physical-button, relay, pump, pin, sensor, reservoir-interlock, or shutoff change.
- No hosted command/control, Water Now, or Supabase watering authority.
- No Phase 8G threshold presentation.
- No general UI modernization.
- No automatic-watering event was claimed; Jeremy confirmed Balcony02 had not yet produced one.
- No claim that the isolated WL01 cutoff proved a recurring fault.

## Closeout

Jeremy approved the bounded implementation, authorized commit and push, and confirmed the authenticated hosted result on 2026-08-19. Phase 8D is operationally closed at its frontend-only regression-repair boundary. Phase 8E — Feels Like and Dew Point — is next under the separate discovery and approval process in the roadmap authority.
