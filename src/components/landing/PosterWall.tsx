'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { getPosterUrl } from '@/lib/tmdb/helpers'

export interface PosterWallItem {
  id: number
  poster_path: string | null
  title?: string
  name?: string
}

interface PosterWallProps {
  posters: PosterWallItem[]
}

/** Layout of the constellation — depth drives parallax, blur drives focus. */
interface Slot {
  left: number
  top: number
  w: number
  h: number
  depth: number // parallax magnitude (foreground moves most)
  rotate: number // resting tilt
  blur: number // depth-of-field
  opacity: number
  focus?: boolean // the in-focus, ember-framed poster
  floatDur: number
  floatDelay: number
}

const STAGE_W = 440
const STAGE_H = 440
const MAX_SHIFT = 22 // px the nearest layer travels with the cursor

const SLOTS: Slot[] = [
  // The hero poster — crisp, centered, framed in ember.
  { left: 138, top: 104, w: 178, h: 267, depth: 1, rotate: -2, blur: 0, opacity: 1, focus: true, floatDur: 6, floatDelay: 0 },
  // Mid layer, flanking.
  { left: 14, top: 66, w: 132, h: 198, depth: 0.62, rotate: -5, blur: 0.5, opacity: 0.94, floatDur: 7, floatDelay: 0.8 },
  { left: 298, top: 206, w: 132, h: 198, depth: 0.66, rotate: 5, blur: 0.5, opacity: 0.94, floatDur: 6.5, floatDelay: 0.4 },
  // Far layer — small, dim, soft.
  { left: 250, top: 12, w: 100, h: 150, depth: 0.32, rotate: 7, blur: 1.6, opacity: 0.68, floatDur: 8, floatDelay: 1.2 },
  { left: 40, top: 284, w: 104, h: 156, depth: 0.3, rotate: -7, blur: 1.6, opacity: 0.68, floatDur: 7.5, floatDelay: 0.6 },
]

/**
 * A floating constellation of real TMDB posters at varied depths. The cluster
 * drifts on its own and tilts toward the cursor in 3D, with the far posters
 * softly blurred for a cinematic depth-of-field and the hero poster framed in
 * ember. Decorative only — nothing here is clickable.
 */
export default function PosterWall({ posters }: PosterWallProps) {
  const usable = posters.filter((p) => p.poster_path)
  const stageRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const reduced = useRef(false)
  const [point, setPoint] = useState({ x: 0, y: 0 }) // cursor, normalized −1..1

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  if (usable.length === 0) return null

  // Assign a poster to each slot, repeating if trending returned few.
  const cards = SLOTS.map((slot, i) => ({ slot, item: usable[i % usable.length] }))

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced.current) return
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setPoint({ x, y }))
  }

  const handleLeave = () => {
    if (frame.current) cancelAnimationFrame(frame.current)
    setPoint({ x: 0, y: 0 })
  }

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="hidden md:block flex-shrink-0"
      style={{ width: STAGE_W, height: STAGE_H, position: 'relative', perspective: 1100 }}
    >
      <style>{`
        @keyframes posterwall-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .posterwall-float { animation: none !important; }
        }
      `}</style>

      {/* Ember ambience behind the cluster */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 320,
          height: 320,
          transform: 'translate(-50%, -50%)',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, rgba(123,97,255,0.16) 0%, transparent 70%)',
          filter: 'blur(46px)',
          pointerEvents: 'none',
        }}
      />

      {/* 3D scene tilts subtly toward the cursor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${point.x * 6}deg) rotateX(${-point.y * 6}deg)`,
          transition: 'transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {cards.map(({ slot, item }, i) => {
          const url = getPosterUrl(item.poster_path, 'md')
          if (!url) return null
          const tx = point.x * slot.depth * MAX_SHIFT
          const ty = point.y * slot.depth * MAX_SHIFT
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: slot.left,
                top: slot.top,
                width: slot.w,
                height: slot.h,
                zIndex: Math.round(slot.depth * 100),
                transform: `translate3d(${tx}px, ${ty}px, 0)`,
                transition: 'transform 450ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                willChange: 'transform',
              }}
            >
              {/* Idle float */}
              <div
                className="posterwall-float"
                style={{
                  width: '100%',
                  height: '100%',
                  animation: `posterwall-float ${slot.floatDur}s ease-in-out ${slot.floatDelay}s infinite`,
                }}
              >
                {/* Poster face */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${slot.rotate}deg)`,
                    borderRadius: 4,
                    overflow: 'hidden',
                    opacity: slot.opacity,
                    filter: slot.blur ? `blur(${slot.blur}px)` : undefined,
                    boxShadow: slot.focus
                      ? '0 24px 46px -18px rgba(0,0,0,0.85)'
                      : '0 14px 28px -14px rgba(0,0,0,0.7)',
                  }}
                >
                  <Image
                    src={url}
                    alt={item.title ?? item.name ?? ''}
                    fill
                    sizes={`${slot.w}px`}
                    className="object-cover"
                    priority={slot.focus}
                  />
                  {/* Printed-poster grade */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.40) 0%, transparent 45%)',
                    }}
                  />
                  {/* Frame: ember on the focus poster, hairline on the rest */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 4,
                      boxShadow: slot.focus
                        ? 'inset 0 0 0 2px rgba(123,97,255,0.65), inset 0 0 28px rgba(123,97,255,0.14)'
                        : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
