# Phase 7L.3 - Minimal Landing Page with Embedded Live Demo and Hosted My Garden Route Shell

Date: 2026-06-07

## Status

Phase 7L.3 is implemented pending validation, Jeremy review, commit approval, and merge approval.

## Purpose

Phase 7L.3 moves the public domain from opening directly into a dashboard-like data surface to opening on a minimal product front door.

The public landing page is intentionally compact. It should quickly answer:

- What is My Balcony Gardener?
- Is the demo real?
- What is it measuring?
- Where does a customer login go next?

## Hosted Route Structure

Hosted-readonly mode now uses a lightweight route shell in `App.tsx` based on `window.location.pathname`.

The approved public route shell is:

- `/` - minimal public landing page with an embedded real-data live snapshot.
- `/demo` - fuller public read-only live demo.
- `/mygarden` - current customer dashboard shell.
- `/app` - backward-compatible alias for `/mygarden`.
- `/login` - placeholder for future customer login.
- `/support` - temporary read-only support view for Jeremy to review connected garden units.

The route shell does not add React Router.

Cloudflare Pages direct path refresh support is handled by:

```text
mbg_dashboard/public/_redirects
```

with:

```text
/* /index.html 200
```

## Public Landing Page

The landing page uses:

- Soft green page gradient.
- White or near-white cards.
- Dark readable text.
- One restrained green accent.
- Clear CTA buttons.
- Minimal nested containers.

The landing copy leads with:

```text
Automated balcony watering.
Live garden data.
```

It includes a reservoir-fed value line:

```text
Reservoir-fed watering for balconies without an outdoor spigot.
```

It includes a short explanation:

```text
Monitor current conditions and watering history from your garden.
```

The public top navigation includes `My Balcony Gardener`, `Demo`, `My Garden`, and a `Login` button that opens a placeholder dialog on the current page. `Support` is not linked in the public navigation for this phase.

The landing page intentionally leads with what the product does. Technical control boundaries remain preserved in architecture docs, validation guardrails, and implementation behavior.

## Embedded Live Snapshot

The landing page embeds a compact live snapshot labelled:

```text
Live from Jeremy's Balcony
```

The snapshot uses existing read-only data helpers and real Supabase-backed garden readings for the existing demo unit:

```text
Balcony01
device key: balcony
UUID: 550e8400-e29b-41d4-a716-446655440000
```

The snapshot may show:

- Moisture Index.
- Air Temperature.
- Relative Humidity.
- Soil Temperature.
- Last Reading.
- System Reporting.

Unavailable measurements are shown as unavailable rather than faked.

## Demo And My Garden Routes

`/demo` presents:

```text
Live Demo
Live garden data from Jeremy's balcony
A detailed look at real growing conditions
```

It reuses the existing dashboard/data components and defaults to Balcony01 through the existing assignment behavior.

The prominent site assignment shell is hidden on `/demo` and `/mygarden` so those routes flow directly from the route heading into the readings, status, diagnostics, selector, and chart surfaces.

`/demo` includes a dismissible guide:

```text
What you can do here
Check current garden readings.
Open device status and diagnostics.
Change between garden units.
Change the history window.
Choose which readings appear on the chart.
```

`/mygarden` renders the existing Phase 7L.2 customer/site dashboard shell and is labelled `My Garden` in public navigation. `/app` remains a backward-compatible alias for now.

Device selection in customer/dashboard contexts remains constrained to:

- Balcony01.
- Scout01.

The bench test unit is not exposed in public or customer routes in this phase.

## Login And Support Routes

`/login` renders the landing page with the same placeholder login dialog open:

```text
Customer Login
Customer access is coming next.
Early access is currently managed by Jeremy.
```

`/support` is a temporary read-only support view:

```text
Support View
Review connected garden units and recent readings.
Temporary read-only support access. Login protection is coming next.
```

It reuses the hosted-readonly data path and broadens the device selector to the existing frontend registry for support review. It includes Balcony01, Scout01, and Bench01 when available from that registry/data path.

No login form, session state, support privilege, or customer isolation is implemented in this phase.

## Preserved Boundaries

Phase 7L.3 preserves:

- Hosted customer product path is read-only.
- No app-based Water Now.
- No Supabase command/control.
- No hosted local ESP32 calls.
- No real auth yet.
- No real customer isolation yet.
- URL/query/path selection is navigation convenience, not security.
- Real customer access later requires auth, RLS-filtered hosted views, and customer/site/device membership.
- Support/admin access later should use explicit membership, not shared customer login.

## Explicit Non-Goals

Phase 7L.3 does not implement or change:

- Supabase Auth.
- RLS policies.
- SQL tables or migrations.
- Customer/site/device tables.
- Membership tables.
- Real login/logout.
- Support/admin privileges.
- Cloudflare Access.
- Firmware.
- Device IDs.
- Sensor assignments.
- Watering duration, threshold, cooldown, cadence, or moisture mapping.
- `control_eligible` behavior.
- `/water-now` behavior.
- Local dashboard behavior.
- Supabase schema/RLS.
- Fake telemetry or fake `sensor_logs` rows.
- Watering-event capture fixes.
- Deploy, firmware upload, push, or commit approval.
