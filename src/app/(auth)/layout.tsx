import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Ember pool of light + sprocket strips frame the lobby */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[28rem] rounded-full bg-ember/[0.06] blur-[130px] pointer-events-none"
      />
      <div aria-hidden className="sprockets absolute top-4 inset-x-0 opacity-50" />
      <div aria-hidden className="sprockets absolute bottom-4 inset-x-0 opacity-50" />

      {/* Logo */}
      <div className="relative px-6 py-6 shrink-0">
        <Link href="/" className="group inline-flex items-baseline" aria-label="PictureBox home">
          <span className="font-display text-2xl font-semibold tracking-tight text-cream group-hover:text-ember transition-colors">
            PictureBox
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-ember ml-1" />
        </Link>
      </div>

      {/* Vertically + horizontally centred content */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  )
}
