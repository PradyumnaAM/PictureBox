'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, ChevronDown, Star, Tv } from 'lucide-react'
import { toast } from 'sonner'

import type { TMDBSeason, TMDBSeasonSummary } from '@/types/tmdb'
import { getPosterUrl, getStillUrl } from '@/lib/tmdb/helpers'

interface SeasonAccordionProps {
  showId: number
  seasons: TMDBSeasonSummary[]
  initialSeason: TMDBSeason | null
}

export default function SeasonAccordion({
  showId,
  seasons,
  initialSeason,
}: SeasonAccordionProps) {
  const [openSeason, setOpenSeason] = useState<number | null>(
    initialSeason?.season_number ?? null,
  )
  const [seasonDataMap, setSeasonDataMap] = useState<Map<number, TMDBSeason>>(
    () => (initialSeason ? new Map([[initialSeason.season_number, initialSeason]]) : new Map()),
  )
  const [loadingSet, setLoadingSet] = useState<Set<number>>(new Set())
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set())
  const [ratingsMap, setRatingsMap] = useState<Map<number, number>>(new Map())

  // ── Restore saved progress + ratings on load ──────────────────────────────
  // Watched state and ratings are keyed by the TMDB episode id (episode.id),
  // matching the rest of this component. The GET only returns non-deleted logs,
  // so the checkbox state mirrors deleted_at IS NULL rows.
  useEffect(() => {
    let cancelled = false
    async function loadProgress() {
      try {
        const res = await fetch(`/api/logs/episode?tmdbId=${showId}`)
        if (!res.ok) return
        const { logs } = (await res.json()) as {
          logs: Array<{
            season_number: number
            episode_number: number
            episode_tmdb_id: number | null
            watched: boolean
            rating: number | null
          }>
        }
        if (cancelled || !Array.isArray(logs)) return

        const nextWatched = new Set<number>()
        const nextRatings = new Map<number, number>()
        for (const log of logs) {
          if (log.episode_tmdb_id == null) continue
          if (log.watched) nextWatched.add(log.episode_tmdb_id)
          if (log.rating != null) nextRatings.set(log.episode_tmdb_id, log.rating)
        }
        setWatchedEpisodes(nextWatched)
        setRatingsMap(nextRatings)
      } catch {
        // Non-fatal: leave progress empty if it can't be loaded.
      }
    }
    void loadProgress()
    return () => {
      cancelled = true
    }
  }, [showId])

  async function fetchSeason(seasonNumber: number) {
    setLoadingSet((prev) => new Set(prev).add(seasonNumber))
    try {
      const res = await fetch(`/api/tv/${showId}/season/${seasonNumber}`)
      if (!res.ok) throw new Error('Failed')
      const data: TMDBSeason = await res.json()
      setSeasonDataMap((prev) => new Map(prev).set(seasonNumber, data))
    } catch {
      // silently fail — user can retry by clicking the season header again
    } finally {
      setLoadingSet((prev) => {
        const next = new Set(prev)
        next.delete(seasonNumber)
        return next
      })
    }
  }

  function toggleSeason(seasonNumber: number) {
    if (openSeason === seasonNumber) {
      setOpenSeason(null)
      return
    }
    setOpenSeason(seasonNumber)
    if (!seasonDataMap.has(seasonNumber) && !loadingSet.has(seasonNumber)) {
      void fetchSeason(seasonNumber)
    }
  }

  async function toggleEpisode(
    episodeId: number,
    seasonNum: number,
    epNum: number,
    runtime: number | null,
  ) {
    const isWatched = watchedEpisodes.has(episodeId)

    // Optimistic update
    setWatchedEpisodes((prev) => {
      const next = new Set(prev)
      if (isWatched) next.delete(episodeId)
      else next.add(episodeId)
      return next
    })

    try {
      if (isWatched) {
        const res = await fetch('/api/logs/episode', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            episode_tmdb_id: episodeId,
          }),
        })
        if (!res.ok) throw new Error('Failed')
      } else {
        const res = await fetch('/api/logs/episode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdb_show_id: showId,
            season_number: seasonNum,
            episode_number: epNum,
            episode_tmdb_id: episodeId,
            runtime,
          }),
        })
        if (!res.ok) throw new Error('Failed')
      }
    } catch {
      // Revert optimistic update on error
      setWatchedEpisodes((prev) => {
        const next = new Set(prev)
        if (isWatched) next.add(episodeId)
        else next.delete(episodeId)
        return next
      })
      toast.error("Couldn't save that episode. Please try again.")
    }
  }

  async function markAllWatched(seasonNumber: number) {
    const data = seasonDataMap.get(seasonNumber)
    if (!data) return

    const episodeIds = data.episodes.map((e) => e.id)
    const allWatched =
      episodeIds.length > 0 && episodeIds.every((id) => watchedEpisodes.has(id))

    setWatchedEpisodes((prev) => {
      const next = new Set(prev)
      if (allWatched) episodeIds.forEach((id) => next.delete(id))
      else episodeIds.forEach((id) => next.add(id))
      return next
    })

    try {
      const res = await fetch('/api/logs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_type: 'tv_episodes_bulk',
          status: allWatched ? 'unwatched' : 'watched',
          tmdb_show_id: showId,
          season_number: seasonNumber,
          episodes: data.episodes.map((e) => ({
            episode_id: e.id,
            episode_number: e.episode_number,
            runtime: e.runtime ?? null,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      // revert
      setWatchedEpisodes((prev) => {
        const next = new Set(prev)
        if (allWatched) episodeIds.forEach((id) => next.add(id))
        else episodeIds.forEach((id) => next.delete(id))
        return next
      })
      toast.error("Couldn't update the season. Please try again.")
    }
  }

  async function rateEpisode(
    episodeId: number,
    seasonNum: number,
    epNum: number,
    rating: number,
    runtime: number | null,
  ) {
    const prevRating = ratingsMap.get(episodeId)

    // Optimistic update — also reflect that rating implies watched.
    setRatingsMap((prev) => new Map(prev).set(episodeId, rating))
    setWatchedEpisodes((prev) => new Set(prev).add(episodeId))

    try {
      const res = await fetch('/api/logs/episode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_show_id: showId,
          season_number: seasonNum,
          episode_number: epNum,
          episode_tmdb_id: episodeId,
          rating,
          runtime,
        }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      // Revert the rating on error (leave watched state as-is).
      setRatingsMap((prev) => {
        const next = new Map(prev)
        if (prevRating === undefined) next.delete(episodeId)
        else next.set(episodeId, prevRating)
        return next
      })
      toast.error("Couldn't save your rating. Please try again.")
    }
  }

  return (
    <div className="space-y-3">
      {seasons.map((season) => {
        const isOpen = openSeason === season.season_number
        const isLoading = loadingSet.has(season.season_number)
        const data = seasonDataMap.get(season.season_number)
        const posterUrl = getPosterUrl(season.poster_path, 'sm')
        const airYear = season.air_date?.slice(0, 4)

        const watchedCount = data
          ? data.episodes.filter((e) => watchedEpisodes.has(e.id)).length
          : 0
        const totalCount = data ? data.episodes.length : season.episode_count
        const allWatched =
          data !== undefined &&
          data.episodes.length > 0 &&
          watchedCount === data.episodes.length

        return (
          <div key={season.season_number} className="rounded-xl overflow-hidden border border-white/5">

            {/* ── Season header ── */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => toggleSeason(season.season_number)}
              onKeyDown={(e) => e.key === 'Enter' && toggleSeason(season.season_number)}
              className="w-full flex items-center gap-4 p-4 cursor-pointer bg-surface-container hover:bg-surface-container-high transition-colors select-none"
            >
              {/* Season poster */}
              <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-surface-container-highest">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={season.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tv className="text-on-surface-variant" size={16} />
                  </div>
                )}
              </div>

              {/* Season info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-on-surface font-medium">{season.name}</span>
                  {allWatched && (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
                      <Check size={10} />
                      Watched
                    </span>
                  )}
                </div>
                <p className="text-on-surface-variant text-sm mt-0.5">
                  {season.episode_count} episodes{airYear ? ` • ${airYear}` : ''}
                </p>
              </div>

              {/* Right: mark-all + chevron */}
              <div
                className="flex items-center gap-3 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {isOpen && data && (
                  <button
                    type="button"
                    onClick={() => void markAllWatched(season.season_number)}
                    className="text-xs font-medium text-ember border border-ember/40 hover:bg-ember/10 px-3 py-1 rounded-full transition-colors"
                  >
                    {allWatched ? 'Unmark all' : 'Mark all watched'}
                  </button>
                )}
                <ChevronDown
                  size={20}
                  className={`text-on-surface-variant transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* ── Progress bar ── */}
            {isOpen && data && (
              <div className="px-4 pb-2 pt-2 bg-surface-container border-b border-white/5">
                <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
                  <span>
                    {watchedCount} of {totalCount} episodes watched
                  </span>
                  <span>
                    {totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0}%
                  </span>
                </div>
                <div className="bg-surface-variant rounded-full h-1">
                  <div
                    className="bg-ember rounded-full h-1 transition-all duration-300"
                    style={{
                      width: `${totalCount > 0 ? (watchedCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── Skeleton rows while loading ── */}
            {isOpen && isLoading && !data && (
              <div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3 border-b border-white/5 animate-pulse"
                  >
                    <div className="w-5 h-5 rounded bg-surface-container-high flex-shrink-0" />
                    <div className="w-8 h-4 bg-surface-container-high rounded flex-shrink-0" />
                    <div className="w-24 h-14 rounded bg-surface-container-high flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-container-high rounded w-3/4" />
                      <div className="h-3 bg-surface-container-high rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Episode list ── */}
            {isOpen && data && (
              <div>
                {data.episodes.map((episode) => {
                  const isWatched = watchedEpisodes.has(episode.id)
                  const rating = ratingsMap.get(episode.id) ?? 0
                  const stillUrl = getStillUrl(episode.still_path)
                  const epNum = `E${String(episode.episode_number).padStart(2, '0')}`
                  const meta = [
                    episode.runtime ? `${episode.runtime}m` : '',
                    episode.air_date ? episode.air_date.slice(0, 10) : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')

                  return (
                    <div
                      key={episode.id}
                      className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-surface-container/50 group"
                    >
                      {/* Watch checkbox */}
                      <button
                        type="button"
                        onClick={() =>
                          void toggleEpisode(
                            episode.id,
                            season.season_number,
                            episode.episode_number,
                            episode.runtime ?? null,
                          )
                        }
                        aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                        className="flex-shrink-0"
                      >
                        {isWatched ? (
                          <div className="w-5 h-5 rounded bg-ember border-2 border-ember flex items-center justify-center">
                            <Check size={12} className="text-black" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-outline-variant hover:border-ember transition-colors" />
                        )}
                      </button>

                      {/* Episode number */}
                      <span className="text-on-surface-variant text-sm w-8 flex-shrink-0 font-mono">
                        {epNum}
                      </span>

                      {/* Still image */}
                      <div className="relative w-24 h-14 rounded overflow-hidden flex-shrink-0 bg-surface-container-highest">
                        {stillUrl ? (
                          <Image
                            src={stillUrl}
                            alt={episode.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="text-on-surface-variant" size={16} />
                          </div>
                        )}
                      </div>

                      {/* Episode info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-on-surface font-medium text-sm truncate group-hover:text-ember transition-colors">
                          {episode.name}
                        </p>
                        {meta && (
                          <p className="text-on-surface-variant text-xs mt-0.5">{meta}</p>
                        )}
                      </div>

                      {/* Star rating — visible on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              void rateEpisode(
                                episode.id,
                                season.season_number,
                                episode.episode_number,
                                star,
                                episode.runtime ?? null,
                              )
                            }
                            aria-label={`Rate ${star} stars`}
                            className="text-on-surface-variant hover:text-ember transition-colors"
                          >
                            <Star
                              size={14}
                              className={
                                star <= rating ? 'fill-ember text-ember' : 'fill-none'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
