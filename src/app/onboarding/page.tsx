'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Data ────────────────────────────────────────────────────────────────────

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi',
  'Thriller', 'Western', 'Foreign', 'Classic', 'Indie', 'Musical',
]

const SERVICES = [
  { id: 8,    name: 'Netflix',      logo: 'https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
  { id: 9,    name: 'Amazon Prime', logo: 'https://image.tmdb.org/t/p/w92/pvske1MyAoymrs5bguRfVqYiM9a.jpg' },
  { id: 337,  name: 'Disney+',      logo: 'https://image.tmdb.org/t/p/w92/97yvRBw1GzX7fXprcF80er19ot.jpg' },
  { id: 1899, name: 'HBO Max',       logo: 'https://image.tmdb.org/t/p/w92/jbe4gVSfRlbPTdESXhEKpornsfu.jpg' },
  { id: 350,  name: 'Apple TV+',    logo: 'https://image.tmdb.org/t/p/w92/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg' },
  { id: 15,   name: 'Hulu',         logo: 'https://image.tmdb.org/t/p/w92/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg' },
  { id: 386,  name: 'Peacock',      logo: 'https://image.tmdb.org/t/p/w92/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg' },
  { id: 2303,  name: 'Paramount+',   logo: 'https://image.tmdb.org/t/p/w92/fts6X10Jn4QT0X6ac3udKEn2tJA.jpg' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [username, setUsername] = useState('')

  // Fetch current user on mount; redirect if not logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      setUserEmail(user.email ?? '')
      setUsername(
        (user.user_metadata?.username as string | undefined) ?? 'Curator',
      )
    })
  }, [router])

  // ── Genre helpers ──────────────────────────────────────────────────────────
  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    )

  // ── Service helpers ────────────────────────────────────────────────────────
  const toggleService = (id: number) =>
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  // ── Finish onboarding ──────────────────────────────────────────────────────
  const finish = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            streaming_services: selectedServices,
            favorite_genres: selectedGenres,
          })
          .eq('id', user.id)
        if (error) {
          console.error('[onboarding] failed to save preferences:', error.message)
          toast.error('Could not save your preferences. Please try again.')
          setSaving(false)
          return
        }
      }
      router.push('/feed')
    } catch (err) {
      console.error('[onboarding] unexpected error:', err)
      toast.error('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl rounded-lg border border-ember/25 bg-surface-container p-8 shadow-header md:p-12">

        {/* Logo */}
        <p className="font-display text-xl text-ember text-center mb-6">PictureBox</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'rounded-full transition-all duration-300',
                s === step ? 'w-6 h-2 bg-ember' : 'w-2 h-2 bg-white/30',
              )}
            />
          ))}
        </div>

        {/* ── STEP 1: Genres ── */}
        {step === 1 && (
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-on-surface font-semibold text-center mb-2">
              What do you love watching?
            </h1>
            <p className="text-on-surface-variant text-sm text-center mb-8">
              Pick at least 3 genres to personalise your experience.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {GENRES.map((genre) => {
                const selected = selectedGenres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={cn(
                      'border rounded-full px-4 py-2 font-label text-sm cursor-pointer transition-all duration-200',
                      selected
                        ? 'bg-ember text-black border-ember'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant hover:border-ember/50',
                    )}
                  >
                    {genre}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={selectedGenres.length < 3}
              onClick={() => setStep(2)}
              className="w-full bg-ember text-black font-label uppercase font-bold py-3 rounded-md hover:bg-ember-hover active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue {selectedGenres.length > 0 && `(${selectedGenres.length} selected)`}
            </button>
          </div>
        )}

        {/* ── STEP 2: Streaming services ── */}
        {step === 2 && (
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-on-surface font-semibold text-center mb-2">
              Where do you watch?
            </h1>
            <p className="text-on-surface-variant text-sm text-center mb-8">
              We&apos;ll show you what&apos;s available on your services.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {SERVICES.map((service) => {
                const selected = selectedServices.includes(service.id)
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left',
                      selected
                        ? 'border-ember bg-ember/10'
                        : 'border-outline-variant bg-surface-container/40 hover:border-ember/50',
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                      <Image
                        src={service.logo}
                        alt={service.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span
                      className={cn(
                        'font-medium text-sm',
                        selected ? 'text-on-surface' : 'text-on-surface-variant',
                      )}
                    >
                      {service.name}
                    </span>
                    {selected && (
                      <Check className="w-4 h-4 text-ember ml-auto shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full bg-ember text-black font-label uppercase font-bold py-3 rounded-md hover:bg-ember-hover active:scale-95 transition-all"
            >
              Continue
            </button>
            <p className="text-center mt-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Skip for now
              </button>
            </p>
          </div>
        )}

        {/* ── STEP 3: Summary ── */}
        {step === 3 && (
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-on-surface font-semibold text-center mb-2">
              You&apos;re almost in.
            </h1>
            <p className="text-on-surface-variant text-sm text-center mb-8">
              Your account is ready.
            </p>

            {/* Summary card */}
            <div className="bg-surface-container/60 border border-white/10 rounded-xl p-6 mb-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </div>
                <span className="text-on-surface font-medium text-sm">Account created</span>
              </div>
              {userEmail && (
                <p className="text-on-surface-variant text-sm pl-9">{userEmail}</p>
              )}
              <p className="text-on-surface font-semibold pl-9">
                Welcome to PictureBox, {username}!
              </p>
              {selectedGenres.length > 0 && (
                <p className="text-on-surface-variant text-sm pl-9">
                  {selectedGenres.length} genres selected · {selectedServices.length} services
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={finish}
              className="w-full bg-ember text-black font-label uppercase font-bold py-3 rounded-md hover:bg-ember-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Setting up…' : 'Start Exploring'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
