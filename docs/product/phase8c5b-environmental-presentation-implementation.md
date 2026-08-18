# Phase 8C.5B — Environmental Presentation Implementation

Date: 2026-08-18

Status: Implementation complete and locally validated; Jeremy approved commit and push

Authority: [Phase 8C.5A Environmental Presentation Design](./phase8c5a-environmental-presentation-design.md)

## Purpose

Phase 8C.5B implements the approved measurement-specific environmental descriptions, full-card tones, compact scale indicators, and evidence-state precedence for the commissioned Gen2 presentation path.

The implementation is frontend-only. It changes no query, polling path, SQL, Supabase object or data, storage, firmware, device, watering behavior, safety authority, Demo architecture, customer adoption, or deployment command.

## Implemented contract

- Added one typed environmental-presentation module for exact supported measurement names.
- Implemented every approved inclusive/exclusive light, air-temperature, humidity, pressure, soil-temperature, RMI, and reservoir boundary.
- Replaced generic `Good`, `Watch`, and `Check` environmental wording with concise measurement-specific conditions.
- Separated air-temperature and root-zone terminology.
- Replaced absolute Low/Normal/High pressure judgment with `Local Pressure` and a neutral purple measurement scale.
- Preserved the accepted unclamped RMI formula and exact condition boundaries.
- Removed the superseded generic condition helpers and catalog-card tones proven unreachable.

## Information-at-a-glance presentation

Ordinary current eligible cards now assume currency rather than announcing `Current` repeatedly:

- the upper-right pill shows the current condition, such as `Direct Sun`, `Filtered Light`, `Extreme Heat`, `Moderate Humidity`, `Local Pressure`, `Well-watered`, or `Saturated`;
- the separate `Condition:` line is removed;
- a current card without an approved interpretation shows no redundant pill; and
- the page-level Latest reading timestamp remains the ordinary currency cue.

When evidence is not current or uses a fallback/fault path, the upper-right pill continues to show the evidence state, including `Last Good`, `Last Reliable`, `Not Current`, or `Reading Unavailable`. Environmental wording never hides an evidence exception.

## Color and scale refinements

Jeremy's visual review refined the initial palettes:

- light uses a quieter natural brightness progression from muted blue-gray and cool gray through pale daylight to soft sun yellow;
- moisture uses a continuous dry-tan through olive/sage and teal to wet blue progression rather than red/green pass/fail judgment;
- `Check Sensor` remains outside the moisture environmental scale;
- reservoir remains explicitly binary with red for refill and green for water detected; and
- other measurements retain their approved measurement-specific scales.

Every supported card includes a compact footer scale pill aligned opposite Sensor Details. It shows the complete measurement scale and a current-value marker. The marker is omitted when no display value exists. Its accessible label states the scale and current condition.

Light-marker position follows the five approved condition bands directly rather than a logarithmic lux position. Each band receives one fifth of the pill, so card color, condition wording, and marker agree. For example, `3,335 lux` falls near the start of the `Filtered Light` segment rather than near the bright-yellow end.

## Evidence precedence

Phase 8C.3 remains unchanged:

- Last Good and Last Reliable evidence retains condition wording and color through the inclusive 50-minute condition-currency boundary;
- after 50 minutes, environmental condition is suppressed and the card is neutral;
- invalid and omission counts and severities remain unchanged; and
- the greater-than-95-minute device-active actionable boundary remains unchanged.

Phase 8C.4 remains unchanged:

- only presentation-eligible evidence supplies value, condition, RMI, card tone, or trend points;
- latest rejected evidence remains available in authenticated Support details;
- Last Reliable provenance and timestamps remain honest;
- SEN0562 `65535 lux` remains eligible Direct Sun with a Support-only ceiling concern; and
- rejected evidence never gains watering authority.

## Accessibility and responsive behavior

- Condition and evidence meaning remains textual; color is not the sole signal.
- Current condition and exception pills wrap without horizontal overflow.
- Footer scale pills use accessible names and bounded markers.
- Sensor Details retains visible keyboard focus.
- Desktop and `360 px` mobile review showed no card, header, footer, or scale overflow.
- Browser review produced no warnings or errors.

## Deterministic validation

Validation passed:

- `36/36` deterministic tests;
- ESLint;
- TypeScript/Vite production build;
- `git diff --check`;
- authenticated-data Demo rendering in hosted-readonly local mode;
- desktop and `360 px` responsive inspection; and
- Jeremy's iterative visual review and final information-at-a-glance approval.

The existing Vite large-chunk advisory remains non-blocking and unchanged in kind.

## Query and Disk I/O impact

- New query: none.
- Per-card recovery query: none.
- Expanded history: none.
- Polling change: none.
- SQL, view, function, index, trigger, RLS, grant, or stored flag: none.
- Backfill, mutation, or storage change: none.
- Expected Supabase query increase: none.
- Expected production Disk I/O increase: none.
- Production read-only `EXPLAIN`: not required for this no-query frontend implementation.

## Explicit non-changes

- No Feels Like or Dew Point.
- No customer adoption or deterministic Demo redesign.
- No Gen1 review or generic raw-ADC/12-bit assumption.
- No major UI modernization.
- No schedule persistence, sensor-assisted watering, or other Phase 9 work.
- No firmware, device, reservoir-interlock, watering, safety, or control-authority change.
- No new phase numbers for the post-8C.5 priority candidates.

## Closeout boundary

Jeremy approved the final local appearance and behavior and authorized documentation closeout, commit, and push on 2026-08-18. This record claims local deterministic and visual validation. It does not claim a separate authenticated production validation after the push.
