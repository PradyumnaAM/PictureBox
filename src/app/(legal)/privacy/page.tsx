import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — PictureBox' }

export default function PrivacyPage() {
  return (
    <div className="text-on-surface leading-relaxed">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-cream mb-2">Privacy Policy</h1>
      <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full mb-8 inline-block">
        Last updated: June 2026
      </span>

      <p className="text-on-surface-variant mb-4 leading-relaxed">
        PictureBox (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This policy explains
        what information we collect, how we use it, and your rights over it.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        What We Collect
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        When you use PictureBox, we collect the following:
      </p>
      <ul className="text-on-surface-variant mb-4 leading-relaxed space-y-2 list-disc list-inside">
        <li>Email address and username (required to create an account)</li>
        <li>Watch history — films and TV shows you log, including status and dates</li>
        <li>Ratings and written reviews you submit</li>
        <li>Streaming service preferences you set in your profile</li>
        <li>IP address, used solely for rate limiting and abuse prevention</li>
      </ul>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        What We Don&apos;t Collect
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        We do not collect payment information (we have no paid tier), precise geolocation data,
        device contacts or address books, or any biometric data. We do not sell your data to
        third parties.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        How We Use Your Information
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        Your data is used to provide and improve the PictureBox service — powering your diary,
        watchlist, and stats. We send transactional emails only (account confirmation, password
        reset). We will never send marketing emails without your explicit consent.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Third-Party Services
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        We rely on the following sub-processors, each bound by their own privacy policies:
      </p>
      <ul className="text-on-surface-variant mb-4 leading-relaxed space-y-2 list-disc list-inside">
        <li>
          <span className="text-on-surface font-medium">Supabase</span> — database and
          authentication (data stored in the EU by default)
        </li>
        <li>
          <span className="text-on-surface font-medium">TMDB (The Movie Database)</span> — film
          and TV metadata; your searches may be proxied through their API
        </li>
        <li>
          <span className="text-on-surface font-medium">Vercel</span> — hosting and edge network
        </li>
        <li>
          <span className="text-on-surface font-medium">Resend</span> — transactional email
          delivery
        </li>
      </ul>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Data Retention
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        We retain your data for as long as your account is active. If you request account deletion,
        your personal data is purged within 30 days. Aggregated, anonymised statistics may be
        retained indefinitely.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Your Rights
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        You can export your watch history and reviews at any time from your account settings. You
        may also request full account deletion, which permanently removes your profile, logs, and
        reviews from our systems.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Children (COPPA)
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        PictureBox is not directed at children under the age of 13. We do not knowingly collect
        personal information from anyone under 13. If you believe a child has provided us with
        personal data, please contact us and we will delete it promptly.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        GDPR (EU Users)
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        If you are located in the European Economic Area, you have the right to access, rectify,
        or erase your personal data, restrict or object to its processing, and data portability.
        To exercise these rights, contact us at{' '}
        <a
          href="mailto:privacy@picturebox.app"
          className="text-ember hover:underline"
        >
          privacy@picturebox.app
        </a>
        .
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Contact
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        Questions about this policy? Email us at{' '}
        <a href="mailto:privacy@picturebox.app" className="text-ember hover:underline">
          privacy@picturebox.app
        </a>
        .
      </p>
    </div>
  )
}
