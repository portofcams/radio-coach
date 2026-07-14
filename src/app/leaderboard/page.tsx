'use client'

import { useEffect, useState } from 'react'

interface Row { rank: number; callsign: string; passes: number; avg: number; week: number; streak?: number; referred?: number; you: boolean }
const TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All-time' },
  { key: 'week', label: 'This week' },
  { key: 'streak', label: 'Streaks' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'towered', label: 'Towered' },
  { key: 'nontowered', label: 'Non-towered' },
  { key: 'school', label: 'My school' },
]

const SCOPE_LABEL: Record<string, string> = {
  all: 'All-Time', week: 'Weekly', streak: 'Streak', referrals: 'Referral',
  towered: 'Towered', nontowered: 'Non-Towered', school: 'School',
}

function shareStat(scope: string, r: Row): { stat: number; unit: string } {
  if (scope === 'streak') return { stat: r.streak ?? 0, unit: 'day streak' }
  if (scope === 'week') return { stat: r.week, unit: 'passed this week' }
  if (scope === 'referrals') return { stat: r.passes, unit: 'referrals converted' }
  return { stat: r.passes, unit: 'scenarios passed' }
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState('all')
  const [rows, setRows] = useState<Row[]>([])
  const [unavailable, setUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true); setUnavailable(false)
    fetch(`/api/leaderboard?scope=${scope}`).then((r) => r.json()).then((d) => {
      setRows(d.rows ?? []); setUnavailable(!!d.unavailable)
    }).finally(() => setLoading(false))
  }, [scope])

  const metric = scope === 'streak' ? 'streak' : scope === 'week' ? 'week' : scope === 'referrals' ? 'converted' : 'passes'

  function shareRank(r: Row) {
    const { stat, unit } = shareStat(scope, r)
    const qs = new URLSearchParams({
      rank: String(r.rank), stat: String(stat), unit, scope: SCOPE_LABEL[scope] ?? 'Leaderboard', cs: r.callsign,
    })
    const url = `${location.origin}/s?${qs.toString()}`
    navigator.clipboard?.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
          <h1 className="text-xl font-semibold">Leaderboard</h1>
        </div>
        <p className="text-xs text-gray-400 mb-5">Climb by passing scenarios and keeping your streak alive.</p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setScope(t.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${scope === t.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : unavailable ? (
          <div className="text-gray-400 text-sm">Join or run a flight school to see a school leaderboard.</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-400 text-sm">No entries yet. <a href="/train" className="text-blue-600 hover:underline">Start training →</a></div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Pilot</div>
              <div className="col-span-2 text-right">{scope === 'streak' ? 'Streak' : scope === 'week' ? 'Week' : scope === 'referrals' ? 'Converted' : 'Passed'}</div>
              <div className="col-span-3 text-right">{scope === 'streak' ? 'Passed' : scope === 'referrals' ? 'Referred' : 'Avg'}</div>
            </div>
            {rows.map((r) => (
              <div key={r.rank} className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm items-center ${r.you ? 'bg-blue-50' : ''} ${r.rank > 1 ? 'border-t border-gray-50' : ''}`}>
                <div className="col-span-1 font-mono text-gray-400">{r.rank}</div>
                <div className="col-span-6 font-mono truncate">
                  {r.callsign}
                  {r.you && (
                    <>
                      <span className="ml-1 text-xs text-blue-600">(you)</span>
                      <button onClick={() => shareRank(r)} className="ml-2 text-xs text-gray-400 hover:text-gray-700 underline decoration-dotted">
                        {copied ? 'Copied' : 'Share'}
                      </button>
                    </>
                  )}
                </div>
                <div className="col-span-2 text-right font-semibold">{metric === 'streak' ? `${r.streak ?? 0}d` : metric === 'week' ? r.week : r.passes}</div>
                <div className="col-span-3 text-right text-gray-500">{scope === 'streak' ? r.passes : scope === 'referrals' ? (r.referred ?? 0) : r.avg}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
