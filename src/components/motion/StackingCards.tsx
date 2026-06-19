'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface StackingCardProps {
  children: ReactNode
  /** Zero-based index of this card. */
  index: number
  /** Total number of cards in the stack. */
  total: number
  className?: string
  /** Vertical sticky offset for the whole stack (Tailwind class). */
  stickyClassName?: string
  /** Height of the scroll container that drives the pin (Tailwind class). */
  heightClassName?: string
}

/**
 * One card in a sticky-stack. As later cards scroll up, earlier cards pin and
 * scale down slightly, producing a layered deck. Wrap each in its own tall
 * scroll container so the pinning has room to play out.
 */
export function StackingCard({
  children,
  index,
  total,
  className,
  stickyClassName = 'top-24 md:top-32',
  heightClassName = 'h-[85vh]',
}: StackingCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const targetScale = 1 - (total - 1 - index) * 0.03
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale])

  return (
    <div
      ref={containerRef}
      className={cn('flex items-start justify-center', heightClassName)}
    >
      <motion.div
        style={{ scale, top: `${index * 28}px` }}
        className={cn('sticky w-full', stickyClassName, className)}
      >
        {children}
      </motion.div>
    </div>
  )
}

interface StackingCardsProps {
  children: ReactNode
  className?: string
}

/** Container for a vertical stack of {@link StackingCard}s. */
export default function StackingCards({ children, className }: StackingCardsProps) {
  return <div className={cn('relative', className)}>{children}</div>
}
