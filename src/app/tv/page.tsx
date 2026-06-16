import { getGenres } from '@/lib/tmdb/client'
import { toPosterItems, tvCategories } from '@/lib/tmdb/browse'
import PosterRow from '@/components/home/PosterRow'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'TV Shows',
  description: 'Track every season, every episode.',
}

export default async function TVPage() {
  const [genres, ...firstPages] = await Promise.all([
    getGenres(),
    ...tvCategories.map((c) => c.fetch(1)),
  ])

  const genreMap = new Map(genres.map((g) => [g.id, g.name]))

  const rows = tvCategories.map((c, i) => ({
    title: c.title,
    slug: c.slug,
    items: toPosterItems(firstPages[i].slice(0, 20), genreMap),
  }))

  return (
    <div className="bg-background min-h-screen">
      <header className="pt-32 pb-14 px-4 md:px-16 max-w-page mx-auto">
        <p className="flex items-center gap-3 font-label text-label uppercase text-ember mb-4">
          <span aria-hidden className="w-6 h-px bg-ember/50" />
          The Index · Television
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-cream leading-none">
          TV Shows
        </h1>
        <p className="text-on-surface-variant text-lg mt-5 max-w-md">
          Every season, <em className="font-display text-cream">every episode</em> — tracked
          down to the credits.
        </p>
      </header>

      <div className="space-y-14 pb-20">
        {rows.map(({ title, slug, items }) => (
          <section key={slug}>
            <PosterRow
              title={title}
              items={items}
              href={`/tv/${slug}`}
              linkPrefix="/tv"
            />
          </section>
        ))}
      </div>

      <Footer />
    </div>
  )
}
