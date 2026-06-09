'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, ChevronLeft, ChevronRight, Film, Star } from 'lucide-react'

import { slugify, formatReleaseYear, getPosterUrl } from '@/lib/tmdb/helpers'

// 3 cards × (208 px card + 24 px gap) = 696 px per arrow click
const SCROLL_AMOUNT = 696

export interface PosterItem {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_names: string[]
}

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
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 px-4 md:px-16">
        <div className="border-l-2 border-gold pl-4">
          <h2 className="font-display text-headline text-on-surface">{title}</h2>
        </div>
        <Link
          href={href}
          className="text-label uppercase tracking-widest text-on-surface-variant hover:text-gold transition-colors"
        >
          See All
        </Link>
      </div>

      {/* Scroll area with arrow buttons */}
      <div className="relative">
        {/* Left arrow */}
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Scroll left"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container/90 backdrop-blur border border-white/10 flex items-center justify-center text-on-surface hover:bg-gold hover:text-black hover:border-gold transition-all duration-200 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrollable card row */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-14 pb-4"
        >
          {items.map((item) => {
            const posterUrl = getPosterUrl(item.poster_path, 'md')
            const year = formatReleaseYear(item.release_date)
            const rating = item.vote_average
            const slug = slugify(item.id, item.title)

            return (
              <Link
                key={item.id}
                href={`${linkPrefix}/${slug}`}
                className="flex-none w-52 snap-start group cursor-pointer"
              >
                {/* Poster image */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 group-hover:-translate-y-2 group-hover:shadow-gold-glow transition-all duration-500">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="208px"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <Film className="w-10 h-10 text-outline" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-poster-overlay" />

                  {/* Bookmark — appears on hover */}
                  <div
                    aria-hidden
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-white" />
                  </div>

                  {/* Bottom: year + star rating */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                    {year && (
                      <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {year}
                      </span>
                    )}
                    {rating > 0 && (
                      <span className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-gold text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        <Star className="w-2.5 h-2.5 fill-gold stroke-none" />
                        {rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title + meta below poster */}
                <p className="font-sans font-semibold text-sm truncate text-on-surface group-hover:text-gold transition-colors">
                  {item.title}
                </p>
                <p className="text-on-surface-variant text-xs mt-0.5 truncate">
                  {[year, item.genre_names[0]].filter(Boolean).join(' • ')}
                </p>
              </Link>
            )
          })}
        </div>

        {/* Edge fade masks — above cards (z-5), below arrows (z-10) */}
        <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />

        {/* Right arrow */}
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll right"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container/90 backdrop-blur border border-white/10 flex items-center justify-center text-on-surface hover:bg-gold hover:text-black hover:border-gold transition-all duration-200 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
