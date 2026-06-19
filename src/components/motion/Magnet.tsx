'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

interface MagnetProps {
  children: ReactNode
  className?: string
  /** Distance (px) from the element edge at which the magnet activates. */
  padding?: number
  /** Higher = weaker pull (offset is divided by this). */
  strength?: number
  activeTransition?: string
  inactiveTransition?: string
  /** Render as inline-block instead of block. */
  inline?: boolean
}

/**
 * Mouse-following magnetic hover. Tracks the cursor relative to the element
 * centre and applies a translate3d transform, easing back to rest on leave.
 * Disabled for touch / reduced-motion so it never hurts mobile or a11y.
 */
export default function Magnet({
  children,
  className,
  padding = 120,
  strength = 3,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  inline = false,
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [active, setActive] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    setEnabled(fine && !reduced)
  }, [])

  const handleMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy

      const within =
        Math.abs(dx) < rect.width / 2 + padding &&
        Math.abs(dy) < rect.height / 2 + padding

      if (within) {
        setActive(true)
        setOffset({ x: dx / strength, y: dy / strength })
      } else if (active) {
        setActive(false)
        setOffset({ x: 0, y: 0 })
      }
    },
    [enabled, padding, strength, active],
  )

  const handleLeave = useCallback(() => {
    setActive(false)
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(inline ? 'inline-block' : 'block', className)}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: active ? activeTransition : inactiveTransition,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
