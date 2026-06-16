'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Props {
  targetUserId: string
  targetUsername: string
  initialIsFollowing: boolean
  currentUserId: string | null
}

export default function FollowButton({
  targetUserId,
  targetUsername,
  initialIsFollowing,
  currentUserId,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)

  // Can't follow yourself — render nothing
  if (currentUserId === targetUserId) return null

  // Not logged in — link to sign-in
  if (!currentUserId) {
    return (
      <Link
        href="/sign-in"
        className="bg-ember text-black font-label uppercase tracking-widest text-sm font-bold px-5 py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all inline-block"
      >
        Follow
      </Link>
    )
  }

  const handleFollow = async () => {
    if (loading) return
    const newState = !isFollowing
    setIsFollowing(newState) // optimistic
    setLoading(true)

    try {
      const res = await fetch('/api/follows', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: targetUserId }),
      })

      if (!res.ok) {
        setIsFollowing(!newState) // revert
        const data = await res.json().catch(() => ({}))
        toast.error((data as { error?: string }).error ?? 'Something went wrong.')
      } else if (newState) {
        toast.success(`Following @${targetUsername}`)
      }
    } catch {
      setIsFollowing(!newState)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleFollow}
        disabled={loading}
        className="group relative bg-surface-container border border-white/20 text-on-surface font-label uppercase tracking-widest text-sm font-bold px-5 py-2.5 rounded hover:border-red-400/50 hover:text-red-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="group-hover:opacity-0 transition-opacity duration-150">Following</span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          Unfollow
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={loading}
      className="bg-ember text-black font-label uppercase tracking-widest text-sm font-bold px-5 py-2.5 rounded hover:bg-ember-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Follow
    </button>
  )
}
