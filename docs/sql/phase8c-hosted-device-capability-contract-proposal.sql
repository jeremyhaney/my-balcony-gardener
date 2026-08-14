-- PROPOSAL ONLY — NOT EXECUTED
-- Phase 8C hosted device-capability contract.
-- Creates an initially empty positive commissioned-capability contract.
-- Does not seed data, infer from measurements, ingest firmware capabilities,
-- grant watering authority, or change any existing object.

begin;

-- Precondition: btree_gist must already be installed. This migration does not
-- install extensions. See the separate preflight checks in the validation file.

create table public.device_capabilities (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.device_registry(device_id),
  logical_sensor_key text not null,
  logical_channel text not null,
  sensor_family text not null,
  expected_measurement_names text[] not null,
  physical_sensor_id text null,
  friendly_name text null,
  location_label text null,
  effective_from timestamptz not null,
  effective_to timestamptz null,
  provisioning_note text null,
  created_at timestamptz not null default now(),

  constraint device_capabilities_logical_sensor_key_not_blank
    check (btrim(logical_sensor_key) <> ''),
  constraint device_capabilities_logical_channel_not_blank
    check (btrim(logical_channel) <> ''),
  constraint device_capabilities_sensor_family_not_blank
    check (btrim(sensor_family) <> ''),
  constraint device_capabilities_expected_measurements_nonempty
    check (cardinality(expected_measurement_names) > 0),
  constraint device_capabilities_expected_measurements_no_null
    check (array_position(expected_measurement_names, null) is null),
  constraint device_capabilities_expected_measurements_no_blank
    check (array_position(expected_measurement_names, '') is null),
  constraint device_capabilities_physical_sensor_id_not_blank
    check (physical_sensor_id is null or btrim(physical_sensor_id) <> ''),
  constraint device_capabilities_friendly_name_not_blank
    check (friendly_name is null or btrim(friendly_name) <> ''),
  constraint device_capabilities_location_label_not_blank
    check (location_label is null or btrim(location_label) <> ''),
  constraint device_capabilities_provisioning_note_not_blank
    check (provisioning_note is null or btrim(provisioning_note) <> ''),
  constraint device_capabilities_effective_interval_valid
    check (effective_to is null or effective_to > effective_from),
  constraint device_capabilities_device_key_start_unique
    unique (device_id, logical_sensor_key, effective_from),
  constraint device_capabilities_device_key_no_overlap
    exclude using gist (
      device_id with =,
      logical_sensor_key with =,
      tstzrange(
        effective_from,
        coalesce(effective_to, 'infinity'::timestamptz),
        '[)'
      ) with &&
    )
);

create index device_capabilities_current_device_idx
  on public.device_capabilities (device_id, logical_sensor_key)
  where effective_to is null;

alter table public.device_capabilities enable row level security;

revoke all on table public.device_capabilities
  from public, anon, authenticated;

create view public.customer_device_capabilities
with (security_barrier = true)
as
select
  customer_device.garden_id,
  customer_device.garden_key,
  customer_device.garden_name,
  customer_device.garden_device_id,
  capability.device_id,
  customer_device.device_key,
  customer_device.display_name as device_display_name,
  capability.logical_sensor_key,
  capability.logical_channel,
  capability.sensor_family,
  capability.expected_measurement_names,
  capability.friendly_name,
  capability.location_label
from public.device_capabilities as capability
inner join public.customer_garden_devices as customer_device
  on customer_device.device_id = capability.device_id
where capability.effective_from <= now()
  and (capability.effective_to is null or capability.effective_to > now());

create view public.support_device_capabilities
with (security_barrier = true)
as
select
  support_device.garden_id,
  support_device.garden_key,
  support_device.garden_name,
  support_device.garden_device_id,
  capability.id as capability_id,
  capability.device_id,
  support_device.device_key,
  support_device.display_name as device_display_name,
  capability.logical_sensor_key,
  capability.logical_channel,
  capability.sensor_family,
  capability.expected_measurement_names,
  capability.physical_sensor_id,
  capability.friendly_name,
  capability.location_label,
  capability.effective_from,
  capability.effective_to,
  capability.provisioning_note,
  capability.created_at
from public.device_capabilities as capability
inner join public.support_garden_devices as support_device
  on support_device.device_id = capability.device_id;

revoke all on public.customer_device_capabilities
  from public, anon, authenticated;
revoke all on public.support_device_capabilities
  from public, anon, authenticated;

grant select on public.customer_device_capabilities to authenticated;
grant select on public.support_device_capabilities to authenticated;

comment on table public.device_capabilities is
  'Positive per-device commissioned logical-sensor lifecycle; provisioning authority, not runtime evidence or command/control.';
comment on view public.customer_device_capabilities is
  'Current commissioned capabilities filtered by existing customer garden/device membership.';
comment on view public.support_device_capabilities is
  'Commissioned capability history filtered by existing Support membership.';

commit;
