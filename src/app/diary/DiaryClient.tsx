'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Film, Search, Star } from 'lucide-react'

import { getPosterUrl, slugify, formatReleaseYear } from '@/lib/tmdb/helpers'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiaryEntry {
  id: string
  log_type: string
  status: string
  rating: number | null
  review: string | null
  watched_at: string | null
  created_at: string
  rewatch: boolean | null
  titles: {
    id: string
    tmdb_id: number
    media_type: string
    title: string
    poster_path: string | null
    release_date: string | null
  } | null
}

type Filter = 'all' | 'films' | 'tv' | 'reviewed'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthKey(entry: DiaryEntry): string {
  const d = new Date(entry.watched_at ?? entry.created_at)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function dayNumber(entry: DiaryEntry): string {
  if (!entry.watched_at) return '-'
  return String(new Date(entry.watched_at).getDate())
}

function groupByMonth(entries: DiaryEntry[]): [string, DiaryEntry[]][] {
  const map = new Map<string, DiaryEntry[]>()
  for (const entry of entries) {
    const key = monthKey(entry)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(entry)
  }
  return Array.from(map.entries())
}

function entryHref(entry: DiaryEntry): string {
  const title = entry.titles
  if (!title) return '#'
  const slug = slugify(title.tmdb_id, title.title)
  return title.media_type === 'movie' ? `/film/${slug}` : `/tv/${slug}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n
        const half = !full && rating >= n - 0.5
        return (
          <div key={n} className="relative w-3 h-3 flex-shrink-0">
            <Star className="absolute inset-0 w-3 h-3 text-on-surface-variant/25" />
            {full && <Star className="absolute inset-0 w-3 h-3 fill-ember text-ember" />}
            {half && (
              <Star
                className="absolute inset-0 w-3 h-3 fill-ember text-ember"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'watched') return null
  const styles: Record<string, string> = {
    watching: 'bg-amber-500/15 text-amber-400',
    dropped:  'bg-red-500/15 text-red-400',
    on_hold:  'bg-blue-500/15 text-blue-400',
    completed:'bg-green-500/15 text-green-400',
  }
  const labels: Record<string, string> = {
    watching:  'Watching',
    dropped:   'Dropped',
    on_hold:   'On Hold',
    completed: 'Completed',
  }
  const cls = styles[status] ?? 'bg-surface-container text-on-surface-variant'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-1.5 ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

function DiaryRow({ entry }: { entry: DiaryEntry }) {
  const title = entry.titles
  if (!title) return null

  const posterUrl = getPosterUrl(title.poster_path, 'sm')
  const href = entryHref(entry)
  const day = dayNumber(entry)
  const isFilm = title.media_type === 'movie'
  const year = formatReleaseYear(title.release_date)

  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/5 group">
      {/* Day */}
      <div className="w-8 text-center flex-shrink-0 pt-1">
        <span className="text-2xl font-display text-on-surface-variant leading-none">{day}</span>
      </div>

      {/* Poster */}
      <Link href={href} className="flex-shrink-0">
        <div className="relative w-10 h-14 rounded overflow-hidden bg-surface-container">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title.title}
              fill
              sizes="40px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="text-on-surface-variant" size={14} />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1">
          <Link
            href={href}
            className="text-on-surface font-medium hover:text-ember transition-colors text-sm"
          >
            {title.title}
          </Link>
          {year && (
            <span className="text-on-surface-variant text-xs">({year})</span>
          )}
          <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full ml-1">
            {isFilm ? 'FILM' : 'TV'}
          </span>
          <StatusBadge status={entry.status} />
        </div>

        {entry.review && (
          <p className="text-on-surface-variant text-sm mt-1 line-clamp-2 leading-relaxed">
            {entry.review}
          </p>
        )}
      </div>

      {/* Right: rating + rewatch */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
        {entry.rating != null && <StarDisplay rating={entry.rating} />}
        {entry.rewatch && (
          <span className="text-ember text-xs font-medium" title="Rewatch">↺</span>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const FILTER_PILLS: { label: string; value: Filter }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Films',    value: 'films' },
  { label: 'TV',       value: 'tv' },
  { label: 'Reviewed', value: 'reviewed' },
]

interface Props {
  entries: DiaryEntry[]
}

export default function DiaryClient({ entries }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = entries

    if (filter === 'films')    result = result.filter((e) => e.titles?.media_type === 'movie')
    if (filter === 'tv')       result = result.filter((e) => e.titles?.media_type === 'tv')
    if (filter === 'reviewed') result = result.filter((e) => !!e.review?.trim())

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((e) =>
        e.titles?.title.toLowerCase().includes(q),
      )
    }

    return result
  }, [entries, filter, search])

  const grouped = useMemo(() => groupByMonth(filtered), [filtered])

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center mt-24 text-center">
        <BookOpen size={48} className="text-on-surface-variant opacity-30 mb-4" />
        <p className="text-on-surface font-semibold text-lg">Your diary is empty.</p>
        <p className="text-on-surface-variant mt-1 text-sm">
          Start logging films and TV shows.
        </p>
        <Link
          href="/films"
          className="mt-6 bg-ember text-black font-label uppercase tracking-widest text-sm font-bold px-6 py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all"
        >
          Browse Films
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Filter + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          {FILTER_PILLS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-ember text-black'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your diary…"
            className="w-full sm:w-56 bg-surface-container border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-ember/50 transition-colors"
          />
        </div>
      </div>

      {/* No results after filter */}
      {filtered.length === 0 && (
        <p className="text-on-surface-variant text-sm text-center mt-16">
          No entries match your filters.
        </p>
      )}

      {/* Month groups */}
      {grouped.map(([month, monthEntries]) => (
        <div key={month}>
          <h2 className="font-display text-2xl text-cream border-b border-white/10 pb-3 mb-4 mt-10">
            {month}{' '}
            <span className="text-on-surface-variant text-base font-sans font-normal">
              · {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </h2>
          {monthEntries.map((entry) => (
            <DiaryRow key={entry.id} entry={entry} />
          ))}
        </div>
      ))}
    </>
  )
}
