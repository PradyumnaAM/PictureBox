import Link from 'next/link'

const FOOTER_GROUPS = [
  {
    heading: 'Browse',
    links: [
      { href: '/films', label: 'Films' },
      { href: '/tv', label: 'TV Shows' },
      { href: '/members', label: 'Members' },
    ],
  },
  {
    heading: 'PictureBox',
    links: [
      { href: '/about', label: 'About' },
      { href: '/feed', label: 'Activity' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/cookies', label: 'Cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-surface-container-lowest/85 backdrop-blur-sm">
      <div className="mx-auto max-w-page px-page-x-mobile pt-16 pb-12 md:px-page-x">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Wordmark + tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-semibold leading-none tracking-tight text-cream">
                PictureBox
              </span>
              <span className="mb-1 h-1.5 w-1.5 rounded-full bg-ember" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-surface-variant">
              Every film and every episode, kept in one diary. The social tracker
              for people who take watching seriously.
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <p className="font-label text-label uppercase text-outline">
                {group.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-on-surface-variant transition-colors hover:text-ember"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-outline">© 2026 PictureBox</p>
          <p className="font-mono text-xs text-outline">
            Film &amp; TV data from TMDB. Not endorsed or certified by TMDB.
          </p>
        </div>
      </div>

      {/* Oversized ghost wordmark bleeding off the bottom */}
      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[clamp(4rem,13vw,12rem)] font-semibold leading-none tracking-tight text-white/[0.022]"
      >
        PictureBox
      </p>
    </footer>
  )
}
