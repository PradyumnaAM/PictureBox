import {
  getMoviesByGenre,
  getPopularMovies,
  getPopularTV,
  getTVByGenre,
  getTrending,
} from './client'
import type { PosterItem } from '@/components/home/PosterCard'
import type { TMDBSearchResult } from '@/types/tmdb'

// ----------------------------------------------------------------------------
// Browse categories — the single source of truth shared by:
//   • the /films and /tv index pages (one row per category, "See All" link)
//   • the /films/[category] and /tv/[category] full-grid pages
// The `slug` becomes the URL segment, e.g. /films/trending-this-week
// ----------------------------------------------------------------------------

export interface BrowseCategory {
  slug: string
  title: string
  /** Fetch one page (TMDB returns ~20 results per page) of this category. */
  fetch: (page: number) => Promise<TMDBSearchResult[]>
}

// How many pages the full-grid category pages pull in (20 results/page).
export const CATEGORY_PAGES = 5

export const filmCategories: BrowseCategory[] = [
  {
    slug: 'trending-this-week',
    title: 'Trending This Week',
    fetch: (page) => getTrending('movie', 'week', page),
  },
  {
    slug: 'popular-right-now',
    title: 'Popular Right Now',
    fetch: (page) => getPopularMovies(page).then((r) => r.results),
  },
  { slug: 'action', title: 'Action', fetch: (page) => getMoviesByGenre(28, page).then((r) => r.results) },
  { slug: 'drama', title: 'Drama', fetch: (page) => getMoviesByGenre(18, page).then((r) => r.results) },
  { slug: 'comedy', title: 'Comedy', fetch: (page) => getMoviesByGenre(35, page).then((r) => r.results) },
  { slug: 'thriller', title: 'Thriller', fetch: (page) => getMoviesByGenre(53, page).then((r) => r.results) },
]

export const tvCategories: BrowseCategory[] = [
  {
    slug: 'trending-this-week',
    title: 'Trending This Week',
    fetch: (page) => getTrending('tv', 'week', page),
  },
  {
    slug: 'popular-shows',
    title: 'Popular Shows',
    fetch: (page) => getPopularTV(page).then((r) => r.results),
  },
  { slug: 'drama', title: 'Drama', fetch: (page) => getTVByGenre(18, page).then((r) => r.results) },
  { slug: 'crime', title: 'Crime', fetch: (page) => getTVByGenre(80, page).then((r) => r.results) },
  { slug: 'comedy', title: 'Comedy', fetch: (page) => getTVByGenre(35, page).then((r) => r.results) },
  { slug: 'sci-fi-fantasy', title: 'Sci-Fi & Fantasy', fetch: (page) => getTVByGenre(10765, page).then((r) => r.results) },
]

export function findCategory(
  kind: 'film' | 'tv',
  slug: string,
): BrowseCategory | undefined {
  const list = kind === 'film' ? filmCategories : tvCategories
  return list.find((c) => c.slug === slug)
}

// ----------------------------------------------------------------------------
// Result → PosterItem mapping (handles both movie and TV result shapes)
// ----------------------------------------------------------------------------

export function toPosterItems(
  results: TMDBSearchResult[],
  genreMap: Map<number, string>,
): PosterItem[] {
  return results.map((item) => ({
    id: item.id,
    title: item.title ?? item.name ?? '',
    poster_path: item.poster_path ?? null,
    // movies use release_date, TV uses first_air_date
    release_date: item.release_date ?? item.first_air_date ?? '',
    vote_average: item.vote_average ?? 0,
    genre_names: (item.genre_ids ?? [])
      .map((id) => genreMap.get(id))
      .filter((n): n is string => Boolean(n))
      .slice(0, 2),
  }))
}

// Fetch CATEGORY_PAGES worth of results and de-duplicate by id (trending pages
// can overlap, and the same title may appear across pages).
export async function fetchCategoryResults(
  category: BrowseCategory,
  pages = CATEGORY_PAGES,
): Promise<TMDBSearchResult[]> {
  const batches = await Promise.all(
    Array.from({ length: pages }, (_, i) => category.fetch(i + 1)),
  )
  const seen = new Set<number>()
  const merged: TMDBSearchResult[] = []
  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push(item)
    }
  }
  return merged
}
