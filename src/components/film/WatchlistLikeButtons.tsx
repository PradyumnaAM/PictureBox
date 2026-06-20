'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Heart, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TitleMeta {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  release_date: string | null
}

interface Props {
  title: TitleMeta
  isLoggedIn: boolean
  /** Whether the user's existing log for this title is on the watchlist. */
  initialOnWatchlist: boolean
  /** Whether the user has liked this title. */
  initialLiked: boolean
  /** The id of the user's existing log for this title, if any. */
  initialLogId: string | null
}

const baseClass =
  'bg-surface-container/60 backdrop-blur border border-white/20 text-white font-label ' +
  'uppercase font-bold px-6 py-3 rounded flex items-center gap-2 hover:bg-white/10 ' +
  'transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed'

export default function WatchlistLikeButtons({
  title,
  isLoggedIn,
  initialOnWatchlist,
  initialLiked,
  initialLogId,
}: Props) {
  const router = useRouter()

  const [onWatchlist, setOnWatchlist] = useState(initialOnWatchlist)
  const [liked, setLiked] = useState(initialLiked)
  const [logId, setLogId] = useState<string | null>(initialLogId)
  const [watchlistBusy, setWatchlistBusy] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)

  const requireAuth = () => {
    toast.error('Sign in to do that.')
    router.push('/sign-in')
  }

  // ── Watchlist toggle ──────────────────────────────────────────────────────
  const toggleWatchlist = async () => {
    if (!isLoggedIn) return requireAuth()
    if (watchlistBusy) return

    const next = !onWatchlist
    setOnWatchlist(next) // optimistic
    setWatchlistBusy(true)

    try {
      if (next) {
        // Add to watchlist — upserts the title + the user's log via /api/logs.
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_id: title.tmdb_id,
            media_type: title.media_type,
            title: title.title,
            poster_path: title.poster_path,
            release_date: title.release_date,
            status: 'want_to_watch',
          }),
        })
        if (!res.ok) throw new Error()
        let data: { log?: { id?: string } } = {}
        try { data = await res.json() } catch { /* log.id unavailable, remove still works */ }
        if (data.log?.id) setLogId(data.log.id)
      } else {
        // Remove from watchlist — soft-delete the user's existing log.
        if (!logId) throw new Error('missing log id')
        const res = await fetch('/api/logs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ log_id: logId }),
        })
        if (!res.ok) throw new Error()
        setLogId(null)
      }

      toast.success(next ? 'Added to watchlist.' : 'Removed from watchlist.')
      router.refresh()
    } catch {
      setOnWatchlist(!next) // revert
      toast.error('Something went wrong. Please try again.')
    } finally {
      setWatchlistBusy(false)
    }
  }

  // ── Like toggle ───────────────────────────────────────────────────────────
  const toggleLike = async () => {
    if (!isLoggedIn) return requireAuth()
    if (likeBusy) return

    const next = !liked
    setLiked(next) // optimistic
    setLikeBusy(true)

    try {
      const res = await fetch('/api/logs/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: title.tmdb_id,
          media_type: title.media_type,
          title: title.title,
          poster_path: title.poster_path,
          release_date: title.release_date,
          liked: next,
        }),
      })

      if (!res.ok) throw new Error()
      let data: { liked?: boolean } = {}
      try { data = await res.json() } catch { /* optimistic state already applied */ }
      if (typeof data.liked === 'boolean') setLiked(data.liked)
      toast.success(next ? 'Liked.' : 'Removed like.')
      router.refresh()
    } catch {
      setLiked(!next) // revert
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLikeBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleWatchlist}
        disabled={watchlistBusy}
        aria-pressed={onWatchlist}
        className={cn(baseClass, onWatchlist && 'border-ember text-ember')}
      >
        {watchlistBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : onWatchlist ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {onWatchlist ? 'On Watchlist' : 'Watchlist'}
      </button>

      <button
        type="button"
        onClick={toggleLike}
        disabled={likeBusy}
        aria-pressed={liked}
        className={cn(baseClass, liked && 'border-ember text-ember')}
      >
        {likeBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={cn('w-4 h-4', liked && 'fill-ember')} />
        )}
        {liked ? 'Liked' : 'Like'}
      </button>
    </>
  )
}
