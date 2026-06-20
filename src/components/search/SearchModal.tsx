'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Film, Loader2, Search, X } from 'lucide-react'

import type { TMDBSearchResult } from '@/types/tmdb'
import type { UserSearchResult } from '@/app/api/search/users/route'
import { formatReleaseYear, getPosterUrl, slugify } from '@/lib/tmdb/helpers'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResults {
  movies: TMDBSearchResult[]
  tvShows: TMDBSearchResult[]
}

// Unified keyboard-navigation item across people and titles.
type NavItem =
  | { kind: 'user'; item: UserSearchResult }
  | { kind: 'title'; item: TMDBSearchResult }

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

interface ResultRowProps {
  item: TMDBSearchResult
  isHighlighted: boolean
  onClick: () => void
}

function ResultRow({ item, isHighlighted, onClick }: ResultRowProps) {
  const title = item.title ?? item.name ?? ''
  const year = formatReleaseYear(item.release_date ?? item.first_air_date)
  const isFilm = item.media_type === 'movie'
  const posterUrl = getPosterUrl(item.poster_path, 'sm')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors group ${
        isHighlighted ? 'bg-surface-container-highest' : 'hover:bg-surface-container-highest'
      }`}
    >
      <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-surface-container">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="text-on-surface-variant" size={16} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className={`font-medium truncate transition-colors ${
          isHighlighted ? 'text-ember' : 'text-on-surface group-hover:text-ember'
        }`}>
          {title}
        </p>
        <p className="text-on-surface-variant text-sm mt-0.5">
          {year && `${year} · `}{isFilm ? 'Film' : 'TV Show'}
        </p>
      </div>

      <ChevronRight
        size={16}
        className={`text-on-surface-variant ml-auto shrink-0 transition-opacity ${
          isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// User result row
// ---------------------------------------------------------------------------

function UserRow({
  user,
  isHighlighted,
  onClick,
}: {
  user: UserSearchResult
  isHighlighted: boolean
  onClick: () => void
}) {
  const name = user.display_name ?? user.username
  const initial = (name[0] ?? '?').toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors group ${
        isHighlighted ? 'bg-surface-container-highest' : 'hover:bg-surface-container-highest'
      }`}
    >
      <div className="w-10 h-10 rounded-full flex-shrink-0 bg-ember/15 flex items-center justify-center">
        <span className="font-display text-base font-semibold text-ember">{initial}</span>
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className={`font-medium truncate transition-colors ${
          isHighlighted ? 'text-ember' : 'text-on-surface group-hover:text-ember'
        }`}>
          {name}
        </p>
        <p className="text-on-surface-variant text-sm mt-0.5 truncate">@{user.username}</p>
      </div>

      <ChevronRight
        size={16}
        className={`text-on-surface-variant ml-auto shrink-0 transition-opacity ${
          isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [users, setUsers] = useState<UserSearchResult[]>([])
  const [trending, setTrending] = useState<TMDBSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults(null)
      setUsers([])
      setHighlightedIndex(-1)
      setIsLoading(false)
    }
  }, [isOpen])

  // Fetch trending once on open
  useEffect(() => {
    if (!isOpen) return
    fetch('/api/trending')
      .then((r) => r.json())
      .then((data: TMDBSearchResult[]) =>
        setTrending(Array.isArray(data) ? data.slice(0, 6) : []),
      )
      .catch(() => { /* non-fatal: modal works without trending data */ })
  }, [isOpen])

  // Debounced search — titles (TMDB) and people (profiles) in parallel
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setUsers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      const q = encodeURIComponent(query)
      const [titlesRes, usersRes] = await Promise.allSettled([
        fetch(`/api/search?q=${q}`).then((r) => r.json() as Promise<SearchResults>),
        fetch(`/api/search/users?q=${q}`).then(
          (r) => r.json() as Promise<{ users: UserSearchResult[] }>,
        ),
      ])

      setResults(
        titlesRes.status === 'fulfilled' ? titlesRes.value : { movies: [], tvShows: [] },
      )
      setUsers(usersRes.status === 'fulfilled' ? (usersRes.value.users ?? []) : [])
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Reset highlight when query changes
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query])

  const showTrending = query.length < 2
  const hasResults =
    (results && (results.movies.length > 0 || results.tvShows.length > 0)) || users.length > 0
  const noResults = query.length >= 2 && !isLoading && results && !hasResults

  // Flattened list used for keyboard navigation. People come first, then films,
  // then TV — matching the visual order below.
  const allResults = useMemo<NavItem[]>(() => {
    if (showTrending) return trending.map((item) => ({ kind: 'title', item }) as NavItem)
    const titleItems = results
      ? [...results.movies, ...results.tvShows].map(
          (item) => ({ kind: 'title', item }) as NavItem,
        )
      : []
    return [...users.map((item) => ({ kind: 'user', item }) as NavItem), ...titleItems]
  }, [showTrending, trending, results, users])

  const navigate = useCallback(
    (nav: NavItem) => {
      if (nav.kind === 'user') {
        router.push(`/u/${nav.item.username}`)
      } else {
        const item = nav.item
        const title = item.title ?? item.name ?? ''
        router.push(
          item.media_type === 'movie'
            ? `/film/${slugify(item.id, title)}`
            : `/tv/${slugify(item.id, title)}`,
        )
      }
      onClose()
    },
    [router, onClose],
  )

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Arrow key + Enter navigation
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, -1))
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        const nav = allResults[highlightedIndex]
        if (nav) {
          e.preventDefault()
          navigate(nav)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, allResults, highlightedIndex, navigate])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="absolute left-1/2 top-[10%] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-lg border border-ember/25 bg-surface-container-high shadow-header"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Search input ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search className="text-on-surface-variant shrink-0" size={20} />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films, TV shows, and people..."
            className="flex-1 bg-transparent text-on-surface text-lg placeholder:text-on-surface-variant focus:outline-none"
          />
          {isLoading ? (
            <Loader2 className="text-on-surface-variant animate-spin shrink-0" size={20} />
          ) : (
            <button
              type="button"
              onClick={query ? () => setQuery('') : onClose}
              aria-label={query ? 'Clear search' : 'Close search'}
              className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── Results area ── */}
        <div className="max-h-[60vh] overflow-y-auto">

          {/* Trending grid */}
          {showTrending && trending.length > 0 && (
            <div className="p-5">
              <p className="font-sans text-label uppercase tracking-widest text-on-surface-variant mb-3">
                Trending
              </p>
              <div className="grid grid-cols-3 gap-3">
                {trending.map((item, i) => {
                  const title = item.title ?? item.name ?? ''
                  const year = formatReleaseYear(item.release_date ?? item.first_air_date)
                  const isFilm = item.media_type === 'movie'
                  const posterUrl = getPosterUrl(item.poster_path, 'sm')

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate({ kind: 'title', item })}
                      className={`flex flex-col gap-2 text-left cursor-pointer group rounded-lg p-2 transition-colors ${
                        highlightedIndex === i
                          ? 'bg-surface-container-highest'
                          : 'hover:bg-surface-container-highest'
                      }`}
                    >
                      <div className="relative w-full aspect-[2/3] rounded overflow-hidden bg-surface-container">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 33vw, 200px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="text-on-surface-variant" size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium line-clamp-1 transition-colors ${
                          highlightedIndex === i ? 'text-ember' : 'text-on-surface group-hover:text-ember'
                        }`}>
                          {title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {year && (
                            <span className="text-on-surface-variant text-xs">{year}</span>
                          )}
                          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                            {isFilm ? 'FILM' : 'TV'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Search results */}
          {!showTrending && hasResults && (
            <div className="py-2">
              {/* People come first; their highlight indices are 0..users.length-1 */}
              {users.length > 0 && (
                <div>
                  <p className="font-sans text-label uppercase tracking-widest text-on-surface-variant px-5 pt-3 pb-2">
                    People
                  </p>
                  {users.map((user, i) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isHighlighted={highlightedIndex === i}
                      onClick={() => navigate({ kind: 'user', item: user })}
                    />
                  ))}
                </div>
              )}
              {results && results.movies.length > 0 && (
                <div>
                  <p className="font-sans text-label uppercase tracking-widest text-on-surface-variant px-5 pt-3 pb-2">
                    Films
                  </p>
                  {results.movies.map((item, i) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      isHighlighted={highlightedIndex === users.length + i}
                      onClick={() => navigate({ kind: 'title', item })}
                    />
                  ))}
                </div>
              )}
              {results && results.tvShows.length > 0 && (
                <div>
                  <p className="font-sans text-label uppercase tracking-widest text-on-surface-variant px-5 pt-3 pb-2">
                    TV Shows
                  </p>
                  {results.tvShows.map((item, i) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      isHighlighted={
                        highlightedIndex === users.length + results.movies.length + i
                      }
                      onClick={() => navigate({ kind: 'title', item })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <p className="text-on-surface-variant">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-on-surface-variant text-sm mt-1">
                Try searching for a different title
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/10">
          <p className="text-on-surface-variant text-xs text-center py-3">
            Powered by TMDB
          </p>
        </div>
      </div>
    </div>
  )
}
