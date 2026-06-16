import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
        <Link href="/" className="font-display text-xl text-ember hover:text-ember-hover transition-colors inline-block mb-12">
          PictureBox
        </Link>
        {children}
      </div>
    </div>
  )
}
