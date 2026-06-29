'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import PosterCard, { type PosterItem } from './PosterCard'

// Re-exported so existing `import { PosterItem } from '.../PosterRow'` keeps working.
export type { PosterItem }

// 3 cards × (208 px card + 24 px gap) = 696 px per arrow click
const SCROLL_AMOUNT = 696

interface PosterRowProps {
  title: string
  items: PosterItem[]
  /** href for the "See All" link */
  href: string
  /** URL prefix for each card link, e.g. "/film" or "/tv" */
  linkPrefix?: string
}

export default function PosterRow({
  title,
  items,
  href,
  linkPrefix = '/film',
}: PosterRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollLeft = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollLeft <= 0) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
    } else {
      el.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      el.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
    }
  }

  return (
    <div className="max-w-page mx-auto">
      {/* Section header — editorial: title, rule line, reel count.
          Insets match the scroll row below so the title lines up with the
          first card (and clears the edge fade on desktop). */}
      <div className="mb-6 flex items-baseline gap-5 px-page-x-mobile md:px-24">
        <h2 className="shrink-0 font-display text-2xl font-semibold leading-none tracking-tight text-cream md:text-[1.75rem]">
          {title}
        </h2>
        <span aria-hidden className="hidden h-px flex-1 bg-white/[0.08] sm:block" />
        <span className="hidden shrink-0 font-mono text-xs text-outline sm:block">
          {String(items.length).padStart(2, '0')}
        </span>
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1.5 font-sans text-xs font-medium text-on-surface-variant transition-colors hover:text-ember"
        >
          See all
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Scroll area with arrow buttons */}
      <div className="relative">
        {/* Left arrow */}
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Scroll left"
          className="surface-frost absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 text-on-surface transition-colors hover:border-ember hover:text-ember active:scale-95 md:left-4 md:flex"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrollable card row.
            Horizontal padding is kept >= the edge-fade width on each breakpoint
            (20px mobile / 96px desktop) so the resting first and last cards sit
            clear of the fade instead of being darkened by it. */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-page-x-mobile py-4 md:gap-5 md:px-24"
        >
          {items.map((item, index) => (
            <PosterCard
              key={item.id}
              item={item}
              index={index}
              linkPrefix={linkPrefix}
              className="flex-none w-32 snap-start sm:w-40 md:w-52"
              sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 208px"
              magnet
            />
          ))}
        </div>

        {/* Edge fade masks — above cards (z-5), below arrows (z-10).
            Widths equal the scroll row's side padding so the fade sits entirely
            in the gutter and never covers a resting card. */}
        <div className="pointer-events-none absolute left-0 top-0 z-[5] h-full w-5 md:w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-[5] h-full w-5 md:w-24 bg-gradient-to-l from-background to-transparent" />

        {/* Right arrow */}
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll right"
          className="surface-frost absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 text-on-surface transition-colors hover:border-ember hover:text-ember active:scale-95 md:right-4 md:flex"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
