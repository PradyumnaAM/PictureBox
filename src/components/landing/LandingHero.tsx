import Link from 'next/link'
import { Film, Play } from 'lucide-react'

import FadeIn from '@/components/motion/FadeIn'
import GradientButton from '@/components/motion/GradientButton'
import Magnet from '@/components/motion/Magnet'

const STATS = [
  { value: '900K+', label: 'Films & shows' },
  { value: 'Episode', label: 'Level tracking' },
  { value: 'Free', label: 'Stats, forever' },
]

export default function LandingHero() {
  return (
    <section className="relative flex min-h-[94svh] items-center justify-center overflow-hidden">
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-page-x-mobile pb-28 pt-28 text-center md:px-page-x md:pb-32 md:pt-32">
        {/* Editorial headline */}
        <FadeIn as="h1" y={40} className="font-display text-[2.75rem] font-semibold leading-[0.95] tracking-tight md:text-[5.5rem]">
          <span className="text-iris-gradient">Every film.</span>
          <br className="hidden sm:block" />{' '}
          <span className="text-iris-gradient">Every episode.</span>{' '}
          <em className="font-normal italic text-ember">Accounted for.</em>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.2} y={20} className="mx-auto mt-10 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
          <Magnet padding={90} strength={4}>
            <GradientButton href="/sign-up" size="lg">
              <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
              Start your reel — free
            </GradientButton>
          </Magnet>
          <Link
            href="/films"
            className="surface-frost group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-white/15 px-8 py-3.5 font-sans text-base font-semibold text-cream transition-colors hover:border-ember hover:text-ember active:scale-[0.98]"
          >
            <Film className="h-4 w-4 transition-transform group-hover:rotate-6" />
            See what&apos;s playing
          </Link>
        </FadeIn>

        {/* Social-proof stats */}
        <FadeIn delay={0.4} y={20} as="dl" className="mt-14 flex items-stretch justify-center divide-x divide-white/10">
          {STATS.map(({ value, label }) => (
            <div key={label} className="px-6 text-center sm:px-8">
              <dt className="font-display text-2xl font-semibold text-cream md:text-3xl">
                {value}
              </dt>
              <dd className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
                {label}
              </dd>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}
