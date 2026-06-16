import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { getPosterUrl } from '@/lib/tmdb/helpers'
import Reveal from './Reveal'
import PosterWall, { type PosterWallItem } from './PosterWall'
import TrendingTicker, { type TickerItem } from './TrendingTicker'

interface LandingHeroProps {
  posters: PosterWallItem[]
  tickerItems: TickerItem[]
}

export default function LandingHero({ posters, tickerItems }: LandingHeroProps) {
  // Three columns of posters, offset for the wall effect
  const columns: PosterWallItem[][] = [[], [], []]
  posters.slice(0, 12).forEach((p, i) => columns[i % 3].push(p))

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* ── Poster wall background ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-[-10%] grid grid-cols-3 gap-4 opacity-20 rotate-[-5deg] animate-drift"
      >
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col gap-4"
            style={{ marginTop: colIdx === 1 ? '-6rem' : colIdx === 2 ? '-3rem' : '0' }}
          >
            {col.map((p) => {
              const url = getPosterUrl(p.poster_path, 'lg')
              if (!url) return null
              return (
                <div key={p.id} className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 500px"
                    quality={90}
                    className="object-cover"
                    priority={colIdx === 0}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Overlays: darken + vignette + ember ambience ───────────────────── */}
      <div aria-hidden className="absolute inset-0 bg-background/75" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0b0c10_85%)]"
      />
      <div
        aria-hidden
        className="absolute -top-48 left-1/2 -translate-x-1/2 w-[44rem] h-[44rem] rounded-full bg-ember/[0.06] blur-[120px] pointer-events-none"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-page mx-auto w-full px-4 md:px-16 pt-32 pb-28 md:pt-36 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left: pitch */}
          <div className="lg:col-span-7 max-w-2xl">
            <Reveal delay={100}>
              <h1 className="font-display text-[2.9rem] md:text-[4.75rem] text-cream tracking-tight font-semibold leading-[1.02]">
                Every film.
                <br />
                Every episode.
                <br />
                <em className="text-ember font-medium" style={{ fontVariationSettings: "'SOFT' 60, 'WONK' 1" }}>
                  Accounted for.
                </em>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed mt-7 max-w-xl">
                PictureBox is the watch diary built for how people actually watch in 2026 —
                log a film in five seconds, track TV down to the episode, and find your
                next watch through people you trust, not an algorithm.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 mt-9">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center gap-2 bg-ember text-background font-label text-label uppercase font-medium px-8 py-4 rounded-md hover:bg-ember-hover active:scale-[0.98] transition-all shadow-[0_8px_32px_-4px_rgba(255,77,46,0.45)]"
                >
                  Start tracking — free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/films"
                  className="inline-flex items-center justify-center bg-white/[0.05] backdrop-blur text-cream font-label text-label uppercase font-medium px-8 py-4 rounded-md border border-white/15 hover:bg-white/[0.1] hover:border-white/30 active:scale-[0.98] transition-all"
                >
                  Browse what&apos;s trending
                </Link>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-9 text-sm text-on-surface-variant">
                {['Free forever', 'Episode-level TV tracking', 'No algorithm deciding your taste'].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <Check className="w-4 h-4 text-ember" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </Reveal>
          </div>

          {/* Right: live TMDB poster wall (desktop) */}
          <div className="lg:col-span-5 hidden lg:flex justify-end">
            <Reveal delay={300}>
              <PosterWall posters={posters} />
            </Reveal>
          </div>
        </div>
      </div>

      {/* ── Trending titles ticker, pinned to the bottom edge of the hero ──── */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <TrendingTicker items={tickerItems} />
      </div>
    </section>
  )
}
