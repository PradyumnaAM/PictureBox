'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Film, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'

import { getPosterUrl, slugify, formatReleaseYear } from '@/lib/tmdb/helpers'

export interface GroupItem {
  id: string
  group_id: string
  vote_count: number
  watched: boolean
  titles: {
    id: string
    tmdb_id: number
    media_type: string
    title: string
    poster_path: string | null
    release_date: string | null
  } | null
}

interface Props {
  items: GroupItem[]
  groupId: string
  currentUserId: string
  initialVotedItemIds: string[]
}

export default function GroupItemsList({
  items,
  groupId,
  currentUserId,
  initialVotedItemIds,
}: Props) {
  const [localItems, setLocalItems] = useState(items)
  const [votedIds, setVotedIds] = useState(() => new Set(initialVotedItemIds))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  // Sync when server provides updated items (e.g., after AddToGroupSearch refresh)
  const itemsRef = useRef(items)
  useEffect(() => {
    if (items !== itemsRef.current) {
      itemsRef.current = items
      setLocalItems(items)
    }
  }, [items])

  // Suppress unused-variable warning — currentUserId reserved for future per-user UI
  void currentUserId

  function setLoading(id: string, on: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })
  }

  const handleVote = async (itemId: string) => {
    if (loadingIds.has(itemId)) return
    const hadVoted = votedIds.has(itemId)
    const delta = hadVoted ? -1 : 1

    // Optimistic update
    setVotedIds((prev) => {
      const next = new Set(prev)
      hadVoted ? next.delete(itemId) : next.add(itemId)
      return next
    })
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, vote_count: Math.max(0, item.vote_count + delta) }
          : item,
      ),
    )

    setLoading(itemId, true)
    try {
      const res = await fetch(`/api/groups/${groupId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert
      setVotedIds((prev) => {
        const next = new Set(prev)
        hadVoted ? next.add(itemId) : next.delete(itemId)
        return next
      })
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, vote_count: Math.max(0, item.vote_count - delta) }
            : item,
        ),
      )
      toast.error('Failed to update vote.')
    } finally {
      setLoading(itemId, false)
    }
  }

  const handleWatched = async (itemId: string) => {
    if (loadingIds.has(itemId)) return
    const snapshot = localItems

    // Optimistic: remove from list
    setLocalItems((prev) => prev.filter((item) => item.id !== itemId))
    setLoading(itemId, true)

    try {
      const res = await fetch(`/api/groups/${groupId}/items/${itemId}/watched`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error()
      toast.success('Marked as watched!')
    } catch {
      setLocalItems(snapshot)
      toast.error('Failed to mark as watched.')
    } finally {
      setLoading(itemId, false)
    }
  }

  if (localItems.length === 0) {
    return (
      <p className="text-on-surface-variant text-sm text-center mt-8">
        No titles in this watchlist yet. Add something above!
      </p>
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {localItems.map((item) => {
        const title = item.titles
        if (!title) return null

        const posterUrl = getPosterUrl(title.poster_path, 'sm')
        const slug = slugify(title.tmdb_id, title.title)
        const href = title.media_type === 'movie' ? `/film/${slug}` : `/tv/${slug}`
        const year = formatReleaseYear(title.release_date)
        const hasVoted = votedIds.has(item.id)
        const isLoading = loadingIds.has(item.id)

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl"
          >
            {/* Poster */}
            <Link href={href} className="flex-shrink-0">
              <div className="relative w-12 h-16 rounded overflow-hidden bg-surface-container-high">
                {posterUrl ? (
                  <Image src={posterUrl} alt={title.title} fill sizes="48px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="text-on-surface-variant" size={14} />
                  </div>
                )}
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={href}
                className="text-on-surface font-medium text-sm hover:text-ember transition-colors block truncate"
              >
                {title.title}
              </Link>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {[year, title.media_type === 'movie' ? 'Film' : 'TV Show']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            {/* Vote count */}
            <div className="flex-shrink-0 text-center w-10">
              <p className="font-display text-2xl text-ember leading-none">{item.vote_count}</p>
              <p className="text-on-surface-variant text-[10px] mt-0.5">votes</p>
            </div>

            {/* Vote button */}
            <button
              type="button"
              onClick={() => handleVote(item.id)}
              disabled={isLoading}
              title={hasVoted ? 'Remove vote' : 'Vote for this'}
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${
                hasVoted
                  ? 'bg-ember text-black'
                  : 'bg-surface-container border border-white/10 text-on-surface-variant hover:border-ember/40 hover:text-ember'
              }`}
            >
              <ThumbsUp size={16} strokeWidth={hasVoted ? 2.5 : 1.5} />
            </button>

            {/* Watched button */}
            <button
              type="button"
              onClick={() => handleWatched(item.id)}
              disabled={isLoading}
              title="Mark as watched"
              className="flex-shrink-0 w-9 h-9 rounded-full bg-surface-container border border-white/10 text-on-surface-variant hover:border-green-500/40 hover:text-green-400 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
