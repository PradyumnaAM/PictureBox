'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl text-gold mb-4">500</p>
      <h2 className="font-display text-2xl text-on-surface mb-2">
        Something went wrong.
      </h2>
      <p className="text-on-surface-variant mb-8">
        The projector seems to have broken down.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={reset}
          className="bg-gold text-black font-label uppercase font-bold px-6 py-3 rounded hover:bg-gold-hover transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="bg-surface-container border border-white/20 text-on-surface font-label uppercase font-bold px-6 py-3 rounded hover:bg-surface-container-high transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
