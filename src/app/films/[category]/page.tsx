import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getGenres } from '@/lib/tmdb/client'
import {
  fetchCategoryResults,
  filmCategories,
  findCategory,
  toPosterItems,
} from '@/lib/tmdb/browse'
import CategoryView from '@/components/browse/CategoryView'

interface PageProps {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return filmCategories.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const cat = findCategory('film', category)
  if (!cat) return { title: 'Films' }
  return {
    title: `${cat.title} — Films`,
    description: `${cat.title} films on PictureBox.`,
  }
}

export default async function FilmCategoryPage({ params }: PageProps) {
  const { category } = await params
  const cat = findCategory('film', category)
  if (!cat) notFound()

  const [genres, results] = await Promise.all([
    getGenres(),
    fetchCategoryResults(cat),
  ])

  const genreMap = new Map(genres.map((g) => [g.id, g.name]))
  const items = toPosterItems(results, genreMap)

  return (
    <CategoryView
      kicker="The Index · Cinema"
      title={cat.title}
      items={items}
      linkPrefix="/film"
      backHref="/films"
      backLabel="All Films"
    />
  )
}
