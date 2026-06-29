import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/layout/Footer'
import FollowListView, { type Person } from '@/components/profile/FollowListView'

interface PageProps {
  params: Promise<{ username: string }>
}

interface ProfileRow {
  id: string
  username: string
  display_name: string | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}’s followers — PictureBox` }
}

export default async function FollowersPage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .single()

  if (!profileData) notFound()
  const profile = profileData as ProfileRow

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Two-step fetch (ids → profiles) rather than a PostgREST embed: the generated
  // types expose no relationship for follows, and an embed can silently return
  // null people if the relationship cache is stale.
  const [{ data: followRows }, { count: followersCount }, { count: followingCount }, { data: myFollows }] =
    await Promise.all([
      supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
      user
        ? supabase.from('follows').select('following_id').eq('follower_id', user.id)
        : Promise.resolve({ data: [] as { following_id: string }[] }),
    ])

  const orderedIds = ((followRows ?? []) as { follower_id: string }[]).map((r) => r.follower_id)

  const { data: profilesData } = orderedIds.length
    ? await supabase.from('profiles').select('id, username, display_name, bio').in('id', orderedIds)
    : { data: [] as Person[] }

  const byId = new Map<string, Person>(((profilesData ?? []) as Person[]).map((p) => [p.id, p]))
  const people = orderedIds.map((id) => byId.get(id)).filter((p): p is Person => !!p)

  const followingSet = new Set<string>(
    ((myFollows ?? []) as { following_id: string }[]).map((f) => f.following_id),
  )

  return (
    <>
      <FollowListView
        username={profile.username}
        displayName={profile.display_name ?? profile.username}
        active="followers"
        followersCount={followersCount ?? 0}
        followingCount={followingCount ?? 0}
        people={people}
        followingSet={followingSet}
        currentUserId={user?.id ?? null}
      />
      <Footer />
    </>
  )
}
