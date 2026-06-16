'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { getBackdropUrl, formatReleaseYear, formatRuntime, slugify } from '@/lib/tmdb/helpers'
import type { TMDBMovie } from '@/types/tmdb'
import { cn } from '@/lib/utils'

// Pick the best YouTube trailer key from a film's appended videos, if any.
function getTrailerKey(film: TMDBMovie): string | null {
  const videos = film.videos?.results ?? []
  const youtube = videos.filter((v) => v.site === 'YouTube' && v.key)
  const pick =
    youtube.find((v) => v.official && v.type === 'Trailer') ??
    youtube.find((v) => v.type === 'Trailer') ??
    youtube.find((v) => v.type === 'Teaser') ??
    youtube[0]
  return pick?.key ?? null
}

interface HeroCarouselProps {
  films: TMDBMovie[]
}

export default function HeroCarousel({ films }: HeroCarouselProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [watchlisted, setWatchlisted] = useState<Set<number>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Trailer: open an official YouTube trailer in a new tab when one is
  // available on the carousel item; otherwise fall back to the detail page
  // where trailer/playback lives.
  const handleTrailer = useCallback(
    (f: TMDBMovie) => {
      const key = getTrailerKey(f)
      if (key) {
        window.open(`https://www.youtube.com/watch?v=${key}`, '_blank', 'noopener,noreferrer')
      } else {
        router.push(`/film/${slugify(f.id, f.title)}`)
      }
    },
    [router],
  )

  // Watchlist: add the film with status 'want_to_watch'. Optimistic UI +
  // toast; bounce to /sign-in if the user isn't authenticated.
  const handleWatchlist = useCallback(
    async (f: TMDBMovie) => {
      if (savingIds.has(f.id) || watchlisted.has(f.id)) return
      setSavingIds((prev) => new Set(prev).add(f.id))
      setWatchlisted((prev) => new Set(prev).add(f.id)) // optimistic
      try {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_id: f.id,
            media_type: 'movie',
            title: f.title,
            poster_path: f.poster_path,
            release_date: f.release_date,
            overview: f.overview ?? null,
            status: 'want_to_watch',
          }),
        })
        if (res.status === 401) {
          router.push('/sign-in')
          return
        }
        if (!res.ok) throw new Error()
        toast.success('Added to watchlist')
      } catch {
        // roll back optimistic state
        setWatchlisted((prev) => {
          const next = new Set(prev)
          next.delete(f.id)
          return next
        })
        toast.error('Failed to add. Please try again.')
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev)
          next.delete(f.id)
          return next
        })
      }
    },
    [router, savingIds, watchlisted],
  )

  // Auto-advance every 6 s; restarts whenever paused flips back to false
  useEffect(() => {
    if (paused || films.length <= 1) return
    const id = setInterval(() => setCurrent((c) => (c + 1) % films.length), 6000)
    return () => clearInterval(id)
  }, [paused, films.length])

  // Clean up the pause timeout on unmount
  useEffect(() => () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
  }, [])

  // Navigate to an index and pause auto-advance for 10 s
  const goTo = useCallback((index: number) => {
    setCurrent(index)
    setPaused(true)
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    pauseTimeoutRef.current = setTimeout(() => setPaused(false), 10000)
  }, [])

  const goPrev = useCallback(
    () => goTo((current - 1 + films.length) % films.length),
    [current, films.length, goTo],
  )

  const goNext = useCallback(
    () => goTo((current + 1) % films.length),
    [current, films.length, goTo],
  )

  if (!films.length) return null

  const film = films[current]

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Backdrops (one per film, stacked, crossfade) ── */}
      {films.map((f, i) => {
        const backdropUrl = getBackdropUrl(f.backdrop_path, 'original')
        return (
          <div
            key={f.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-[800ms]',
              i === current ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={i !== current}
          >
            {backdropUrl && (
              <Image
                src={backdropUrl}
                alt={f.title}
                fill
                className="object-cover object-center"
                priority={i === 0}
                sizes="100vw"
              />
            )}
          </div>
        )
      })}

      {/* ── Gradient overlays — always above all backdrops ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/45 to-[#0b0c10]/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10]/55 via-transparent to-transparent" />

      {/* ── Per-film content (fades with its backdrop) ── */}
      {films.map((f, i) => (
        <div
          key={`content-${f.id}`}
          className={cn(
            'absolute inset-0 transition-opacity duration-[800ms]',
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          aria-hidden={i !== current}
        >
          <div className="absolute bottom-0 left-0 right-0 pb-20 md:pb-24">
            <div className="max-w-page mx-auto px-4 md:px-16 flex items-end justify-between gap-8">

              {/* Left: film info + CTAs */}
              <div className="max-w-2xl">
                {/* Timecode metadata line */}
                <p className="font-mono text-xs text-cream/80 uppercase tracking-[0.14em] mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {f.release_date && <span>{formatReleaseYear(f.release_date)}</span>}
                  {f.runtime ? (
                    <>
                      <span className="text-ember">/</span>
                      <span>{formatRuntime(f.runtime)}</span>
                    </>
                  ) : null}
                  {f.genres?.slice(0, 3).map((g) => (
                    <span key={g.id} className="flex items-center gap-3">
                      <span className="text-ember">/</span>
                      {g.name}
                    </span>
                  ))}
                </p>

                {/* Title */}
                <h1 className="font-display text-5xl md:text-7xl text-cream tracking-tight font-semibold leading-[1.02] mb-5">
                  {f.title}
                </h1>

                {/* Overview */}
                {f.overview && (
                  <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl line-clamp-2 mb-8">
                    {f.overview}
                  </p>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => handleTrailer(f)}
                    className="bg-ember text-background font-label text-label uppercase font-medium px-8 py-3.5 rounded-md flex items-center gap-2 hover:bg-ember-hover active:scale-95 transition-all shadow-ember-glow"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Trailer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWatchlist(f)}
                    disabled={savingIds.has(f.id) || watchlisted.has(f.id)}
                    className="bg-white/[0.06] backdrop-blur text-cream font-label text-label uppercase font-medium px-8 py-3.5 rounded-md border border-white/15 hover:bg-white/[0.12] hover:border-white/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:active:scale-100"
                  >
                    {watchlisted.has(f.id) ? (
                      <>
                        <Check className="w-4 h-4" />
                        On Watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Watchlist
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: community rating (desktop only) */}
              <div className="hidden md:block shrink-0">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg p-5 text-center min-w-[150px]">
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.16em] mb-2">
                    Rating
                  </p>
                  <p className="font-display text-5xl text-ember font-semibold leading-none">
                    {f.vote_average.toFixed(1)}
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-3">
                    {f.vote_count.toLocaleString()} votes
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}

      {/* ── Left / right arrows (hidden on very small screens) ── */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous film"
        className="hidden sm:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-md bg-black/40 backdrop-blur-sm border border-white/15 items-center justify-center text-cream hover:bg-ember hover:text-background hover:border-ember transition-all duration-200 active:scale-95"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next film"
        className="hidden sm:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-md bg-black/40 backdrop-blur-sm border border-white/15 items-center justify-center text-cream hover:bg-ember hover:text-background hover:border-ember transition-all duration-200 active:scale-95"
      >
        <ChevronRight size={24} />
      </button>

      {/* ── Progress bars — film-counter style, clear of mobile nav ── */}
      <div className="absolute bottom-20 md:bottom-8 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {films.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to film ${i + 1}`}
            className={cn(
              'h-[3px] rounded-full transition-all duration-300',
              i === current
                ? 'bg-ember w-10'
                : 'bg-white/25 w-5 hover:bg-white/50',
            )}
          />
        ))}
      </div>

      {/* Screen-reader announcement of the current film */}
      <p className="sr-only" aria-live="polite">{film.title}</p>
    </section>
  )
}
