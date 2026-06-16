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
    <div className="bg-surface-container/40 border-y border-white/5 py-3 overflow-hidden">
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
            className="inline-flex items-center gap-2 whitespace-nowrap text-on-surface-variant text-xs uppercase tracking-widest"
          >
            <span aria-hidden className="text-ember">●</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
