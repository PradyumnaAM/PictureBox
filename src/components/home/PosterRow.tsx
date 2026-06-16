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
      {/* Section header — editorial: title, rule line, reel count */}
      <div className="flex items-baseline gap-5 mb-7 px-4 md:px-16">
        <h2 className="font-display text-headline md:text-3xl text-cream shrink-0">
          {title}
        </h2>
        <span aria-hidden className="hidden sm:block flex-1 h-px bg-white/[0.08] translate-y-[-4px]" />
        <span className="hidden sm:block font-mono text-xs text-outline shrink-0">
          {String(items.length).padStart(2, '0')} titles
        </span>
        <Link
          href={href}
          className="group flex items-center gap-1.5 font-label text-label uppercase text-on-surface-variant hover:text-ember transition-colors shrink-0"
        >
          See All
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Scroll area with arrow buttons */}
      <div className="relative">
        {/* Left arrow */}
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Scroll left"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-md bg-surface-container/90 backdrop-blur border border-white/10 flex items-center justify-center text-on-surface hover:bg-ember hover:text-background hover:border-ember transition-all duration-200 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrollable card row */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-14 pb-4"
        >
          {items.map((item, index) => (
            <PosterCard
              key={item.id}
              item={item}
              index={index}
              linkPrefix={linkPrefix}
              className="flex-none w-52 snap-start"
              sizes="208px"
            />
          ))}
        </div>

        {/* Edge fade masks — above cards (z-5), below arrows (z-10) */}
        <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />

        {/* Right arrow */}
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll right"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-md bg-surface-container/90 backdrop-blur border border-white/10 flex items-center justify-center text-on-surface hover:bg-ember hover:text-background hover:border-ember transition-all duration-200 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
