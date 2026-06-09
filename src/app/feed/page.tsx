'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

export default function FeedPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      setEmail(user.email ?? null)
    })
  }, [router])

  const signOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="bg-background min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-2xl text-gold mb-3">PictureBox</p>
      <h1 className="text-xl font-semibold text-on-surface mb-2">
        Your feed is coming soon.
      </h1>
      <p className="text-on-surface-variant mb-1">You&apos;re logged in!</p>
      {email && (
        <p className="text-on-surface-variant text-sm mb-8">{email}</p>
      )}
      <button
        type="button"
        disabled={signingOut}
        onClick={signOut}
        className="bg-gold text-black font-label uppercase font-bold px-6 py-2.5 rounded hover:bg-gold-hover active:scale-95 transition-all disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  )
}
