-- =============================================================================
-- PictureBox — Initial Schema
-- Film + TV unified social tracker
-- =============================================================================
-- Ordering rules:
--   1. Extensions
--   2. All CREATE TABLE (dependency order)
--   3. All indexes
--   4. Trigger functions (pure first, then ones that reference tables)
--   5. Trigger wiring
--   6. SECURITY DEFINER helpers (must come after the tables they query)
--   7. RLS ENABLE
--   8. RLS policies (call the helpers defined above)
--   9. get_user_stats() RPC (after all tables)
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
create extension if not exists pgcrypto;

-- =============================================================================
-- 2. CREATE TABLES (dependency order)
-- =============================================================================

-- 2.1 profiles ----------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           text not null unique
                       check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  display_name       text,
  bio                text check (char_length(bio) <= 300),
  avatar_url         text,
  country_code       text default 'US' check (char_length(country_code) = 2),
  streaming_services jsonb not null default '[]'::jsonb,
  spoiler_free_mode  boolean not null default false,
  profile_public     boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 2.2 follows -----------------------------------------------------------------
create table public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

-- 2.3 titles (cached TMDB data) -----------------------------------------------
create table public.titles (
  id              uuid primary key default gen_random_uuid(),
  tmdb_id         integer not null,
  media_type      text not null check (media_type in ('movie', 'tv')),
  title           text not null,
  original_title  text,
  overview        text,
  poster_path     text,
  backdrop_path   text,
  release_date    date,
  runtime         integer,
  status          text,
  genres          jsonb not null default '[]'::jsonb,
  cast_crew       jsonb not null default '{}'::jsonb,
  watch_providers jsonb not null default '{}'::jsonb,
  tmdb_rating     numeric(3,1),
  tmdb_vote_count integer default 0,
  tmdb_synced_at  timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (tmdb_id, media_type)
);

-- 2.4 seasons -----------------------------------------------------------------
create table public.seasons (
  id              uuid primary key default gen_random_uuid(),
  title_id        uuid not null references public.titles(id) on delete cascade,
  tmdb_season_id  integer,
  season_number   integer not null,
  name            text,
  overview        text,
  poster_path     text,
  air_date        date,
  episode_count   integer default 0,
  created_at      timestamptz not null default now(),
  unique (title_id, season_number)
);

-- 2.5 episodes ----------------------------------------------------------------
create table public.episodes (
  id               uuid primary key default gen_random_uuid(),
  season_id        uuid not null references public.seasons(id) on delete cascade,
  tmdb_episode_id  integer,
  episode_number   integer not null,
  name             text,
  overview         text,
  still_path       text,
  air_date         date,
  runtime          integer,
  created_at       timestamptz not null default now(),
  unique (season_id, episode_number)
);

-- 2.6 user_logs ---------------------------------------------------------------
create table public.user_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title_id          uuid not null references public.titles(id) on delete cascade,
  season_id         uuid references public.seasons(id) on delete set null,
  episode_id        uuid references public.episodes(id) on delete set null,
  log_type          text not null
                      check (log_type in ('movie', 'tv_show', 'tv_season', 'tv_episode')),
  status            text not null
                      check (status in ('watched', 'watching', 'want_to_watch', 'dropped', 'on_hold')),
  rating            numeric(3,1) check (rating >= 0.5 and rating <= 5.0),
  review            text check (char_length(review) <= 10000),
  contains_spoilers boolean not null default false,
  watched_at        date,
  rewatch           boolean not null default false,
  rewatch_count     integer not null default 0,
  liked             boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (user_id, title_id, season_id, episode_id, rewatch_count)
);

-- 2.7 lists -------------------------------------------------------------------
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  is_public   boolean not null default true,
  is_ranked   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2.8 list_items --------------------------------------------------------------
create table public.list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.lists(id) on delete cascade,
  title_id   uuid not null references public.titles(id) on delete cascade,
  position   integer not null default 0,
  notes      text,
  created_at timestamptz not null default now(),
  unique (list_id, title_id)
);

-- 2.9 group_watchlists --------------------------------------------------------
create table public.group_watchlists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{8}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2.10 group_members ----------------------------------------------------------
create table public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.group_watchlists(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- 2.11 group_items ------------------------------------------------------------
create table public.group_items (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.group_watchlists(id) on delete cascade,
  title_id   uuid not null references public.titles(id) on delete cascade,
  added_by   uuid references public.profiles(id) on delete set null,
  vote_count integer not null default 0,
  watched    boolean not null default false,
  created_at timestamptz not null default now(),
  unique (group_id, title_id)
);

-- 2.12 group_votes ------------------------------------------------------------
create table public.group_votes (
  id            uuid primary key default gen_random_uuid(),
  group_item_id uuid not null references public.group_items(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (group_item_id, user_id)
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================
create index idx_profiles_username        on public.profiles  (username);

create index idx_follows_follower         on public.follows   (follower_id);
create index idx_follows_following        on public.follows   (following_id);

-- The unique(tmdb_id, media_type) constraint already creates an index;
-- this named one makes the TMDB cache lookup explicit and tuneable.
create index idx_titles_tmdb              on public.titles    (tmdb_id, media_type);

create index idx_seasons_title            on public.seasons   (title_id);

create index idx_episodes_season          on public.episodes  (season_id);

create index idx_user_logs_user_created   on public.user_logs (user_id, created_at desc);
create index idx_user_logs_title          on public.user_logs (title_id);
create index idx_user_logs_user_status    on public.user_logs (user_id, status);

create index idx_lists_user               on public.lists     (user_id);

create index idx_list_items_list          on public.list_items (list_id);

create index idx_group_watchlists_creator on public.group_watchlists (created_by);

create index idx_group_members_group      on public.group_members (group_id);
create index idx_group_members_user       on public.group_members (user_id);

create index idx_group_items_group        on public.group_items (group_id);

create index idx_group_votes_item         on public.group_votes (group_item_id);

-- =============================================================================
-- 4. TRIGGER FUNCTIONS
-- =============================================================================

-- 4.1 updated_at maintenance (pure — no table dependencies) -------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4.2 Invite-code character pool (pure — no table dependencies) ---------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars  text    := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text    := '';
  i      integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- 4.3 Auto-generate invite_code before a group_watchlists row is inserted -----
--     (references group_watchlists — must be after that table)
create or replace function public.set_group_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    loop
      new.invite_code := public.generate_invite_code();
      exit when not exists (
        select 1 from public.group_watchlists g
        where g.invite_code = new.invite_code
      );
    end loop;
  end if;
  return new;
end;
$$;

-- 4.4 Auto-create a profile row when auth.users gets a new record -------------
--     (references profiles — must be after that table)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_base     text;
  v_suffix   text;
begin
  -- Prefer a username supplied in signup metadata, sanitised to the allowed
  -- charset. Fall back to a generated "user_xxxxxxxx" handle.
  v_base := regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', ''),
    '[^A-Za-z0-9_]', '', 'g'
  );

  if char_length(v_base) >= 3 then
    v_username := left(v_base, 30);
  else
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  -- Guarantee uniqueness; on collision append a short random suffix.
  if exists (select 1 from public.profiles p where p.username = v_username) then
    v_suffix   := substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    v_username := left(v_username, 23) || '_' || v_suffix;
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    v_username,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  return new;
end;
$$;

-- =============================================================================
-- 5. TRIGGER WIRING
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_user_logs_updated_at
  before update on public.user_logs
  for each row execute function public.set_updated_at();

create trigger trg_lists_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

create trigger trg_group_watchlists_updated_at
  before update on public.group_watchlists
  for each row execute function public.set_updated_at();

create trigger trg_group_watchlists_invite_code
  before insert on public.group_watchlists
  for each row execute function public.set_group_invite_code();

-- =============================================================================
-- 6. SECURITY DEFINER HELPERS
--    Defined AFTER the tables they query so the function body compiles cleanly.
--    SECURITY DEFINER + fixed search_path breaks RLS recursion loops.
-- =============================================================================

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id  = p_user_id
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_watchlists gw
    where gw.id         = p_group_id
      and gw.created_by = p_user_id
  );
$$;

-- =============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.follows          enable row level security;
alter table public.titles           enable row level security;
alter table public.seasons          enable row level security;
alter table public.episodes         enable row level security;
alter table public.user_logs        enable row level security;
alter table public.lists            enable row level security;
alter table public.list_items       enable row level security;
alter table public.group_watchlists enable row level security;
alter table public.group_members    enable row level security;
alter table public.group_items      enable row level security;
alter table public.group_votes      enable row level security;

-- =============================================================================
-- 8. RLS POLICIES
-- =============================================================================

-- profiles --------------------------------------------------------------------
create policy "profiles_select"
  on public.profiles for select
  using (
    profile_public = true
    or id = auth.uid()
    or exists (
      select 1 from public.follows f
      where f.following_id = profiles.id
        and f.follower_id  = auth.uid()
    )
  );

create policy "profiles_insert"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update"
  on public.profiles for update
  using    (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete"
  on public.profiles for delete
  using (id = auth.uid());

-- follows ---------------------------------------------------------------------
create policy "follows_select"
  on public.follows for select
  using (true);

create policy "follows_insert"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "follows_delete"
  on public.follows for delete
  using (follower_id = auth.uid());

-- titles (public read; authenticated users may upsert for TMDB caching) ------
create policy "titles_select"
  on public.titles for select
  using (true);

create policy "titles_insert"
  on public.titles for insert
  to authenticated
  with check (true);

create policy "titles_update"
  on public.titles for update
  to authenticated
  using    (true)
  with check (true);

-- seasons ---------------------------------------------------------------------
create policy "seasons_select"
  on public.seasons for select
  using (true);

create policy "seasons_insert"
  on public.seasons for insert
  to authenticated
  with check (true);

create policy "seasons_update"
  on public.seasons for update
  to authenticated
  using    (true)
  with check (true);

-- episodes --------------------------------------------------------------------
create policy "episodes_select"
  on public.episodes for select
  using (true);

create policy "episodes_insert"
  on public.episodes for insert
  to authenticated
  with check (true);

create policy "episodes_update"
  on public.episodes for update
  to authenticated
  using    (true)
  with check (true);

-- user_logs -------------------------------------------------------------------
create policy "user_logs_select"
  on public.user_logs for select
  using (
    user_id = auth.uid()
    or (
      deleted_at is null
      and exists (
        select 1 from public.profiles p
        where p.id            = user_logs.user_id
          and p.profile_public = true
      )
    )
  );

create policy "user_logs_insert"
  on public.user_logs for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_logs_update"
  on public.user_logs for update
  using    (user_id = auth.uid() and deleted_at is null)
  with check (user_id = auth.uid());

create policy "user_logs_delete"
  on public.user_logs for delete
  using (user_id = auth.uid());

-- lists -----------------------------------------------------------------------
create policy "lists_select"
  on public.lists for select
  using (is_public = true or user_id = auth.uid());

create policy "lists_insert"
  on public.lists for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "lists_update"
  on public.lists for update
  using    (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "lists_delete"
  on public.lists for delete
  using (user_id = auth.uid());

-- list_items (visibility follows the parent list) -----------------------------
create policy "list_items_select"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_items.list_id
        and (l.is_public = true or l.user_id = auth.uid())
    )
  );

create policy "list_items_insert"
  on public.list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.lists l
      where l.id      = list_items.list_id
        and l.user_id = auth.uid()
    )
  );

create policy "list_items_update"
  on public.list_items for update
  using (
    exists (
      select 1 from public.lists l
      where l.id      = list_items.list_id
        and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lists l
      where l.id      = list_items.list_id
        and l.user_id = auth.uid()
    )
  );

create policy "list_items_delete"
  on public.list_items for delete
  using (
    exists (
      select 1 from public.lists l
      where l.id      = list_items.list_id
        and l.user_id = auth.uid()
    )
  );

-- group_watchlists ------------------------------------------------------------
create policy "group_watchlists_select"
  on public.group_watchlists for select
  using (
    created_by = auth.uid()
    or public.is_group_member(id, auth.uid())
  );

create policy "group_watchlists_insert"
  on public.group_watchlists for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "group_watchlists_update"
  on public.group_watchlists for update
  using    (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "group_watchlists_delete"
  on public.group_watchlists for delete
  using (created_by = auth.uid());

-- group_members ---------------------------------------------------------------
create policy "group_members_select"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
    or public.is_group_owner(group_id, auth.uid())
  );

-- Users may add themselves (join via invite code); owners may add others.
create policy "group_members_insert"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.is_group_owner(group_id, auth.uid())
  );

-- Members leave by deleting their own row; owners can remove anyone.
create policy "group_members_delete"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or public.is_group_owner(group_id, auth.uid())
  );

-- Only the group owner may change roles.
create policy "group_members_update"
  on public.group_members for update
  using    (public.is_group_owner(group_id, auth.uid()))
  with check (public.is_group_owner(group_id, auth.uid()));

-- group_items -----------------------------------------------------------------
create policy "group_items_select"
  on public.group_items for select
  using (public.is_group_member(group_id, auth.uid()));

create policy "group_items_insert"
  on public.group_items for insert
  to authenticated
  with check (public.is_group_member(group_id, auth.uid()));

create policy "group_items_update"
  on public.group_items for update
  using    (public.is_group_member(group_id, auth.uid()))
  with check (public.is_group_member(group_id, auth.uid()));

create policy "group_items_delete"
  on public.group_items for delete
  using (
    added_by = auth.uid()
    or public.is_group_owner(group_id, auth.uid())
  );

-- group_votes -----------------------------------------------------------------
create policy "group_votes_select"
  on public.group_votes for select
  using (
    exists (
      select 1 from public.group_items gi
      where gi.id = group_votes.group_item_id
        and public.is_group_member(gi.group_id, auth.uid())
    )
  );

create policy "group_votes_insert"
  on public.group_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.group_items gi
      where gi.id = group_votes.group_item_id
        and public.is_group_member(gi.group_id, auth.uid())
    )
  );

create policy "group_votes_delete"
  on public.group_votes for delete
  using (user_id = auth.uid());

-- =============================================================================
-- 9. RPC: get_user_stats(p_user_id uuid)
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
      and status    = 'watched'
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
    );
$$;

grant execute on function public.get_user_stats(uuid) to anon, authenticated;
