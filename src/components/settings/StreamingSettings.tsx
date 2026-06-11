'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import type { Profile } from '@/app/settings/page'

const SERVICES = [
  { id: 8,    name: 'Netflix',      logo: 'https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: 119,  name: 'Amazon Prime', logo: 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { id: 337,  name: 'Disney+',      logo: 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19d.jpg' },
  { id: 1899, name: 'HBO Max',      logo: 'https://image.tmdb.org/t/p/original/Ajqyt5aNxNvaG0sDlXd3tP5t0MQ.jpg' },
  { id: 350,  name: 'Apple TV+',   logo: 'https://image.tmdb.org/t/p/original/4KAy34EHvRM25Ih8wb82AJE7gS5.jpg' },
  { id: 15,   name: 'Hulu',        logo: 'https://image.tmdb.org/t/p/original/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg' },
  { id: 386,  name: 'Peacock',     logo: 'https://image.tmdb.org/t/p/original/8VCV78prwd9QzZnEm0ReO6bERDa.jpg' },
  { id: 531,  name: 'Paramount+',  logo: 'https://image.tmdb.org/t/p/original/h5DcR0J2EESLitnhR8xLG1QymTE.jpg' },
]

interface Props {
  profile: Profile
}

export default function StreamingSettings({ profile }: Props) {
  const [selected, setSelected] = useState<number[]>(
    (profile.streaming_services as number[] | null) ?? [],
  )
  const [savingId, setSavingId] = useState<number | null>(null)

  const toggle = async (id: number) => {
    if (savingId !== null) return

    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id]

    setSelected(next)
    setSavingId(id)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streaming_services: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on error
      setSelected(selected)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="bg-surface-container/60 backdrop-blur border border-white/[0.06] rounded-xl p-6 mb-6">
      <h2 className="font-display text-xl text-on-surface mb-1">Streaming Services</h2>
      <p className="text-on-surface-variant text-sm mb-4">
        We&apos;ll show what&apos;s available on your services.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SERVICES.map((service) => {
          const isSelected = selected.includes(service.id)
          const isLoading = savingId === service.id
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggle(service.id)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 text-left disabled:opacity-70',
                isSelected
                  ? 'border-gold bg-gold/10'
                  : 'border-white/10 bg-surface-container/40 hover:border-gold/40',
              )}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                <Image
                  src={service.logo}
                  alt={service.name}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={cn(
                  'font-medium text-sm flex-1 truncate',
                  isSelected ? 'text-on-surface' : 'text-on-surface-variant',
                )}
              >
                {service.name}
              </span>
              {isSelected && (
                <Check className="w-4 h-4 text-gold flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
