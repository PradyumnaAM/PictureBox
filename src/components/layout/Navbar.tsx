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

  // Prefer the live profiles.username; fall back to metadata then id so the link
  // is never empty.
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

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/40 backdrop-blur-2xl backdrop-saturate-[1.8] backdrop-brightness-110 border-b border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.14)]">
      {/* Liquid-glass sheen — a soft light gradient skimming the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.10] via-white/[0.02] to-transparent"
      />
      <div className="relative max-w-page mx-auto h-full flex items-center justify-between gap-4 px-page-x-mobile md:px-page-x">

        {/* ── Left: wordmark + desktop nav ── */}
        <div className="flex items-center gap-10 min-w-0">
          <Link
            href="/"
            className="group flex items-baseline shrink-0"
            aria-label="PictureBox home"
          >
            <span className="font-display text-[1.45rem] font-semibold tracking-tight text-cream group-hover:text-ember transition-colors">
              PictureBox
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-ember ml-1 translate-y-[-1px] group-hover:animate-blink" />
          </Link>

          {/* Desktop nav — hidden on mobile */}
          {user && (
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {NAV_LINKS.map(({ href, label }, i) => {
              const active = isActive(href, activePath)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group/link flex items-center gap-2 font-label text-label uppercase transition-colors ${
                    active ? 'text-cream' : 'text-on-surface-variant hover:text-cream'
                  }`}
                >
                  <span
                    className={`text-[10px] transition-colors ${
                      active ? 'text-ember' : 'text-outline group-hover/link:text-ember'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {label}
                </Link>
              )
            })}
          </nav>
          )}
        </div>

        {/* ── Right: search + log + avatar ── */}
        <div className="flex items-center gap-3">
          {/* Search — icon-only button (Ctrl/Cmd+K also opens it) */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-on-surface-variant hover:text-ember transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <>
              {/* Log shortcut — logged in, desktop only */}
              <Link
                href="/diary"
                aria-label="Log a film"
                className="hidden md:flex w-9 h-9 rounded-md bg-ember text-background items-center justify-center hover:bg-ember-hover active:scale-95 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </Link>

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="shrink-0 w-9 h-9 rounded-md bg-surface-container-high border border-white/10 text-cream font-mono text-sm font-medium flex items-center justify-center cursor-pointer hover:border-ember/50 hover:text-ember active:scale-95 transition-all"
                >
                  {initial}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-surface-container-low border border-white/10 rounded-lg p-1 shadow-header"
                >
                  <DropdownMenuItem
                    onClick={() => router.push(`/u/${profileSlug}`)}
                    className="text-on-surface hover:text-ember hover:bg-surface-container-high px-4 py-2 text-sm cursor-pointer rounded-md"
                  >
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/diary')}
                    className="text-on-surface hover:text-ember hover:bg-surface-container-high px-4 py-2 text-sm cursor-pointer rounded-md"
                  >
                    My Diary
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/watchlist')}
                    className="text-on-surface hover:text-ember hover:bg-surface-container-high px-4 py-2 text-sm cursor-pointer rounded-md"
                  >
                    Watchlist
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                    className="text-on-surface hover:text-ember hover:bg-surface-container-high px-4 py-2 text-sm cursor-pointer rounded-md"
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 border-white/10" />
                  <DropdownMenuItem
                    onClick={onSignOut}
                    className="text-error hover:bg-error/10 px-4 py-2 text-sm cursor-pointer rounded-md"
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
                className="hidden md:inline-flex items-center h-9 px-4 rounded-md font-label text-label uppercase text-on-surface-variant border border-white/[0.12] hover:border-cream/40 hover:text-cream transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center h-9 px-4 rounded-md font-label text-label uppercase bg-ember text-background font-medium hover:bg-ember-hover active:scale-95 transition-all"
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