import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import ProfileSettings from '@/components/settings/ProfileSettings'
import StreamingSettings from '@/components/settings/StreamingSettings'
import PrivacySettings from '@/components/settings/PrivacySettings'
import DangerZone from '@/components/settings/DangerZone'

export const metadata: Metadata = {
  title: 'Settings — PictureBox',
}

// Exported so client components can import the shape without a separate types file
export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  country_code: string | null
  streaming_services: number[] | null
  profile_public: boolean | null
  spoiler_free_mode: boolean | null
  created_at: string
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // RLS client: profiles_select policy exposes the user's own row always
  // (id = auth.uid() is always true for select on own profile).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = (profileData ?? {
    id: user.id,
    username: '',
    display_name: null,
    bio: null,
    country_code: 'US',
    streaming_services: [],
    profile_public: true,
    spoiler_free_mode: false,
    created_at: new Date().toISOString(),
  }) as Profile

  return (
    <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <h1 className="text-iris-gradient font-display text-3xl md:text-4xl font-semibold tracking-tight mb-8">Settings</h1>

          <ProfileSettings profile={profile} />
          <StreamingSettings profile={profile} />
          <PrivacySettings profile={profile} />
          <DangerZone />
        </div>
      </div>
  )
}

