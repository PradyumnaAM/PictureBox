import type {
  TMDBEpisode,
  TMDBMovie,
  TMDBPagedResult,
  TMDBSearchResult,
  TMDBSeason,
  TMDBTVShow,
} from '@/types/tmdb'

const BASE_URL = 'https://api.themoviedb.org/3'

function authHeader(): HeadersInit {
  const token = process.env.TMDB_READ_ACCESS_TOKEN
  if (!token) throw new Error('TMDB_READ_ACCESS_TOKEN is not set')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
  fetchOptions: RequestInit = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    headers: authHeader(),
    ...fetchOptions,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `TMDB ${res.status} ${res.statusText} — ${path}${body ? `: ${body}` : ''}`,
    )
  }

  return res.json() as Promise<T>
}

// ----------------------------------------------------------------------------
// 1. Multi-search (always fresh — user is actively typing a query)
// ----------------------------------------------------------------------------
export async function searchMulti(
  query: string,
  page = 1,
): Promise<TMDBSearchResult[]> {
  const data = await tmdbFetch<TMDBPagedResult<TMDBSearchResult>>(
    '/search/multi',
    { query, page, include_adult: false },
    { cache: 'no-store' },
  )
  return data.results
}

// ----------------------------------------------------------------------------
// 2. Movie detail
// ----------------------------------------------------------------------------
export async function getMovie(id: number): Promise<TMDBMovie> {
  return tmdbFetch<TMDBMovie>(
    `/movie/${id}`,
    { append_to_response: 'credits,videos,watch/providers,similar' },
    { next: { revalidate: 86400 } },
  )
}

// ----------------------------------------------------------------------------
// 3. TV show detail
// ----------------------------------------------------------------------------
export async function getTVShow(id: number): Promise<TMDBTVShow> {
  return tmdbFetch<TMDBTVShow>(
    `/tv/${id}`,
    { append_to_response: 'credits,videos,watch/providers,similar,seasons' },
    { next: { revalidate: 86400 } },
  )
}

// ----------------------------------------------------------------------------
// 4. TV season
// ----------------------------------------------------------------------------
export async function getTVSeason(
  showId: number,
  seasonNumber: number,
): Promise<TMDBSeason> {
  return tmdbFetch<TMDBSeason>(
    `/tv/${showId}/season/${seasonNumber}`,
    {},
    { next: { revalidate: 43200 } },
  )
}

// ----------------------------------------------------------------------------
// 5. TV episode
// ----------------------------------------------------------------------------
export async function getTVEpisode(
  showId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<TMDBEpisode> {
  return tmdbFetch<TMDBEpisode>(
    `/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
    {},
    { next: { revalidate: 43200 } },
  )
}

// ----------------------------------------------------------------------------
// 6. Trending
// ----------------------------------------------------------------------------
export async function getTrending(
  type: 'movie' | 'tv' | 'all',
  window: 'day' | 'week',
): Promise<TMDBSearchResult[]> {
  const data = await tmdbFetch<TMDBPagedResult<TMDBSearchResult>>(
    `/trending/${type}/${window}`,
    {},
    { next: { revalidate: 3600 } },
  )
  return data.results
}

// ----------------------------------------------------------------------------
// 7. Popular movies
// ----------------------------------------------------------------------------
export async function getPopularMovies(page = 1): Promise<TMDBPagedResult<TMDBSearchResult>> {
  return tmdbFetch<TMDBPagedResult<TMDBSearchResult>>(
    '/movie/popular',
    { page },
    { next: { revalidate: 3600 } },
  )
}

// ----------------------------------------------------------------------------
// 8. Popular TV
// ----------------------------------------------------------------------------
export async function getPopularTV(page = 1): Promise<TMDBPagedResult<TMDBSearchResult>> {
  return tmdbFetch<TMDBPagedResult<TMDBSearchResult>>(
    '/tv/popular',
    { page },
    { next: { revalidate: 3600 } },
  )
}

// ----------------------------------------------------------------------------
// 9. Movies by genre
// ----------------------------------------------------------------------------
export async function getMoviesByGenre(
  genreId: number,
  page = 1,
): Promise<TMDBPagedResult<TMDBSearchResult>> {
  return tmdbFetch<TMDBPagedResult<TMDBSearchResult>>(
    '/discover/movie',
    { with_genres: genreId, sort_by: 'popularity.desc', page },
    { next: { revalidate: 3600 } },
  )
}

// ----------------------------------------------------------------------------
// 10. TV by genre
// ----------------------------------------------------------------------------
export async function getTVByGenre(
  genreId: number,
  page = 1,
): Promise<TMDBPagedResult<TMDBSearchResult>> {
  return tmdbFetch<TMDBPagedResult<TMDBSearchResult>>(
    '/discover/tv',
    { with_genres: genreId, sort_by: 'popularity.desc', page },
    { next: { revalidate: 3600 } },
  )
}

// ----------------------------------------------------------------------------
// 11. Genres (movie + TV lists, deduped by name)
// ----------------------------------------------------------------------------
export async function getGenres(): Promise<Array<{ id: number; name: string }>> {
  const fetchOpts: RequestInit = { next: { revalidate: 604800 } }

  const [movieRes, tvRes] = await Promise.all([
    tmdbFetch<{ genres: Array<{ id: number; name: string }> }>(
      '/genre/movie/list',
      {},
      fetchOpts,
    ),
    tmdbFetch<{ genres: Array<{ id: number; name: string }> }>(
      '/genre/tv/list',
      {},
      fetchOpts,
    ),
  ])

  // Dedupe by name; prefer the movie genre id on collision (IDs differ across lists).
  const seen = new Map<string, { id: number; name: string }>()
  for (const genre of [...movieRes.genres, ...tvRes.genres]) {
    if (!seen.has(genre.name)) seen.set(genre.name, genre)
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
}
