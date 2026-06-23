import type { Metadata } from 'next'
import Link from 'next/link'
import { getPool } from '@/lib/db'
import { topWeekly } from '@/lib/leaderboard-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Top radio pilots this week · Clearspar',
  description: 'This week\'s leaderboard — the student pilots passing the most graded ATC radio scenarios on Clearspar. Practice your readbacks and climb the board.',
  alternates: { canonical: 'https://wilco.binnacleai.com/top-pilots' },
}

export default async function TopPilotsPage() {
  const db = getPool()
  const pilots = db ? await topWeekly(db, 25) : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Top radio pilots this week',
    itemListElement: pilots.map((p) => ({ '@type': 'ListItem', position: p.rank, name: p.callsign })),
  }

  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-xl mx-auto px-6 py-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Top radio pilots this week</h1>
        <p className="text-gray-500 mb-6">The most graded ATC scenarios passed in the last 7 days. Updated continuously.</p>

        {pilots.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-2">The board resets weekly — be the first on it.</p>
            <Link href="/train" className="text-blue-600 hover:underline text-sm">Start practicing →</Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            {pilots.map((p) => (
              <div key={p.rank} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={`w-6 text-right font-mono ${p.rank <= 3 ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{p.rank}</span>
                <span className="flex-1 font-mono truncate">{p.callsign}</span>
                <span className="font-semibold">{p.week}</span>
                <span className="text-gray-400 text-xs w-16 text-right">this week</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border border-gray-200 rounded-xl p-5 bg-gray-50 text-center">
          <p className="text-gray-700 mb-3">Want on the board? Hear a real ATC call, read it back, get graded — free.</p>
          <Link href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Start training →</Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Pilots appear by their chosen radio call sign. <Link href="/leaderboard" className="text-blue-600 hover:underline">Full leaderboard →</Link></p>
      </div>
    </main>
  )
}
