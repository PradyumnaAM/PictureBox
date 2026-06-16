import Link from 'next/link'

// Renders as a fixed full-screen overlay so the navbar from root layout
// is visually covered — effectively a standalone page.
export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Ember pool of light */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[26rem] rounded-full bg-ember/[0.07] blur-[120px] pointer-events-none"
      />

      <p className="relative font-mono text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-ember animate-blink" />
        Reel missing
      </p>
      <p className="relative font-display text-[8rem] md:text-[11rem] text-cream font-semibold leading-none tracking-tight">
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
        className="relative bg-ember text-background font-label text-label uppercase font-medium px-8 py-3.5 rounded-md hover:bg-ember-hover active:scale-95 transition-all shadow-ember-glow"
      >
        Back to the lobby
      </Link>

      {/* Sprocket strips top + bottom */}
      <div aria-hidden className="sprockets absolute top-6 inset-x-0 opacity-60" />
      <div aria-hidden className="sprockets absolute bottom-6 inset-x-0 opacity-60" />
    </div>
  )
}
