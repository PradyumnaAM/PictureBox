import Link from 'next/link'
import type { Metadata } from 'next'

import AnimatedText from '@/components/motion/AnimatedText'
import FadeIn from '@/components/motion/FadeIn'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'About — PictureBox',
  description:
    'PictureBox is a film and TV social tracker built for people who take their watching seriously.',
}

export default function AboutPage() {
  return (
    <>
      <div className="bg-background min-h-screen pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-8">

          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <FadeIn y={30}>
            <h1 className="text-iris-gradient font-display text-5xl font-semibold tracking-tight">PictureBox</h1>
            <p className="text-on-surface-variant text-xl mt-2">The Discerning Curator.</p>
          </FadeIn>

          <hr className="mt-8 border-white/10" />

          {/* ── About ──────────────────────────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-cream mb-4">What is PictureBox?</h2>
            <AnimatedText
              text="PictureBox is a film and TV social tracker built for people who take their watching seriously. Log every film, every season, every episode — and see your stats grow in real time. No paywalls. No freemium gates. Everything is free, forever."
              className="text-on-surface leading-relaxed mb-4"
            />
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Existing trackers do films well but TV poorly, or vice versa. PictureBox was built
              to solve that: a single home for your entire watching life, with episode-level
              tracking, spoiler-free mode, streaming availability filters, and social features that
              let you see what the people you trust are actually watching.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Built by a film student and developer who got tired of spreadsheets and fragmented
              apps. This is the tracker we wanted to exist.
            </p>
          </section>

          <hr className="mt-10 border-white/10" />

          {/* ── TMDB Attribution (required by TMDB API ToS) ────────────────── */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-cream mb-4">Data &amp; Images</h2>

            <div className="flex items-center gap-4 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="The Movie Database (TMDB)"
                width={200}
                height={28}
                style={{ height: 'auto' }}
              />
            </div>

            <p className="text-on-surface-variant leading-relaxed mb-3">
              All film and TV data, images, and metadata are provided by{' '}
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ember hover:underline"
              >
                The Movie Database (TMDB)
              </a>
              .
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </section>

          <hr className="mt-10 border-white/10" />

          {/* ── Contact ────────────────────────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-cream mb-4">Get in Touch</h2>
            <p className="text-on-surface-variant leading-relaxed mb-3">
              For support, feedback, or press inquiries:
            </p>
            <a
              href="mailto:hello@picturebox.app"
              className="text-ember hover:underline text-lg"
            >
              hello@picturebox.app
            </a>
          </section>

          <hr className="mt-10 border-white/10" />

          {/* ── Legal links ────────────────────────────────────────────────── */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-on-surface-variant text-sm hover:text-ember transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-on-surface-variant text-sm hover:text-ember transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-on-surface-variant text-sm hover:text-ember transition-colors">
              Cookie Policy
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
