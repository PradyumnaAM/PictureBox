'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { useMemo, type ElementType, type ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  className?: string
  /** Seconds before the animation starts. */
  delay?: number
  /** Seconds the animation runs. */
  duration?: number
  /** Initial X offset in px. */
  x?: number
  /** Initial Y offset in px. */
  y?: number
  /** Element type to render (div, section, h1, …). */
  as?: ElementType
  /** Replay every time it enters the viewport (default once). */
  repeat?: boolean
}

const EASE = [0.25, 0.1, 0.25, 1] as const

/**
 * Scroll-triggered fade + slide. Mirrors the editorial `Reveal` but with
 * directional offsets and framer-motion easing, for hero / accent moments.
 * Respects prefers-reduced-motion via framer-motion's reduced-motion handling.
 */
export default function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  as = 'div',
  repeat = false,
  ...rest
}: FadeInProps & Omit<HTMLMotionProps<'div'>, keyof FadeInProps>) {
  const MotionTag = useMemo(
    () => motion.create(as as ElementType) as typeof motion.div,
    [as],
  )

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: !repeat, margin: '50px', amount: 0 }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
