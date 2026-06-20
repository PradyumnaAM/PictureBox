-- =============================================================================
-- Security fixes: tighten RLS and function grants
-- =============================================================================

-- ── 1. increment_vote: restrict to service_role only ─────────────────────────
-- The API route at /api/groups/[id]/vote already enforces group membership
-- before calling this RPC. Granting execute to `authenticated` lets any
-- logged-in user call it directly (bypassing the membership check) and inflate
-- or deflate any item's vote count. Restrict to service_role so the only path
-- is through the server-side route.
revoke execute on function public.increment_vote(uuid, integer) from authenticated;

-- ── 2. titles / seasons / episodes: remove authenticated write access ─────────
-- These are shared reference tables populated exclusively by server-side API
-- routes using the service_role admin client. Granting INSERT/UPDATE to
-- `authenticated` lets any logged-in user overwrite cached TMDB data (titles,
-- episode runtimes used in total-hours stats, etc.) by calling the Supabase
-- JS SDK directly from the browser. Drop those policies; service_role bypasses
-- RLS and needs no policy.

drop policy if exists "titles_insert"   on public.titles;
drop policy if exists "titles_update"   on public.titles;

drop policy if exists "seasons_insert"  on public.seasons;
drop policy if exists "seasons_update"  on public.seasons;

drop policy if exists "episodes_insert" on public.episodes;
drop policy if exists "episodes_update" on public.episodes;
