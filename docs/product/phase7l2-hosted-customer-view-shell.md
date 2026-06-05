# Phase 7L.2 - Hosted Customer View Shell and UI Mode Boundary

Date: 2026-06-05

## Status

Phase 7L.2 is implemented pending Jeremy review, commit approval, and merge approval.

## Purpose

Phase 7L.2 refines the hosted-readonly pilot shell so it looks more like the future customer product while preserving the honest pilot/simulation boundary from Phase 7L.1.

The hosted page should now read first as a site monitoring dashboard:

```text
Jeremy Balcony Pilot
Savannah Balcony
Read-only monitoring dashboard
```

The simulation/access caveat remains visible, but it is no longer the dominant visual message.

## Hosted Shell Behavior

The former `CustomerSiteHeader` component was renamed to `HostedSiteHeader`.

The rename reflects the current product boundary: this is a hosted site shell over a static pilot assignment, not real authenticated customer access.

The hosted shell now prioritizes:

- Site name.
- Site location.
- Read-only monitoring purpose.
- Assigned device roles.
- A small pilot/simulation note.

The visible device role copy is:

- `Balcony01` - Primary controller.
- `Scout01` - Telemetry-only support sensor.

The visible pilot note is:

```text
Pilot simulation
Static site assignment. Real login and customer isolation are deferred.
```

## Preserved Assignment Boundary

Phase 7L.2 keeps the static Phase 7L.1 pilot assignment:

```text
Customer: Jeremy Haney
Customer key: jeremy
Site: Jeremy Balcony Pilot
Site key: jeremy-balcony-pilot
Location: Savannah Balcony
Primary controller: Balcony01
Balcony01 UUID: 550e8400-e29b-41d4-a716-446655440000
Telemetry-only support unit: Scout01
Scout01 UUID: 28f4e6e3-5979-4af4-9753-34e185d8e47e
```

Hosted pilot device selection remains constrained to:

- `Balcony01`
- `Scout01`

`Prototype01` / `bench` remains in the base frontend device registry for support and development contexts outside this pilot hosted shell.

If hosted pilot mode receives a URL query such as `?device=bench`, the selected device still resolves to `Balcony01` because `bench` is not assigned to this pilot site.

## Security And Control Boundary

Phase 7L.2 does not create real customer security.

It does not implement:

- Real login.
- Real customer isolation.
- Supabase Auth.
- Customer/site/device SQL tables.
- Membership tables.
- RLS-filtered customer views.
- Support/admin authorization.

Device/window URL query state remains navigation state only, not security.

The hosted dashboard remains read-only. It does not expose Water Now, call local ESP32 endpoints, or introduce Supabase command/control.

App-based Water Now remains outside the customer product path. Current local/default Manual Water Now behavior is unchanged.

## Implementation Scope

Frontend changes are limited to the hosted shell component rename and presentation refinement:

- `CustomerSiteHeader.tsx` renamed to `HostedSiteHeader.tsx`.
- `CustomerSiteHeader.css` renamed to `HostedSiteHeader.css`.
- `SensorLogViewer` now imports/renders `HostedSiteHeader`.
- The hosted shell copy/layout was revised to make site identity dominant and the pilot note secondary.

The app-level `App.tsx` brand/header structure was intentionally left unchanged for this phase.

## Explicit Non-Goals

Phase 7L.2 does not change firmware, SQL/RLS, Supabase schema, telemetry storage, local control, deployment configuration, device IDs, sensor assignments, watering duration, watering thresholds, cooldowns, moisture mapping, `control_eligible`, `/water-now`, `/logs`, or Cloudflare configuration.

The 2026-06-05 manual watering event capture/hosted visibility issue remains deferred to the Phase 7O telemetry/event-capture track and later pilot-readiness/customer-trust work.
