# Phase 8G.2 Local Button Programs and Automatic-Control Retirement

Status: Complete; locally build-validated and B02 quick-start/stop runtime-validated

Date: 2026-08-24

## Implemented behavior

Balcony02 now uses an explicit nonblocking local button controller with four states: `AwaitingRelease`, `Idle`, `SelectingProgram`, and `Watering`.

- From `Idle`, an accepted press enters `SelectingProgram` without starting the relay.
- An accepted release before `5,000 ms` starts the 30-second program.
- An accepted release at or after `5,000 ms` starts the 60-second program.
- A valid press in `Watering` shuts off the relay and enters `AwaitingRelease`; its release only returns to `Idle`.
- Booting while pressed begins in `AwaitingRelease`, so startup release cannot start a cycle.
- A held selection never starts until release.
- Raw edges must remain stable for the configured 50 ms debounce interval. Gesture duration uses the raw edge times that survive debounce, so equal press/release debounce windows do not move the exact 4,999/5,000 ms boundary.
- Program selection and completion use unsigned 32-bit elapsed subtraction and remain correct across `millis()` rollover.

WL01 reservoir state is evaluated before button debounce and programmed completion on every active loop. Empty-reservoir start blocking remains immediate. During a run, GPIO26 must remain continuously LOW for `20 ms` before the controller accepts reservoir loss; any intervening HIGH silently resets qualification. Persistent loss then shuts off the relay before terminal evidence is queued. The qualification is independent of the 50 ms button debounce, and the firmware performs no synchronous client, telemetry, heartbeat, or event-delivery work while the pump is active.

The first uploaded Phase 8G.2 build exposed a firmware regression during Jeremy's 2026-08-24 quick test: repeated starts were followed by sub-second `reservoir_liquid_lost` terminals even though the reservoir was full and the WL01 indicator remained on. A later idle `/measurements` read returned `measurement_value:1`, `valid:true`, `quality:good`, and `read_ok`; `/status` confirmed the pump idle. The new tight active loop had treated any single raw GPIO26 LOW sample as confirmed loss. Revision `phase8g2-local-button-programs-r2` adds the dedicated continuous-LOW qualification and deterministic transient/persistent cases.

Jeremy uploaded revision `r2` and runtime-validated two quick cycles on 2026-08-24. Both release-selected 30-second programs remained active despite transient raw LOW reads, stopped on the following accepted button press after approximately one second, and posted one `watering_started` plus one `watering_completed` / `physical_button_cancelled` terminal event. Diagnostic per-transient serial messages proved noisy and were removed in revision `r3`; rejecting a transient performs no event, HTTP, Supabase, database, or other network I/O.

Jeremy then uploaded `phase8g2-local-button-programs-r3` to B02 and reported a successful brief start/following-button-stop test on 2026-08-24. That closes the uploaded-revision smoke-test gap without claiming the deliberately deferred uninterrupted 30-second or 60-second completion tests.

## Event evidence

The existing schema and event-type constraint remain unchanged.

| Outcome | Event type / source | Reason | Duration and details |
| --- | --- | --- | --- |
| Program starts | `watering_started` / `physical_button` | `physical_button_program_30s_started` or `physical_button_program_60s_started` | Top-level duration remains null; details include `requested_duration_seconds` and `button_program` |
| Program completes | `watering_completed` / `physical_button` | `physical_button_program_completed` | Top-level actual whole-second duration; requested program retained in details |
| Button cancels | `watering_completed` / `physical_button` | `physical_button_cancelled` | Top-level actual whole-second duration; requested program retained in details |
| Reservoir signal is lost | `watering_safety_cutoff` / `firmware_safety` | `reservoir_liquid_lost` | Actual duration, requested program, and WL01 interlock evidence |
| Selected start is blocked | `watering_blocked` / `physical_button` | `reservoir_liquid_not_detected` | Requested program and WL01 interlock evidence |

The queue retains offline events instead of discarding them before a delivery attempt. The relay is always off before terminal delivery can begin. The current bounded queue holds eight events (four complete accepted cycles if no events can flush); it remains best-effort evidence rather than durable local storage.

Hosted history interprets only the new terminal reasons as `Button Cycle` and `Button Stop`. Historical automatic, manual, button-release, timeout, and reservoir-safety records retain their existing interpretation.

Subsequent presentation follow-on, 2026-08-27: both programmed completion and accepted button cancellation now use the simpler customer-facing label `Button Watering`; stored terminal reasons and durations remain unchanged. See [`watering-event-graph-visibility-repair-phase-slice.md`](./watering-event-graph-visibility-repair-phase-slice.md).

## Automatic-control retirement

Current firmware and configuration no longer contain the automatic-control threshold/duration/cooldown macros, automatic sample buffers/timers/gates, moisture comparisons, automatic start helper, or automatic completion branch. The ignored private configuration had only those two obsolete definitions removed; secrets and unrelated settings were not changed or displayed.

RMI and SEN0308 values remain observational measurement evidence. No moisture or RMI value can initiate watering in this slice. Historical records remain unchanged.

## Validation

The production controller is covered by firmware-compiled `static_assert` scenarios for the 4,999/5,000 ms boundary, release-only start, startup depressed behavior, immediate accepted-press cancellation and release re-arm, both programmed completions, immediate empty-reservoir blocking, rejected transient LOW, accepted persistent 20 ms LOW, bounce duplicate prevention, one start/one terminal action per modeled run, and rollover-safe timing.

`pio run -e balcony02-gen2` passes. The build reports two existing warnings in the vendored OneWire library about extra tokens on `#undef` directives; no project-source warning was introduced.

## Prototype01 follow-up

Prototype01 is not modified or uploaded. A separate reviewed slice must:

1. define a new explicit Gen2 PlatformIO environment rather than restore `bench-proto-gen2`;
2. assign a new stable device UUID and label/role/build provenance rather than reuse the retired Prototype01/Bench01 UUID;
3. declare and review its complete installed sensor, pin, relay/button, reservoir-interlock, and electrical contract;
4. provision its private configuration without copying retired identity;
5. add it intentionally to any required registry/capability/access surfaces under separate approval;
6. build first, then obtain explicit approval for a confirmed-port upload and runtime endpoint/button/safety/evidence validation.

## Exclusions

No SQL/schema change, threshold UI, `/support` redesign, RMI formula change, hardware/identity/provisioning change, or Prototype01 resurrection is included. The user-executed B02 `r3` upload and brief runtime test are recorded above; no Prototype01 upload occurred.
