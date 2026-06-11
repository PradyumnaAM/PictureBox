'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import type { Profile } from '@/app/settings/page'

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
]

interface Props {
  profile: Profile
}

export default function ProfileSettings({ profile }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [country, setCountry] = useState(profile.country_code ?? 'US')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName || null,
          username,
          bio: bio || null,
          country_code: country,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save profile')
        return
      }
      toast.success('Profile updated')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2.5 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-gold/60 transition-colors'
  const labelClass = 'block text-sm text-on-surface-variant mb-1.5'

  return (
    <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-6 mb-6">
      <h2 className="font-display text-xl text-on-surface mb-4">Profile</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="display-name" className={labelClass}>
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            placeholder="username"
            className={inputClass}
          />
          <p className="text-on-surface-variant text-xs mt-1">
            3–30 characters: letters, numbers, underscores only.
          </p>
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>
            Bio
            <span className="ml-2 text-xs text-on-surface-variant/60">
              {bio.length}/300
            </span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Tell people a little about yourself…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="country" className={labelClass}>
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-gold text-black font-label uppercase tracking-widest text-sm font-bold px-6 py-2.5 rounded hover:bg-gold-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
