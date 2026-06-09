import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-white/5 py-12">
      <div className="max-w-page mx-auto px-4 md:px-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <span className="font-display text-display-mobile text-on-surface tracking-tight">
            PictureBox
          </span>
          <p className="text-on-surface-variant text-sm text-center">
            © 2026 PictureBox. The Discerning Curator.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="text-on-surface-variant text-sm hover:text-gold transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-on-surface-variant text-sm hover:text-gold transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-on-surface-variant text-sm hover:text-gold transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-outline text-xs">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  )
}
