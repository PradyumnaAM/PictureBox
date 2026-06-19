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
  /** Alternate background band */
  tinted?: boolean
}

/**
 * Centered landing section: copy leads, the product visual follows beneath it.
 * Each section numbers itself like a film chapter via the .chapter counter.
 */
export default function FeatureSection({
  eyebrow,
  title,
  description,
  bullets,
  visual,
  tinted = false,
}: FeatureSectionProps) {
  return (
    <section
      className={cn(
        'chapter py-20 md:py-28',
        tinted && 'bg-surface-container-lowest/35',
      )}
    >
      <div className="mx-auto max-w-page px-page-x-mobile md:px-page-x">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Reveal className="w-full">
            <p className="mb-5 flex items-center justify-center gap-3 font-label text-label uppercase text-ember">
              <span className="chapter-num font-mono text-outline" aria-hidden />
              <span aria-hidden className="h-px w-8 bg-ember/40" />
              {eyebrow}
            </p>
            <h2 className="mx-auto mb-6 max-w-4xl font-display text-[2rem] font-semibold leading-[1.05] tracking-tight text-cream md:text-[3.5rem]">
              {title}
            </h2>
            <div className="mx-auto max-w-2xl space-y-4 text-base leading-relaxed text-on-surface-variant md:text-lg">
              {description}
            </div>
            {bullets && bullets.length > 0 && (
              <ul className="mx-auto mt-9 grid max-w-3xl gap-3 text-left md:grid-cols-3">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-on-surface"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ember-muted">
                      <Check className="h-3 w-3 text-ember" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delay={150} className="mt-12 w-full">
            {visual}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
