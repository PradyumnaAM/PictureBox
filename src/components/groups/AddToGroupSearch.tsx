'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Film, Loader2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { getPosterUrl, formatReleaseYear } from '@/lib/tmdb/helpers'
import type { TMDBSearchResult } from '@/types/tmdb'

interface Props {
  groupId: string
}

export default function AddToGroupSearch({ groupId }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          const combined: TMDBSearchResult[] = [
            ...(data.movies ?? []),
            ...(data.tvShows ?? []),
          ].filter((r: TMDBSearchResult) => r.media_type !== 'person')
          setResults(combined.slice(0, 8))
          setOpen(combined.length > 0)
        }
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = async (result: TMDBSearchResult) => {
    if (addingId !== null) return
    setAddingId(result.id)
    try {
      const res = await fetch(`/api/groups/${groupId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: result.id,
          media_type: result.media_type === 'movie' ? 'movie' : 'tv',
          title: result.title ?? result.name ?? '',
          poster_path: result.poster_path ?? null,
          release_date: result.release_date ?? result.first_air_date ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add title')
        return
      }
      toast.success(`Added "${result.title ?? result.name}" to the group!`)
      setQuery('')
      setResults([])
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a film or TV show to add…"
          className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-ember/50 transition-colors"
        />
        {searching && (
          <Loader2
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant animate-spin"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-ember/25 bg-surface-container shadow-header">
          {results.map((result) => {
            const title = result.title ?? result.name ?? ''
            const year = formatReleaseYear(result.release_date ?? result.first_air_date)
            const posterUrl = getPosterUrl(result.poster_path, 'sm')
            const isAdding = addingId === result.id

            return (
              <button
                key={`${result.media_type}-${result.id}`}
                type="button"
                onClick={() => handleAdd(result)}
                disabled={isAdding || addingId !== null}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors text-left disabled:opacity-60"
              >
                <div className="relative w-8 h-11 rounded overflow-hidden bg-surface-container-high flex-shrink-0">
                  {posterUrl ? (
                    <Image src={posterUrl} alt={title} fill sizes="32px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={12} className="text-on-surface-variant" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{title}</p>
                  <p className="text-xs text-on-surface-variant">
                    {[year, result.media_type === 'movie' ? 'Film' : 'TV Show']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isAdding ? (
                    <Loader2 size={16} className="text-ember animate-spin" />
                  ) : (
                    <Plus size={16} className="text-on-surface-variant" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
