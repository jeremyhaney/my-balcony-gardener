# ADR 0020: MVP Customer Setup, Access, and Local-Control Boundary

Status: Accepted

Date: 2026-06-04

## Context

Phase 7L asks what must be true if Jeremy installs My Balcony Gardener at another location: the customer should see their own dashboard and only their own data, while Jeremy still has support/admin visibility without sharing the customer's login.

Phase 7L records a product/setup/access boundary only. It does not implement auth, RLS changes, firmware changes, frontend runtime changes, SQL changes, provisioning UI, local dashboard removal, or physical button hardware/firmware behavior.

The current hosted dashboard is useful for read-only visibility, but it is not customer isolation. Device/window URL query selection is convenience, not security. The current `public.device_registry` is a provisioned-device insert allowlist and hosted visibility source, not customer/site/auth access control.

## Decision

The MVP customer product path should be:

- Hosted dashboard for daily customer visibility.
- Read-only Supabase telemetry/history/diagnostics evidence.
- No app-based watering command.
- Local firmware ownership of automatic watering decisions and pump shutoff.
- Jeremy-managed installation/provisioning for supervised pilots.

Phase 7L defines the target boundary for customer setup, access, support, device assignment, Wi-Fi setup, and local-control separation without implementing those systems.

## Customer/Site/Device Logical Model

The lightest future logical model is:

- `customers`
- `sites`, `gardens`, or `installations`
- `devices`
- `user_site_memberships`
- `support_admin_memberships`

A customer should eventually see only their own site/device data through authenticated, RLS-filtered hosted views. A site may contain one physically equipped controller unit plus optional telemetry-only sensor units. Devices remain individually identifiable by stable device UUIDs, while customer-facing names, garden labels, and location notes are install-time assignment metadata.

Phase 7L does not create these tables, views, policies, or UI.

## Pilot/MVP Access Boundary

For a supervised pilot, Jeremy may continue to manage customer/device assignment outside the app while the hosted dashboard remains read-only. This is acceptable only as a small-pilot boundary, not as commercial customer isolation.

The current hosted dashboard may continue to use device/window selectors for review and support. Those selectors do not prove user ownership and must not be described as customer security.

## Deferred Auth/RLS/Provisioning Boundary

Commercial or broader pilot customer access requires a later explicit phase for:

- Supabase Auth or equivalent login.
- RLS-filtered customer/site/device views.
- Membership tables connecting users to sites and devices.
- Support/admin memberships separate from customer credentials.
- Customer-safe account lifecycle and invite flows.
- Setup/provisioning UI or installer workflow.

Future RLS must authorize rows by site/device membership, not merely by authenticated role. Authorization decisions must not rely on user-editable metadata.

## Jeremy Support/Admin Access

Jeremy should have explicit support/admin membership to customer site records instead of sharing customer logins.

Future role language may include:

- `site-owner`
- `support-read-only`
- `installer`
- `admin`

Support access should be read-only by default. Support/admin access must not create remote watering authority.

## Device Identity and Install-Time Assignment

Fixed at build/flash or provisioning time:

- Stable device UUID.
- Build profile.
- Firmware role/profile.
- Physical controller or telemetry-only capability.

Assigned at install time:

- Customer/site/garden assignment.
- Friendly display name.
- Physical location or zone label.
- Support notes.
- Dashboard display grouping.

The stable device UUID remains telemetry identity. Friendly names and site assignments are presentation and access metadata, not firmware identity.

## Wi-Fi Setup/Provisioning Boundary

For supervised pilot installs, Jeremy or an installer may preload Wi-Fi and device settings through the current local config/build-profile process. This is acceptable for a small pilot but is not a scalable customer provisioning system.

Deferred setup options include:

- AP/captive portal setup.
- USB serial provisioning.
- Bluetooth/app setup.
- Installer setup mode.
- Programming-station provisioning.

Phase 7L implements none of these options.

## Hosted Dashboard Boundary

Customer daily use should be the hosted read-only dashboard.

The hosted dashboard must remain read-only, must not call local ESP32 endpoints, must not expose Water Now, and must not introduce Supabase command/control. Supabase remains telemetry/history/diagnostics storage only.

Future customer isolation requires authenticated, membership-filtered hosted views. The current URL/query selected device and window are navigation state only.

## App Water Now Product Decision

App-based Water Now is not part of the customer product path. The hosted customer dashboard remains read-only. Supabase remains telemetry/history/diagnostics storage only and must not become command/control. Remote/app watering is intentionally excluded because it adds security, liability, support, state-sync, and frontend complexity. Phase 7L removes no existing code and changes no current local/manual behavior.

This decision affects future product design, support docs, and customer dashboard scope. It does not remove the existing local/default Manual Water Now code path in Phase 7L.

## Future Physical Hold-To-Water/Test Direction

Future manual watering/testing should be a physical local hold-to-water action on the controller unit. The pump should run only while the physical input is held. Firmware should log start/stop evidence for the event. Firmware must enforce a hard failsafe maximum runtime if the input remains active. Pump shutoff remains first-priority firmware logic. Event evidence should preserve enough information to support later water-use history and expected water-use forecasting. Phase 7L implements no firmware or hardware change.

Potential future event evidence may include:

- `manual_physical_water_start`
- `manual_physical_water_stop`
- Duration.
- Source such as `physical_button`.
- Whether a safety cutoff was applied.
- Estimated water volume later, if pump rate or flow evidence is known.

## Local Dashboard Future

Customer daily use should be the hosted read-only dashboard. The local dashboard/endpoints may remain engineering, service, and setup tools for now.

A future setup/provisioning mode is different from a daily-use local dashboard. Local UI/control can be reduced or removed from the product path later, but Phase 7L does not remove it.

## Sensor-Only Unit Language

Sensor-only units are telemetry-only because they are not physically connected to irrigation hardware. A sensor-only unit has no pump, no pump relay, no irrigation connection, and no watering output. Dashboard and metadata should label sensor-only devices accurately as telemetry-only. Only a physically equipped controller unit can water locally.

Scout01 is an example of a telemetry-only sensor unit because of its physical product configuration, not a special remote-control risk case.

## Explicit Non-Goals

Phase 7L does not implement:

- Supabase Auth.
- RLS changes.
- Customer/site/device tables.
- Support/admin UI.
- Provisioning UI.
- Firmware changes.
- Frontend runtime changes.
- SQL changes.
- Hosted dashboard behavior changes.
- Local dashboard removal.
- App-based Water Now removal from existing local code.
- Physical button hardware or firmware.
- Remote Water Now.
- Supabase command/control.
- Firmware upload.
- Deploy.

## Consequences

This ADR gives future phases a product boundary before implementation work begins. It separates customer access design from URL filtering, separates support visibility from customer login sharing, and separates manual watering/testing from app command/control.

It also prevents Phase 7L from overbuilding commercial auth or provisioning while still documenting what a real customer deployment eventually needs.

## Follow-Up Work

Likely future implementation phases:

- Authenticated customer/site/device access model and RLS-filtered hosted views.
- Support/admin membership implementation.
- Installer/provisioning workflow.
- Customer-safe hosted dashboard routing and account flow.
- Physical hold-to-water/test hardware and firmware design.
- Loggable manual physical watering/test events.
- Local dashboard reduction or service/setup-mode separation.
- Pilot deployment package and support workflow.
