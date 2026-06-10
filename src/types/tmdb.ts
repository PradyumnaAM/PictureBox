// ============================================================================
// TMDB API types
// ============================================================================

export type MediaType = 'movie' | 'tv'

// ----------------------------------------------------------------------------
// Shared building blocks
// ----------------------------------------------------------------------------

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
  credit_id: string
}

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
  credit_id: string
}

export interface TMDBCredits {
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
}

export interface TMDBVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBWatchProviderEntry {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

export interface TMDBWatchProviderRegion {
  link: string
  flatrate?: TMDBWatchProviderEntry[]
  rent?: TMDBWatchProviderEntry[]
  buy?: TMDBWatchProviderEntry[]
  free?: TMDBWatchProviderEntry[]
}

// ----------------------------------------------------------------------------
// Search
// ----------------------------------------------------------------------------

export interface TMDBSearchResult {
  id: number
  media_type?: MediaType | 'person'
  // movie fields
  title?: string
  original_title?: string
  release_date?: string
  // tv fields
  name?: string
  original_name?: string
  first_air_date?: string
  // shared
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  popularity?: number
  adult?: boolean
}

// ----------------------------------------------------------------------------
// Movie detail  (/movie/{id}?append_to_response=credits,videos,watch/providers,similar)
// ----------------------------------------------------------------------------

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  runtime: number
  status: string
  genres: TMDBGenre[]
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  budget: number
  revenue: number
  tagline: string
  homepage: string
  imdb_id: string | null
  production_companies: Array<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }>
  spoken_languages: Array<{ iso_639_1: string; name: string }>
  origin_country: string[]
  // appended responses
  credits?: TMDBCredits
  videos?: { results: TMDBVideo[] }
  'watch/providers'?: { results: Record<string, TMDBWatchProviderRegion> }
  similar?: { results: TMDBSearchResult[] }
}

// ----------------------------------------------------------------------------
// TV show detail  (/tv/{id}?append_to_response=credits,videos,watch/providers,similar,seasons)
// ----------------------------------------------------------------------------

export interface TMDBSeasonSummary {
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  air_date: string | null
  episode_count: number
}

export interface TMDBTVShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  last_air_date: string
  status: string
  number_of_seasons: number
  number_of_episodes: number
  episode_run_time: number[]
  genres: TMDBGenre[]
  vote_average: number
  vote_count: number
  popularity: number
  homepage: string
  tagline: string
  type: string
  in_production: boolean
  created_by?: Array<{
    id: number
    name: string
    gender?: number
    profile_path: string | null
  }>
  networks: Array<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }>
  production_companies: Array<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }>
  spoken_languages: Array<{ iso_639_1: string; name: string }>
  origin_country: string[]
  // appended responses
  seasons?: TMDBSeasonSummary[]
  credits?: TMDBCredits
  videos?: { results: TMDBVideo[] }
  'watch/providers'?: { results: Record<string, TMDBWatchProviderRegion> }
  similar?: { results: TMDBSearchResult[] }
}

// ----------------------------------------------------------------------------
// Season detail  (/tv/{id}/season/{n})
// ----------------------------------------------------------------------------

export interface TMDBEpisode {
  id: number
  name: string
  overview: string
  still_path: string | null
  episode_number: number
  season_number: number
  air_date: string | null
  runtime: number | null
  vote_average: number
  vote_count: number
  crew?: TMDBCrewMember[]
  guest_stars?: TMDBCastMember[]
}

export interface TMDBSeason {
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  air_date: string | null
  episodes: TMDBEpisode[]
}

// ----------------------------------------------------------------------------
// Paginated list wrapper  (returned by /discover, /trending, /popular, etc.)
// ----------------------------------------------------------------------------

export interface TMDBPagedResult<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}
