import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { MediaType, TMDBMovie, TMDBTVShow } from '@/types/tmdb'
import type { Json } from '@/types/supabase'

// Note: the TMDB detail fetch is injected by callers (e.g. /api/logs passes
// getMovie / getTVShow) so this cache module stays decoupled from the client.

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
  genres: Json
  cast_crew: Json
  watch_providers: Json
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
    genres: (data.genres ?? []) as unknown as Json,
    cast_crew: ({
      cast: data.credits?.cast ?? [],
      crew: data.credits?.crew ?? [],
    }) as unknown as Json,
    watch_providers: (data['watch/providers']?.results ?? {}) as unknown as Json,
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
    genres: (data.genres ?? []) as unknown as Json,
    cast_crew: ({
      cast: data.credits?.cast ?? [],
      crew: data.credits?.crew ?? [],
    }) as unknown as Json,
    watch_providers: (data['watch/providers']?.results ?? {}) as unknown as Json,
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

  const db = createAdminClient()

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
  const db = createAdminClient()

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

// ----------------------------------------------------------------------------
// Logging-time cache
// ----------------------------------------------------------------------------

/**
 * True when a cached title row is missing the rich fields that stats depend on
 * (runtime, genres, cast_crew with a crew array). Such rows were typically
 * written by an early "minimal" log path and need a refresh from TMDB.
 */
function isTitleMissingRichData(row: TitleRow): boolean {
  const genres = row.genres as unknown[] | null | undefined
  const castCrew = row.cast_crew as { crew?: unknown[] } | null | undefined

  const hasRuntime = row.runtime != null
  const hasGenres = Array.isArray(genres) && genres.length > 0
  const hasCrew = Array.isArray(castCrew?.crew) && castCrew!.crew!.length > 0

  return !hasRuntime || !hasGenres || !hasCrew
}

/**
 * Ensure a title is cached with the FULL set of fields that stats rely on:
 * runtime, genres (jsonb array) and cast_crew (jsonb with a `crew` array that
 * includes Director jobs), alongside poster/title/release_date/overview.
 *
 * This is the function the /api/logs route should use instead of writing a
 * minimal title row. It fetches the full TMDB detail (credits included) and
 * upserts it via `upsertTitle`, so every freshly-logged title is immediately
 * usable for total-hours / favourite-genre / favourite-director stats.
 *
 * Behaviour:
 *  - If a fresh, complete row is already cached, it is returned as-is (no fetch).
 *  - If the row exists but is missing runtime/genres/cast_crew, it is refreshed.
 *  - If TMDB is unreachable, we fall back to whatever is already cached (or, if
 *    nothing is cached, to a minimal upsert from `fallback`) so logging never
 *    fails just because the detail fetch did. We never overwrite an existing
 *    non-empty row with a blank one.
 *
 * `fetchDetail` is injected so this module stays decoupled from the TMDB
 * client; pass `getMovie` / `getTVShow` from '@/lib/tmdb/client'.
 */
export async function cacheTitleOnLog(opts: {
  tmdbId: number
  mediaType: MediaType
  fetchDetail: (id: number) => Promise<TMDBMovie | TMDBTVShow>
  fallback?: {
    title?: string | null
    poster_path?: string | null
    release_date?: string | null
    overview?: string | null
  }
}): Promise<TitleRow> {
  const { tmdbId, mediaType, fetchDetail, fallback } = opts

  const cached = await getCachedTitle(tmdbId, mediaType)

  // A cached row with all the rich fields is good enough — reuse it.
  if (cached && !isTitleMissingRichData(cached)) {
    return cached
  }

  // Otherwise fetch full details from TMDB and upsert the complete row.
  try {
    const fresh = await fetchDetail(tmdbId)
    return await upsertTitle(fresh, mediaType)
  } catch (err) {
    console.error(
      `[cache] cacheTitleOnLog: TMDB detail fetch failed for tmdb_id=${tmdbId} (${mediaType}):`,
      err instanceof Error ? err.message : err,
    )

    // Detail fetch failed. Never destroy good data: if we already have a row,
    // keep it. Only as a last resort write a minimal row from the fallback so
    // the log can reference a title at all.
    if (cached) return cached

    const db = createAdminClient()
    const { data, error } = await db
      .from('titles')
      .upsert(
        {
          tmdb_id: tmdbId,
          media_type: mediaType,
          title: fallback?.title ?? '',
          poster_path: fallback?.poster_path ?? null,
          release_date: fallback?.release_date || null,
          overview: fallback?.overview ?? null,
        },
        { onConflict: 'tmdb_id,media_type' },
      )
      .select()
      .single()

    if (error) {
      throw new Error(
        `Failed to upsert fallback title tmdb_id=${tmdbId}: ${error.message}`,
      )
    }

    return data as TitleRow
  }
}
