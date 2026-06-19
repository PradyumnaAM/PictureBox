import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

import StackingCards, { StackingCard } from '@/components/motion/StackingCards'
import {
  DiaryMock,
  FeedMock,
  GroupMock,
  ProgressMock,
  SearchMock,
  StatsMock,
  StreamingMock,
} from './mocks'

interface Feature {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  bullets?: string[]
  visual: ReactNode
}

const FEATURES: Feature[] = [
  {
    eyebrow: 'The Diary',
    title: (
      <>
        Track films and TV like they&apos;re{' '}
        <em className="font-normal italic text-ember">equals</em>.
      </>
    ),
    description: (
      <>
        Most trackers treat TV as an afterthought — a checkbox bolted onto a film site.
        PictureBox logs a season finale with the same care as a first watch of a classic:
        rate it, review it, date it, and get back to your evening.
      </>
    ),
    bullets: [
      'Log a whole season as one entry, or episode by episode',
      'Half-star ratings, rewatch flags, and spoiler-safe reviews',
      'Your full watch history, searchable and filterable',
    ],
    visual: <DiaryMock />,
  },
  {
    eyebrow: 'Episode-Level Tracking',
    title: (
      <>
        Know exactly where you are in{' '}
        <em className="font-normal italic text-ember">every show</em>.
      </>
    ),
    description: (
      <>
        Three shows on the go and a fourth on pause? PictureBox keeps a progress bar for
        each one — down to the episode — so &ldquo;wait, did we watch this one?&rdquo;
        never happens again.
      </>
    ),
    visual: <ProgressMock />,
  },
  {
    eyebrow: 'Stats for Everyone',
    title: (
      <>
        Your year in film. <em className="font-normal italic text-ember">Free</em>, not
        premium.
      </>
    ),
    description: (
      <>
        Hours watched, genre obsessions, most-rewatched directors, your busiest watching
        month — PictureBox counts everything you log and turns it into stats worth
        screenshotting. Other platforms paywall this; we ship it free.
      </>
    ),
    bullets: [
      'Hours watched across films and TV, combined',
      'Genre and decade breakdowns that update live',
      'A shareable year-in-review every December',
    ],
    visual: <StatsMock />,
  },
  {
    eyebrow: 'Social, Not Algorithmic',
    title: (
      <>
        Discover through <em className="font-normal italic text-ember">people</em>, not
        algorithms.
      </>
    ),
    description: (
      <>
        The best recommendation you ever got came from a person, not a &ldquo;Because you
        watched&rdquo; row. Follow friends and critics whose taste you trust, and your
        feed becomes exactly that — what they watched, what they thought.
      </>
    ),
    bullets: [
      'A feed of real opinions from people you chose to follow',
      'See ratings from your circle right on every title page',
      'No promoted titles, no engagement bait',
    ],
    visual: <FeedMock />,
  },
  {
    eyebrow: 'Group Watchlists',
    title: (
      <>
        Decide what to watch before the{' '}
        <em className="font-normal italic text-ember">popcorn</em> gets cold.
      </>
    ),
    description: (
      <>
        The forty-five minute scroll-and-argue is a solved problem. Create a group, throw
        titles into a shared list, vote, and watch the winner. One invite code and
        everyone&apos;s in.
      </>
    ),
    visual: <GroupMock />,
  },
  {
    eyebrow: 'Streaming Availability',
    title: (
      <>
        Know where it&apos;s streaming{' '}
        <em className="font-normal italic text-ember">before</em> you commit.
      </>
    ),
    description: (
      <>
        Tell PictureBox which services you pay for, and every title shows you — in your
        country — whether you can press play tonight or whether it&apos;s a rental. In
        groups, see what&apos;s available on everyone&apos;s services.
      </>
    ),
    visual: <StreamingMock />,
  },
  {
    eyebrow: 'One Search',
    title: (
      <>
        One search for{' '}
        <em className="font-normal italic text-ember">everything</em>.
      </>
    ),
    description: (
      <>
        Films and TV live in the same index, so you stop thinking about which app to open.
        Type three letters, hit enter, log it — the whole loop takes about five seconds.
        <kbd className="ml-1 font-mono text-sm text-ember">⌘K</kbd> from anywhere.
      </>
    ),
    visual: <SearchMock />,
  },
]

/**
 * The product feature showcase as a sticky-stacking deck: each feature pins and
 * scales down as the next scrolls over it, building a layered stack. Borrowed
 * from the portfolio reference's project section, styled in Midnight Iris.
 */
export default function FeatureStack() {
  const total = FEATURES.length

  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-page px-page-x-mobile text-center md:mb-16 md:px-page-x">
        <p className="mb-4 font-label text-label uppercase text-ember">
          Everything in one place
        </p>
        <h2 className="text-iris-gradient mx-auto max-w-3xl font-display text-[2rem] font-semibold leading-[1.05] tracking-tight md:text-[3.5rem]">
          Seven reasons it replaces your spreadsheet.
        </h2>
      </div>

      <StackingCards className="mx-auto max-w-page px-page-x-mobile md:px-page-x">
        {FEATURES.map((feature, i) => (
          <StackingCard
            key={feature.eyebrow}
            index={i}
            total={total}
            stickyClassName="top-20 md:top-24"
            heightClassName="h-[82vh]"
          >
            <article className="overflow-hidden rounded-[28px] border border-ember/25 bg-surface-container-low/85 p-5 shadow-poster backdrop-blur-xl md:rounded-[44px] md:p-9">
              <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
                {/* Copy */}
                <div className="min-w-0">
                  <div className="mb-4 flex items-center gap-4">
                    <span
                      className="text-iris-gradient-violet font-display font-black leading-none tracking-tight"
                      style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-label text-label uppercase text-ember">
                      {feature.eyebrow}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold leading-[1.08] tracking-tight text-cream md:text-[2.25rem]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-on-surface-variant md:text-lg">
                    {feature.description}
                  </p>
                  {feature.bullets && (
                    <ul className="mt-6 grid gap-2.5">
                      {feature.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 text-sm text-on-surface"
                        >
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ember-muted">
                            <Check className="h-3 w-3 text-ember" />
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Visual */}
                <div className="min-w-0">{feature.visual}</div>
              </div>
            </article>
          </StackingCard>
        ))}
      </StackingCards>
    </section>
  )
}
