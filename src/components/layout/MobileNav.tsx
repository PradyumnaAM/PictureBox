'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Film, Home, Tv } from 'lucide-react'

const TABS = [
  { href: '/',         label: 'Home',      Icon: Home },
  { href: '/films',    label: 'Films',     Icon: Film },
  { href: '/tv',       label: 'TV Shows',  Icon: Tv },
  { href: '/activity', label: 'Activity',  Icon: Activity },
] as const

function isActive(linkHref: string, currentPath: string): boolean {
  if (linkHref === '/') return currentPath === '/'
  return currentPath.startsWith(linkHref)
}

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-container/80 backdrop-blur-xl border-t border-white/10"
      aria-label="Mobile navigation"
    >
      <div className="h-full flex items-center justify-around px-2">
        {TABS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
              isActive(href, pathname) ? 'text-gold' : 'text-on-surface-variant'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
