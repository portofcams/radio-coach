'use client'

import { useEffect, useState } from 'react'

interface Row { rank: number; callsign: string; score: number; you: boolean }
interface BracketData {
  scenario: { id: string; title: string }
  weekStart: string
  weekEnd: string
  rows: Row[]
  you: Row | null
  previousWeek: { scenario: { id: string; title: string }; winner: Row | null }
}

function daysLeft(weekEnd: string): number {
  return Math.max(0, Math.ceil((new Date(weekEnd).getTime() - Date.now()) / 86_400_000))
}

export default function BracketPage() {
  const [data, setData] = useState<BracketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bracket').then((r) => (r.ok ? r.json() : null)).then(setData).finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
          <h1 className="text-xl font-semibold">Weekly Bracket</h1>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          One shared scenario, every pilot, all week — your best attempt is your score. New challenge every Monday.
        </p>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : !data ? (
          <div className="text-gray-400 text-sm">Couldn&apos;t load this week&apos;s bracket. <a href="/train" className="text-blue-600 hover:underline">Back to training</a></div>
        ) : (
          <>
            <a href={`/train/scenario?id=${data.scenario.id}`} className="block rounded-xl p-4 border border-amber-300 bg-amber-50 hover:border-amber-400 transition-colors mb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold tracking-widest text-amber-600 mb-0.5">THIS WEEK&apos;S CHALLENGE</div>
                  <div className="font-medium text-gray-900 truncate">{data.scenario.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{daysLeft(data.weekEnd)}d left this week</div>
                </div>
                <span className="shrink-0 text-sm font-medium text-amber-700">
                  {data.you ? `#${data.you.rank} · ${data.you.score}` : 'Fly it →'}
                </span>
              </div>
            </a>

            {data.previousWeek.winner && (
              <div className="rounded-xl p-3 border border-gray-200 bg-gray-50 mb-6 text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Last week&apos;s champion:</span>{' '}
                {data.previousWeek.winner.callsign} — {data.previousWeek.winner.score} on &ldquo;{data.previousWeek.scenario.title}&rdquo;
              </div>
            )}

            {data.rows.length === 0 ? (
              <div className="text-gray-400 text-sm">
                No entries yet this week. <a href={`/train/scenario?id=${data.scenario.id}`} className="text-blue-600 hover:underline">Be the first →</a>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                  <div className="col-span-1">#</div>
                  <div className="col-span-8">Pilot</div>
                  <div className="col-span-3 text-right">Score</div>
                </div>
                {data.rows.map((r) => (
                  <div key={r.rank} className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm items-center ${r.you ? 'bg-blue-50' : ''} ${r.rank > 1 ? 'border-t border-gray-50' : ''}`}>
                    <div className="col-span-1 font-mono text-gray-400">{r.rank}</div>
                    <div className="col-span-8 font-mono truncate">
                      {r.callsign}
                      {r.you && <span className="ml-1 text-xs text-blue-600">(you)</span>}
                    </div>
                    <div className="col-span-3 text-right font-semibold">{r.score}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
