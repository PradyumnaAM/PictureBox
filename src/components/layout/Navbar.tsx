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
  { href: '/',         label: 'Home' },
  { href: '/films',    label: 'Films' },
  { href: '/tv',       label: 'TV Shows' },
  { href: '/activity', label: 'Activity' },
]

function isActive(linkHref: string, currentPath: string): boolean {
  if (linkHref === '/') return currentPath === '/'
  return currentPath.startsWith(linkHref)
}

export default function Navbar({ activePath, user, onSignOut }: NavbarProps) {
  const router = useRouter()
  const initial = user?.email?.[0].toUpperCase() ?? 'U'
  const profileSlug = user?.user_metadata?.username ?? user?.id ?? ''
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-on-surface-variant hover:text-gold transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <>
              {/* Pencil icon — logged in, desktop only */}
              <Link
                href="/diary"
                aria-label="Log a film"
                className="hidden md:flex w-10 h-10 rounded-full bg-gold text-black items-center justify-center hover:bg-gold-hover active:scale-95 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </Link>

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="shrink-0 w-10 h-10 rounded-full bg-gold text-black font-bold flex items-center justify-center cursor-pointer hover:bg-gold-hover active:scale-95 transition-all"
                >
                  {initial}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-surface-container-high border border-white/10 rounded-xl p-1"
                >
                  <DropdownMenuItem
                    onClick={() => router.push(`/u/${profileSlug}`)}
                    className="text-on-surface hover:text-gold hover:bg-surface-container-highest px-4 py-2 text-sm cursor-pointer rounded-lg"
                  >
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/diary')}
                    className="text-on-surface hover:text-gold hover:bg-surface-container-highest px-4 py-2 text-sm cursor-pointer rounded-lg"
                  >
                    My Diary
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/watchlist')}
                    className="text-on-surface hover:text-gold hover:bg-surface-container-highest px-4 py-2 text-sm cursor-pointer rounded-lg"
                  >
                    Watchlist
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                    className="text-on-surface hover:text-gold hover:bg-surface-container-highest px-4 py-2 text-sm cursor-pointer rounded-lg"
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 border-white/10" />
                  <DropdownMenuItem
                    onClick={onSignOut}
                    className="text-error hover:bg-error/10 px-4 py-2 text-sm cursor-pointer rounded-lg"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* LOG button — logged out, desktop only */}
              <Link
                href="/sign-up"
                className="hidden md:flex items-center gap-1.5 bg-gold text-black font-sans text-label uppercase tracking-widest font-bold px-4 py-2 rounded hover:bg-gold-hover active:scale-95 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
                Log
              </Link>

              {/* Avatar placeholder — links to sign-in */}
              <Link
                href="/sign-in"
                aria-label="Sign in"
                className="shrink-0 w-10 h-10 rounded-full border border-white/10 hover:border-gold transition-colors cursor-pointer bg-surface-container-high flex items-center justify-center"
              >
                <span className="text-on-surface-variant text-sm font-semibold select-none">
                  U
                </span>
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
