import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import Reveal from './Reveal'

interface FeatureSectionProps {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  bullets?: string[]
  visual: ReactNode
  /** Place the visual on the left on desktop */
  flip?: boolean
  /** Alternate background band */
  tinted?: boolean
}

/**
 * Two-column landing section: copy on one side, a product visual on the
 * other. Sections alternate via `flip` and `tinted` for visual rhythm.
 * Each section numbers itself like a film chapter via the .chapter counter.
 */
export default function FeatureSection({
  eyebrow,
  title,
  description,
  bullets,
  visual,
  flip = false,
  tinted = false,
}: FeatureSectionProps) {
  return (
    <section
      className={cn(
        'chapter py-20 md:py-28',
        tinted && 'bg-surface-container-lowest/70 border-y border-white/[0.04]',
      )}
    >
      <div className="max-w-page mx-auto px-4 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Copy */}
          <Reveal className={cn(flip && 'lg:order-2')}>
            <p className="flex items-center gap-3 font-label text-label uppercase text-ember mb-4">
              <span className="chapter-num font-mono text-outline" aria-hidden />
              <span aria-hidden className="w-6 h-px bg-ember/50" />
              {eyebrow}
            </p>
            <h2 className="font-display text-3xl md:text-[2.75rem] text-cream tracking-tight font-semibold leading-[1.1] mb-5">
              {title}
            </h2>
            <div className="text-on-surface-variant text-base md:text-lg leading-relaxed space-y-4">
              {description}
            </div>
            {bullets && bullets.length > 0 && (
              <ul className="mt-7 space-y-3.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-on-surface text-sm md:text-base">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-ember-muted flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-ember" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          {/* Visual */}
          <Reveal delay={150} className={cn(flip && 'lg:order-1')}>
            {visual}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
