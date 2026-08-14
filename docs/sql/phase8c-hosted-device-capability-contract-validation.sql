-- PROPOSAL ONLY — NOT EXECUTED
-- Read-only preflight and validation plan for the narrowed Phase 8C contract.
-- No query in this artifact reads telemetry or expands measurement batches.
-- JWT isolation must also be proved through authenticated REST clients because
-- Supabase SQL Editor owner access does not prove browser behavior.

-- PRE-EXECUTION PREFLIGHT ONLY: determine whether btree_gist is installed and
-- whether PostgreSQL reports it as available. The main migration does not
-- install it. If absent and permitted, installation requires a separately
-- approved prerequisite action in the later execution slice.
select extension.extname, extension.extversion
from pg_extension as extension
where extension.extname = 'btree_gist';

select available.name, available.default_version, available.installed_version,
  available.comment
from pg_available_extensions as available
where available.name = 'btree_gist';

-- 1. Exact created objects. Expected after migration: one table and two views.
select namespace.nspname as schema_name, relation.relname, relation.relkind
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in (
    'device_capabilities',
    'customer_device_capabilities',
    'support_device_capabilities'
  )
order by relation.relname;

-- 2. Exact column definitions.
select table_name, ordinal_position, column_name, data_type, udt_name,
  is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'device_capabilities',
    'customer_device_capabilities',
    'support_device_capabilities'
  )
order by table_name, ordinal_position;

-- 3. Constraints and indexes.
select constraint_record.conname, constraint_record.contype,
  pg_get_constraintdef(constraint_record.oid) as definition
from pg_constraint as constraint_record
where constraint_record.conrelid = 'public.device_capabilities'::regclass
order by constraint_record.conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'device_capabilities'
order by indexname;

-- 4. RLS and zero base-table browser policies.
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid = 'public.device_capabilities'::regclass;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'device_capabilities'
order by policyname;
-- Expected: zero policy rows.

-- 5. Grants/revokes.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'device_capabilities',
    'customer_device_capabilities',
    'support_device_capabilities'
  )
order by table_name, grantee, privilege_type;

select
  has_table_privilege('anon', 'public.device_capabilities', 'select')
    as anon_base_select,
  has_table_privilege('authenticated', 'public.device_capabilities', 'select')
    as authenticated_base_select,
  has_table_privilege('anon', 'public.customer_device_capabilities', 'select')
    as anon_customer_select,
  has_table_privilege('authenticated', 'public.customer_device_capabilities', 'select')
    as authenticated_customer_select,
  has_table_privilege('anon', 'public.support_device_capabilities', 'select')
    as anon_support_select,
  has_table_privilege('authenticated', 'public.support_device_capabilities', 'select')
    as authenticated_support_select;

-- 6. Both protected views must have security_barrier=true. This slice does not
-- introduce security_invoker or browser grants on underlying tables.
select relation.relname, relation.reloptions
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname in (
    'customer_device_capabilities',
    'support_device_capabilities'
  )
order by relation.relname;

-- 7. Confirm capability reads depend on configuration and mandatory membership
-- views, not measurements or telemetry.
select view_record.table_name, view_record.view_definition
from information_schema.views as view_record
where view_record.table_schema = 'public'
  and view_record.table_name in (
    'customer_device_capabilities',
    'support_device_capabilities'
  )
order by view_record.table_name;

select dependent.relname as capability_view, source.relname as source_object
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
    'customer_device_capabilities',
    'support_device_capabilities'
  )
order by dependent.relname, source.relname;
-- Expected: no measurement or telemetry dependency.

-- 8. Exact Balcony02 provisioning, only after separate approval.
select logical_sensor_key, logical_channel, sensor_family,
  expected_measurement_names, physical_sensor_id, friendly_name, location_label,
  effective_from, effective_to, provisioning_note
from public.device_capabilities
where device_id = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
order by logical_sensor_key;

select count(*) as balcony02_capability_count
from public.device_capabilities
where device_id = '7e5bd328-ad68-4389-a71a-fa5cd01b3813';
-- Expected: 9.

select sum(cardinality(expected_measurement_names))
  as balcony02_expected_measurement_entry_count
from public.device_capabilities
where device_id = '7e5bd328-ad68-4389-a71a-fa5cd01b3813';
-- Expected: 11.

select capability.logical_sensor_key, expected.measurement_name
from public.device_capabilities as capability
cross join lateral unnest(capability.expected_measurement_names)
  as expected(measurement_name)
where capability.device_id = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
order by capability.logical_sensor_key, expected.measurement_name;
-- Expected: exactly 11 provisioning entries; configuration only.

-- Expected: zero rows. M04 and LUX04 are not commissioned.
select *
from public.device_capabilities
where device_id = '7e5bd328-ad68-4389-a71a-fa5cd01b3813'
  and logical_sensor_key in ('sen0308_m04', 'sen0562_l04', 'lux04');

-- Expected: zero rows. This package proposes no other device.
select *
from public.device_capabilities
where device_id <> '7e5bd328-ad68-4389-a71a-fa5cd01b3813';

-- 9. Current selection and retired exclusion using configuration only.
select *
from public.support_device_capabilities
where effective_from <= now()
  and (effective_to is null or effective_to > now())
order by device_key, logical_sensor_key;

select customer.*
from public.customer_device_capabilities as customer
join public.device_capabilities as capability
  on capability.device_id = customer.device_id
  and capability.logical_sensor_key = customer.logical_sensor_key
where capability.effective_to is not null
  and capability.effective_to <= now();
-- Expected: zero retired rows in the customer view.

-- 10. Historical interval and overlap audit. Expected: zero overlaps.
select earlier.device_id, earlier.logical_sensor_key,
  earlier.id as earlier_id, later.id as later_id
from public.device_capabilities as earlier
join public.device_capabilities as later
  on later.device_id = earlier.device_id
  and later.logical_sensor_key = earlier.logical_sensor_key
  and later.id > earlier.id
  and tstzrange(
    earlier.effective_from,
    coalesce(earlier.effective_to, 'infinity'::timestamptz), '[)'
  ) && tstzrange(
    later.effective_from,
    coalesce(later.effective_to, 'infinity'::timestamptz), '[)'
  );

-- Constraint inspection in section 3 proves prevention without attempting an
-- invalid INSERT in this read-only validation artifact.

-- 11. Authenticated customer isolation.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<customer-auth-user-uuid>';
select * from public.customer_device_capabilities
  order by device_key, logical_sensor_key;
select * from public.support_device_capabilities
  order by device_key, logical_sensor_key;
rollback;

-- 12. Unauthorized authenticated user. Expected: zero rows from both views.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<unassigned-auth-user-uuid>';
select * from public.customer_device_capabilities;
select * from public.support_device_capabilities;
rollback;

-- 13. Support isolation and lifecycle history.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<support-auth-user-uuid>';
select * from public.support_device_capabilities
  order by device_key, logical_sensor_key, effective_from;
select * from public.customer_device_capabilities
  order by device_key, logical_sensor_key;
rollback;

-- 14. No public capability exposure. Expected: zero anon grants.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'device_capabilities',
    'customer_device_capabilities',
    'support_device_capabilities'
  )
  and grantee = 'anon'
order by table_name, privilege_type;
