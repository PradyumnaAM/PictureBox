import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { MediaType, TMDBMovie, TMDBTVShow } from '@/types/tmdb'

// Mirrors the public.titles table row shape.
// Replace with the generated Database type once `supabase gen types` is run.
export interface TitleRow {
  id: string
  tmdb_id: number
  media_type: MediaType
  title: string
  original_title: string | null
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  release_date: string | null
  runtime: number | null
  status: string | null
  genres: unknown
  cast_crew: unknown
  watch_providers: unknown
  tmdb_rating: number | null
  tmdb_vote_count: number
  tmdb_synced_at: string
  created_at: string
}

// ----------------------------------------------------------------------------
// Normalisers
// ----------------------------------------------------------------------------

function normaliseMovie(data: TMDBMovie): Omit<TitleRow, 'id' | 'created_at'> {
  return {
    tmdb_id: data.id,
    media_type: 'movie',
    title: data.title,
    original_title: data.original_title ?? null,
    overview: data.overview ?? null,
    poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null,
    release_date: data.release_date || null,
    runtime: data.runtime ?? null,
    status: data.status ?? null,
    genres: data.genres ?? [],
    cast_crew: {
      cast: data.credits?.cast ?? [],
      crew: data.credits?.crew ?? [],
    },
    watch_providers: data['watch/providers']?.results ?? {},
    tmdb_rating: data.vote_average != null ? Math.round(data.vote_average * 10) / 10 : null,
    tmdb_vote_count: data.vote_count ?? 0,
    tmdb_synced_at: new Date().toISOString(),
  }
}

function normaliseTVShow(data: TMDBTVShow): Omit<TitleRow, 'id' | 'created_at'> {
  // Use the first listed episode runtime; 0 when the array is empty.
  const runtime = data.episode_run_time?.[0] ?? null

  return {
    tmdb_id: data.id,
    media_type: 'tv',
    title: data.name,
    original_title: data.original_name ?? null,
    overview: data.overview ?? null,
    poster_path: data.poster_path ?? null,
    backdrop_path: data.backdrop_path ?? null,
    release_date: data.first_air_date || null,
    runtime,
    status: data.status ?? null,
    genres: data.genres ?? [],
    cast_crew: {
      cast: data.credits?.cast ?? [],
      crew: data.credits?.crew ?? [],
    },
    watch_providers: data['watch/providers']?.results ?? {},
    tmdb_rating: data.vote_average != null ? Math.round(data.vote_average * 10) / 10 : null,
    tmdb_vote_count: data.vote_count ?? 0,
    tmdb_synced_at: new Date().toISOString(),
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * Upsert TMDB detail data into the titles cache table.
 *
 * Uses the service-role admin client so it bypasses RLS — this is intentional;
 * caching is a trusted server-side operation, not a user-initiated write.
 *
 * The admin client is typed against the placeholder Database type, so we cast
 * through `unknown` here. Remove the cast once supabase gen types is run and
 * Database is updated with real table definitions.
 */
export async function upsertTitle(
  tmdbData: TMDBMovie | TMDBTVShow,
  mediaType: MediaType,
): Promise<TitleRow> {
  const row =
    mediaType === 'movie'
      ? normaliseMovie(tmdbData as TMDBMovie)
      : normaliseTVShow(tmdbData as TMDBTVShow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const { data, error } = await db
    .from('titles')
    .upsert(row, { onConflict: 'tmdb_id,media_type' })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to upsert title tmdb_id=${row.tmdb_id}: ${error.message}`)
  }

  return data as TitleRow
}

/**
 * Fetch a cached title row without hitting TMDB.
 * Returns null when the title isn't in the cache yet.
 */
export async function getCachedTitle(
  tmdbId: number,
  mediaType: MediaType,
): Promise<TitleRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const { data, error } = await db
    .from('titles')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch cached title tmdb_id=${tmdbId}: ${error.message}`)
  }

  return (data as TitleRow | null) ?? null
}

/**
 * Convenience: return a cached title or fetch + upsert from TMDB if stale/missing.
 * staleSecs defaults to 24 h.
 */
export async function getOrFetchTitle(
  tmdbId: number,
  mediaType: MediaType,
  fetchFn: () => Promise<TMDBMovie | TMDBTVShow>,
  staleSecs = 86400,
): Promise<TitleRow> {
  const cached = await getCachedTitle(tmdbId, mediaType)

  if (cached) {
    const syncedAt = new Date(cached.tmdb_synced_at).getTime()
    const ageSeconds = (Date.now() - syncedAt) / 1000
    if (ageSeconds < staleSecs) return cached
  }

  const fresh = await fetchFn()
  return upsertTitle(fresh, mediaType)
}
