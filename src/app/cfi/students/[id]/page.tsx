'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { scenarios } from '@/lib/scenarios'
import { ENDORSEMENT_KINDS } from '@/lib/endorsements'

interface Report {
  joined: boolean
  email: string
  callsign: string | null
  weakspots: Array<{ key: string; label: string; tip: string; rate: number; misses: number; opportunities: number }>
  readiness: { score: number; level: string; label: string; factors: { recentAccuracy: number; passRate: number; coverage: number } } | null
  recent: Array<{ scenario_id: string; score: number; passed: boolean; created_at: string }>
  assignments: Array<{ scenario_id: string; done: boolean; created_at: string }>
  comments: Array<{ id: number; body: string; created_at: string }>
  endorsements: string[]
}

const PHASES = ['ground', 'departure', 'pattern', 'enroute', 'ifr', 'emergency'] as const
const PHASE_LABELS: Record<string, string> = { ground: 'Ground', departure: 'Departure', pattern: 'Pattern', enroute: 'En route', ifr: 'IFR', emergency: 'Emergencies & advanced' }

export default function StudentReport() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assigning, setAssigning] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    const res = await fetch(`/api/cfi/students/${id}`)
    if (res.status === 401) { router.push('/login'); return }
    if (res.status === 403) { router.push('/cfi'); return }
    if (res.ok) setReport(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

  async function assign() {
    if (!selected.size) return
    setAssigning(true)
    try {
      await fetch(`/api/cfi/students/${id}/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenarioIds: [...selected] }),
      })
      setSelected(new Set()); setPicking(false)
      await load()
    } finally { setAssigning(false) }
  }

  function toggle(sid: string) {
    setSelected((s) => { const n = new Set(s); n.has(sid) ? n.delete(sid) : n.add(sid); return n })
  }

  async function postComment() {
    if (!comment.trim()) return
    setPosting(true)
    try {
      await fetch(`/api/cfi/students/${id}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: comment }) })
      setComment(''); await load()
    } finally { setPosting(false) }
  }

  async function toggleEndorsement(kind: string, has: boolean) {
    await fetch(`/api/cfi/students/${id}/endorse`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, remove: has }) })
    await load()
  }

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (!report) return null
  const r = report
  const levelColor = r.readiness?.level === 'ready' ? '#16a34a' : r.readiness?.level === 'almost' ? '#d97706' : '#dc2626'
  const assignedIds = new Set(r.assignments.map((a) => a.scenario_id))

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <a href="/cfi" className="text-gray-400 hover:text-gray-600 text-sm">← students</a>
          <h1 className="text-xl font-semibold truncate">{r.email}</h1>
        </div>

        {!r.joined && <div className="text-amber-600 text-sm">This student hasn&apos;t joined yet.</div>}

        {r.joined && (
          <>
            {/* Readiness + weak spots */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-4">
                {r.readiness && (
                  <div className="text-center shrink-0">
                    <div className="text-3xl font-bold" style={{ color: levelColor }}>{r.readiness.score}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{r.readiness.label}</div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Weak spots</div>
                  {r.weakspots.length === 0 && <div className="text-sm text-gray-400">No clear weak spots yet — needs more graded scenarios.</div>}
                  <div className="space-y-2">
                    {r.weakspots.map((w) => (
                      <div key={w.key} className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 w-28 shrink-0 truncate">{w.label}</span>
                        <span className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><span className="block h-full bg-red-400 rounded-full" style={{ width: `${Math.round(w.rate * 100)}%` }} /></span>
                        <span className="text-xs font-mono text-gray-400 w-16 text-right">{Math.round(w.rate * 100)}% miss</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Assigned scenarios</div>
                <button onClick={() => setPicking((v) => !v)} className="text-sm text-blue-600 hover:underline">{picking ? 'Cancel' : '+ Assign'}</button>
              </div>
              {r.assignments.length === 0 && !picking && <div className="text-sm text-gray-400">Nothing assigned yet.</div>}
              <div className="space-y-1.5">
                {r.assignments.map((a) => (
                  <div key={a.scenario_id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 capitalize">{a.scenario_id.replace(/-/g, ' ')}</span>
                    <span className={a.done ? 'text-green-600' : 'text-gray-400'}>{a.done ? 'done ✓' : 'pending'}</span>
                  </div>
                ))}
              </div>

              {picking && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                    {PHASES.map((p) => {
                      const list = scenarios.filter((s) => s.phase === p && !assignedIds.has(s.id))
                      if (!list.length) return null
                      return (
                        <div key={p}>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{PHASE_LABELS[p]}</div>
                          <div className="space-y-1">
                            {list.map((s) => (
                              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="accent-gray-900" />
                                <span className="text-gray-700">{s.title}</span>
                                {s.tier === 'pro' && <span className="text-[9px] font-bold bg-gray-900 text-white px-1 rounded">PRO</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={assign} disabled={assigning || !selected.size} className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">
                    {assigning ? 'Assigning...' : `Assign ${selected.size || ''}`.trim()}
                  </button>
                </div>
              )}
            </div>

            {/* Endorsements */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Endorsements</div>
              <div className="flex flex-wrap gap-2">
                {ENDORSEMENT_KINDS.map((e) => {
                  const has = r.endorsements.includes(e.key)
                  return (
                    <button key={e.key} onClick={() => toggleEndorsement(e.key, has)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${has ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-500 hover:border-gray-500'}`}>
                      {has ? '✓ ' : '+ '}{e.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">Tap to grant or revoke. Granted endorsements show on the student&apos;s profile and score card.</p>
            </div>

            {/* Comments */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Notes to {r.callsign || 'your student'}</div>
              <div className="flex gap-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') postComment() }}
                  placeholder="Leave a note (the student sees this)…" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <button onClick={postComment} disabled={posting || !comment.trim()} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">Post</button>
              </div>
              <div className="mt-3 space-y-2">
                {r.comments.map((c) => (
                  <div key={c.id} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                    {c.body}
                    <span className="block text-[10px] text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent */}
            {r.recent.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Recent scenarios</div>
                <div className="space-y-1.5">
                  {r.recent.map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{g.scenario_id.replace(/-/g, ' ')}</span>
                      <span className={`font-mono text-xs ${g.passed ? 'text-green-600' : 'text-red-500'}`}>{g.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
