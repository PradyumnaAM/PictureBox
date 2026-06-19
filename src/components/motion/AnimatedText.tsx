'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

interface AnimatedTextProps {
  text: string
  className?: string
  /** Dimmed starting opacity for not-yet-revealed characters. */
  from?: number
}

/**
 * Character-by-character scroll-reveal. Each glyph brightens from `from` to 1
 * as it passes through the viewport. An invisible placeholder preserves layout
 * and wrapping while an absolutely-positioned span carries the animation.
 */
export default function AnimatedText({
  text,
  className,
  from = 0.2,
}: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  const chars = text.split('')

  return (
    <p ref={ref} className={cn('relative', className)}>
      {chars.map((char, i) => {
        const start = i / chars.length
        const end = start + 1 / chars.length
        return <Char key={i} progress={scrollYProgress} range={[start, end]} char={char} from={from} />
      })}
    </p>
  )
}

function Char({
  char,
  progress,
  range,
  from,
}: {
  char: string
  progress: ReturnType<typeof useScroll>['scrollYProgress']
  range: [number, number]
  from: number
}) {
  const opacity = useTransform(progress, range, [from, 1])
  return (
    <span className="relative inline-block">
      <span className="opacity-0">{char === ' ' ? ' ' : char}</span>
      <motion.span style={{ opacity }} className="absolute left-0 top-0">
        {char === ' ' ? ' ' : char}
      </motion.span>
    </span>
  )
}
