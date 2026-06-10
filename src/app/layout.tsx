import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

import { Toaster } from 'sonner'

import NavbarWrapper from '@/components/layout/NavbarWrapper'
import MobileNav from '@/components/layout/MobileNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PictureBox — The Discerning Curator',
    template: '%s — PictureBox',
  },
  description: 'Track every film and every episode. The social tracker for serious cinephiles.',
  keywords: ['film tracker', 'movie tracker', 'TV tracker', 'letterboxd alternative', 'film diary'],
  openGraph: {
    title: 'PictureBox — The Discerning Curator',
    description: 'Track every film and every episode.',
    type: 'website',
    siteName: 'PictureBox',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PictureBox — The Discerning Curator',
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
        className={`${inter.variable} ${playfair.variable} font-sans bg-background text-on-surface antialiased`}
      >
        <NavbarWrapper />
        {/* Hero pages manage their own top spacing; pb-16 md:pb-0 clears the mobile bottom nav */}
        <main className="pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
