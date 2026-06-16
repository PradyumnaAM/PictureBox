'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import type { Profile } from '@/app/settings/page'

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  isLast?: boolean
}

function ToggleRow({ label, description, checked, onChange, disabled, isLast }: ToggleRowProps) {
  return (
    <div
      className={`flex justify-between items-center py-3 ${isLast ? '' : 'border-b border-white/5'}`}
    >
      <div>
        <p className="text-sm text-on-surface font-medium">{label}</p>
        {description && (
          <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 ml-4 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-ember' : 'bg-surface-variant'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

interface Props {
  profile: Profile
}

export default function PrivacySettings({ profile }: Props) {
  const [profilePublic, setProfilePublic] = useState(profile.profile_public ?? true)
  const [spoilerFree, setSpoilerFree] = useState(profile.spoiler_free_mode ?? false)
  const [saving, setSaving] = useState<string | null>(null)

  const save = async (field: string, value: boolean) => {
    setSaving(field)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error('Failed to save. Please try again.')
      // Revert
      if (field === 'profile_public') setProfilePublic(!value)
      if (field === 'spoiler_free_mode') setSpoilerFree(!value)
    } finally {
      setSaving(null)
    }
  }

  const handleProfilePublic = (next: boolean) => {
    setProfilePublic(next)
    save('profile_public', next)
  }

  const handleSpoilerFree = (next: boolean) => {
    setSpoilerFree(next)
    save('spoiler_free_mode', next)
  }

  return (
    <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-6 mb-6">
      <h2 className="font-display text-2xl text-cream mb-4">Privacy</h2>

      <ToggleRow
        label="Public profile"
        description="Allow others to view your profile, diary, and reviews."
        checked={profilePublic}
        onChange={handleProfilePublic}
        disabled={saving === 'profile_public'}
      />
      <ToggleRow
        label="Spoiler-free mode"
        description="Hide review text by default until you choose to reveal it."
        checked={spoilerFree}
        onChange={handleSpoilerFree}
        disabled={saving === 'spoiler_free_mode'}
        isLast
      />
    </div>
  )
}
