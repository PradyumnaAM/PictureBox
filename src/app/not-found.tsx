import Link from 'next/link'

// Renders as a fixed full-screen overlay so the navbar from root layout
// is visually covered — effectively a standalone page.
export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Marquee field */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-10 cinema-stripes opacity-70"
      />

      <p className="relative font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-3">
        <span className="h-2 w-2 bg-ember animate-blink" />
        Reel missing
      </p>
      <p className="relative font-display text-[8rem] md:text-[11rem] text-cream font-semibold leading-none">
        4<em className="text-ember">0</em>4
      </p>
      <h1 className="relative font-display text-2xl text-cream font-semibold mt-6 mb-3">
        This scene didn&apos;t make the final cut.
      </h1>
      <p className="relative text-on-surface-variant mb-10 max-w-sm">
        The page you&apos;re looking for was left on the cutting-room floor.
      </p>
      <Link
        href="/"
        className="relative rounded-md bg-ember px-8 py-3.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-ember-hover active:scale-95"
      >
        Back to the lobby
      </Link>

      {/* Sprocket strips top + bottom */}
      <div aria-hidden className="sprockets absolute top-6 inset-x-0 opacity-60" />
      <div aria-hidden className="sprockets absolute bottom-6 inset-x-0 opacity-60" />
    </div>
  )
}

