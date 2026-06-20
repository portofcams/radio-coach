'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Readiness } from '@/lib/readiness'

interface Stats {
  total: number
  passed: number
  passRate: number
  avgScore: number
  byPhase: Array<{ phase: string; total: string; passed: string; avg_score: string }>
  topMistakes: Array<{ elem: string; cnt: string }>
  trend: Array<{ day: string; n: string; avg: string; passed: string }>
}

const PHASE_LABELS: Record<string, string> = {
  ground: 'Ground', departure: 'Departure', pattern: 'Pattern', enroute: 'En route', ifr: 'IFR', emergency: 'Emergencies', other: 'Other',
}
const barColor = (v: number) => (v >= 80 ? 'bg-green-400' : v >= 60 ? 'bg-amber-400' : 'bg-red-400')

export default function ProgressPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [rd, setRd] = useState<Readiness | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/user/stats').then((r) => r.json()),
      fetch('/api/user/readiness').then((r) => r.json()),
    ]).then(([me, s, r]) => {
      if (!me.user) { router.push('/login'); return }
      if (!s.error) setStats(s)
      if (r && typeof r.score === 'number') setRd(r)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (!stats) return null

  if (stats.total === 0) return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center text-gray-400">
      <div className="text-sm">No graded scenarios yet.</div>
      <a href="/train" className="text-blue-600 text-sm hover:underline mt-1 block">Start training →</a>
    </main>
  )

  const trend = stats.trend ?? []
  const rdColor = rd?.level === 'ready' ? '#16a34a' : rd?.level === 'almost' ? '#d97706' : '#dc2626'
  const c = 2 * Math.PI * 34

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
            <h1 className="text-xl font-semibold">Your progress</h1>
          </div>
          <a href="/card" className="text-xs text-gray-400 hover:text-gray-600">Share card</a>
        </div>

        {/* Readiness + headline numbers */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6 flex items-center gap-5">
          {rd && (
            <svg viewBox="0 0 80 80" className="w-20 h-20 shrink-0 -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={rdColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - rd.score / 100)} />
              <text x="40" y="40" dy="0.35em" textAnchor="middle" transform="rotate(90 40 40)" fontSize="20" fontWeight="700" fill="#0f172a">{rd.score}</text>
            </svg>
          )}
          <div className="flex-1 grid grid-cols-3 gap-3 text-center">
            {[{ label: 'Scenarios', v: stats.total }, { label: 'Pass rate', v: `${stats.passRate}%` }, { label: 'Avg score', v: stats.avgScore }].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-gray-900">{s.v}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score trend (last 30 days) */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Score trend · last 30 days</div>
          {trend.length === 0 ? (
            <div className="text-sm text-gray-400">No activity in the last 30 days.</div>
          ) : (
            <>
              <div className="flex items-end gap-1 h-32">
                {trend.map((d) => {
                  const avg = parseInt(d.avg) || 0
                  return (
                    <div key={d.day} className="flex-1 flex flex-col justify-end items-center group relative" title={`${d.day}: avg ${avg} (${d.n})`}>
                      <div className={`w-full rounded-t ${barColor(avg)}`} style={{ height: `${Math.max(4, avg)}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                <span>{trend[0].day.slice(5)}</span>
                <span>avg score per active day</span>
                <span>{trend[trend.length - 1].day.slice(5)}</span>
              </div>
            </>
          )}
        </div>

        {/* By phase */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Pass rate by phase</div>
          <div className="space-y-2">
            {stats.byPhase.map((p) => {
              const pct = Math.round((parseInt(p.passed) / parseInt(p.total)) * 100)
              return (
                <div key={p.phase} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 shrink-0">{PHASE_LABELS[p.phase] ?? p.phase}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 w-20 text-right">{pct}% · {p.total} done</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Most-missed elements */}
        {stats.topMistakes.length > 0 && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-3">Most-missed elements</div>
            <div className="space-y-2">
              {stats.topMistakes.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-yellow-900">{m.elem}</span>
                  <span className="text-xs text-yellow-600 font-mono">{m.cnt}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
