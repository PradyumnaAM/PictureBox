import Image from 'next/image'
import {
  ArrowUp,
  Crown,
  Film,
  Search,
  Star,
  Tv,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/* ─── Shared pieces ─────────────────────────────────────────────────────── */

function MockCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-surface-container/80 p-4 shadow-poster backdrop-blur-sm md:p-5',
        'transition-colors duration-200 hover:border-ember/40',
        className,
      )}
    >
      {children}
    </div>
  )
}

const posterSrc = (path: string) => `https://image.tmdb.org/t/p/w342${path}`

const posterPathByTitle: Record<string, string> = {
  Severance: '/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
  Andor: '/khZqmwHQicTYoS7Flreb9EddFZC.jpg',
  'The Leftovers': '/NKJdryIFHr245Umq6gXsf7oULW.jpg',
  Heat: '/e09dLw1Ljtccd2P4NsuUvVtS5du.jpg',
  'Children of Men': '/k9IAS4TehZFcKi4HVByxZNPfqex.jpg',
  Oldboy: '/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg',
  Fargo: '/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg',
  'Blade Runner 2049': '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
  'Blade Runner': '/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg',
  'Blade Runner: Black Lotus': '/aR06SJRDGqRmGQYXAXqeOkRZq7T.jpg',
}

function PosterThumb({
  title,
  posterPath,
  className,
}: {
  title: string
  posterPath: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-md border border-white/10 overflow-hidden flex-shrink-0 bg-surface-container-high',
        className ?? 'w-10 h-14',
      )}
    >
      <Image
        src={posterSrc(posterPath)}
        alt={`${title} poster`}
        fill
        sizes="96px"
        className="object-cover"
      />
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n
        const half = !full && rating >= n - 0.5
        return (
          <div key={n} className="relative w-3.5 h-3.5">
            <Star className="absolute inset-0 w-3.5 h-3.5 text-on-surface-variant/25" />
            {full && <Star className="absolute inset-0 w-3.5 h-3.5 fill-ember text-ember" />}
            {half && (
              <Star
                className="absolute inset-0 w-3.5 h-3.5 fill-ember text-ember"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TypeBadge({ type }: { type: 'film' | 'tv' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
        type === 'film' ? 'bg-white/[0.08] text-on-surface-variant' : 'bg-ember-muted text-ember',
      )}
    >
      {type === 'film' ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
      {type === 'film' ? 'Film' : 'TV'}
    </span>
  )
}

/* ─── 1. Diary — films and TV logged side by side ───────────────────────── */

const DIARY_ROWS = [
  {
    letter: 'P', hue: '#7eb8a4', title: 'Past Lives', meta: '2023 · Film',
    posterPath: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
    type: 'film' as const, rating: 4.5, date: 'Jun 8',
  },
  {
    letter: 'B', hue: '#d97742', title: 'The Bear — S4 E10 "Goodbye"', meta: 'Season finale',
    posterPath: '/4fVddnbhcmzRZE14NJY03GKS6Fn.jpg',
    type: 'tv' as const, rating: 5, date: 'Jun 6',
  },
  {
    letter: 'S', hue: '#8a9bc4', title: 'Shōgun — Season 1', meta: '10 episodes · logged as one',
    posterPath: '/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
    type: 'tv' as const, rating: 4.5, date: 'Jun 1',
  },
]

export function DiaryMock() {
  return (
    <MockCard>
      <div className="flex items-center justify-between mb-4">
        <p className="text-label uppercase tracking-widest text-on-surface-variant">My Diary</p>
        <span className="text-xs text-on-surface-variant/60">June 2026</span>
      </div>
      <div className="space-y-3">
        {DIARY_ROWS.map((row) => (
          <div
            key={row.title}
            className="flex items-center gap-3.5 rounded-md border border-white/[0.06] bg-surface-container-high/55 p-3"
          >
            <PosterThumb title={row.title} posterPath={row.posterPath} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-on-surface truncate">{row.title}</p>
                <TypeBadge type={row.type} />
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">{row.meta}</p>
              <div className="mt-1.5">
                <Stars rating={row.rating} />
              </div>
            </div>
            <span className="text-xs text-on-surface-variant/60 flex-shrink-0">{row.date}</span>
          </div>
        ))}
      </div>
    </MockCard>
  )
}

/* ─── 2. TV progress bars ───────────────────────────────────────────────── */

const PROGRESS_ROWS = [
  { letter: 'S', hue: '#6fb3d9', title: 'Severance', sub: 'S2 · 7 of 10 episodes', pct: 70, next: 'Up next: S2 E8 — Sweet Vitriol' },
  { letter: 'A', hue: '#c4a35a', title: 'Andor', sub: 'S2 · Complete', pct: 100, next: null },
  { letter: 'L', hue: '#b07ec4', title: 'The Leftovers', sub: 'S2 · 4 of 10 episodes', pct: 40, next: null },
]

export function ProgressMock() {
  return (
    <MockCard>
      <p className="text-label uppercase tracking-widest text-on-surface-variant mb-4">
        Currently Watching
      </p>
      <div className="space-y-4">
        {PROGRESS_ROWS.map((row) => (
          <div key={row.title} className="flex items-center gap-3.5">
            <PosterThumb title={row.title} posterPath={posterPathByTitle[row.title]} className="w-11 h-16" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-on-surface truncate">{row.title}</p>
                <span
                  className={cn(
                    'text-xs font-semibold flex-shrink-0',
                    row.pct === 100 ? 'text-ember' : 'text-on-surface-variant',
                  )}
                >
                  {row.pct === 100 ? '✓ Done' : `${row.pct}%`}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">{row.sub}</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    row.pct === 100 ? 'bg-ember' : 'bg-ember/70',
                  )}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              {row.next && (
                <p className="text-[11px] text-ember mt-1.5">{row.next}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </MockCard>
  )
}

/* ─── 3. Stats ──────────────────────────────────────────────────────────── */

const GENRE_BARS = [
  { genre: 'Drama', pct: 34 },
  { genre: 'Sci-Fi', pct: 22 },
  { genre: 'Thriller', pct: 18 },
  { genre: 'Comedy', pct: 12 },
]

export function StatsMock() {
  return (
    <MockCard>
      <p className="text-label uppercase tracking-widest text-on-surface-variant mb-4">
        2026 · Year So Far
      </p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: '142', label: 'Films' },
          { value: '688', label: 'Episodes' },
          { value: '914h', label: 'Watched' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-white/[0.06] bg-surface-container-high/55 py-4 text-center"
          >
            <p className="font-display text-2xl md:text-3xl text-ember font-semibold">{s.value}</p>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {GENRE_BARS.map((g) => (
          <div key={g.genre} className="flex items-center gap-3">
            <span className="text-xs text-on-surface w-16 flex-shrink-0">{g.genre}</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.07] overflow-hidden">
              <div className="h-full rounded-full bg-ember/80" style={{ width: `${g.pct * 2.4}%` }} />
            </div>
            <span className="text-xs text-on-surface-variant w-8 text-right flex-shrink-0">
              {g.pct}%
            </span>
          </div>
        ))}
      </div>
    </MockCard>
  )
}

/* ─── 4. Friends activity ───────────────────────────────────────────────── */

const FEED_ROWS = [
  {
    initial: 'M', name: 'Maya', action: 'watched', title: 'Past Lives',
    rating: 4.5 as number | null, note: '"Quietly devastating. The bar scene."', time: '2h',
  },
  {
    initial: 'J', name: 'Jordan', action: 'finished', title: 'Severance S2',
    rating: 5 as number | null, note: null, time: '5h',
  },
  {
    initial: 'R', name: 'Ren', action: 'added', title: 'Perfect Days',
    rating: null as number | null, note: 'to their watchlist', time: '1d',
  },
]

export function FeedMock() {
  return (
    <MockCard>
      <p className="text-label uppercase tracking-widest text-on-surface-variant mb-4">
        Friends Activity
      </p>
      <div className="space-y-3">
        {FEED_ROWS.map((row) => (
          <div
            key={row.name}
            className="flex items-start gap-3 rounded-md border border-white/[0.06] bg-surface-container-high/55 p-3"
          >
            <div className="w-8 h-8 rounded-full bg-ember text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
              {row.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-on-surface-variant leading-snug">
                <span className="font-semibold text-on-surface">{row.name}</span>{' '}
                {row.action}{' '}
                <span className="font-semibold text-on-surface">{row.title}</span>
                {row.note && !row.rating && <> {row.note}</>}
              </p>
              {row.rating != null && (
                <div className="mt-1">
                  <Stars rating={row.rating} />
                </div>
              )}
              {row.note && row.rating != null && (
                <p className="text-xs text-on-surface-variant italic mt-1">{row.note}</p>
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant/60 flex-shrink-0">{row.time}</span>
          </div>
        ))}
      </div>
    </MockCard>
  )
}

/* ─── 5. Group watchlist ────────────────────────────────────────────────── */

const GROUP_ITEMS = [
  { letter: 'H', hue: '#7b61ff', title: 'Heat', votes: 4, top: true },
  { letter: 'C', hue: '#7eb8a4', title: 'Children of Men', votes: 3, top: false },
  { letter: 'O', hue: '#b07ec4', title: 'Oldboy', votes: 1, top: false },
]

export function GroupMock() {
  return (
    <MockCard>
      <div className="flex items-center justify-between mb-1">
        <p className="font-display text-xl text-cream font-semibold">Friday Film Club</p>
        <div className="flex -space-x-1.5">
          {['M', 'J', 'R', 'A'].map((c) => (
            <div
              key={c}
              className="w-6 h-6 rounded-full bg-ember text-black text-[10px] font-bold flex items-center justify-center border-2 border-surface-container"
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-on-surface-variant mb-4">4 members · vote closes 7pm</p>
      <div className="space-y-2.5">
        {GROUP_ITEMS.map((item) => (
          <div
            key={item.title}
            className={cn(
                'flex items-center gap-3 rounded-md p-3 border',
              item.top
                ? 'bg-ember-muted border-ember/30'
                : 'bg-surface-container-high/50 border-white/[0.05]',
            )}
          >
            <PosterThumb title={item.title} posterPath={posterPathByTitle[item.title]} className="w-9 h-12" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate flex items-center gap-2">
                {item.title}
                {item.top && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-ember font-semibold uppercase tracking-wider">
                    <Crown className="w-3 h-3" />
                    Tonight&apos;s pick
                  </span>
                )}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded flex-shrink-0',
                item.top ? 'bg-ember text-black' : 'bg-white/[0.07] text-on-surface-variant',
              )}
            >
              <ArrowUp className="w-3 h-3" />
              {item.votes}
            </span>
          </div>
        ))}
      </div>
    </MockCard>
  )
}

/* ─── 6. Streaming availability ─────────────────────────────────────────── */

const SERVICES = [
  { abbr: 'N', name: 'Netflix', color: '#e50914', available: true },
  { abbr: 'P', name: 'Prime Video', color: '#00a8e1', available: true },
  { abbr: 'M', name: 'Max', color: '#9b6bf3', available: false },
  { abbr: 'D', name: 'Disney+', color: '#4fc3f7', available: false },
]

export function StreamingMock() {
  return (
    <MockCard>
      <p className="text-label uppercase tracking-widest text-on-surface-variant mb-4">
        Where to Watch
      </p>
      <div className="flex items-center gap-3.5 mb-5">
        <PosterThumb title="Fargo" posterPath={posterPathByTitle.Fargo} className="w-12 h-[4.5rem]" />
        <div>
          <p className="font-semibold text-on-surface">Fargo</p>
          <p className="text-xs text-on-surface-variant mt-0.5">1996 · Film</p>
          <p className="text-xs text-ember mt-1.5 font-medium">
            On 2 of your 4 services
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {SERVICES.map((s) => (
          <div
            key={s.name}
            className={cn(
              'flex items-center gap-2.5 rounded-md border p-2.5',
              s.available
                ? 'bg-surface-container-high/60 border-white/[0.08]'
                : 'bg-surface-container-high/20 border-white/[0.03] opacity-45',
            )}
          >
            <span
              className="w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: s.color }}
            >
              {s.abbr}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">{s.name}</p>
              <p className="text-[10px] text-on-surface-variant">
                {s.available ? 'Included' : 'Not available'}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-on-surface-variant/70 mt-4">
        Jordan and Ren can stream it too — group watch is on.
      </p>
    </MockCard>
  )
}

/* ─── 7. Unified search ─────────────────────────────────────────────────── */

const SEARCH_RESULTS = [
  { letter: 'B', hue: '#6fb3d9', title: 'Blade Runner 2049', meta: '2017 · Denis Villeneuve', type: 'film' as const },
  { letter: 'B', hue: '#c4a35a', title: 'Blade Runner', meta: '1982 · Ridley Scott', type: 'film' as const },
  { letter: 'B', hue: '#b07ec4', title: 'Blade Runner: Black Lotus', meta: '2021 · Series', type: 'tv' as const },
]

export function SearchMock() {
  return (
    <MockCard>
      <div className="mb-3 flex items-center gap-3 rounded-md border border-white/[0.08] bg-surface-container-high/70 px-4 py-3">
        <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
        <span className="text-sm text-on-surface">
          blade runner
          <span className="inline-block w-px h-4 bg-ember ml-0.5 align-middle animate-pulse" />
        </span>
        <kbd className="ml-auto text-[10px] text-on-surface-variant/60 border border-white/10 rounded px-1.5 py-0.5 flex-shrink-0">
          ⌘K
        </kbd>
      </div>
      <div className="space-y-2">
        {SEARCH_RESULTS.map((r) => (
          <div
            key={r.title}
            className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-white/[0.04]"
          >
            <PosterThumb title={r.title} posterPath={posterPathByTitle[r.title]} className="w-9 h-12" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{r.title}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{r.meta}</p>
            </div>
            <TypeBadge type={r.type} />
          </div>
        ))}
      </div>
    </MockCard>
  )
}
