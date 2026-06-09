import Link from 'next/link'
import { Layers, Tv, Zap } from 'lucide-react'

const FEATURES = [
  {
    Icon: Layers,
    title: 'Film + TV, Unified',
    description:
      "One place for every movie you've seen and every episode you've watched. No app-switching, no compromise.",
  },
  {
    Icon: Tv,
    title: 'Episode-Level Tracking',
    description:
      'Log every season, every episode. Track exactly where you are in any series and never lose your place.',
  },
  {
    Icon: Zap,
    title: 'Free for Everyone',
    description:
      'All statistics, all insights, no paywalls. Great film tracking should be available to everyone.',
  },
] as const

export default function WhySection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-page mx-auto px-4 md:px-16 text-center">
        <p className="text-label text-gold uppercase tracking-widest font-semibold mb-3">
          The Discerning Curator
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-on-surface tracking-tighter font-bold mb-4">
          Why PictureBox?
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto mb-16">
          Built for the people who take their watching seriously.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          {FEATURES.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <div className="w-10 h-10 rounded-full bg-gold-muted flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface mb-2">{title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-gold text-black font-label uppercase tracking-widest font-bold px-8 py-3 rounded hover:bg-gold-hover active:scale-95 transition-all"
          >
            Start Tracking Free
          </Link>
          <Link
            href="/films"
            className="bg-surface-container/60 backdrop-blur text-white font-label uppercase tracking-widest font-bold px-8 py-3 rounded border border-white/20 hover:bg-white/10 active:scale-95 transition-all"
          >
            Browse Films
          </Link>
        </div>
      </div>
    </section>
  )
}
