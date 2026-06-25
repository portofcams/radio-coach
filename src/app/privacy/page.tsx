import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Clearspar Radio Trainer',
  description: 'What Clearspar Radio Trainer collects, why, and how to control your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Effective June 24, 2026. Plain-language summary of how we handle your data.</p>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 mb-1">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account:</strong> your email and a hashed password. We never store your password in plain text.</li>
              <li><strong>Training data:</strong> your practice scores, graded readbacks, streaks, and progress, so we can show your history and weak spots.</li>
              <li><strong>Optional details you enter:</strong> call sign, home airport, saved aircraft, logbook entries — only what you choose to add.</li>
              <li><strong>Basic logs:</strong> errors and request data needed to keep the service running and secure.</li>
              <li><strong>Anonymous usage analytics:</strong> which pages get viewed and whether you&rsquo;re on the web or the app, tied only to a random ID stored on your device — never your name or email, never shared with advertisers, and never used to track you across other apps or websites.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">What we don&rsquo;t do</h2>
            <p>We don&rsquo;t sell your personal data, and we don&rsquo;t run third-party advertising trackers. Leaderboards show only the call sign you choose to display.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Service providers we use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe</strong> — processes subscription payments. We never see or store your full card number.</li>
              <li><strong>ElevenLabs</strong> — generates the ATC voice and (if you use voice input) transcribes your spoken readback.</li>
              <li><strong>Resend</strong> — delivers the emails you opt into (weekly reports, drip lessons).</li>
              <li><strong>OpenStreetMap</strong> — supplies airport taxiway geometry for diagrams.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Cookies &amp; local storage</h2>
            <p>A secure cookie keeps you signed in. We also store a random anonymous ID and a daily free-scenario counter on your device — used only for the analytics above and the free tier. There are no advertising cookies and no cross-site tracking.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Email choices</h2>
            <p>Any newsletter or report email includes a one-click unsubscribe link, and your account stays untouched if you opt out.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Deleting your data</h2>
            <p>Want your account and data removed? Email us (see <Link href="/contact" className="text-blue-600 hover:underline">Contact</Link>) and we&rsquo;ll delete it.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Contact</h2>
            <p>Clearspar Radio Trainer · 440 Lewers Street, Suite 603, Honolulu, HI 96815 · <a href="mailto:john@binnacleai.com" className="text-blue-600 hover:underline">john@binnacleai.com</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
