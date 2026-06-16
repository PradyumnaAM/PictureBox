import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import PosterCard, { type PosterItem } from '@/components/home/PosterCard'
import Footer from '@/components/layout/Footer'

interface CategoryViewProps {
  /** Small uppercase eyebrow, e.g. "The Index · Cinema" */
  kicker: string
  /** Category title, e.g. "Trending This Week" */
  title: string
  /** All items to lay out in the grid */
  items: PosterItem[]
  /** URL prefix for each card link, e.g. "/film" or "/tv" */
  linkPrefix: string
  /** Where the back link points, e.g. "/films" or "/tv" */
  backHref: string
  /** Label for the back link, e.g. "All Films" */
  backLabel: string
}

export default function CategoryView({
  kicker,
  title,
  items,
  linkPrefix,
  backHref,
  backLabel,
}: CategoryViewProps) {
  return (
    <div className="bg-background min-h-screen">
      <header className="pt-32 pb-12 px-4 md:px-16 max-w-page mx-auto">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 font-label text-label uppercase text-on-surface-variant hover:text-ember transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>

        <p className="flex items-center gap-3 font-label text-label uppercase text-ember mb-4">
          <span aria-hidden className="w-6 h-px bg-ember/50" />
          {kicker}
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-cream leading-none">
          {title}
        </h1>
        <p className="text-on-surface-variant text-lg mt-5 font-mono">
          {String(items.length).padStart(2, '0')} titles
        </p>
      </header>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 px-4 md:px-16 max-w-page mx-auto pb-24">
          {items.map((item, index) => (
            <PosterCard
              key={item.id}
              item={item}
              index={index}
              linkPrefix={linkPrefix}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 md:px-16 max-w-page mx-auto pb-24 text-on-surface-variant">
          No titles found right now. Please check back later.
        </div>
      )}

      <Footer />
    </div>
  )
}
