import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pilot tools — METAR decoder, crosswind & density altitude · Clearspar',
  description: 'Free quick tools for pilots: decode a METAR into plain English, compute crosswind components, figure density altitude, and generate a flight radio brief.',
  alternates: { canonical: 'https://wilco.binnacleai.com/tools' },
}

const TOOLS = [
  { href: '/metar', name: 'METAR decoder', desc: 'Raw report → plain English + flight category.' },
  { href: '/taf', name: 'TAF decoder', desc: 'Terminal forecast → plain-English periods.' },
  { href: '/notam', name: 'NOTAM decoder', desc: 'Expand the contractions into readable English.' },
  { href: '/crosswind', name: 'Crosswind calculator', desc: 'Runway + wind → headwind & crosswind.' },
  { href: '/density-altitude', name: 'Density altitude', desc: 'Elevation, altimeter & temp → performance.' },
  { href: '/e6b', name: 'E6B calculator', desc: 'Time/speed/distance, fuel, and wind correction.' },
  { href: '/brief', name: 'Flight radio brief', desc: 'Route → the expected call sequence with real freqs.' },
]

const RECORDS = [
  { href: '/wb', name: 'Weight & balance', desc: 'Load your aircraft, check gross weight + CG.' },
  { href: '/aircraft', name: 'Your aircraft', desc: 'Save profiles (weights, arms, limits).' },
  { href: '/logbook', name: 'Logbook', desc: 'Log flights, totals, CSV export.' },
  { href: '/currency', name: 'Currency', desc: 'Passenger, flight review & medical status.' },
]

export default function ToolsPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Pilot tools</h1>
        <p className="text-gray-500 mb-6">Quick calculators and references for everyday flying — free, no account needed.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="block border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors group">
              <div className="font-medium group-hover:text-gray-900">{t.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">{t.desc}</div>
            </Link>
          ))}
        </div>
        <h2 className="text-sm font-semibold text-gray-700 mt-8 mb-3">Your aircraft &amp; records <span className="font-normal text-gray-400">(sign in)</span></h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {RECORDS.map((t) => (
            <Link key={t.href} href={t.href} className="block border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors group">
              <div className="font-medium group-hover:text-gray-900">{t.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">{t.desc}</div>
            </Link>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-6">Studying for the checkride? <Link href="/guides" className="text-blue-600 hover:underline">Written prep, flashcards & the ACS tracker →</Link></p>
      </div>
    </main>
  )
}
