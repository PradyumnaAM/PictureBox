import { getGenres, getMovie, getPopularMovies, getTrending } from '@/lib/tmdb/client'

import HeroCarousel from '@/components/home/HeroCarousel'
import PosterRow, { type PosterItem } from '@/components/home/PosterRow'
import WhySection from '@/components/home/WhySection'
import Footer from '@/components/layout/Footer'

export default async function HomePage() {
  // Four independent fetches in parallel
  const [trendingMovies, popularMoviesData, trendingTV, allGenres] = await Promise.all([
    getTrending('movie', 'day'),
    getPopularMovies(),
    getTrending('tv', 'week'),
    getGenres(),
  ])

  const genreMap = new Map(allGenres.map((g) => [g.id, g.name]))

  // Hero carousel: full movie details for the top 5 trending films
  const heroFilms = await Promise.all(
    trendingMovies.slice(0, 5).map((f) => getMovie(f.id)),
  )

  // Transform search results into PosterItem shape (genre IDs → names)
  const toItems = (results: typeof trendingMovies): PosterItem[] =>
    results.map((r) => ({
      id: r.id,
      title: r.title ?? r.name ?? '',
      poster_path: r.poster_path,
      release_date: r.release_date ?? r.first_air_date ?? '',
      vote_average: r.vote_average ?? 0,
      genre_names: (r.genre_ids ?? [])
        .slice(0, 2)
        .map((id) => genreMap.get(id) ?? '')
        .filter(Boolean),
    }))

  const theaterItems = toItems(popularMoviesData.results.slice(0, 16))
  const tvItems = toItems(trendingTV.slice(0, 16))

  return (
    <>
      <HeroCarousel films={heroFilms} />

      <section className="py-12 md:py-16">
        <PosterRow
          title="In Theaters"
          items={theaterItems}
          href="/films"
          linkPrefix="/film"
        />
      </section>

      <section className="py-12 md:py-16 bg-surface-container-lowest/60">
        <PosterRow
          title="Trending TV"
          items={tvItems}
          href="/tv"
          linkPrefix="/tv"
        />
      </section>

      <WhySection />
      <Footer />
    </>
  )
}
