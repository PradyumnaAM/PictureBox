'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Check, Film, Star, X } from 'lucide-react'
import { toast } from 'sonner'

import { getPosterUrl, slugify, formatReleaseYear } from '@/lib/tmdb/helpers'

export interface WatchlistItem {
  id: string
  rating: number | null
  created_at: string
  titles: {
    id: string
    tmdb_id: number
    media_type: string
    title: string
    poster_path: string | null
    release_date: string | null
  } | null
}

type Filter = 'all' | 'film' | 'tv'

interface Props {
  items: WatchlistItem[]
}

export default function WatchlistClient({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<Filter>('all')
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const filteredItems = items.filter((item) => {
    if (!item.titles) return false
    if (filter === 'film') return item.titles.media_type === 'movie'
    if (filter === 'tv') return item.titles.media_type === 'tv'
    return true
  })

  function setLoading(id: string, on: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      if (on) { next.add(id) } else { next.delete(id) }
      return next
    })
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleMarkWatched(item: WatchlistItem) {
    if (loadingIds.has(item.id)) return
    setLoading(item.id, true)
    try {
      const res = await fetch('/api/logs/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: item.id, status: 'watched' }),
      })
      if (!res.ok) throw new Error()
      removeItem(item.id)
      toast.success('Marked as watched')
    } catch {
      toast.error('Failed to update. Please try again.')
    } finally {
      setLoading(item.id, false)
    }
  }

  async function handleRemove(item: WatchlistItem) {
    if (loadingIds.has(item.id)) return
    setLoading(item.id, true)
    try {
      const res = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: item.id }),
      })
      if (!res.ok) throw new Error()
      removeItem(item.id)
      toast.success('Removed from watchlist')
    } catch {
      toast.error('Failed to remove. Please try again.')
    } finally {
      setLoading(item.id, false)
    }
  }

  const filterPills: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Films', value: 'film' },
    { label: 'TV Shows', value: 'tv' },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
        <div>
          <h1 className="text-iris-gradient font-display text-4xl md:text-5xl font-semibold tracking-tight">My Watchlist</h1>
          <p className="text-on-surface-variant mt-1">
            {items.length} title{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 mt-1">
          {filterPills.map(({ label, value }) => (
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
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center mt-24 text-center">
          <Bookmark size={48} className="text-on-surface-variant opacity-30 mb-4" />
          <p className="text-on-surface font-semibold text-lg">Your watchlist is empty.</p>
          <p className="text-on-surface-variant mt-1 text-sm">
            Start adding films and TV shows to watch later.
          </p>
          <Link
            href="/films"
            className="mt-6 bg-ember text-black font-label uppercase tracking-widest text-sm font-bold px-6 py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all"
          >
            Browse Films
          </Link>
        </div>
      )}

      {/* Grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {filteredItems.map((item) => {
            const title = item.titles
            if (!title) return null

            const posterUrl = getPosterUrl(title.poster_path, 'md')
            const year = formatReleaseYear(title.release_date)
            const slug = slugify(title.tmdb_id, title.title)
            const href = `/${title.media_type === 'movie' ? 'film' : 'tv'}/${slug}`
            const typeLabel = title.media_type === 'movie' ? 'Film' : 'TV Show'
            const isLoading = loadingIds.has(item.id)

            return (
              <div key={item.id} className="group">
                {/* Poster */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
                  {/* Clickable poster area */}
                  <Link href={href} className="absolute inset-0 z-0">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={title.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 31vw, (max-width: 768px) 23vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <Film className="w-8 h-8 text-outline" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-poster-overlay" />
                  </Link>

                  {/* User rating badge */}
                  {item.rating !== null && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-ember text-[10px] font-semibold px-1.5 py-0.5 rounded z-10">
                      <Star className="w-2.5 h-2.5 fill-ember stroke-none" />
                      {item.rating}
                    </div>
                  )}

                  {/* Action overlay — always visible on touch, hover-reveal on desktop */}
                  <div className="absolute inset-0 bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 md:gap-3 z-20">
                    <button
                      type="button"
                      onClick={() => handleMarkWatched(item)}
                      disabled={isLoading}
                      title="Mark as Watched"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-ember text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Check size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={isLoading}
                      title="Remove"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-surface-container/90 backdrop-blur text-on-surface flex items-center justify-center hover:bg-red-500/80 hover:text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Title + meta */}
                <Link href={href}>
                  <p className="font-sans font-semibold text-sm truncate text-on-surface mt-2 hover:text-ember transition-colors">
                    {title.title}
                  </p>
                </Link>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  {[year, typeLabel].filter(Boolean).join(' • ')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

