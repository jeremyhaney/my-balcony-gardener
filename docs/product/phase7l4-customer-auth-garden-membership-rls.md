# Phase 7L.4 - Customer Auth, Garden Membership, and RLS Implementation

Date: 2026-06-07

## Status

Phase 7L.4 is complete, merged to `main`, pushed, Cloudflare production auto-deployed from `main`, and production/credentialed browser validated.

Commit: `1706798 Add customer auth garden membership RLS`

Branch merged: `phase7l4-customer-auth-garden-rls`

Production custom domain: `https://mybalconygardener.boileragency.com`

The SQL schema was applied manually in Supabase SQL Editor after hash review. The frontend implementation has been validated locally and on the production custom domain by browser testing.

## Phase Objective

Move the hosted customer/support product path from route-level placeholders to real authenticated, membership-filtered hosted access while preserving the hosted read-only boundary.

Phase 7L.4 does not create a commercial account system. It adds enough Supabase Auth, garden membership metadata, protected views, and frontend route gating to support the first pilot access model.

## Implementation Summary

The frontend now supports Supabase email/password login, sign out, and session-aware hosted routes.

The hosted route behavior is:

- `/` - public landing page.
- `/demo` - public live demo using the existing public demo-safe hosted views.
- `/login` - real Supabase email/password login path.
- `/mygarden` - authenticated customer garden dashboard.
- `/app` - backward-compatible alias to `/mygarden`.
- `/support` - authenticated support/admin dashboard by direct URL.

Support remains hidden from normal navigation.

## SQL/RLS/Membership Model

The Phase 7L.4 SQL artifact is:

```text
docs/sql/phase7l4-customer-auth-garden-membership-rls.sql
```

It defines:

- `profiles`
- `gardens`
- `garden_devices`
- `garden_memberships`
- `support_memberships`

It also defines protected customer views:

- `customer_garden_devices`
- `customer_hosted_gen2_measurements`
- `customer_hosted_device_diagnostics`

And protected support views:

- `support_garden_devices`
- `support_hosted_gen2_measurements`
- `support_hosted_device_diagnostics`

The protected customer/support route reads use these protected views. Browser-selected device keys, query params, route paths, and display labels are navigation state only and are not authorization.

## Seeded Pilot Memberships

Manual seed validation passed.

`customer_garden_devices` returns:

- Balcony01 / `balcony`
- Scout01 / `scout01`

`support_garden_devices` returns:

- Balcony01 / `balcony`
- Scout01 / `scout01`
- Bench01 / Prototype01 / `bench`

Bench01 / Prototype01 is represented as real support-only visibility metadata. It is not a fake physical device and it does not appear in `/mygarden`.

Scout01 is customer-visible in `/mygarden` as telemetry/readings evidence only. It does not gain watering authority.

## Route Behavior

Validated browser behavior:

- `/` loads while logged out.
- `/demo` loads while logged out.
- `/login` shows real login.
- `/mygarden` requires login.
- `/app` behaves like `/mygarden`.
- `/support` requires login and remains hidden from normal navigation.
- Header login from `/` or `/demo` redirects to `/mygarden` after successful sign-in.
- Direct logged-out `/support` login returns to `/support` after successful sign-in.
- Login changes to Sign out when authenticated.
- Sign out returns protected routes to login/access-required states.

## Customer/Support Device Visibility

Validated customer visibility:

- `/mygarden` shows Balcony01 and Scout01.
- `/mygarden` does not show Bench01 / Prototype01.

Validated support visibility:

- `/support` shows Balcony01, Scout01, and Bench01 / Prototype01.

## Validation Performed

Validated commands:

```powershell
npm.cmd run lint
npm.cmd run build
$env:VITE_MBG_DASHBOARD_MODE='hosted-readonly'
npm.cmd run build
```

Results:

- Lint passed.
- Normal build passed with the existing Vite chunk-size warning.
- Hosted-readonly build passed with the existing Vite chunk-size warning.
- Hosted `dist` scan showed no forbidden hosted production/control leakage.
- Source scan hits were limited to existing local-only control paths.

Manual browser validation passed for login redirects, route gating, customer/support visibility, sign out, `/app` alias behavior, public `/demo`, hidden support navigation, and removal of green all-caps route eyebrow labels.

Production credentialed browser validation passed on `https://mybalconygardener.boileragency.com`:

- Logged-out `/` and `/demo` load publicly.
- Logged-out `/mygarden`, `/app`, and `/support` require login.
- Header Login from `/` or `/demo` redirects to `/mygarden`.
- Direct `/support` login returns to `/support`.
- Logged-in `/mygarden` shows Balcony01 and Scout01 only.
- Logged-in `/support` shows Balcony01, Scout01, and Bench01 / Prototype01.
- Support remains hidden from normal navigation.
- Sign out works.

Cloudflare production deployment came from pushing `main`. No manual deploy command was run.

## Guardrails Preserved

Phase 7L.4 preserves:

- Hosted customer/support routes remain read-only.
- No Remote Water Now.
- No Supabase command/control.
- No hosted local ESP32 calls.
- No hosted `/logs` calls.
- No hosted `/water-now` calls.
- No local ESP32 IPs in hosted production artifacts.
- No firmware changes.
- No firmware upload.
- No pin, sensor, device ID, watering duration, threshold, cooldown, moisture mapping, or control eligibility changes.
- ESP32 firmware remains the owner of watering decisions and pump shutoff.

During production-validation closeout, no SQL was run, no firmware was touched, and no manual deploy command was run.

## Known Remaining Risk

Before adding external customer devices, public demo visibility should be narrowed so public demo views cannot accidentally expose non-demo customer data.

## Out Of Scope

Phase 7L.4 does not implement:

- Public self-signup.
- Invite flow.
- Billing.
- Account lifecycle automation.
- Provisioning UI.
- Device Wi-Fi setup UI.
- Support/admin management UI.
- Remote Water Now.
- Supabase command/control.
- Firmware changes.
- Commercial account lifecycle readiness.
- Broad external customer onboarding.
