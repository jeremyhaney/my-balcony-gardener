-- PROPOSAL ONLY — NOT EXECUTED
-- Read-only preflight and validation package for Phase 8G.4.
-- Run only under a separately approved execution/validation stage. No query
-- writes telemetry, assets, installations, capabilities, or authorization.

-- 1. Required existing extension and authority tables.
select extension.extname, extension.extversion
from pg_extension as extension
where extension.extname = 'btree_gist';

select to_regclass('public.device_registry') as device_registry,
  to_regclass('public.device_capabilities') as device_capabilities,
  to_regclass('public.support_memberships') as support_memberships,
  to_regclass('public.support_garden_devices') as support_garden_devices;

-- 2. Exact Phase 8G.4 objects.
select namespace.nspname as schema_name, relation.relname, relation.relkind
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in (
    'sensor_assets',
    'sensor_installations',
    'support_sensor_assets',
    'support_sensor_installations'
  )
order by relation.relname;

-- 3. Columns, constraints, and indexes.
select table_name, ordinal_position, column_name, data_type, udt_name,
  is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('sensor_assets', 'sensor_installations')
order by table_name, ordinal_position;

select relation.relname as table_name, constraint_record.conname,
  constraint_record.contype,
  pg_get_constraintdef(constraint_record.oid) as definition
from pg_constraint as constraint_record
join pg_class as relation on relation.oid = constraint_record.conrelid
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in ('sensor_assets', 'sensor_installations')
order by relation.relname, constraint_record.conname;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.sensor_installations'::regclass
  and conname in (
    'sensor_installations_device_key_no_overlap',
    'sensor_installations_asset_no_overlap'
  )
order by conname;
-- Expected: exactly both named half-open exclusion constraints.

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('sensor_assets', 'sensor_installations')
order by tablename, indexname;

-- 4. RLS, policies, and grants. Expected: RLS enabled, zero base-table
-- policies, no anon/authenticated base access, authenticated view SELECT only.
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid in (
  'public.sensor_assets'::regclass,
  'public.sensor_installations'::regclass
)
order by relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('sensor_assets', 'sensor_installations')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'sensor_assets',
    'sensor_installations',
    'support_sensor_assets',
    'support_sensor_installations'
  )
order by table_name, grantee, privilege_type;

select
  has_table_privilege('anon', 'public.sensor_assets', 'select')
    as anon_asset_select,
  has_table_privilege('authenticated', 'public.sensor_assets', 'select')
    as authenticated_asset_base_select,
  has_table_privilege('anon', 'public.sensor_installations', 'select')
    as anon_installation_select,
  has_table_privilege('authenticated', 'public.sensor_installations', 'select')
    as authenticated_installation_base_select,
  has_table_privilege('anon', 'public.support_sensor_assets', 'select')
    as anon_support_asset_select,
  has_table_privilege('authenticated', 'public.support_sensor_assets', 'select')
    as authenticated_support_asset_select,
  has_table_privilege('anon', 'public.support_sensor_installations', 'select')
    as anon_support_installation_select,
  has_table_privilege('authenticated', 'public.support_sensor_installations', 'select')
    as authenticated_support_installation_select;

-- 5. Protected view options and dependencies. Expected: security_barrier=true,
-- no measurement or watering dependency, and no customer/public view.
select relation.relname, relation.reloptions
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in (
    'support_sensor_assets',
    'support_sensor_installations'
  )
order by relation.relname;

select dependent.relname as support_view, source.relname as source_object
from pg_depend as dependency
join pg_rewrite as rewrite on rewrite.oid = dependency.objid
join pg_class as dependent on dependent.oid = rewrite.ev_class
join pg_class as source on source.oid = dependency.refobjid
join pg_namespace as dependent_namespace
  on dependent_namespace.oid = dependent.relnamespace
join pg_namespace as source_namespace on source_namespace.oid = source.relnamespace
where dependent_namespace.nspname = 'public'
  and source_namespace.nspname = 'public'
  and dependent.relname in (
    'support_sensor_assets',
    'support_sensor_installations'
  )
order by dependent.relname, source.relname;

select table_name
from information_schema.views
where table_schema = 'public'
  and table_name like '%sensor_asset%'
  and table_name not in (
    'support_sensor_assets',
    'support_sensor_installations'
  );
-- Expected: zero rows.

-- 6. Additive migration contains no seed/backfill. Expected immediately after
-- migration: both counts are zero.
select count(*) as sensor_asset_count from public.sensor_assets;
select count(*) as sensor_installation_count from public.sensor_installations;

-- 7. Historical interval integrity. Expected: zero rows from both audits.
select earlier.device_id, earlier.logical_sensor_key,
  earlier.id as earlier_id, later.id as later_id
from public.sensor_installations as earlier
join public.sensor_installations as later
  on later.id > earlier.id
  and later.device_id = earlier.device_id
  and later.logical_sensor_key = earlier.logical_sensor_key
  and tstzrange(
    earlier.effective_from,
    coalesce(earlier.effective_to, 'infinity'::timestamptz), '[)'
  ) && tstzrange(
    later.effective_from,
    coalesce(later.effective_to, 'infinity'::timestamptz), '[)'
  );

select earlier.sensor_asset_id,
  earlier.id as earlier_id, later.id as later_id
from public.sensor_installations as earlier
join public.sensor_installations as later
  on later.id > earlier.id
  and later.sensor_asset_id = earlier.sensor_asset_id
  and tstzrange(
    earlier.effective_from,
    coalesce(earlier.effective_to, 'infinity'::timestamptz), '[)'
  ) && tstzrange(
    later.effective_from,
    coalesce(later.effective_to, 'infinity'::timestamptz), '[)'
  );

-- 8. Asset family must agree with the commissioned logical capability effective
-- at installation start. The later service transaction must enforce this
-- validation; this audit detects any operator-entered mismatch. Expected: zero.
select installation.id, installation.device_id,
  installation.logical_sensor_key, asset.sensor_family as asset_family,
  capability.sensor_family as commissioned_family
from public.sensor_installations as installation
join public.sensor_assets as asset on asset.id = installation.sensor_asset_id
left join public.device_capabilities as capability
  on capability.device_id = installation.device_id
  and capability.logical_sensor_key = installation.logical_sensor_key
  and tstzrange(
    capability.effective_from,
    coalesce(capability.effective_to, 'infinity'::timestamptz), '[)'
  ) @> installation.effective_from
where capability.id is null
   or lower(capability.sensor_family) <> lower(asset.sensor_family);

-- 9. Exact as-of lookup and plan. Expected: one row at most and use of the
-- device/key GiST exclusion index after representative data exists.
select installation.*, asset.asset_tag, asset.sensor_family,
  asset.manufacturer_serial, asset.hardware_uid_scheme, asset.hardware_uid
from public.sensor_installations as installation
join public.sensor_assets as asset on asset.id = installation.sensor_asset_id
where installation.device_id = '<device-uuid>'
  and installation.logical_sensor_key = '<logical-sensor-key>'
  and tstzrange(
    installation.effective_from,
    coalesce(installation.effective_to, 'infinity'::timestamptz), '[)'
  ) @> '<measurement-timestamp>'::timestamptz
limit 1;

explain (format json)
select installation.id, installation.sensor_asset_id
from public.sensor_installations as installation
where installation.device_id = '<device-uuid>'
  and installation.logical_sensor_key = '<logical-sensor-key>'
  and tstzrange(
    installation.effective_from,
    coalesce(installation.effective_to, 'infinity'::timestamptz), '[)'
  ) @> '<measurement-timestamp>'::timestamptz
limit 1;

-- 10. Authenticated isolation probes. SQL Editor owner execution cannot by
-- itself prove REST/JWT behavior; repeat these through authenticated clients.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<support-read-only-auth-user-uuid>';
select * from public.support_sensor_assets order by asset_tag;
select * from public.support_sensor_installations
  order by device_key, logical_sensor_key, effective_from;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '<unassigned-auth-user-uuid>';
select * from public.support_sensor_assets;
select * from public.support_sensor_installations;
rollback;

-- 11. Confirm the migration did not alter telemetry or capability history.
select count(*) as device_capability_count from public.device_capabilities;
select count(*) as measurement_batch_count
from public.sensor_measurement_batches;
