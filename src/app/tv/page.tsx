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
      <header className="mx-auto max-w-page px-page-x-mobile pb-12 pt-32 md:px-page-x">
        <p className="mb-4 flex items-center gap-3 font-label text-label uppercase text-ember">
          <span aria-hidden className="h-px w-8 bg-ember/40" />
          The Index · Television
        </p>
        <h1 className="text-iris-gradient font-display text-6xl font-semibold leading-[0.95] tracking-tight md:text-8xl">
          TV Shows
        </h1>
        <p className="mt-5 max-w-md text-lg text-on-surface-variant">
          Every season, <em className="italic text-cream">every episode</em> — tracked
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
