import type { Metadata } from 'next'
import Link from 'next/link'
import { AIRSPACE } from '@/lib/airspace'

export const metadata: Metadata = {
  title: 'Airspace radio requirements — Class B, C, D, E, G · Wilco',
  description: 'What you have to say (and have) to fly into each class of US airspace — Class Bravo, Charlie, Delta, Echo, and Golf — explained for student pilots.',
  alternates: { canonical: 'https://wilco.binnacleai.com/airspace' },
}

export default function AirspaceIndex() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Airspace radio requirements</h1>
        <p className="text-gray-500 mb-6">What you must say — and have — to fly into each class of US airspace.</p>
        <div className="space-y-2">
          {AIRSPACE.map((a) => (
            <Link key={a.slug} href={`/airspace/${a.slug}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
              <div className="font-medium group-hover:text-gray-900">{a.klass}</div>
              <div className="text-sm text-gray-500 mt-0.5">{a.oneLine}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
