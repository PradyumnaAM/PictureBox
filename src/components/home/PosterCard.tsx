import Image from 'next/image'
import Link from 'next/link'
import { Film, Star } from 'lucide-react'

import { slugify, formatReleaseYear, getPosterUrl } from '@/lib/tmdb/helpers'
import { cn } from '@/lib/utils'

export interface PosterItem {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_names: string[]
}

interface PosterCardProps {
  item: PosterItem
  /** Zero-based position, rendered as the small index number. */
  index: number
  /** URL prefix for the card link, e.g. "/film" or "/tv" */
  linkPrefix: string
  /** Extra classes for the link wrapper (e.g. fixed width in a scroll row). */
  className?: string
  /** Responsive `sizes` hint for the poster image. */
  sizes?: string
}

export default function PosterCard({
  item,
  index,
  linkPrefix,
  className,
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw',
}: PosterCardProps) {
  const posterUrl = getPosterUrl(item.poster_path, 'md')
  const year = formatReleaseYear(item.release_date)
  const rating = item.vote_average
  const slug = slugify(item.id, item.title)

  return (
    <Link
      href={`${linkPrefix}/${slug}`}
      className={cn('group block cursor-pointer', className)}
    >
      {/* Poster image */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 ring-1 ring-white/[0.06] group-hover:ring-ember/70 group-hover:-translate-y-2 group-hover:shadow-ember-glow transition-all duration-500">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes={sizes}
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <Film className="w-10 h-10 text-outline" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-poster-overlay" />

        {/* Bottom: year + community rating */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
          {year && (
            <span className="bg-black/65 backdrop-blur-sm text-cream font-mono text-[10px] px-1.5 py-0.5 rounded">
              {year}
            </span>
          )}
          {rating > 0 && (
            <span className="flex items-center gap-1 bg-black/65 backdrop-blur-sm text-ember font-mono text-[10px] px-1.5 py-0.5 rounded">
              <Star className="w-2.5 h-2.5 fill-ember stroke-none" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Index + title + meta below poster */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] text-outline group-hover:text-ember transition-colors shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <p className="font-sans font-medium text-sm truncate text-on-surface group-hover:text-cream transition-colors">
            {item.title}
          </p>
          <p className="text-on-surface-variant text-xs mt-0.5 truncate">
            {[year, item.genre_names[0]].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </Link>
  )
}
