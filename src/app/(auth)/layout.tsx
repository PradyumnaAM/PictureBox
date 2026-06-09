import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 shrink-0">
        <Link
          href="/"
          className="font-display text-2xl text-gold tracking-tighter hover:text-gold/80 transition-colors"
        >
          PictureBox
        </Link>
      </div>

      {/* Vertically + horizontally centred content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  )
}
