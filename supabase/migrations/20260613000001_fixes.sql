-- =============================================================================
-- PictureBox — Schema Fixes (2026-06-13)
-- =============================================================================
-- Idempotent, safe to run top-to-bottom on the live DB via the Supabase SQL
-- editor. Uses IF EXISTS / IF NOT EXISTS and drop-and-recreate so it can be
-- re-applied without error.
--
-- Contents:
--   1. Allow status 'completed' on user_logs
--   2. Add profiles.favorite_genres (onboarding)
--   3. Fix privacy consistency in the user_logs_select RLS policy
--   4. Harden get_user_stats: privacy guard + count 'completed' as watched
-- =============================================================================


-- =============================================================================
-- 1. Allow status 'completed' on user_logs
--    Drop the auto-named inline check constraint and re-add it with the extra
--    allowed value.
-- =============================================================================
alter table public.user_logs
  drop constraint if exists user_logs_status_check;

alter table public.user_logs
  add constraint user_logs_status_check
  check (status in (
    'watched', 'watching', 'want_to_watch', 'dropped', 'on_hold', 'completed'
  ));


-- =============================================================================
-- 2. Add column for onboarding favourite genres
--    Column name is EXACTLY `favorite_genres` (onboarding code writes to it).
-- =============================================================================
alter table public.profiles
  add column if not exists favorite_genres jsonb not null default '[]'::jsonb;


-- =============================================================================
-- 3. Fix privacy consistency in the user_logs_select RLS policy
--    Profiles are visible to self + public + followers (profiles_select), so
--    logs should follow the same model. Previously logs were only visible to
--    self OR public profiles, hiding followers' logs.
-- =============================================================================
drop policy if exists "user_logs_select" on public.user_logs;

create policy "user_logs_select"
  on public.user_logs for select
  using (
    user_id = auth.uid()
    or (
      deleted_at is null
      and exists (
        select 1 from public.profiles p
        where p.id = user_logs.user_id
          and (
            p.profile_public = true
            or exists (
              select 1 from public.follows f
              where f.following_id = p.id
                and f.follower_id  = auth.uid()
            )
          )
      )
    )
  );


-- =============================================================================
-- 4. Harden get_user_stats
--    - SECURITY DEFINER currently returns stats for ANY p_user_id, bypassing
--      privacy. Add a privacy gate: caller must be the user, the profile must
--      be public, or the caller must follow the user — otherwise no rows.
--    - Count 'completed' logs the same as 'watched' so completed TV shows
--      contribute to the stats.
--    Exact same return signature/columns preserved.
-- =============================================================================
create or replace function public.get_user_stats(p_user_id uuid)
returns table (
  total_movies        bigint,
  total_tv_shows      bigint,
  total_episodes      bigint,
  total_hours         numeric,
  movies_this_year    bigint,
  episodes_this_year  bigint,
  favourite_genres    text[],
  favourite_directors text[]
)
language sql
stable
security definer
set search_path = public
as $$
  with logs as (
    select *
    from public.user_logs
    where user_id   = p_user_id
      and deleted_at is null
      and status    in ('watched', 'completed')
  ),
  movie_logs as (
    select * from logs where log_type = 'movie'
  ),
  episode_logs as (
    select * from logs where log_type = 'tv_episode'
  )
  select
    -- total_movies
    (select count(*) from movie_logs)::bigint,

    -- total_tv_shows: unique TV titles (any tv_* log type)
    (select count(distinct title_id)
       from logs
       where log_type in ('tv_show', 'tv_season', 'tv_episode'))::bigint,

    -- total_episodes
    (select count(*) from episode_logs)::bigint,

    -- total_hours: (movie minutes + episode minutes) / 60
    round(
      (
        coalesce((
          select sum(t.runtime)
          from movie_logs ml
          join public.titles t on t.id = ml.title_id
        ), 0)
        +
        coalesce((
          select sum(e.runtime)
          from episode_logs el
          join public.episodes e on e.id = el.episode_id
        ), 0)
      )::numeric / 60.0
    , 1),

    -- movies_this_year
    (select count(*)
       from movie_logs
       where extract(year from coalesce(watched_at, created_at::date))
             = extract(year from current_date))::bigint,

    -- episodes_this_year
    (select count(*)
       from episode_logs
       where extract(year from coalesce(watched_at, created_at::date))
             = extract(year from current_date))::bigint,

    -- favourite_genres: top 3 genre names across all watched titles
    (
      select coalesce(array_agg(g.name order by g.cnt desc), array[]::text[])
      from (
        select genre->>'name' as name, count(*) as cnt
        from logs l
        join public.titles t on t.id = l.title_id
        cross join lateral jsonb_array_elements(t.genres) as genre
        where jsonb_typeof(t.genres) = 'array'
          and genre->>'name' is not null
        group by genre->>'name'
        order by cnt desc
        limit 3
      ) g
    ),

    -- favourite_directors: top 3 directors from cast_crew->'crew'
    (
      select coalesce(array_agg(d.name order by d.cnt desc), array[]::text[])
      from (
        select member->>'name' as name, count(*) as cnt
        from logs l
        join public.titles t on t.id = l.title_id
        cross join lateral jsonb_array_elements(
          case when jsonb_typeof(t.cast_crew->'crew') = 'array'
               then t.cast_crew->'crew'
               else '[]'::jsonb end
        ) as member
        where member->>'job'  = 'Director'
          and member->>'name' is not null
        group by member->>'name'
        order by cnt desc
        limit 3
      ) d
    )
  -- Privacy gate: only return rows when the caller is allowed to see this user.
  where exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (
        p.profile_public
        or p.id = auth.uid()
        or exists (
          select 1 from public.follows f
          where f.following_id = p.id
            and f.follower_id  = auth.uid()
        )
      )
  );
$$;

grant execute on function public.get_user_stats(uuid) to anon, authenticated;
