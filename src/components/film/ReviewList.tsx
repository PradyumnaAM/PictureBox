'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

export interface Review {
  id: string
  rating: number | null
  review: string | null
  contains_spoilers: boolean
  watched_at: string | null
  created_at: string
  profiles: { username: string } | null
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n
        const half = !full && rating >= n - 0.5
        return (
          <div key={n} className="relative w-3.5 h-3.5">
            <Star className="absolute inset-0 w-3.5 h-3.5 text-on-surface-variant/30" />
            {full && <Star className="absolute inset-0 w-3.5 h-3.5 fill-gold text-gold" />}
            {half && (
              <Star
                className="absolute inset-0 w-3.5 h-3.5 fill-gold text-gold"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const [revealed, setRevealed] = useState(false)
  const username = review.profiles?.username ?? 'Anonymous'
  const initial = username[0]?.toUpperCase() ?? '?'
  const date = review.watched_at ?? review.created_at.slice(0, 10)

  return (
    <div className="bg-surface-container/40 backdrop-blur border border-white/10 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-on-surface-variant text-xs font-semibold">{initial}</span>
          </div>
          <div>
            <p className="text-on-surface text-sm font-medium">{username}</p>
            <p className="text-on-surface-variant text-xs">{date}</p>
          </div>
        </div>
        {review.rating !== null && <StarDisplay rating={review.rating} />}
      </div>

      {/* Review text */}
      {review.review && (
        review.contains_spoilers && !revealed ? (
          <div className="relative">
            <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-4 blur-sm select-none">
              {review.review}
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="bg-surface-container/90 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface font-medium hover:border-gold transition-colors"
              >
                Contains spoilers — click to reveal
              </button>
            </div>
          </div>
        ) : (
          <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-4">
            {review.review}
          </p>
        )
      )}
    </div>
  )
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null
  return (
    <div className="space-y-4">
      {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
    </div>
  )
}
