import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cookie Policy — PictureBox' }

export default function CookiesPage() {
  return (
    <div className="text-on-surface leading-relaxed">
      <h1 className="font-display text-3xl text-on-surface mb-2">Cookie Policy</h1>
      <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full mb-8 inline-block">
        Last updated: June 2026
      </span>

      <p className="text-on-surface-variant mb-4 leading-relaxed">
        This policy explains how PictureBox uses cookies and similar technologies when you visit
        our site.
      </p>

      <h2 className="font-display text-xl text-on-surface mt-10 mb-3 border-b border-white/10 pb-2">
        What Are Cookies?
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        Cookies are small text files stored on your device by your browser. They allow websites to
        remember information about your visit, such as whether you are signed in.
      </p>

      <h2 className="font-display text-xl text-on-surface mt-10 mb-3 border-b border-white/10 pb-2">
        Cookies We Use
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        PictureBox uses <span className="text-on-surface font-medium">essential cookies only</span>.
        We do not use advertising cookies, tracking pixels, or any third-party analytics cookies.
      </p>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        The only cookie we set is the Supabase authentication session cookie. This cookie:
      </p>
      <ul className="text-on-surface-variant mb-4 leading-relaxed space-y-2 list-disc list-inside">
        <li>Keeps you signed in between visits</li>
        <li>Is strictly necessary — the service cannot function without it</li>
        <li>Contains an encrypted session token, not personal data</li>
        <li>Expires when your session ends or after a configurable period of inactivity</li>
      </ul>

      <h2 className="font-display text-xl text-on-surface mt-10 mb-3 border-b border-white/10 pb-2">
        What We Don&apos;t Use
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        We do not use:
      </p>
      <ul className="text-on-surface-variant mb-4 leading-relaxed space-y-2 list-disc list-inside">
        <li>Advertising or retargeting cookies (Google Ads, Meta Pixel, etc.)</li>
        <li>Analytics cookies (Google Analytics, Mixpanel, etc.)</li>
        <li>Social media tracking cookies</li>
        <li>Any cookie that tracks you across other websites</li>
      </ul>

      <h2 className="font-display text-xl text-on-surface mt-10 mb-3 border-b border-white/10 pb-2">
        How to Clear Cookies
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        You can clear cookies at any time through your browser settings. Note that clearing the
        PictureBox session cookie will sign you out. Here&apos;s how to clear cookies in common
        browsers:
      </p>
      <ul className="text-on-surface-variant mb-4 leading-relaxed space-y-2 list-disc list-inside">
        <li>
          <span className="text-on-surface font-medium">Chrome:</span> Settings → Privacy and
          security → Clear browsing data → Cookies
        </li>
        <li>
          <span className="text-on-surface font-medium">Firefox:</span> Settings → Privacy &amp;
          Security → Cookies and Site Data → Clear Data
        </li>
        <li>
          <span className="text-on-surface font-medium">Safari:</span> Preferences → Privacy →
          Manage Website Data → Remove All
        </li>
        <li>
          <span className="text-on-surface font-medium">Edge:</span> Settings → Privacy, search,
          and services → Clear browsing data → Cookies
        </li>
      </ul>

      <h2 className="font-display text-xl text-on-surface mt-10 mb-3 border-b border-white/10 pb-2">
        Contact
      </h2>
      <p className="text-on-surface-variant mb-4 leading-relaxed">
        Questions about our cookie use? Email{' '}
        <a href="mailto:privacy@picturebox.app" className="text-gold hover:underline">
          privacy@picturebox.app
        </a>
        .
      </p>
    </div>
  )
}
