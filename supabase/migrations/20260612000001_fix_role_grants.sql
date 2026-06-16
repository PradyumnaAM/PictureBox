-- =============================================================================
-- Fix missing role grants
--
-- Several tables (profiles, follows, group_items, …) are missing the standard
-- Supabase grants for service_role / authenticated / anon, causing
-- "permission denied for table profiles" (42501) — e.g. PATCH /api/user/profile
-- returned 500 because the admin (service_role) client could not update.
--
-- Grants are table-level only; row-level security policies still apply to
-- anon/authenticated. service_role bypasses RLS by design (used by
-- createAdminClient() in API routes).
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Existing objects
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all routines  in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

grant select, insert, update, delete on all tables    in schema public to authenticated;
grant execute                        on all routines  in schema public to authenticated;
grant usage, select                  on all sequences in schema public to authenticated;

grant select  on all tables   in schema public to anon;
grant execute on all routines in schema public to anon;

-- Future objects created in public keep the same grants
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on routines  to service_role;
alter default privileges in schema public grant all on sequences to service_role;

alter default privileges in schema public grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public grant execute                        on routines  to authenticated;
alter default privileges in schema public grant usage, select                  on sequences to authenticated;

alter default privileges in schema public grant select  on tables   to anon;
alter default privileges in schema public grant execute on routines to anon;
