import { getGenres, getMoviesByGenre, getPopularMovies, getTrending } from '@/lib/tmdb/client'
import PosterRow, { type PosterItem } from '@/components/home/PosterRow'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Films',
  description: 'Browse and discover every film ever made.',
}

export default async function FilmsPage() {
  const [trendingFilms, popularFilms, genres] = await Promise.all([
    getTrending('movie', 'week'),
    getPopularMovies(),
    getGenres(),
  ])

  const genreMap = new Map(genres.map((g) => [g.id, g.name]))

  const toItems = (results: {
    id: number
    title?: string
    name?: string
    poster_path: string | null
    release_date?: string
    vote_average?: number
    genre_ids?: number[]
  }[]): PosterItem[] =>
    results.map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? '',
      poster_path: item.poster_path ?? null,
      release_date: item.release_date ?? '',
      vote_average: item.vote_average ?? 0,
      genre_names: (item.genre_ids ?? [])
        .map((id) => genreMap.get(id))
        .filter((n): n is string => Boolean(n))
        .slice(0, 2),
    }))

  const [action, drama, comedy, thriller] = await Promise.all([
    getMoviesByGenre(28),
    getMoviesByGenre(18),
    getMoviesByGenre(35),
    getMoviesByGenre(53),
  ])

  const rows = [
    { title: 'Trending This Week',  items: toItems(trendingFilms.slice(0, 20)) },
    { title: 'Popular Right Now',   items: toItems(popularFilms.results.slice(0, 20)) },
    { title: 'Action',              items: toItems(action.results.slice(0, 20)) },
    { title: 'Drama',               items: toItems(drama.results.slice(0, 20)) },
    { title: 'Comedy',              items: toItems(comedy.results.slice(0, 20)) },
    { title: 'Thriller',            items: toItems(thriller.results.slice(0, 20)) },
  ]

  return (
    <div className="bg-background min-h-screen">
      <div className="pt-28 pb-8 px-4 md:px-16 max-w-7xl mx-auto">
        <h1 className="font-display text-4xl text-on-surface">Films</h1>
        <p className="text-on-surface-variant mt-2 mb-8">Every film. Every story.</p>
      </div>

      <div className="space-y-12 pb-16">
        {rows.map(({ title, items }) => (
          <section key={title}>
            <PosterRow
              title={title}
              items={items}
              href="/films"
              linkPrefix="/film"
            />
          </section>
        ))}
      </div>

      <Footer />
    </div>
  )
}
