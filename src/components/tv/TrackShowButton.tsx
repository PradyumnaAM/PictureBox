'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle, Loader2, Tv, X } from 'lucide-react'
import { toast } from 'sonner'

import { getPosterUrl, formatReleaseYear } from '@/lib/tmdb/helpers'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShowMeta {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'watching',      label: 'Watching' },
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'completed',     label: 'Completed' },
  { value: 'dropped',       label: 'Dropped' },
  { value: 'on_hold',       label: 'On Hold' },
] as const

type StatusValue = (typeof STATUSES)[number]['value']

// ─── Inline star rating (whole stars, 1-5) ────────────────────────────────────

function StarRating({
  rating,
  onChange,
}: {
  rating: number
  onChange: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  const display = hover || rating

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n === rating ? 0 : n)}
          aria-label={`Rate ${n} stars`}
          className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-ember transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              'w-5 h-5',
              n <= display ? 'fill-ember text-ember' : 'fill-none text-on-surface-variant/40',
            )}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-1 text-sm text-on-surface-variant">{rating} / 5</span>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TrackShowModal({
  show,
  onClose,
}: {
  show: ShowMeta
  onClose: () => void
}) {
  const posterUrl = getPosterUrl(show.poster_path, 'sm')
  const year = formatReleaseYear(show.first_air_date)

  const [status, setStatus] = useState<StatusValue>('watching')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: show.id,
          media_type: 'tv',
          title: show.name,
          poster_path: show.poster_path,
          release_date: show.first_air_date,
          log_type: 'tv_show',
          status,
          rating: rating > 0 ? rating : null,
          review: review.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Failed to save. Please try again.')
        return
      }

      setSaved(true)
      toast.success('Show tracked!', {
        description: `${show.name} added to your list.`,
        duration: 3000,
      })
      setTimeout(onClose, 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface-container rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {posterUrl && (
              <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0">
                <Image
                  src={posterUrl}
                  alt={show.name}
                  width={48}
                  height={72}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="font-display text-xl text-cream font-semibold leading-tight">
                {show.name}
              </h2>
              {year && (
                <p className="text-on-surface-variant text-sm">{year}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <p className="text-sm text-on-surface-variant mb-3">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    status === value
                      ? 'bg-ember text-black'
                      : 'bg-surface-container-high border border-outline-variant text-on-surface-variant hover:border-ember/50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-sm text-on-surface-variant mb-3">
              Rating <span className="text-xs">(optional)</span>
            </p>
            <StarRating rating={rating} onChange={setRating} />
          </div>

          {/* Review */}
          <div>
            <label className="text-sm text-on-surface-variant mb-2 block">
              Review <span className="text-xs">(optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                maxLength={10000}
                rows={4}
                placeholder="Share your thoughts…"
                className={cn(
                  'w-full bg-surface-container-high border border-outline-variant rounded-md px-4 py-3',
                  'text-on-surface placeholder:text-on-surface-variant',
                  'focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors',
                  'resize-none pb-6',
                )}
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-on-surface-variant pointer-events-none">
                {review.length}/10000
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-error text-sm bg-error/10 border border-error/30 rounded-md px-4 py-3">
              {error}
            </p>
          )}

          {/* Save */}
          <button
            type="button"
            disabled={saving || saved}
            onClick={save}
            className={cn(
              'w-full font-label uppercase font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2',
              saved
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-ember text-black hover:bg-ember-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Tracked!
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

export default function TrackShowButton({ show }: { show: ShowMeta }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-ember text-black font-sans text-label uppercase tracking-widest font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-ember-hover active:scale-95 transition-all"
      >
        <Tv className="w-4 h-4" />
        Track This Show
      </button>

      {isOpen && (
        <TrackShowModal show={show} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
