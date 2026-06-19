import Image from 'next/image'

import { getPosterUrl } from '@/lib/tmdb/helpers'
import { type PosterWallItem } from './PosterWall'

interface PosterBackdropProps {
  posters: PosterWallItem[]
}

// Enough tiles to over-fill the largest common viewport (9 cols × 7 rows);
// the fixed parent clips the overflow. The grid is fully static — only the
// shader streaks layered on top of it move.
const TILE_COUNT = 63

export default function PosterBackdrop({ posters }: PosterBackdropProps) {
  const usable = posters.filter((p) => p.poster_path)
  if (usable.length === 0) return null

  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => usable[i % usable.length])

  return (
    <div
      aria-hidden
      className="absolute inset-0 grid grid-cols-3 gap-1.5 p-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9"
    >
      {tiles.map((item, index) => {
        const url = getPosterUrl(item.poster_path, 'md')
        if (!url) return null
        return (
          <div
            key={`${item.id}-${index}`}
            className="relative aspect-[2/3] overflow-hidden rounded-sm bg-surface-container"
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 11vw"
              className="object-cover"
            />
          </div>
        )
      })}
    </div>
  )
}
