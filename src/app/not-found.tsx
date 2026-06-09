import Link from 'next/link'

// Renders as a fixed full-screen overlay so the navbar from root layout
// is visually covered — effectively a standalone page.
export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-8xl text-gold font-bold mb-4 leading-none">404</p>
      <h1 className="font-display text-2xl text-on-surface font-bold mb-3">
        Page not found.
      </h1>
      <p className="text-on-surface-variant mb-10">
        The reel seems to have run out.
      </p>
      <Link
        href="/"
        className="bg-gold text-black font-label uppercase tracking-widest font-bold px-8 py-3 rounded hover:bg-gold-hover active:scale-95 transition-all"
      >
        Back to Home
      </Link>
    </div>
  )
}
