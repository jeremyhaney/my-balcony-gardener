-- PROPOSAL ONLY — NOT EXECUTED
-- Dependency-safe rollback for the additive Phase 8G.4 schema proposal.
-- Use only before any asset or installation evidence is recorded and before a
-- frontend/service dependency exists. Once evidence exists, export/preserve it
-- and approve a dedicated migration instead of using this simple rollback.
-- btree_gist removal is explicitly out of scope.

begin;

drop view if exists public.support_sensor_installations;
drop view if exists public.support_sensor_assets;
drop table if exists public.sensor_installations;
drop table if exists public.sensor_assets;

commit;
