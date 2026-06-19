'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Search } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SearchModal from '@/components/search/SearchModal'

interface NavbarProps {
  activePath: string
  user: User | null
  onSignOut: () => void
}

const NAV_LINKS = [
  { href: '/',      label: 'Home' },
  { href: '/films', label: 'Films' },
  { href: '/tv',    label: 'TV' },
  { href: '/feed',  label: 'Activity' },
]

function isActive(linkHref: string, currentPath: string): boolean {
  if (linkHref === '/') return currentPath === '/'
  return currentPath.startsWith(linkHref)
}

export default function Navbar({ activePath, user, onSignOut }: NavbarProps) {
  const router = useRouter()
  const initial = user?.email?.[0].toUpperCase() ?? 'U'
  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Resolve the real profile handle from the profiles table (the auth metadata
  // username can be stale or never set). Falls back to metadata / id below.
  useEffect(() => {
    if (!user) {
      setProfileUsername(null)
      return
    }
    let cancelled = false
    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const u = data?.profile?.username
        if (typeof u === 'string' && u.length > 0) setProfileUsername(u)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  const profileSlug =
    profileUsername ?? user?.user_metadata?.username ?? user?.id ?? ''

  // Cmd+K / Ctrl+K to open search from anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Frosted elevation only after the page scrolls past the hero edge.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-colors duration-300 ${
          scrolled
            ? 'surface-frost border-b border-white/[0.07] shadow-header'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="relative mx-auto flex h-full max-w-page items-center justify-between gap-4 px-page-x-mobile md:px-page-x">
          {/* ── Left: wordmark + desktop nav ── */}
          <div className="flex min-w-0 items-center gap-10">
            <Link
              href="/"
              className="group flex items-baseline gap-1.5 shrink-0"
              aria-label="PictureBox home"
            >
              <span className="font-display text-[1.7rem] font-semibold leading-none tracking-tight text-cream transition-colors group-hover:text-ember">
                PictureBox
              </span>
              <span className="mb-1 h-1.5 w-1.5 rounded-full bg-ember transition-transform group-hover:scale-125" />
            </Link>

            {/* Desktop nav */}
            {user && (
              <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
                {NAV_LINKS.map(({ href, label }) => {
                  const active = isActive(href, activePath)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`relative rounded-full px-3.5 py-2 font-sans text-sm font-medium transition-colors ${
                        active
                          ? 'text-cream'
                          : 'text-on-surface-variant hover:text-cream'
                      }`}
                    >
                      {label}
                      {active && (
                        <span className="absolute inset-x-3.5 -bottom-px h-px bg-ember" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>

          {/* ── Right: search + log + avatar ── */}
          <div className="flex items-center gap-2">
            {/* Search — only shown to authenticated users */}
            {user && (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
                className="group flex h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] pl-3 pr-2.5 text-on-surface-variant transition-colors hover:border-white/15 hover:text-cream md:pr-3"
              >
                <Search className="h-4 w-4" />
                <span className="hidden text-sm md:inline">Search</span>
              </button>
            )}

            {user ? (
              <>
                {/* Log shortcut — logged in, desktop only */}
                <Link
                  href="/diary"
                  aria-label="Log a film"
                  className="hidden h-9 w-9 items-center justify-center rounded-full bg-ember text-white transition-all hover:bg-ember-hover active:scale-95 md:flex"
                >
                  <Pencil className="h-4 w-4" />
                </Link>

                {/* Avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Account menu"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-surface-container-high font-mono text-sm font-medium text-cream transition-all hover:border-ember/60 hover:text-ember active:scale-95"
                  >
                    {initial}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="surface-frost w-52 rounded-xl border border-white/10 p-1.5 shadow-header"
                  >
                    {[
                      { label: 'My Profile', path: `/u/${profileSlug}` },
                      { label: 'My Diary', path: '/diary' },
                      { label: 'Watchlist', path: '/watchlist' },
                      { label: 'Settings', path: '/settings' },
                    ].map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        onClick={() => router.push(item.path)}
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-white/[0.06] hover:text-ember"
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="my-1.5 bg-white/10" />
                    <DropdownMenuItem
                      onClick={onSignOut}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden h-9 items-center rounded-full border border-ember px-4 font-sans text-sm font-semibold text-ember transition-all hover:bg-ember hover:text-white active:scale-95 md:inline-flex"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-9 items-center rounded-full border border-ember px-4 font-sans text-sm font-semibold text-ember transition-all hover:bg-ember hover:text-white active:scale-95"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
