'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react'

import { getBackdropUrl, formatReleaseYear, formatRuntime } from '@/lib/tmdb/helpers'
import type { TMDBMovie } from '@/types/tmdb'
import { cn } from '@/lib/utils'

interface HeroCarouselProps {
  films: TMDBMovie[]
}

export default function HeroCarousel({ films }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Backdrops (one per film, stacked, crossfade) ── */}
      {films.map((film, i) => {
        const backdropUrl = getBackdropUrl(film.backdrop_path, 'lg')
        return (
          <div
            key={film.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-[800ms]',
              i === current ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={i !== current}
          >
            {backdropUrl && (
              <Image
                src={backdropUrl}
                alt={film.title}
                fill
                className="object-cover object-center"
                priority={i === 0}
                sizes="100vw"
              />
            )}
          </div>
        )
      })}

      {/* ── Gradient overlay — always above all backdrops ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141313] via-[#141313]/60 to-transparent" />

      {/* ── Per-film content (fades with its backdrop) ── */}
      {films.map((film, i) => (
        <div
          key={`content-${film.id}`}
          className={cn(
            'absolute inset-0 transition-opacity duration-[800ms]',
            i === current ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={i !== current}
        >
          <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-24">
            <div className="max-w-page mx-auto px-4 md:px-16 flex items-end justify-between gap-8">

              {/* Left: film info + CTAs */}
              <div className="max-w-2xl">
                {/* Metadata pills */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {film.genres?.slice(0, 3).map((g) => (
                    <span
                      key={g.id}
                      className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded"
                    >
                      {g.name}
                    </span>
                  ))}
                  {film.release_date && (
                    <span className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded">
                      {formatReleaseYear(film.release_date)}
                    </span>
                  )}
                  {film.runtime ? (
                    <span className="bg-surface-variant/80 backdrop-blur text-on-surface text-label uppercase border border-white/10 px-2 py-1 rounded">
                      {formatRuntime(film.runtime)}
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h1 className="font-display text-5xl md:text-7xl text-white tracking-tighter font-bold mb-4">
                  {film.title}
                </h1>

                {/* Overview */}
                {film.overview && (
                  <p className="text-on-surface-variant text-lg max-w-xl line-clamp-2 mb-8">
                    {film.overview}
                  </p>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="bg-gold text-black font-label uppercase font-bold px-8 py-3 rounded flex items-center gap-2 hover:bg-gold-hover active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(212,175,55,0.39)]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Trailer
                  </button>
                  <button
                    type="button"
                    className="bg-surface-container/60 backdrop-blur text-white font-label uppercase font-bold px-8 py-3 rounded border border-white/20 hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Watchlist
                  </button>
                </div>
              </div>

              {/* Right: community rating (desktop only) */}
              <div className="hidden md:block shrink-0">
                <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 text-center min-w-[148px]">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-2">
                    Community Rating
                  </p>
                  <p className="font-display text-4xl text-gold font-bold leading-none">
                    {film.vote_average.toFixed(1)}
                    <span className="font-sans text-sm text-on-surface-variant font-normal">/10</span>
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-2">
                    {film.vote_count.toLocaleString()} votes
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
        className="hidden sm:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-gold hover:text-black hover:border-gold transition-all duration-200 active:scale-95"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next film"
        className="hidden sm:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 items-center justify-center text-white hover:bg-gold hover:text-black hover:border-gold transition-all duration-200 active:scale-95"
      >
        <ChevronRight size={24} />
      </button>

      {/* ── Progress dots — always visible, clear of mobile nav ── */}
      <div className="absolute bottom-20 md:bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {films.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to film ${i + 1}`}
            className={cn(
              'rounded-full transition-all duration-300',
              i === current
                ? 'bg-gold w-6 h-2'
                : 'bg-white/30 w-2 h-2 hover:bg-white/50',
            )}
          />
        ))}
      </div>
    </section>
  )
}
