import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact — Clearspar Radio Trainer',
  description: 'How to reach Clearspar Radio Trainer for support or questions.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Contact</h1>
        <p className="text-gray-500 text-sm mb-8">Questions, bugs, or feature ideas — we read every message.</p>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Send feedback in the app</h2>
            <p>The fastest way to reach us is the <Link href="/feedback" className="text-blue-600 hover:underline">feedback form</Link> — report a bug, suggest a scenario, or tell us what&rsquo;s confusing.</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Email</h2>
            <p><a href="mailto:john@binnacleai.com" className="text-blue-600 hover:underline">john@binnacleai.com</a></p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Mailing address</h2>
            <p>Clearspar Radio Trainer<br />440 Lewers Street, Suite 603<br />Honolulu, HI 96815</p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">Billing</h2>
            <p>Manage or cancel a subscription from your <Link href="/profile" className="text-blue-600 hover:underline">profile</Link>. Payments are handled by Stripe.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
