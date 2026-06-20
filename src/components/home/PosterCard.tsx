import Image from 'next/image'
import Link from 'next/link'
import { Film, Star } from 'lucide-react'

import Magnet from '@/components/motion/Magnet'
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
  /** Add a subtle magnetic mouse-follow to the poster (desktop only). */
  magnet?: boolean
}

export default function PosterCard({
  item,
  index: _index,
  linkPrefix,
  className,
  sizes = '(max-width: 640px) 31vw, (max-width: 1024px) 23vw, 18vw',
  magnet = false,
}: PosterCardProps) {
  const posterUrl = getPosterUrl(item.poster_path, 'md')
  const year = formatReleaseYear(item.release_date)
  const rating = item.vote_average
  const slug = slugify(item.id, item.title)

  const frame = (
    <div className="poster-frame relative mb-3 aspect-[2/3] overflow-hidden transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-ember-glow">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes={sizes}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-container">
            <Film className="h-10 w-10 text-outline" />
          </div>
        )}

        {/* Gradient overlay — deepens on hover for legibility */}
        <div className="absolute inset-0 bg-poster-overlay opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Gold ring on hover */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-transparent transition-colors duration-300 group-hover:ring-ember/50" />

        {/* Rating — top-right, fades in on hover */}
        {rating > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2 py-0.5 font-mono text-[10px] text-ember opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <Star className="h-2.5 w-2.5 fill-ember stroke-none" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>
  )

  return (
    <Link
      href={`${linkPrefix}/${slug}`}
      className={cn('group block cursor-pointer', className)}
    >
      {magnet ? (
        <Magnet padding={40} strength={6}>
          {frame}
        </Magnet>
      ) : (
        frame
      )}

      {/* Title + meta below poster */}
      <div className="min-w-0">
        <p className="truncate font-sans text-sm font-medium text-on-surface transition-colors group-hover:text-ember">
          {item.title}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-on-surface-variant">
          {[year, item.genre_names[0]].filter(Boolean).join('  ·  ')}
        </p>
      </div>
    </Link>
  )
}
