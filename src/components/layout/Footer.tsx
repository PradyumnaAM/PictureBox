import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/about',   label: 'About' },
  { href: '/films',   label: 'Films' },
  { href: '/tv',      label: 'TV Shows' },
  { href: '/members', label: 'Members' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms',   label: 'Terms' },
  { href: '/cookies', label: 'Cookies' },
]

export default function Footer() {
  return (
    <footer className="relative bg-surface-container-lowest border-t border-white/[0.06] overflow-hidden">
      {/* Filmstrip sprocket strip */}
      <div aria-hidden className="sprockets mt-5" />

      <div className="max-w-page mx-auto px-page-x-mobile md:px-page-x pt-12 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          {/* Wordmark + tagline */}
          <div>
            <p className="flex items-baseline">
              <span className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-cream">
                PictureBox
              </span>
              <span className="w-2 h-2 rounded-full bg-ember ml-1.5" />
            </p>
            <p className="font-label text-label uppercase text-on-surface-variant mt-4">
              Every film · Every episode · Accounted for
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-3">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-label text-label uppercase text-on-surface-variant hover:text-ember transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/[0.06] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-outline">
            © 2026 PictureBox — fin.
          </p>
          <p className="font-mono text-xs text-outline text-center">
            Film and TV data from TMDB. Not endorsed or certified by TMDB.
          </p>
        </div>
      </div>

      {/* Oversized ghost wordmark bleeding off the bottom */}
      <p
        aria-hidden
        className="pointer-events-none select-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-display font-semibold tracking-tight text-[clamp(4rem,12vw,11rem)] leading-none text-white/[0.025]"
      >
        PictureBox
      </p>
    </footer>
  )
}
