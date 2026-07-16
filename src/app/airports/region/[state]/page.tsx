import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { US_STATES, usStatesWithFields, regionAirports } from '@/lib/airports'

export function generateStaticParams() {
  return usStatesWithFields().map((s) => ({ state: s.code.toLowerCase() }))
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params
  const name = US_STATES[state.toUpperCase()]
  if (!name) return {}
  return {
    title: `Aircraft radio practice in ${name} — airport frequencies · Clearspar`,
    description: `Tower, ground, ATIS and clearance frequencies for towered airports in ${name}, plus free ATC radio-communication practice with instant grading.`,
    alternates: { canonical: `https://clearsparradio.binnacleai.com/airports/region/${state.toLowerCase()}` },
  }
}

export default async function RegionHub({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params
  const code = state.toUpperCase()
  const name = US_STATES[code]
  if (!name) notFound()
  const list = regionAirports(code)
  if (list.length === 0) notFound()

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/airports" className="text-gray-400 hover:text-gray-600 text-sm">← all airports</a>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Aircraft radio practice in {name}</h1>
        <p className="text-gray-500 mb-6">
          Real tower, ground, ATIS and clearance frequencies for {list.length} towered{' '}
          {name} airport{list.length === 1 ? '' : 's'} — then practice the calls at your home field, graded instantly.
        </p>
        {(code === 'HI' || code === 'AK') && (
          <a
            href={`/train?pack=${code === 'HI' ? 'hawaii' : 'alaska'}`}
            className="block mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 hover:border-blue-400 transition-colors"
          >
            <span className="font-mono text-[10px] font-bold tracking-widest text-blue-700">
              {code === 'HI' ? 'HAWAII PACK' : 'ALASKA PACK'}
            </span>
            <span className="block text-sm text-blue-900 mt-0.5">
              {code === 'HI'
                ? `Practice real ${name} radio calls — inter-island clearances, tower checkins, CTAF self-announce, and more →`
                : `Practice real ${name} radio calls — bush-strip self-announce, tower checkins, flight following, and more →`}
            </span>
          </a>
        )}
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
