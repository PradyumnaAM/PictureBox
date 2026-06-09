import Link from 'next/link'
import { Pencil, Search } from 'lucide-react'

interface NavbarProps {
  activePath: string
}

const NAV_LINKS = [
  { href: '/',        label: 'Home' },
  { href: '/films',   label: 'Films' },
  { href: '/tv',      label: 'TV Shows' },
  { href: '/activity',label: 'Activity' },
]

function isActive(linkHref: string, currentPath: string): boolean {
  if (linkHref === '/') return currentPath === '/'
  return currentPath.startsWith(linkHref)
}

export default function Navbar({ activePath }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-surface-container/60 backdrop-blur-xl border-b border-white/10 shadow-header">
      <div className="max-w-page mx-auto h-full flex items-center justify-between px-page-x-mobile md:px-page-x">

        {/* ── Left: logo + desktop nav ── */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-display-mobile md:text-display-lg tracking-tighter text-on-surface hover:text-gold transition-colors"
          >
            PictureBox
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 mt-1" aria-label="Primary">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  isActive(href, activePath)
                    ? 'font-sans text-label uppercase tracking-widest text-gold font-bold border-b-2 border-gold pb-1'
                    : 'font-sans text-label uppercase tracking-widest text-on-surface-variant hover:text-gold transition-colors'
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Right: search + log + avatar ── */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            className="p-2 text-on-surface-variant hover:text-gold transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Log button — desktop only */}
          <Link
            href="/sign-up"
            className="hidden md:flex items-center gap-1.5 bg-gold text-black font-sans text-label uppercase tracking-widest font-bold px-4 py-2 rounded hover:bg-gold-hover active:scale-95 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Log
          </Link>

          {/* Avatar placeholder */}
          <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-gold transition-colors cursor-pointer bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface-variant text-sm font-semibold select-none">
              U
            </span>
          </div>
        </div>

      </div>
    </header>
  )
}
