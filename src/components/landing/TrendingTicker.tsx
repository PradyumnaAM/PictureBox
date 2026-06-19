'use client'

export interface TickerItem {
  title?: string
  name?: string
}

interface TrendingTickerProps {
  items: TickerItem[]
}

/**
 * A full-width, seamlessly looping marquee of trending title names that runs
 * just beneath the hero.
 */
export default function TrendingTicker({ items }: TrendingTickerProps) {
  const labels = items.map((i) => i.title ?? i.name ?? '').filter(Boolean)

  if (labels.length === 0) return null

  // Duplicate the list so the -50% translate wraps seamlessly.
  const track = [...labels, ...labels]

  return (
    <div className="overflow-hidden border-y border-ember/20 bg-black py-3">
      <style>{`
        @keyframes trending-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .trending-track { animation: none !important; }
        }
      `}</style>

      <div
        className="trending-track flex w-max gap-8"
        style={{ animation: 'trending-marquee 30s linear infinite' }}
      >
        {track.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs uppercase text-on-surface-variant"
          >
            <span aria-hidden className="h-1.5 w-1.5 bg-ember" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
