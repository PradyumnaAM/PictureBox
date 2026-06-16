import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import Footer from '@/components/layout/Footer'
import LandingHero from './LandingHero'
import { type PosterWallItem } from './PosterWall'
import { type TickerItem } from './TrendingTicker'
import FeatureSection from './FeatureSection'
import Reveal from './Reveal'
import {
  DiaryMock,
  FeedMock,
  GroupMock,
  ProgressMock,
  SearchMock,
  StatsMock,
  StreamingMock,
} from './mocks'

interface LandingPageProps {
  posters: PosterWallItem[]
  tickerItems: TickerItem[]
}

function FinalCTA() {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden border-t border-white/[0.05]">
      {/* Ember ambience + sprockets framing the closing card */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[30rem] rounded-full bg-ember/[0.07] blur-[140px] pointer-events-none"
      />
      <div className="relative max-w-page mx-auto px-4 md:px-16 text-center">
        <Reveal>
          <p className="font-label text-label uppercase text-ember mb-6">
            Final reel
          </p>
        </Reveal>
        <Reveal delay={50}>
          <h2 className="font-display text-4xl md:text-6xl text-cream tracking-tight font-semibold leading-[1.08] max-w-3xl mx-auto">
            Your watchlist isn&apos;t going to{' '}
            <em className="text-ember font-medium">watch itself</em>.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-on-surface-variant text-lg md:text-xl mt-6 max-w-xl mx-auto">
            Join PictureBox and turn &ldquo;we should watch that sometime&rdquo; into a
            logged, rated, settled fact.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/sign-up"
              className="group inline-flex items-center justify-center gap-2 bg-ember text-background font-label text-label uppercase font-medium px-10 py-4 rounded-md hover:bg-ember-hover active:scale-[0.98] transition-all shadow-[0_8px_32px_-4px_rgba(255,77,46,0.45)]"
            >
              Create your free account
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center font-label text-label uppercase text-on-surface-variant px-10 py-4 rounded-md hover:text-ember transition-colors"
            >
              Why we built this
            </Link>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <p className="font-mono text-xs text-on-surface-variant/60 mt-9">
            FREE FOREVER · ALL STATS INCLUDED · NO CREDIT CARD, NO PREMIUM TIER, NO CATCH
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export default function LandingPage({ posters, tickerItems }: LandingPageProps) {
  return (
    <>
      <LandingHero posters={posters} tickerItems={tickerItems} />

      {/* 1 ── Track films and TV properly */}
      <FeatureSection
        eyebrow="The Diary"
        title={
          <>
            Track films and TV like they&apos;re <em className="text-ember font-medium">equals</em>.
          </>
        }
        description={
          <>
            <p>
              Most trackers treat TV as an afterthought — a checkbox bolted onto a film
              site. PictureBox logs a season finale with the same care as a first watch
              of a classic: rate it, review it, date it, and get back to your evening.
            </p>
            <p>
              One diary. Films, seasons, and single episodes, all in the same timeline.
            </p>
          </>
        }
        bullets={[
          'Log a whole season as one entry, or episode by episode',
          'Half-star ratings, rewatch flags, and spoiler-safe reviews',
          'Your full watch history, searchable and filterable',
        ]}
        visual={<DiaryMock />}
      />

      {/* 2 ── TV progress tracking */}
      <FeatureSection
        flip
        tinted
        eyebrow="Episode-Level Tracking"
        title={
          <>
            Know exactly where you are in <em className="text-ember font-medium">every show</em>.
          </>
        }
        description={
          <>
            <p>
              Three shows on the go and a fourth on pause? PictureBox keeps a progress
              bar for each one — down to the episode — so &ldquo;wait, did we watch this
              one?&rdquo; never happens again.
            </p>
            <p>
              Mark an episode in one tap, a season in two. Pick any show back up months
              later and know precisely where you left off.
            </p>
          </>
        }
        visual={<ProgressMock />}
      />

      {/* 3 ── Free stats */}
      <FeatureSection
        eyebrow="Stats for Everyone"
        title={
          <>
            Your year in film. <em className="text-ember font-medium">Free</em>, not premium.
          </>
        }
        description={
          <>
            <p>
              Hours watched, genre obsessions, most-rewatched directors, your busiest
              watching month — PictureBox counts everything you log and turns it into
              stats worth screenshotting.
            </p>
            <p>
              Other platforms paywall this. We think the numbers are the whole point,
              so every stat ships free. Including your year-in-review.
            </p>
          </>
        }
        bullets={[
          'Hours watched across films and TV, combined',
          'Genre and decade breakdowns that update live',
          'A shareable year-in-review every December',
        ]}
        visual={<StatsMock />}
      />

      {/* 4 ── Friends activity */}
      <FeatureSection
        flip
        tinted
        eyebrow="Social, Not Algorithmic"
        title={
          <>
            Discover through <em className="text-ember font-medium">people</em>, not algorithms.
          </>
        }
        description={
          <>
            <p>
              The best recommendation you ever got came from a person, not a
              &ldquo;Because you watched&rdquo; row. Follow friends and critics whose
              taste you trust, and your feed becomes exactly that: what they watched,
              what they thought, nothing injected in between.
            </p>
          </>
        }
        bullets={[
          'A feed of real opinions from people you chose to follow',
          'See ratings from your circle right on every title page',
          'No promoted titles, no engagement bait',
        ]}
        visual={<FeedMock />}
      />

      {/* 5 ── Group watchlists */}
      <FeatureSection
        eyebrow="Group Watchlists"
        title={
          <>
            Decide what to watch before the <em className="text-ember font-medium">popcorn</em> gets
            cold.
          </>
        }
        description={
          <>
            <p>
              The forty-five minute scroll-and-argue is a solved problem. Create a group
              with friends, throw titles into a shared list, vote, and watch the winner.
            </p>
            <p>
              Movie night, long-distance watch parties, the family rewatch project —
              one invite code and everyone&apos;s in.
            </p>
          </>
        }
        visual={<GroupMock />}
      />

      {/* 6 ── Streaming availability */}
      <FeatureSection
        flip
        tinted
        eyebrow="Streaming Availability"
        title={
          <>
            Know where it&apos;s streaming <em className="text-ember font-medium">before</em> you
            commit.
          </>
        }
        description={
          <>
            <p>
              Tell PictureBox which services you pay for, and every title shows you —
              in your country — whether you can actually press play tonight or whether
              it&apos;s a rental.
            </p>
            <p>
              In groups, it gets better: see what&apos;s available on{' '}
              <em>everyone&apos;s</em> services, so the winning vote is always watchable.
            </p>
          </>
        }
        visual={<StreamingMock />}
      />

      {/* 7 ── Search */}
      <FeatureSection
        eyebrow="One Search"
        title={
          <>
            One search for <em className="text-ember font-medium">everything</em>.
          </>
        }
        description={
          <>
            <p>
              Films and TV live in the same index, so you stop thinking about which app
              to open. Type three letters, hit enter, log it — the whole loop takes
              about five seconds.
            </p>
            <p>
              <kbd className="text-ember font-mono text-sm">⌘K</kbd> from anywhere on the
              site. Muscle memory will do the rest.
            </p>
          </>
        }
        visual={<SearchMock />}
      />

      <FinalCTA />
      <Footer />
    </>
  )
}
