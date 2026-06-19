'use client'

import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Film, Play } from 'lucide-react'

import GradientButton from '@/components/motion/GradientButton'
import Magnet from '@/components/motion/Magnet'

const VIDEO_SRC = '/video/hero-scrub.mp4'

export default function ScrollVideoHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // 3D reveal — flattens from a tilted "lying flat" state to head-on view
  const rotateX      = useTransform(scrollYProgress, [0, 0.32], [18, 0])
  const scale        = useTransform(scrollYProgress, [0, 0.32], [0.87, 1])
  const borderRadius = useTransform(scrollYProgress, [0, 0.32], [22, 0])

  // Dark scrim lifts as the 3D reveal completes
  const scrimOpacity = useTransform(scrollYProgress, [0, 0.38], [0.68, 0.08])

  // Hero text — fades up and out quickly so the video can be seen
  const textOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0])
  const textY       = useTransform(scrollYProgress, [0, 0.18], [0, -56])

  // Scroll nudge arrow
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0])

  // Wire scroll progress → video.currentTime
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.preload = 'auto'
    video.load()

    const unsubscribe = scrollYProgress.on('change', (p) => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        // cap at 97 % to avoid blank last frame on some encodings
        video.currentTime = Math.min(p, 0.97) * video.duration
      }
    })

    return unsubscribe
  }, [scrollYProgress])

  return (
    <div ref={containerRef} style={{ height: '500vh' }}>
      {/* Sticky viewport-filling stage */}
      <div
        className="sticky top-0 h-screen overflow-hidden bg-background"
        style={{ perspective: '1300px', perspectiveOrigin: '50% 50%' }}
      >
        {/* 3D-tilted video frame */}
        <motion.div
          className="absolute inset-0 overflow-hidden will-change-transform"
          style={{
            rotateX,
            scale,
            borderRadius,
            transformOrigin: 'center 62%',
          }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />

          {/* Animated dark scrim — lightens as the reveal plays out */}
          <motion.div
            style={{ opacity: scrimOpacity }}
            className="absolute inset-0 bg-background pointer-events-none"
          />

          {/* Static radial vignette — keeps edges dark for text legibility */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 30%, rgba(7,7,6,0.70) 100%)',
            }}
          />

          {/* Bottom fade — blends into the next section */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-background to-transparent"
          />
        </motion.div>

        {/* Hero overlay — headline + CTAs, fades as video is revealed */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="mb-5 font-label text-label uppercase tracking-[0.22em] text-ember">
            The Watch Diary
          </p>

          <h1
            className="font-display font-semibold leading-[0.94] tracking-tight"
            style={{ fontSize: 'clamp(3rem, 10.5vw, 9rem)' }}
          >
            <span className="text-iris-gradient block">Every film.</span>
            <span className="text-iris-gradient block">Every episode.</span>
          </h1>

          <p
            className="mt-5 font-sans"
            style={{ fontSize: 'clamp(1rem, 1.7vw, 1.3rem)' }}
          >
            <em className="italic text-cream/80">Accounted for.</em>
          </p>

          {/* CTAs — pointer events re-enabled while overlay is visible */}
          <div className="pointer-events-auto mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Magnet padding={80} strength={4}>
              <GradientButton href="/sign-up" size="lg">
                <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
                Start your reel — free
              </GradientButton>
            </Magnet>

            <Link
              href="/films"
              className="surface-frost group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-white/15 px-8 py-3.5 font-sans text-base font-semibold text-cream transition-colors hover:border-ember hover:text-ember active:scale-[0.98]"
            >
              <Film className="h-4 w-4 transition-transform group-hover:rotate-6" />
              See what&apos;s playing
            </Link>
          </div>
        </motion.div>

        {/* Scroll nudge */}
        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
          aria-hidden
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
            Scroll
          </span>
          <div className="h-10 w-px bg-gradient-to-b from-ember/55 to-transparent" />
        </motion.div>
      </div>
    </div>
  )
}
