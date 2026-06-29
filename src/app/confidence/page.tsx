import type { Metadata } from 'next'
import Link from 'next/link'
import DripSignup from '@/components/DripSignup'

export const metadata: Metadata = {
  title: '7 days to radio confidence — free email course · Clearspar',
  description: 'A free 7-day email course for student pilots: go from dreading the radio to making clean ATC calls. One short lesson a day.',
  alternates: { canonical: 'https://clearsparradio.binnacleai.com/confidence' },
}

const DAYS = [
  'The words you actually need (phonetics & numbers)',
  'The four-part call-up',
  'Readbacks — the part that matters',
  'Talking to a control tower',
  'Non-towered airports & the CTAF',
  'Flight following & handoffs',
  'Put it all together',
]

export default function ConfidencePage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-14">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-3xl font-semibold mt-4 mb-2 leading-tight">7 days to radio confidence</h1>
        <p className="text-lg text-gray-600 mb-6">A free email course for student pilots. One short lesson a day — from dreading the radio to making clean calls.</p>

        <DripSignup />
        <p className="text-xs text-gray-400 mt-2">Free. Unsubscribe anytime. No spam.</p>

        <div className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">What you&apos;ll get</div>
          <ol className="space-y-2">
            {DAYS.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                <span className="text-gray-700">{d}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-gray-500 mt-10">Prefer to dive in? <Link href="/train" className="text-blue-600 hover:underline">Start graded practice now →</Link></p>
      </div>
    </main>
  )
}
