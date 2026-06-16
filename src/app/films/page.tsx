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
      <header className="pt-32 pb-14 px-4 md:px-16 max-w-page mx-auto">
        <p className="flex items-center gap-3 font-label text-label uppercase text-ember mb-4">
          <span aria-hidden className="w-6 h-px bg-ember/50" />
          The Index · Cinema
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-cream leading-none">
          Films
        </h1>
        <p className="text-on-surface-variant text-lg mt-5 max-w-md">
          Every film, <em className="font-display text-cream">every story</em> — trending,
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
