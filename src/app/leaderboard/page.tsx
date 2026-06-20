'use client'

import { useEffect, useState } from 'react'

interface Row { rank: number; callsign: string; passes: number; avg: number; week: number; you: boolean }

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard').then((r) => r.json()).then((d) => setRows(d.rows ?? [])).finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
        </div>
        <p className="text-xs text-gray-400 mb-6">Top pilots by scenarios passed. Keep flying to climb.</p>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-400 text-sm">No graded scenarios yet — be the first. <a href="/train" className="text-blue-600 hover:underline">Start training →</a></div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Pilot</div>
              <div className="col-span-2 text-right">Passed</div>
              <div className="col-span-2 text-right">Avg</div>
              <div className="col-span-2 text-right">Week</div>
            </div>
            {rows.map((r) => (
              <div key={r.rank} className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm items-center ${r.you ? 'bg-blue-50' : ''} ${r.rank > 1 ? 'border-t border-gray-50' : ''}`}>
                <div className="col-span-1 font-mono text-gray-400">{r.rank}</div>
                <div className="col-span-5 font-mono truncate">{r.callsign}{r.you && <span className="ml-1 text-xs text-blue-600">(you)</span>}</div>
                <div className="col-span-2 text-right font-semibold">{r.passes}</div>
                <div className="col-span-2 text-right text-gray-500">{r.avg}</div>
                <div className="col-span-2 text-right text-gray-400">{r.week > 0 ? `+${r.week}` : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
