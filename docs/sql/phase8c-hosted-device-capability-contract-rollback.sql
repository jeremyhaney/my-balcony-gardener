-- PROPOSAL ONLY — NOT EXECUTED
-- Dependency-safe rollback for objects created by the Phase 8C forward proposal.
-- WARNING: Use only before frontend dependency and production provisioning.
-- After provisioning, preserve lifecycle evidence and approve a dedicated migration.
-- Extension removal is out of scope; this package does not install btree_gist.

begin;

drop view if exists public.support_device_capabilities;
drop view if exists public.customer_device_capabilities;
drop table if exists public.device_capabilities;

commit;
