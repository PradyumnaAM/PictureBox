'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle, Loader2, Star, X } from 'lucide-react'
import { toast } from 'sonner'

import { getPosterUrl, formatReleaseYear } from '@/lib/tmdb/helpers'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MovieMeta {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  media_type?: 'movie' | 'tv'
}

export interface ExistingLog {
  id: string
  status: string
  rating: number | null
  review: string | null
  watched_at: string | null
  contains_spoilers: boolean
  rewatch: boolean
}

interface LogModalProps {
  isOpen: boolean
  onClose: () => void
  movie: MovieMeta
  titleId: string | null
  existingLog: ExistingLog | null
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'watched',       label: 'Watched' },
  { value: 'watching',      label: 'Watching' },
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'dropped',       label: 'Dropped' },
] as const

type StatusValue = (typeof STATUSES)[number]['value']

// ─── Star rating ─────────────────────────────────────────────────────────────

function StarRating({
  rating,
  onChange,
}: {
  rating: number
  onChange: (r: number) => void
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const display = hoverRating || rating

  return (
    <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = display >= n
        const half = !full && display >= n - 0.5
        return (
          <div key={n} className="relative w-8 h-8 cursor-pointer">
            {/* Background star */}
            <Star className="absolute inset-0 w-8 h-8 text-on-surface-variant/30" />
            {/* Full fill */}
            {full && <Star className="absolute inset-0 w-8 h-8 fill-ember text-ember" />}
            {/* Half fill */}
            {half && (
              <Star
                className="absolute inset-0 w-8 h-8 fill-ember text-ember"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
            {/* Left half-star hit area (n − 0.5) */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHoverRating(n - 0.5)}
              onClick={() => onChange(n - 0.5)}
            />
            {/* Right full-star hit area (n) */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => onChange(n)}
            />
          </div>
        )
      })}
      {rating > 0 && (
        <span className="ml-2 text-sm text-on-surface-variant self-center">
          {rating.toFixed(1)} / 5
        </span>
      )}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
          checked ? 'bg-ember border-ember' : 'border-outline-variant',
        )}
      >
        {checked && <Check className="w-3 h-3 text-black" />}
      </button>
      <span className="text-sm text-on-surface-variant">{label}</span>
    </label>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const inputClass =
  'w-full bg-surface-container-high border border-outline-variant rounded-md px-4 py-3 ' +
  'text-on-surface placeholder:text-on-surface-variant ' +
  'focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors'

export default function LogModal({
  isOpen,
  onClose,
  movie,
  titleId,
  existingLog,
}: LogModalProps) {
  const router = useRouter()
  const posterUrl = getPosterUrl(movie.poster_path, 'sm')

  const [status, setStatus] = useState<StatusValue>(
    (existingLog?.status as StatusValue) ?? 'watched',
  )
  const [rating, setRating] = useState<number>(existingLog?.rating ?? 0)
  const [reviewText, setReviewText] = useState(existingLog?.review ?? '')
  const [watchedAt, setWatchedAt] = useState(existingLog?.watched_at ?? today)
  const [containsSpoilers, setContainsSpoilers] = useState(
    existingLog?.contains_spoilers ?? false,
  )
  const [isRewatch, setIsRewatch] = useState(existingLog?.rewatch ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const isWatched = status === 'watched'

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: movie.id,
          media_type: movie.media_type ?? 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          title_id: titleId ?? undefined,
          status,
          rating: isWatched && rating > 0 ? rating : null,
          review: reviewText.trim() || null,
          watched_at: isWatched ? watchedAt : null,
          contains_spoilers: containsSpoilers,
          rewatch: isRewatch,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to save. Please try again.')
        return
      }
      setSaved(true)
      toast.success('Logged!', {
        description: `${movie.title} added to your diary.`,
        duration: 3000,
      })
      router.refresh()
      setTimeout(() => {
        onClose()
      }, 1500)
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-ember/25 bg-surface-container p-8 shadow-header">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {posterUrl && (
              <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0">
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  width={48}
                  height={72}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="font-display text-xl text-cream font-semibold leading-tight">
                {movie.title}
              </h2>
              <p className="text-on-surface-variant text-sm">
                {formatReleaseYear(movie.release_date)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status selector */}
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

          {/* Star rating — only when watched */}
          {isWatched && (
            <div>
              <p className="text-sm text-on-surface-variant mb-3">Rating</p>
              <StarRating rating={rating} onChange={setRating} />
            </div>
          )}

          {/* Date watched — only when watched */}
          {isWatched && (
            <div>
              <label className="text-sm text-on-surface-variant mb-2 block">
                Date watched
              </label>
              <input
                type="date"
                value={watchedAt}
                max={today}
                onChange={(e) => setWatchedAt(e.target.value)}
                className={cn(inputClass, '[color-scheme:dark]')}
              />
            </div>
          )}

          {/* Review */}
          <div>
            <label className="text-sm text-on-surface-variant mb-2 block">
              Review <span className="text-xs">(optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={10000}
                rows={4}
                placeholder="Share your thoughts…"
                className={cn(inputClass, 'resize-none pb-6')}
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-on-surface-variant pointer-events-none">
                {reviewText.length}/10000
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <Toggle
              label="Contains spoilers"
              checked={containsSpoilers}
              onChange={setContainsSpoilers}
            />
            <Toggle
              label="This is a rewatch"
              checked={isRewatch}
              onChange={setIsRewatch}
            />
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
                Logged!
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : existingLog ? (
              'Update Log'
            ) : (
              'Save Log'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
