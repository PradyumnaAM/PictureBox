import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import GradientButton from '@/components/motion/GradientButton'
import Magnet from '@/components/motion/Magnet'
import Footer from '@/components/layout/Footer'
import ScrollVideoHero from './ScrollVideoHero'
import CinemaScrollShowcase from './CinemaScrollShowcase'
import FeatureStack from './FeatureStack'
import Reveal from './Reveal'

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24 text-center md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/40 to-transparent"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-page-x-mobile md:px-page-x">
        <Reveal>
          <div className="mx-auto">
            <p className="mb-5 font-label text-label uppercase text-ember">
              Final reel
            </p>
            <h2 className="mx-auto max-w-3xl font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight md:text-6xl">
              <span className="text-iris-gradient">Your watchlist isn&apos;t going to</span>{' '}
              <em className="font-normal italic text-ember">watch itself</em>.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
              Join PictureBox and turn &ldquo;we should watch that sometime&rdquo; into a
              logged, rated, settled fact.
            </p>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnet padding={90} strength={4}>
              <GradientButton href="/sign-up" size="lg">
                Create your free account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GradientButton>
            </Magnet>
            <Link
              href="/about"
              className="surface-frost inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-8 py-3.5 font-sans text-base font-semibold text-on-surface-variant transition-colors hover:border-ember hover:text-ember"
            >
              Why we built this
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <>
      <ScrollVideoHero />
      <CinemaScrollShowcase />
      <FeatureStack />
      <FinalCTA />
      <Footer />
    </>
  )
}
