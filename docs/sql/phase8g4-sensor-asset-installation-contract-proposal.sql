-- PROPOSAL ONLY — NOT EXECUTED
-- Phase 8G.4 sensor asset identity and field-replacement history.
-- Additive schema only: no seed/backfill, telemetry rewrite, firmware identity,
-- measurement-view change, browser mutation path, or watering authority.

begin;

-- Precondition: btree_gist is already installed for the existing
-- device_capabilities lifecycle exclusion constraint. This proposal neither
-- installs nor removes the extension.

create table public.sensor_assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text not null,
  sensor_family text not null,
  manufacturer text null,
  model text null,
  manufacturer_serial text null,
  hardware_uid_scheme text null,
  hardware_uid text null,
  asset_note text null,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,

  constraint sensor_assets_asset_tag_not_blank
    check (btrim(asset_tag) <> ''),
  constraint sensor_assets_sensor_family_not_blank
    check (btrim(sensor_family) <> ''),
  constraint sensor_assets_manufacturer_not_blank
    check (manufacturer is null or btrim(manufacturer) <> ''),
  constraint sensor_assets_model_not_blank
    check (model is null or btrim(model) <> ''),
  constraint sensor_assets_manufacturer_serial_not_blank
    check (manufacturer_serial is null or btrim(manufacturer_serial) <> ''),
  constraint sensor_assets_hardware_uid_scheme_not_blank
    check (hardware_uid_scheme is null or btrim(hardware_uid_scheme) <> ''),
  constraint sensor_assets_hardware_uid_not_blank
    check (hardware_uid is null or btrim(hardware_uid) <> ''),
  constraint sensor_assets_hardware_uid_pair_complete
    check ((hardware_uid_scheme is null) = (hardware_uid is null)),
  constraint sensor_assets_asset_note_not_blank
    check (asset_note is null or btrim(asset_note) <> '')
);

create unique index sensor_assets_asset_tag_unique
  on public.sensor_assets (lower(asset_tag));

create unique index sensor_assets_hardware_uid_unique
  on public.sensor_assets (
    lower(hardware_uid_scheme),
    lower(hardware_uid)
  )
  where hardware_uid_scheme is not null and hardware_uid is not null;

create index sensor_assets_family_idx
  on public.sensor_assets (sensor_family, asset_tag);

create table public.sensor_installations (
  id uuid primary key default gen_random_uuid(),
  sensor_asset_id uuid not null references public.sensor_assets(id),
  device_id text not null references public.device_registry(device_id),
  logical_sensor_key text not null,
  effective_from timestamptz not null,
  effective_to timestamptz null,
  installed_by uuid null references auth.users(id) on delete set null,
  verified_at timestamptz null,
  verification_measured_at timestamptz null,
  verification_batch_id uuid null,
  service_note text null,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,

  constraint sensor_installations_logical_sensor_key_not_blank
    check (btrim(logical_sensor_key) <> ''),
  constraint sensor_installations_effective_interval_valid
    check (effective_to is null or effective_to > effective_from),
  constraint sensor_installations_verification_pair_complete
    check ((verified_at is null) = (verification_measured_at is null)),
  constraint sensor_installations_verification_batch_requires_verification
    check (verification_batch_id is null or verified_at is not null),
  constraint sensor_installations_service_note_not_blank
    check (service_note is null or btrim(service_note) <> ''),
  constraint sensor_installations_device_key_start_unique
    unique (device_id, logical_sensor_key, effective_from),
  constraint sensor_installations_device_key_no_overlap
    exclude using gist (
      device_id with =,
      logical_sensor_key with =,
      tstzrange(
        effective_from,
        coalesce(effective_to, 'infinity'::timestamptz),
        '[)'
      ) with &&
    ),
  constraint sensor_installations_asset_no_overlap
    exclude using gist (
      sensor_asset_id with =,
      tstzrange(
        effective_from,
        coalesce(effective_to, 'infinity'::timestamptz),
        '[)'
      ) with &&
    )
);

create index sensor_installations_current_device_idx
  on public.sensor_installations (device_id, logical_sensor_key)
  where effective_to is null;

create index sensor_installations_current_asset_idx
  on public.sensor_installations (sensor_asset_id)
  where effective_to is null;

alter table public.sensor_assets enable row level security;
alter table public.sensor_installations enable row level security;

revoke all on table public.sensor_assets
  from public, anon, authenticated;
revoke all on table public.sensor_installations
  from public, anon, authenticated;

-- This view deliberately authorizes against the existing Support membership
-- table so uninstalled inventory can be reviewed. It is read-only and exposes
-- no customer/public surface.
create view public.support_sensor_assets
with (security_barrier = true)
as
select
  asset.id as sensor_asset_id,
  asset.asset_tag,
  asset.sensor_family,
  asset.manufacturer,
  asset.model,
  asset.manufacturer_serial,
  asset.hardware_uid_scheme,
  asset.hardware_uid,
  asset.asset_note,
  asset.created_at
from public.sensor_assets as asset
where (select auth.uid()) is not null
  and exists (
    select 1
    from public.support_memberships as support
    where support.user_id = (select auth.uid())
      and support.active is true
      and support.role in ('support_read_only', 'admin')
  );

-- Installation history is filtered through the existing Support-visible
-- device assignment contract. Measurements are not joined into this view.
create view public.support_sensor_installations
with (security_barrier = true)
as
select
  support_device.garden_id,
  support_device.garden_key,
  support_device.garden_name,
  installation.id as sensor_installation_id,
  installation.device_id,
  support_device.device_key,
  support_device.display_name as device_display_name,
  installation.logical_sensor_key,
  installation.sensor_asset_id,
  asset.asset_tag,
  asset.sensor_family,
  asset.manufacturer,
  asset.model,
  asset.manufacturer_serial,
  asset.hardware_uid_scheme,
  asset.hardware_uid,
  installation.effective_from,
  installation.effective_to,
  installation.installed_by,
  installation.verified_at,
  installation.verification_measured_at,
  installation.verification_batch_id,
  installation.service_note,
  installation.created_at
from public.sensor_installations as installation
inner join public.sensor_assets as asset
  on asset.id = installation.sensor_asset_id
inner join public.support_garden_devices as support_device
  on support_device.device_id = installation.device_id;

revoke all on public.support_sensor_assets
  from public, anon, authenticated;
revoke all on public.support_sensor_installations
  from public, anon, authenticated;

grant select on public.support_sensor_assets to authenticated;
grant select on public.support_sensor_installations to authenticated;

comment on table public.sensor_assets is
  'MBG-tagged physical sensor assets. Asset UUID/QR identity is separate from logical sensor key, manufacturer serial, and discoverable hardware UID.';
comment on table public.sensor_installations is
  'Half-open effective-time history linking one physical asset to one device-local logical sensor key; service evidence only, never command/control.';
comment on view public.support_sensor_assets is
  'Authenticated Support inventory read surface; no customer/public access and no mutation path.';
comment on view public.support_sensor_installations is
  'Authenticated Support installation-history read surface filtered by Support-visible device assignments.';

commit;
