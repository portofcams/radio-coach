import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Clearspar Radio Trainer',
  description: 'The terms for using Clearspar Radio Trainer.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Effective June 23, 2026. Plain-language summary of the deal.</p>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 mb-1">What this is</h2>
            <p>Clearspar Radio Trainer is a study aid for practicing aviation radio communications. It is <strong>not</strong> flight instruction, not a substitute for a certificated instructor, and <strong>not for navigation or operational use</strong>. Airport diagrams are illustrative and labeled &ldquo;not for navigation.&rdquo; Always defer to current FAA publications, ATC, and your CFI.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Accounts</h2>
            <p>You&rsquo;re responsible for your account and for keeping your password secure. Use the service lawfully and don&rsquo;t attempt to break, abuse, or scrape it.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Subscriptions &amp; billing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>The free tier includes full Ground School and a daily allowance of graded scenarios.</li>
              <li>Paid plans (Solo Pilot, CFI Pro, Flight School) renew automatically each month or year until you cancel.</li>
              <li>You can cancel anytime from your billing portal; access continues through the period you&rsquo;ve paid for.</li>
              <li>Payments are processed by Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">No warranty</h2>
            <p>The service is provided &ldquo;as is.&rdquo; Grading is rule-based and may not match every controller or examiner exactly. We don&rsquo;t guarantee it will make you pass a checkride, and we&rsquo;re not liable for decisions made in reliance on it.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Changes</h2>
            <p>We may update these terms or the service. Material changes will be reflected by the effective date above.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Governing law &amp; contact</h2>
            <p>These terms are governed by the laws of the State of Hawaii. Clearspar Radio Trainer · 440 Lewers Street, Suite 603, Honolulu, HI 96815 · <a href="mailto:john@binnacleai.com" className="text-blue-600 hover:underline">john@binnacleai.com</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
