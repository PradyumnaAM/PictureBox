import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface-container-lowest">
      {/* Soft overhead house-light + a single gold hairline across the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(123,97,255,0.08)_0%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/40 to-transparent"
      />

      {/* Logo */}
      <div className="relative z-10 shrink-0 px-page-x-mobile py-6 md:px-10">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-1.5"
          aria-label="PictureBox home"
        >
          <span className="font-display text-2xl font-semibold leading-none tracking-tight text-cream transition-colors group-hover:text-ember">
            PictureBox
          </span>
          <span className="mb-1 h-1.5 w-1.5 rounded-full bg-ember" />
        </Link>
      </div>

      {/* Vertically + horizontally centred content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-page-x-mobile py-8">
        {children}
      </div>

      {/* Oversized ghost wordmark bleeding off the bottom */}
      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[clamp(5rem,16vw,15rem)] font-semibold leading-none tracking-tight text-white/[0.02]"
      >
        PictureBox
      </p>
    </div>
  )
}
