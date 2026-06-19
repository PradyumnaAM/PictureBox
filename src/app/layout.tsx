import type { Metadata } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

import { Toaster } from 'sonner'

import NavbarWrapper from '@/components/layout/NavbarWrapper'
import MobileNav from '@/components/layout/MobileNav'

/* Display — a characterful, high-contrast variable serif for editorial titles. */
const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
})

/* UI — a clean neutral grotesque for body, controls, and navigation. */
const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

/* Data — monospaced "catalogue numbers": ratings, years, stats, shortcuts. */
const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'PictureBox | Every film. Every episode.',
    template: '%s | PictureBox',
  },
  description: 'Track every film and every episode. The social tracker for serious cinephiles.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  keywords: ['film tracker', 'movie tracker', 'TV tracker', 'letterboxd alternative', 'film diary'],
  openGraph: {
    title: 'PictureBox | Every film. Every episode.',
    description: 'Track every film and every episode.',
    type: 'website',
    siteName: 'PictureBox',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PictureBox | Every film. Every episode.',
    description: 'Track every film and every episode.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} font-sans bg-background text-on-surface antialiased`}
      >
        <NavbarWrapper />
        {/* Hero pages manage their own top spacing. Bottom-nav clearance is handled
            by MobileNav's own spacer, so it only applies when the nav actually renders. */}
        <main>
          {children}
        </main>
        <MobileNav />
        {/* Film grain overlay sits above everything and never intercepts input. */}
        <div aria-hidden className="grain" />
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
