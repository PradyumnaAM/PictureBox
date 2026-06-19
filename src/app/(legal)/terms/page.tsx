import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — PictureBox' }

export default function TermsPage() {
  return (
    <div className="text-on-surface leading-relaxed">
      <h1 className="text-iris-gradient font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">Terms of Service</h1>
      <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full mb-8 inline-block">
        Last updated: June 2026
      </span>

      <p className="text-on-surface-variant mb-4 leading-relaxed">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of PictureBox and its related services.
        Please read them carefully.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Acceptance of Terms
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        By creating an account or using PictureBox, you agree to be bound by these Terms and our{' '}
        <a href="/privacy" className="text-ember hover:underline">
          Privacy Policy
        </a>
        . If you do not agree, do not use the service.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Eligibility
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        You must be at least 13 years old to use PictureBox. By using the service, you represent
        that you meet this requirement. Users under 18 should have parental consent.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Account Responsibilities
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        You are responsible for maintaining the confidentiality of your account credentials and for
        all activity that occurs under your account. Notify us immediately at{' '}
        <a href="mailto:support@picturebox.app" className="text-ember hover:underline">
          support@picturebox.app
        </a>{' '}
        if you suspect unauthorised access. You may not share your account or create accounts on
        behalf of others without their consent.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Content Rules
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        You may post reviews, ratings, and other content (&ldquo;User Content&rdquo;) on PictureBox. You agree
        not to post content that:
      </p>
      <ul className="text-on-surface-variant mb-4 leading-relaxed space-y-2 list-disc list-inside">
        <li>Contains hate speech, slurs, or content that discriminates based on race, ethnicity, religion, gender, sexual orientation, or disability</li>
        <li>Harasses, threatens, or intimidates other users</li>
        <li>Is spam, unsolicited advertising, or repetitive low-quality content</li>
        <li>Is sexually explicit or NSFW without appropriate spoiler/content warnings</li>
        <li>Infringes on any third-party intellectual property rights</li>
        <li>Violates any applicable law or regulation</li>
      </ul>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        We reserve the right to remove content and suspend accounts that violate these rules, at
        our sole discretion.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        TMDB Attribution
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        Film and TV metadata displayed on PictureBox is provided by{' '}
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ember hover:underline"
        >
          The Movie Database (TMDB)
        </a>
        . This product uses the TMDB API but is not endorsed or certified by TMDB. All film and TV
        data, images, and related content remain the property of their respective rights holders.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Intellectual Property
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        The PictureBox name, logo, design, and original content are the property of PictureBox and
        may not be reproduced without permission. You retain ownership of User Content you post,
        but grant PictureBox a non-exclusive, royalty-free licence to display it within the service.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Disclaimer and Limitation of Liability
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        PictureBox is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not
        guarantee that the service will be uninterrupted, error-free, or that film data will always
        be accurate. To the fullest extent permitted by law, PictureBox shall not be liable for any
        indirect, incidental, or consequential damages arising from your use of the service.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Termination
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        You may delete your account at any time from your account settings. We reserve the right to
        suspend or terminate accounts that violate these Terms, without prior notice. Upon
        termination, your right to use the service ceases immediately.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Governing Law
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        These Terms are governed by the laws of the State of New Jersey, USA, without regard to
        conflict of law principles. Any disputes shall be resolved in the courts of New Jersey.
      </p>

      <h2 className="font-display text-2xl text-cream mt-10 mb-3 border-b border-white/10 pb-2">
        Changes to These Terms
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        We may update these Terms from time to time. For material changes, we will provide at least
        30 days&apos; notice by email or by posting a prominent notice on the site. Continued use of
        PictureBox after the effective date constitutes acceptance of the updated Terms.
      </p>
    </div>
  )
}

