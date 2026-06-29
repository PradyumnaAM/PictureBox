import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

import FollowButton from './FollowButton'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Person {
  id: string
  username: string
  display_name: string | null
  bio: string | null
}

interface Props {
  /** Whose connections these are. */
  username: string
  displayName: string
  /** Which list is being shown. */
  active: 'followers' | 'following'
  followersCount: number
  followingCount: number
  people: Person[]
  /** IDs the *current* viewer already follows — drives each card's button. */
  followingSet: Set<string>
  currentUserId: string | null
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

function Tab({
  href,
  label,
  count,
  active,
}: {
  href: string
  label: string
  count: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={
        'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ' +
        (active
          ? 'border-ember text-on-surface'
          : 'border-transparent text-on-surface-variant hover:text-on-surface')
      }
    >
      {label}
      <span
        className={
          'rounded-full px-2 py-0.5 font-mono text-xs ' +
          (active ? 'bg-ember/15 text-ember' : 'bg-white/[0.06] text-on-surface-variant')
        }
      >
        {count}
      </span>
    </Link>
  )
}

// ─── View ─────────────────────────────────────────────────────────────────────

export default function FollowListView({
  username,
  displayName,
  active,
  followersCount,
  followingCount,
  people,
  followingSet,
  currentUserId,
}: Props) {
  const emptyMessage =
    active === 'following'
      ? `@${username} isn’t following anyone yet.`
      : `@${username} doesn’t have any followers yet.`

  return (
    <div className="bg-background min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 md:px-16">
        {/* Back to profile */}
        <Link
          href={`/u/${username}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-on-surface-variant transition-colors hover:text-ember"
        >
          <ArrowLeft className="h-4 w-4" />
          {displayName}
        </Link>

        {/* Tabs */}
        <div className="mb-8 flex gap-6 border-b border-white/[0.07]">
          <Tab
            href={`/u/${username}/followers`}
            label="Followers"
            count={followersCount}
            active={active === 'followers'}
          />
          <Tab
            href={`/u/${username}/following`}
            label="Following"
            count={followingCount}
            active={active === 'following'}
          />
        </div>

        {/* List */}
        {people.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container">
              <Users size={28} className="text-on-surface-variant opacity-40" />
            </div>
            <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {people.map((person) => {
              const name = person.display_name ?? person.username
              const initial = (name[0] ?? '?').toUpperCase()
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-container/60 p-4 backdrop-blur"
                >
                  <Link
                    href={`/u/${person.username}`}
                    className="group flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ember">
                      <span className="font-display text-lg font-semibold text-black">
                        {initial}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface transition-colors group-hover:text-ember">
                        {name}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        @{person.username}
                      </p>
                    </div>
                  </Link>
                  <div className="flex-shrink-0">
                    <FollowButton
                      targetUserId={person.id}
                      targetUsername={person.username}
                      initialIsFollowing={followingSet.has(person.id)}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
