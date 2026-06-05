# Phase 7L.1 - Customer/Site Access Simulation MVP

Date: 2026-06-05

## Status

Phase 7L.1 Customer/Site Access Simulation MVP is complete and present on `main` in commit `2d74588 Add customer site access simulation`.

## Purpose

Phase 7L.1 creates a hosted-readonly customer/site experience simulation over real existing My Balcony Gardener devices and real existing telemetry.

The goal is to answer:

```text
What would the customer experience look like if Jeremy were Customer001 and Balcony01 were assigned to Jeremy's first pilot site?
```

This phase is intentionally not real customer security. It does not implement Supabase Auth, customer/site/device tables, membership tables, RLS-filtered customer views, account invites, support/admin privileges, or billing/account lifecycle.

## Pilot Assignment

Static pilot customer/site assignment:

```text
Customer: Jeremy Haney
Customer key: jeremy
Site: Jeremy Balcony Pilot
Site key: jeremy-balcony-pilot
Location: Savannah Balcony
Access mode: pilot-simulation
Assigned devices: balcony, scout01
Primary controller: balcony / Balcony01
Support evidence unit: scout01 / Scout01
Pilot role: site-owner / support-admin simulation
```

Device identities are unchanged:

```text
Balcony01: 550e8400-e29b-41d4-a716-446655440000
Scout01: 28f4e6e3-5979-4af4-9753-34e185d8e47e
```

No fake device, duplicate device ID, duplicate telemetry, or fake `sensor_logs` row is created.

## Hosted UI Behavior

Hosted-readonly mode now shows a customer/site context header for the pilot site.

The Phase 7L.1 customer/site header is a temporary access-simulation scaffold.

It is not the final customer-facing UI.

Future customer-facing UI should be clean and site-focused, without engineering/auth disclaimers in the normal customer view.

The hosted pilot selector is constrained through the Phase 7L.1 assignment layer to:

- `Balcony01`
- `Scout01`

`Balcony01` remains the primary controller device. `Scout01` appears as telemetry-only support evidence for the same pilot site.

If hosted pilot mode receives a URL query such as `?device=bench`, the selected device resolves to `Balcony01` because `Prototype01` is not assigned to this pilot site.

The underlying known-device registry remains intact. `Prototype01` / `bench` remains in the base frontend device registry for support and development use outside this pilot customer/site simulation.

MBG should not fork into separate independently maintained customer and engineering sites.

Prefer one shared dashboard codebase and shared UI components with mode/capability/context gates:

- customer hosted read-only mode
- support/admin read-only diagnostics mode
- local engineering/service mode

Customer, support/admin, and local engineering views may expose different capabilities, but they should reuse the same core layout/components where practical so the UI does not drift.

## Security Boundary

The hosted header explicitly labels the view as an access simulation.

This phase does not provide:

- Real login.
- Real customer isolation.
- RLS-filtered customer/site views.
- Membership checks.
- Support/admin authorization.

Device/window URL query state remains navigation state only, not security.

Real customer access still requires auth, RLS-filtered hosted views, and customer/site/device membership.

## Control Boundary

Hosted dashboard behavior remains read-only.

The customer product path remains hosted read-only daily visibility.

This phase does not add:

- Remote Water Now.
- App-based Water Now in the customer product path.
- Supabase command/control.
- Hosted calls to local ESP32 endpoints.
- Watering decisions.
- Watering threshold, duration, cooldown, sensor, pin, device ID, or firmware changes.

Supabase remains telemetry/history/diagnostics storage only.

## Data Boundary

The simulation uses existing hosted Supabase read paths:

- `public.sensor_logs`
- `public.hosted_gen2_measurements`
- `public.hosted_device_diagnostics`

`public.device_registry` remains a provisioned-device insert allowlist and hosted visibility source, not customer/site/auth access control.

## Phase 7L.2 Readiness Notes

The next customer-access/UI-mode plan should keep the Phase 7L product boundary intact:

- The customer product path remains hosted read-only daily visibility.
- App-based Water Now is not part of the customer product path.
- Supabase remains telemetry/history/diagnostics storage only, not command/control.
- Current URL/device/window selection is navigation convenience, not security.
- Real customer access still requires auth, RLS-filtered hosted views, and customer/site/device membership.

Watering event capture/visibility must be fixed in future work. On 2026-06-05, Jeremy ran local Water Now twice for two 60-second sequences on `Balcony01`. All baskets were dripping and the watering appeared thorough, but the hosted site did not register/show the watering event. The event was recorded manually in `sensor_events`.

Future work must investigate and fix local manual watering event capture and hosted visibility without creating fake `sensor_logs` rows, without introducing Supabase command/control, and without changing Water Now behavior in this docs scrub.

## Deferred Follow-Up

Future phases may implement:

- Supabase Auth or equivalent login.
- Customer/site/device tables.
- User-site memberships.
- Support/admin memberships.
- RLS-filtered hosted views.
- Customer-safe routing and invite/account lifecycle.
- Installer/provisioning workflow.

Those are intentionally out of scope for Phase 7L.1.
