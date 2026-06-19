import { getGenres } from '@/lib/tmdb/client'
import { filmCategories, toPosterItems } from '@/lib/tmdb/browse'
import PosterRow from '@/components/home/PosterRow'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Films',
  description: 'Browse and discover every film ever made.',
}

export default async function FilmsPage() {
  const [genres, ...firstPages] = await Promise.all([
    getGenres(),
    ...filmCategories.map((c) => c.fetch(1)),
  ])

  const genreMap = new Map(genres.map((g) => [g.id, g.name]))

  const rows = filmCategories.map((c, i) => ({
    title: c.title,
    slug: c.slug,
    items: toPosterItems(firstPages[i].slice(0, 20), genreMap),
  }))

  return (
    <div className="bg-background min-h-screen">
      <header className="mx-auto max-w-page px-page-x-mobile pb-12 pt-32 md:px-page-x">
        <p className="mb-4 flex items-center gap-3 font-label text-label uppercase text-ember">
          <span aria-hidden className="h-px w-8 bg-ember/40" />
          The Index · Cinema
        </p>
        <h1 className="text-iris-gradient font-display text-6xl font-semibold leading-[0.95] tracking-tight md:text-8xl">
          Films
        </h1>
        <p className="mt-5 max-w-md text-lg text-on-surface-variant">
          Every film, <em className="italic text-cream">every story</em> — trending,
          popular, and sorted by obsession.
        </p>
      </header>

      <div className="space-y-14 pb-20">
        {rows.map(({ title, slug, items }) => (
          <section key={slug}>
            <PosterRow
              title={title}
              items={items}
              href={`/films/${slug}`}
              linkPrefix="/film"
            />
          </section>
        ))}
      </div>

      <Footer />
    </div>
  )
}
