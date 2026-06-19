'use client'

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
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
  const touchStartX = useRef<number | null>(null)

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

  const handleTouchStart = useCallback((e: TouchEvent<HTMLElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
    setPaused(true)
  }, [])

  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLElement>) => {
      const startX = touchStartX.current
      if (startX === null) return
      const endX = e.changedTouches[0]?.clientX ?? startX
      const delta = startX - endX
      if (Math.abs(delta) > 50) {
        if (delta > 0) goNext()
        else goPrev()
      }
      touchStartX.current = null
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = setTimeout(() => setPaused(false), 10000)
    },
    [goNext, goPrev],
  )

  if (!films.length) return null

  const film = films[current]

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
      <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/55 to-[#060608]/10" />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,6,8,0.92)_0%,rgba(6,6,8,0.55)_46%,transparent_78%)]" />

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
                <p className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs uppercase tracking-[0.12em] text-cream/75">
                  {f.release_date && <span>{formatReleaseYear(f.release_date)}</span>}
                  {f.runtime ? (
                    <>
                      <span className="text-ember/70">·</span>
                      <span>{formatRuntime(f.runtime)}</span>
                    </>
                  ) : null}
                  {f.genres?.slice(0, 3).map((g) => (
                    <span key={g.id} className="flex items-center gap-2.5">
                      <span className="text-ember/70">·</span>
                      {g.name}
                    </span>
                  ))}
                </p>

                {/* Title */}
                <h1 className="mb-5 font-display text-4xl font-semibold leading-[0.95] tracking-tight text-cream sm:text-5xl md:text-8xl">
                  {f.title}
                </h1>

                {/* Overview */}
                {f.overview && (
                  <p className="mb-8 max-w-xl text-base leading-relaxed text-on-surface-variant line-clamp-2 md:text-lg">
                    {f.overview}
                  </p>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleTrailer(f)}
                    className="btn-iris-gradient flex items-center gap-2 rounded-full px-7 py-3 font-sans text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch trailer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWatchlist(f)}
                    disabled={savingIds.has(f.id) || watchlisted.has(f.id)}
                    className="surface-frost flex items-center gap-2 rounded-full border border-white/15 px-7 py-3 font-sans text-sm font-semibold text-cream transition-all hover:border-ember hover:text-ember active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                  >
                    {watchlisted.has(f.id) ? (
                      <>
                        <Check className="h-4 w-4" />
                        On watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Watchlist
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: community rating (desktop only) */}
              <div className="hidden shrink-0 md:block">
                <div className="surface-frost min-w-[150px] rounded-2xl border border-white/10 p-5 text-center">
                  <p className="mb-2 font-label text-label uppercase text-on-surface-variant">
                    Rating
                  </p>
                  <p className="font-mono text-5xl font-semibold leading-none text-ember">
                    {f.vote_average.toFixed(1)}
                  </p>
                  <p className="mt-3 font-mono text-[10px] text-on-surface-variant">
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
        className="surface-frost absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 text-cream transition-colors hover:border-ember hover:text-ember active:scale-95 sm:flex md:left-8"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next film"
        className="surface-frost absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 text-cream transition-colors hover:border-ember hover:text-ember active:scale-95 sm:flex md:right-8"
      >
        <ChevronRight size={22} />
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
              'relative rounded-full transition-all duration-300',
              'before:absolute before:inset-0 before:-m-3',
              i === current
                ? 'bg-ember h-1.5 w-10 sm:h-[3px]'
                : 'bg-white/25 h-1.5 w-6 hover:bg-white/50 sm:h-[3px] sm:w-5',
            )}
          />
        ))}
      </div>

      {/* Screen-reader announcement of the current film */}
      <p className="sr-only" aria-live="polite">{film.title}</p>
    </section>
  )
}
