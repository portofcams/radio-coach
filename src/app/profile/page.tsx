'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toPhonetic } from '@/lib/phonetic'

interface Stats {
  total: number
  passed: number
  passRate: number
  avgScore: number
  byPhase: Array<{ phase: string; total: string; passed: string; avg_score: string }>
  topMistakes: Array<{ elem: string; cnt: string }>
  recent: Array<{ scenario_id: string; score: number; passed: boolean; hint_used: boolean; created_at: string }>
}

interface User {
  id: number
  email: string
  callsign: string | null
}

const PHASE_LABELS: Record<string, string> = {
  ground: 'Ground', departure: 'Departure', pattern: 'Pattern', enroute: 'En route', ifr: 'IFR',
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [callsign, setCallsign] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/user/stats').then((r) => r.json()),
    ])
      .then(([me, s]) => {
        if (!me.user) { router.push('/login'); return }
        setUser(me.user)
        setCallsign(me.user.callsign ?? '')
        if (!s.error) setStats(s)
      })
      .finally(() => setLoading(false))
  }, [router])

  async function saveCallsign() {
    setSaving(true)
    try {
      const res = await fetch('/api/user/callsign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callsign }),
      })
      const data = await res.json()
      setUser((u) => u ? { ...u, callsign: data.callsign } : u)
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (!user) return null

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>

        {/* Email */}
        <div className="text-sm text-gray-500 mb-6">{user.email}</div>

        {/* Callsign */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Your aircraft callsign</div>
          <div className="flex gap-2">
            <input
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="N12345"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
            />
            <button
              onClick={saveCallsign}
              disabled={saving}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {callsign && (
            <div className="mt-2 text-xs text-gray-400">
              Phonetic: <span className="text-gray-600">{toPhonetic(callsign)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && stats.total > 0 ? (
          <>
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Scenarios', value: stats.total },
                { label: 'Pass rate', value: `${stats.passRate}%` },
                { label: 'Avg score', value: stats.avgScore },
              ].map((s) => (
                <div key={s.label} className="border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* By phase */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">By phase</div>
              <div className="space-y-2">
                {stats.byPhase.map((p) => {
                  const pct = Math.round((parseInt(p.passed) / parseInt(p.total)) * 100)
                  return (
                    <div key={p.phase} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600 shrink-0">{PHASE_LABELS[p.phase] ?? p.phase}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 shrink-0 w-20 text-right">{pct}% · {p.total} done</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mistake library */}
            {stats.topMistakes.length > 0 && (
              <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5 mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-3">Your most-missed elements</div>
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

            {/* Recent history */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Recent history</div>
              <div className="space-y-2">
                {stats.recent.map((g, i) => (
                  <a key={i} href={`/train/${g.scenario_id}`} className="flex items-center justify-between py-1 hover:text-gray-900 group">
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                      {g.scenario_id.replace(/-/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {g.hint_used && <span className="text-xs text-gray-300">hint</span>}
                      <span className={`text-xs font-mono ${g.passed ? 'text-green-600' : 'text-red-500'}`}>{g.score}</span>
                      <span className={g.passed ? 'text-green-500' : 'text-red-400'}>{g.passed ? '✓' : '✗'}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📡</div>
            <div className="text-sm">No scenarios graded yet.</div>
            <a href="/train" className="text-blue-600 text-sm hover:underline mt-1 block">Start training →</a>
          </div>
        )}
      </div>
    </main>
  )
}
