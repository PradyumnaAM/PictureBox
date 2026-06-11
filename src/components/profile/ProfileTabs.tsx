'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Film, Star, Tv } from 'lucide-react'

import { getPosterUrl, slugify } from '@/lib/tmdb/helpers'

// ─── Shared types (exported for page.tsx) ─────────────────────────────────────

export interface TitleData {
  id: string
  tmdb_id: number
  media_type: string
  title: string
  poster_path: string | null
  release_date: string | null
}

export interface LogEntry {
  id: string
  user_id: string
  title_id: string
  log_type: string
  status: string
  rating: number | null
  review: string | null
  watched_at: string | null
  created_at: string
  titles: TitleData | TitleData[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTitle(log: LogEntry): TitleData | null {
  if (!log.titles) return null
  return Array.isArray(log.titles) ? (log.titles[0] ?? null) : log.titles
}

function detailHref(title: TitleData): string {
  const slug = slugify(title.tmdb_id, title.title)
  return title.media_type === 'movie' ? `/film/${slug}` : `/tv/${slug}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function groupByMonth(logs: LogEntry[]): [string, LogEntry[]][] {
  const map = new Map<string, LogEntry[]>()
  for (const log of logs) {
    const key = new Date(log.watched_at ?? log.created_at).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(log)
  }
  return Array.from(map.entries())
}

// ─── Star display (read-only, supports half-stars) ────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n
        const half = !full && rating >= n - 0.5
        return (
          <div key={n} className="relative w-3 h-3 flex-shrink-0">
            <Star className="absolute inset-0 w-3 h-3 text-on-surface-variant/25" />
            {full && <Star className="absolute inset-0 w-3 h-3 fill-gold text-gold" />}
            {half && (
              <Star
                className="absolute inset-0 w-3 h-3 fill-gold text-gold"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Poster card (Films / TV grid) ───────────────────────────────────────────

function PosterCard({ log }: { log: LogEntry }) {
  const title = resolveTitle(log)
  if (!title) return null

  const posterUrl = getPosterUrl(title.poster_path, 'sm')
  const href = detailHref(title)

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface-container">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title.title}
            fill
            sizes="(max-width: 768px) 33vw, 14vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {title.media_type === 'movie' ? (
              <Film className="text-on-surface-variant" size={20} />
            ) : (
              <Tv className="text-on-surface-variant" size={20} />
            )}
          </div>
        )}
        {/* Rating badge */}
        {log.rating && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 fill-gold text-gold" />
            <span className="text-gold text-[10px] font-semibold">{log.rating.toFixed(1)}</span>
          </div>
        )}
        {/* Status badge for TV */}
        {log.log_type === 'tv_show' && log.status && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
            <span className="text-white text-[9px] font-semibold uppercase tracking-wide">
              {log.status === 'watching' ? 'Watching'
                : log.status === 'completed' ? 'Done'
                : log.status === 'want_to_watch' ? 'Queue'
                : log.status === 'on_hold' ? 'Paused'
                : log.status === 'dropped' ? 'Dropped'
                : log.status}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-on-surface mt-1.5 truncate group-hover:text-gold transition-colors">
        {title.title}
      </p>
    </Link>
  )
}

// ─── Review card (with expand/collapse) ──────────────────────────────────────

function ReviewCard({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const title = resolveTitle(log)
  if (!title || !log.review) return null

  const posterUrl = getPosterUrl(title.poster_path, 'sm')
  const href = detailHref(title)
  const date = formatDate(log.watched_at ?? log.created_at)

  return (
    <div className="bg-surface-container rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3 mb-3">
        {/* Poster */}
        <Link href={href} className="flex-shrink-0">
          <div className="relative w-10 h-14 rounded overflow-hidden bg-surface-container-high">
            {posterUrl ? (
              <Image src={posterUrl} alt={title.title} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="text-on-surface-variant" size={14} />
              </div>
            )}
          </div>
        </Link>
        {/* Meta */}
        <div className="flex-1 min-w-0">
          <Link href={href} className="font-medium text-on-surface hover:text-gold transition-colors text-sm">
            {title.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-on-surface-variant text-xs">{date}</span>
            {log.rating && (
              <StarDisplay rating={log.rating} />
            )}
          </div>
        </div>
      </div>
      {/* Review text */}
      <p className={`text-on-surface-variant text-sm leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
        {log.review}
      </p>
      {log.review.split('\n').length > 4 || log.review.length > 300 ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-gold text-xs mt-2 hover:text-gold-hover transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'diary' | 'films' | 'tv' | 'reviews'

const TABS: { id: Tab; label: string }[] = [
  { id: 'diary',   label: 'Diary' },
  { id: 'films',   label: 'Films' },
  { id: 'tv',      label: 'TV Shows' },
  { id: 'reviews', label: 'Reviews' },
]

// ─── Main component ───────────────────────────────────────────────────────────

interface ProfileTabsProps {
  logs: LogEntry[]
}

export default function ProfileTabs({ logs }: ProfileTabsProps) {
  const [active, setActive] = useState<Tab>('diary')

  const diaryLogs  = logs.filter((l) => l.log_type === 'movie' || l.log_type === 'tv_show')
  const filmLogs   = logs.filter((l) => l.log_type === 'movie')
  const tvLogs     = logs.filter((l) => l.log_type === 'tv_show')
  const reviewLogs = logs.filter((l) => l.review && l.review.trim())

  const grouped = groupByMonth(diaryLogs)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/10 mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              active === id
                ? 'text-gold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
            {active === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* ── Diary ── */}
      {active === 'diary' && (
        <div>
          {diaryLogs.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No entries yet.</p>
          ) : (
            grouped.map(([month, monthLogs]: [string, LogEntry[]]) => (
              <div key={month} className="mb-8">
                <h3 className="font-display text-lg text-on-surface border-b border-white/10 pb-2 mb-4">
                  {month}
                </h3>
                {monthLogs.map((log) => {
                  const title = resolveTitle(log)
                  if (!title) return null
                  const posterUrl = getPosterUrl(title.poster_path, 'sm')
                  const href = detailHref(title)
                  const date = formatDate(log.watched_at ?? log.created_at)
                  const isFilm = title.media_type === 'movie'

                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 py-3 border-b border-white/5"
                    >
                      {/* Poster */}
                      <Link href={href} className="flex-shrink-0">
                        <div className="relative w-10 h-14 rounded overflow-hidden bg-surface-container">
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={title.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isFilm ? (
                                <Film className="text-on-surface-variant" size={14} />
                              ) : (
                                <Tv className="text-on-surface-variant" size={14} />
                              )}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={href}
                          className="text-on-surface font-medium hover:text-gold transition-colors text-sm truncate block"
                        >
                          {title.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isFilm ? 'text-gold/70' : 'text-on-surface-variant'
                            }`}
                          >
                            {isFilm ? 'Film' : 'TV'}
                          </span>
                          <span className="text-on-surface-variant text-xs">{date}</span>
                        </div>
                      </div>

                      {/* Rating */}
                      {log.rating && (
                        <div className="flex-shrink-0">
                          <StarDisplay rating={log.rating} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Films ── */}
      {active === 'films' && (
        <div>
          {filmLogs.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No films logged yet.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {filmLogs.map((log) => (
                <PosterCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TV Shows ── */}
      {active === 'tv' && (
        <div>
          {tvLogs.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No TV shows tracked yet.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {tvLogs.map((log) => (
                <PosterCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reviews ── */}
      {active === 'reviews' && (
        <div>
          {reviewLogs.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No reviews written yet.</p>
          ) : (
            reviewLogs.map((log) => <ReviewCard key={log.id} log={log} />)
          )}
        </div>
      )}
    </div>
  )
}
