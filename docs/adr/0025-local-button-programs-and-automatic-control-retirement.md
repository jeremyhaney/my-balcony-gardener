# ADR 0025: Local Button Programs and Automatic-Control Retirement

- Status: Accepted
- Date: 2026-08-24

## Context

Balcony02's physical button previously used a dead-man gesture: press started the pump, release stopped it, and a 15-second maximum hold forced a safety cutoff. Current firmware also retained threshold, duration, cooldown, sample-buffer, quality-gate, and start-helper code for moisture-triggered automatic watering. That automatic path was unreachable on Balcony02, but leaving it executable/configurable misstated the current product boundary.

The revised hosted Relative Moisture Index is still observational. It has not accumulated enough field evidence to authorize a watering threshold, and the hosted product must remain read-only.

## Decision

Balcony02 provides two firmware-local button programs:

- a debounced press and release before `5,000 ms` selects a `30,000 ms` cycle;
- a debounced press held through `5,000 ms` or longer and then released selects a `60,000 ms` cycle;
- the pump starts only when the selecting release is accepted;
- a valid press while watering immediately cancels the active cycle, and its following release only re-arms the button;
- startup with the button depressed requires a release that only re-arms;
- reservoir liquid absence blocks a selected start immediately; during an active run, GPIO26 must remain continuously LOW for `20 ms` before liquid loss is accepted, after which the relay is shut off before evidence or network work;
- programmed completion uses rollover-safe local elapsed time and never depends on a network response.

Current executable and configuration surfaces contain no moisture threshold, automatic watering duration/cooldown, automatic sample/gate state, or moisture-triggered start helper. No RMI or other moisture value can start watering. Future automatic control requires a new explicitly approved decision and implementation based on sufficient evidence.

Watering evidence continues to use the existing schema-compatible event types. Each accepted run queues one `watering_started` and exactly one terminal event. Details retain `requested_duration_seconds` and the selected button program. Normal completion and button cancellation use `watering_completed` with distinct reasons; reservoir loss uses `watering_safety_cutoff`; an empty-reservoir selection uses `watering_blocked`.

The active-run `20 ms` qualification is dedicated to WL01 signal integrity and is not shared with button debounce. A HIGH at any point resets qualification. This rejects sub-visible transient GPIO LOW reads while preserving a bounded local cutoff for a persistent liquid-loss signal.

## Consequences

- Local button operation and safety remain available without Wi-Fi, internet, Supabase, or hosted UI.
- No synchronous network work runs while the pump is active.
- The hosted UI gains no threshold or watering control. A narrow watering-history wording refinement may interpret the new reasons.
- Historical automatic-watering events, ADRs, field evidence, and presentation compatibility remain historical evidence; this decision does not rewrite or delete them.
- ADR 0006 and ADR 0018 remain historical/design evidence, but their present-tense automatic-control descriptions no longer describe the current executable product. Any future automatic-control design must be reconsidered and approved rather than assumed active.
- Prototype01 remains retired. A future Gen2 Prototype01 requires a new explicit PlatformIO environment, new stable UUID, reviewed installed-module/pin/safety contract, configuration provisioning, build validation, and separately approved upload/runtime validation. The retired profile and UUID must not be restored.
