'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, ChevronDown, ChevronUp, Film, Pencil, Search, Star } from 'lucide-react'

import { getPosterUrl, slugify, formatReleaseYear } from '@/lib/tmdb/helpers'
import LogModal from '@/components/film/LogModal'

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
  contains_spoilers: boolean
  season: { season_number: number } | null
  episode: { episode_number: number } | null
  titles: {
    id: string
    tmdb_id: number
    media_type: string
    title: string
    poster_path: string | null
    release_date: string | null
  } | null
}

interface EpisodeMini {
  id: string
  season_number: number
  episode_number: number
  watched_at: string | null
  rating: number | null
}

interface TVShowGroup {
  kind: 'tv_group'
  key: string
  title: DiaryEntry['titles']
  episodes: EpisodeMini[]
  latestWatchedAt: string | null
}

type DiaryItem =
  | { kind: 'single'; entry: DiaryEntry }
  | TVShowGroup

type Filter = 'all' | 'films' | 'tv' | 'reviewed'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthKey(dateStr: string | null, fallback: string): string {
  const d = new Date(dateStr ?? fallback)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function dayNumber(dateStr: string | null): string {
  if (!dateStr) return '–'
  return String(new Date(dateStr).getDate())
}

function entryHref(titles: DiaryEntry['titles']): string {
  if (!titles) return '#'
  const slug = slugify(titles.tmdb_id, titles.title)
  return titles.media_type === 'movie' ? `/film/${slug}` : `/tv/${slug}`
}

function episodeLabel(ep: EpisodeMini, allSameSeason: boolean): string {
  return allSameSeason ? `Ep ${ep.episode_number}` : `S${ep.season_number}E${ep.episode_number}`
}

function buildEpisodeSummary(episodes: EpisodeMini[]): string {
  const sorted = [...episodes].sort(
    (a, b) => a.season_number - b.season_number || a.episode_number - b.episode_number,
  )
  const seasons = new Set(sorted.map((e) => e.season_number))
  const sameSeason = seasons.size === 1

  const labels = sorted.map((e) => episodeLabel(e, sameSeason))
  const MAX = 6
  if (labels.length <= MAX) return labels.join(', ')
  return labels.slice(0, MAX).join(', ') + ` +${labels.length - MAX} more`
}

// Group entries per month then per tv-show within that month.
function processEntries(entries: DiaryEntry[]): [string, DiaryItem[]][] {
  // month → (tv titleId → TVShowGroup, order-preserved items)
  const monthMap = new Map<string, { tvGroups: Map<string, TVShowGroup>; items: DiaryItem[] }>()

  for (const entry of entries) {
    const mk = monthKey(entry.watched_at, entry.created_at)

    if (!monthMap.has(mk)) {
      monthMap.set(mk, { tvGroups: new Map(), items: [] })
    }
    const bucket = monthMap.get(mk)!

    if (entry.log_type === 'tv_episode' && entry.titles?.id) {
      const titleId = entry.titles.id
      if (!bucket.tvGroups.has(titleId)) {
        const group: TVShowGroup = {
          kind: 'tv_group',
          key: `${mk}::${titleId}`,
          title: entry.titles,
          episodes: [],
          latestWatchedAt: null,
        }
        bucket.tvGroups.set(titleId, group)
        bucket.items.push(group)
      }
      const group = bucket.tvGroups.get(titleId)!
      group.episodes.push({
        id: entry.id,
        season_number: entry.season?.season_number ?? 0,
        episode_number: entry.episode?.episode_number ?? 0,
        watched_at: entry.watched_at,
        rating: entry.rating,
      })
      if (
        entry.watched_at &&
        (!group.latestWatchedAt || entry.watched_at > group.latestWatchedAt)
      ) {
        group.latestWatchedAt = entry.watched_at
      }
    } else {
      bucket.items.push({ kind: 'single', entry })
    }
  }

  return Array.from(monthMap.entries()).map(([month, bucket]) => [month, bucket.items] as [string, DiaryItem[]])
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n
        const half = !full && rating >= n - 0.5
        return (
          <div key={n} className="relative h-3 w-3 flex-shrink-0">
            <Star className="absolute inset-0 h-3 w-3 text-on-surface-variant/25" />
            {full && <Star className="absolute inset-0 h-3 w-3 fill-ember text-ember" />}
            {half && (
              <Star
                className="absolute inset-0 h-3 w-3 fill-ember text-ember"
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
    watching:  'bg-amber-500/15 text-amber-400',
    dropped:   'bg-red-500/15 text-red-400',
    on_hold:   'bg-blue-500/15 text-blue-400',
    completed: 'bg-green-500/15 text-green-400',
  }
  const labels: Record<string, string> = {
    watching:  'Watching',
    dropped:   'Dropped',
    on_hold:   'On Hold',
    completed: 'Completed',
  }
  const cls = styles[status] ?? 'bg-surface-container text-on-surface-variant'
  return (
    <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

function Poster({
  posterPath,
  title,
  href,
}: {
  posterPath: string | null
  title: string
  href: string
}) {
  const url = getPosterUrl(posterPath, 'sm')
  return (
    <Link href={href} className="flex-shrink-0">
      <div className="relative h-14 w-10 overflow-hidden rounded bg-surface-container">
        {url ? (
          <Image src={url} alt={title} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="text-on-surface-variant" size={14} />
          </div>
        )}
      </div>
    </Link>
  )
}

// Single film/show log row (non-episode)
function DiaryRow({ entry, onEdit }: { entry: DiaryEntry; onEdit: (e: DiaryEntry) => void }) {
  const title = entry.titles
  if (!title) return null
  const href = entryHref(title)
  const year = formatReleaseYear(title.release_date)
  const isFilm = title.media_type === 'movie'

  return (
    <div className="flex items-start gap-4 border-b border-white/5 py-4 group">
      <div className="w-8 flex-shrink-0 pt-1 text-center">
        <span className="font-display text-2xl leading-none text-on-surface-variant">
          {dayNumber(entry.watched_at)}
        </span>
      </div>

      <Poster posterPath={title.poster_path} title={title.title} href={href} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <Link href={href} className="text-sm font-medium text-on-surface transition-colors hover:text-ember">
            {title.title}
          </Link>
          {year && <span className="text-xs text-on-surface-variant">({year})</span>}
          <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
            {isFilm ? 'FILM' : 'TV'}
          </span>
          <StatusBadge status={entry.status} />
        </div>
        {entry.review && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
            {entry.review}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-2 pt-0.5">
        {entry.rating != null && <StarDisplay rating={entry.rating} />}
        {entry.rewatch && <span className="text-xs font-medium text-ember" title="Rewatch">↺</span>}
        {/* Pencil edit button — always visible so users can add/edit the review */}
        <button
          type="button"
          onClick={() => onEdit(entry)}
          aria-label="Edit log"
          className="p-1 text-on-surface-variant/40 transition-colors hover:text-ember group-hover:text-on-surface-variant"
        >
          <Pencil size={13} />
        </button>
      </div>
    </div>
  )
}

// Grouped TV show row (collapses all episodes into one)
function TVGroupRow({ group }: { group: TVShowGroup }) {
  const [open, setOpen] = useState(false)
  const title = group.title
  if (!title) return null

  const href = entryHref(title)
  const year = formatReleaseYear(title.release_date)

  const sorted = useMemo(
    () =>
      [...group.episodes].sort(
        (a, b) => a.season_number - b.season_number || a.episode_number - b.episode_number,
      ),
    [group.episodes],
  )

  const seasons = useMemo(() => new Set(sorted.map((e) => e.season_number)), [sorted])
  const sameSeason = seasons.size === 1
  const summary = buildEpisodeSummary(group.episodes)

  return (
    <div className="border-b border-white/5">
      {/* Collapsed header row */}
      <div className="flex items-start gap-4 py-4">
        <div className="w-8 flex-shrink-0 pt-1 text-center">
          <span className="font-display text-2xl leading-none text-on-surface-variant">
            {dayNumber(group.latestWatchedAt)}
          </span>
        </div>

        <Poster posterPath={title.poster_path} title={title.title} href={href} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <Link href={href} className="text-sm font-medium text-on-surface transition-colors hover:text-ember">
              {title.title}
            </Link>
            {year && <span className="text-xs text-on-surface-variant">({year})</span>}
            <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
              TV
            </span>
          </div>

          {/* Episode summary line */}
          <p className="mt-1 text-xs text-on-surface-variant">
            <span className="text-ember font-medium">Watched:</span>{' '}
            {summary}
          </p>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse episodes' : 'Expand episodes'}
          className="flex-shrink-0 flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-on-surface-variant transition-colors hover:border-ember/50 hover:text-ember"
        >
          <span className="hidden sm:inline">{group.episodes.length} ep</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded episode list */}
      {open && (
        <div className="mb-3 ml-12 space-y-1 rounded-lg border border-white/[0.07] bg-surface-container-low p-3">
          {sorted.map((ep) => (
            <div
              key={ep.id}
              className="flex items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-white/[0.04]"
            >
              <span className="font-mono text-xs text-cream">
                {sameSeason
                  ? `Ep ${ep.episode_number}`
                  : `S${ep.season_number} Ep ${ep.episode_number}`}
              </span>
              {ep.watched_at && (
                <span className="text-xs text-on-surface-variant">
                  {new Date(ep.watched_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {ep.rating != null && (
                <span className="flex items-center gap-0.5 font-mono text-xs text-ember">
                  <Star size={10} className="fill-ember" />
                  {ep.rating}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
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
  const [editEntry, setEditEntry] = useState<DiaryEntry | null>(null)

  const filtered = useMemo(() => {
    let result = entries

    if (filter === 'films')    result = result.filter((e) => e.titles?.media_type === 'movie')
    if (filter === 'tv')       result = result.filter((e) => e.titles?.media_type === 'tv')
    if (filter === 'reviewed') result = result.filter((e) => !!e.review?.trim())

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((e) => e.titles?.title.toLowerCase().includes(q))
    }

    return result
  }, [entries, filter, search])

  const grouped = useMemo(() => processEntries(filtered), [filtered])

  const totalItems = useMemo(
    () =>
      grouped.reduce(
        (sum, [, items]) =>
          sum + items.reduce((s, item) => s + (item.kind === 'tv_group' ? 1 : 1), 0),
        0,
      ),
    [grouped],
  )

  if (entries.length === 0) {
    return (
      <div className="mt-24 flex flex-col items-center text-center">
        <BookOpen size={48} className="mb-4 opacity-30 text-on-surface-variant" />
        <p className="text-lg font-semibold text-on-surface">Your diary is empty.</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Start logging films and TV shows.
        </p>
        <Link
          href="/films"
          className="mt-6 rounded bg-ember px-6 py-2.5 font-label text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-ember-hover active:scale-95"
        >
          Browse Films
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Filter + search */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
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
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your diary…"
            className="w-full rounded-full border border-white/10 bg-surface-container py-1.5 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-colors focus:border-ember/50 focus:outline-none sm:w-56"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-sm text-on-surface-variant">
          No entries match your filters.
        </p>
      )}

      {/* Month groups */}
      {grouped.map(([month, items]) => (
        <div key={month}>
          <h2 className="mt-10 border-b border-white/10 pb-3 font-display text-2xl text-cream">
            {month}{' '}
            <span className="font-sans text-base font-normal text-on-surface-variant">
              · {items.length} {items.length === 1 ? 'entry' : 'entries'}
            </span>
          </h2>

          {items.map((item) =>
            item.kind === 'tv_group' ? (
              <TVGroupRow key={item.key} group={item} />
            ) : (
              <DiaryRow key={item.entry.id} entry={item.entry} onEdit={setEditEntry} />
            ),
          )}
        </div>
      ))}

      {totalItems === 0 && filtered.length > 0 && null}

      {/* Edit log modal */}
      {editEntry?.titles && (
        <LogModal
          isOpen
          onClose={() => setEditEntry(null)}
          movie={{
            id: editEntry.titles.tmdb_id,
            title: editEntry.titles.title,
            poster_path: editEntry.titles.poster_path,
            release_date: editEntry.titles.release_date ?? '',
            media_type: editEntry.titles.media_type as 'movie' | 'tv',
          }}
          titleId={editEntry.titles.id}
          existingLog={{
            id: editEntry.id,
            status: editEntry.status,
            rating: editEntry.rating,
            review: editEntry.review,
            watched_at: editEntry.watched_at,
            contains_spoilers: editEntry.contains_spoilers ?? false,
            rewatch: editEntry.rewatch ?? false,
          }}
        />
      )}
    </>
  )
}
