import type { Metadata } from 'next'

import { getGenres, getMovie, getPopularMovies, getTrending } from '@/lib/tmdb/client'
import { createClient } from '@/lib/supabase/server'

import HeroCarousel from '@/components/home/HeroCarousel'
import PosterRow, { type PosterItem } from '@/components/home/PosterRow'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'PictureBox',
  description:
    'The watch diary built for 2026. Log films in five seconds, track TV down to the episode, and find your next watch through friends — not algorithms. Free forever.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [trendingMovies, popularMoviesData, trendingTV, allGenres] = await Promise.all([
    getTrending('movie', 'day'),
    getPopularMovies(),
    getTrending('tv', 'week'),
    getGenres(),
  ])

  const genreMap = new Map(allGenres.map((g) => [g.id, g.name]))

  const heroFilms = await Promise.all(
    trendingMovies.slice(0, 5).map((f) => getMovie(f.id)),
  )

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
        <PosterRow title="In Theaters" items={theaterItems} href={user ? '/films' : '/sign-in'} linkPrefix="/film" />
      </section>

      <section className="py-12 md:py-16 bg-surface-container-lowest/60">
        <PosterRow title="Trending TV" items={tvItems} href={user ? '/tv' : '/sign-in'} linkPrefix="/tv" />
      </section>

      <Footer />
    </>
  )
}
