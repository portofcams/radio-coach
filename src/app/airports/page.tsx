import type { Metadata } from 'next'
import { curatedAirports, usStatesWithFields } from '@/lib/airports'

export const metadata: Metadata = {
  title: 'Airport radio frequencies & ATC practice · Wilco',
  description: 'Tower, ground, ATIS and clearance frequencies for US airports — plus free radio-communication practice with instant grading.',
  alternates: { canonical: 'https://wilco.binnacleai.com/airports' },
}

export default function AirportsIndex() {
  const list = curatedAirports(250)
  const states = usStatesWithFields()
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Airport radio frequencies & practice</h1>
        <p className="text-gray-500 mb-6">Real tower, ground, ATIS and clearance frequencies — then practice the calls at your field, graded instantly.</p>

        <h2 className="text-sm font-semibold text-gray-700 mb-2">Browse by state</h2>
        <div className="flex flex-wrap gap-1.5 mb-8">
          {states.map((s) => (
            <a key={s.code} href={`/airports/region/${s.code.toLowerCase()}`} className="text-sm border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:border-gray-400 transition-colors">
              {s.name} <span className="text-gray-400">{s.count}</span>
            </a>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-2">Busiest fields</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {list.map((a) => (
            <a key={a.ident} href={`/airports/${a.ident}`} className="border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 transition-colors">
              <span className="font-mono text-sm text-gray-900">{a.ident}</span>
              <span className="text-sm text-gray-500"> · {a.city || a.name}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
