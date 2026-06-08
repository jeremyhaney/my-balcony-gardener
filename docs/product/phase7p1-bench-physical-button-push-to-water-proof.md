# Phase 7P.1 - Bench Physical Button Push-to-Water Proof

## Status

Phase 7P.1 is runtime validated / complete pending commit.

This phase proves a bench-only physical push-to-water input for `Prototype01` / `bench-proto-gen2`. It does not complete broader Phase 7P hardware safety maturity, which remains future work.

## Scope

Phase 7P.1 adds and validates a physical-button watering proof using GPIO32 on the bench/prototype unit.

The intended behavior is:

- Press to start watering locally.
- Release to stop watering locally.
- Hold to continue watering until the firmware safety timeout.
- Require release-to-rearm after timeout.
- Queue watering event evidence for best-effort posting only after local safety conditions clear.

The physical button does not use `/water-now`, does not use hosted control, and does not use the preset `WATERING_DURATION_MS` Manual Water Now path.

## Target And Upload Facts

Runtime target:

- Device: `Prototype01`
- Build profile: `bench-proto-gen2`
- Upload port: `COM5`
- ESP32 chip: `ESP32-D0WD-V3`
- MAC: `ec:e3:34:79:c6:e0`
- Local IP after boot: `10.0.0.192`
- Device UUID: `318fab98-89ad-4f36-9100-3134a04e0be5`
- Device role: `bench`

## Wiring Convention

Phase 7P.1 uses a normally-open physical switch wired to GND with ESP32 `INPUT_PULLUP` active-low logic.

Validated bench wiring:

- BLACK = ESP32 GND.
- WHITE = GPIO32 / SW1 physical-button signal.
- Switch terminals used: COM + NO.

Out of scope:

- NC terminal wiring.
- 12V on the physical button input.
- Pump voltage on GPIO32.
- Illuminated switch LED wiring.

## Firmware Behavior Validated

Runtime validation proved:

- Press-to-start watering.
- Release-to-stop watering.
- Hold-to-run watering.
- A 15-second physical-button safety timeout.
- Release-to-rearm behavior after timeout.
- Local relay shutoff before any queued HTTP evidence flush.
- No HTTP evidence flush while physical-button watering is active.
- No HTTP evidence flush while release-to-rearm is required.
- No HTTP evidence flush while the button remains debounced pressed.
- Event flushing resumes after debounced release.

The safety model remains local-first: the firmware owns watering state and relay shutoff. Supabase receives evidence after the local safety path has already made the watering decision.

## Event Evidence

Firmware-side event evidence was validated for:

- `watering_started` / `physical_button`
- `watering_completed` / `physical_button`
- `watering_safety_cutoff` / `firmware_safety`

Local `/status` showed `last_supabase_http_status:201` and `consecutive_supabase_failures:0` during validation.

Approved evidence counts:

- 41 `physical_button` start events.
- 36 `physical_button` completion events.
- 5 `firmware_safety` timeout events.
- All timeout events had `duration_seconds = 15`.
- Normal completed durations ranged from 0-6 seconds during rapid bench testing.

Timing caveat:

- `created_at` may lag `event_at` because queued evidence posts only after local safety conditions clear.
- Normal Gen2 measurement cadence remained separate at approximately 15 minutes.

## Non-Changes

Phase 7P.1 changed no Balcony01 behavior and no Scout01 behavior.

It also introduced no:

- Hosted watering control.
- Supabase command/control.
- SQL.
- Frontend change.
- ADC implementation.
- I2C mux implementation.
- Moisture-sensor implementation.
- Light-sensor implementation.
- `/water-now` behavior change.
- Automatic watering behavior change.

## Known Limitation

Rapid repeat presses may appear delayed by synchronous queued physical-button event flushing after release.

This is not a relay shutoff safety issue because release, timeout, and release-to-rearm remain local. Future work may consider nonblocking evidence posting if rapid repeat physical-button cycling becomes important.

## Validation Commands

Build validation passed with:

```powershell
pio run -e bench-proto-gen2
pio run -e balcony-installed-gen2
pio run -e balcony-sensor-scout-01
```

Runtime validation included a successful `bench-proto-gen2` upload to `COM5` and physical bench-button tests.

## Recommendation

Phase 7P.1 is upload-ready for the bench/prototype target and ready for commit review. Broader Phase 7P hardware safety maturity remains future work.
