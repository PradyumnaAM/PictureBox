'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { Activity, Film, Home, Tv } from 'lucide-react'

const TABS = [
  { href: '/',      label: 'Home',     Icon: Home },
  { href: '/films', label: 'Films',    Icon: Film },
  { href: '/tv',    label: 'TV',       Icon: Tv },
  { href: '/feed',  label: 'Activity', Icon: Activity },
] as const

function isActive(linkHref: string, currentPath: string): boolean {
  if (linkHref === '/') return currentPath === '/'
  return currentPath.startsWith(linkHref)
}

const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/onboarding']

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default function MobileNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isAuthPath(pathname) || !user) return null

  return (
    <>
      {/* Spacer reserves space for the fixed nav — only present when the nav
          renders (authenticated, non-auth routes), and only on mobile. */}
      <div aria-hidden className="md:hidden h-16" />
      <nav
        className="surface-frost fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/[0.07] pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobile navigation"
      >
      <div className="h-full flex items-center justify-around px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-ember' : 'text-on-surface-variant'
              }`}
            >
              {/* Active marker — gold tick above the icon */}
              <span
                aria-hidden
                className={`absolute top-1.5 h-1 w-1 rounded-full bg-ember transition-opacity ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              <span className="font-sans text-[10px] font-medium leading-none">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      </nav>
    </>
  )
}
