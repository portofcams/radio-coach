'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface RosterStudent {
  id: number
  status: string
  email: string
  callsign: string | null
  joined: boolean
  joinUrl: string | null
  attempts: number
  weekCount: number
  lastDays: number | null
  flag: 'ready' | 'almost' | 'needs-work' | 'inactive' | 'new' | null
  readiness: { score: number; level: string; label: string } | null
}

const FLAG_META: Record<string, { label: string; cls: string }> = {
  ready: { label: 'Checkride-ready', cls: 'bg-green-100 text-green-700' },
  almost: { label: 'Almost', cls: 'bg-amber-100 text-amber-700' },
  'needs-work': { label: 'Needs work', cls: 'bg-red-100 text-red-700' },
  inactive: { label: 'Inactive', cls: 'bg-gray-200 text-gray-600' },
  new: { label: 'New', cls: 'bg-blue-100 text-blue-700' },
}

export default function CfiDashboard() {
  const router = useRouter()
  const [roster, setRoster] = useState<RosterStudent[] | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'not-cfi'>('loading')
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState<number | null>(null)

  async function load() {
    const res = await fetch('/api/cfi/students')
    if (res.status === 401) { router.push('/login'); return }
    if (res.status === 403) { setState('not-cfi'); return }
    const data = await res.json()
    setRoster(data.roster ?? [])
    setState('ok')
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  async function addStudent() {
    if (!email.trim()) return
    setAdding(true); setErr('')
    try {
      const res = await fetch('/api/cfi/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error === 'already_added' ? 'That student is already on your roster.' : data.error === 'cannot_add_self' ? "That's you." : 'Could not add — check the email.'); return }
      setEmail('')
      setRoster(data.roster ?? [])
    } finally { setAdding(false) }
  }

  async function remove(id: number) {
    await fetch(`/api/cfi/students/${id}`, { method: 'DELETE' })
    load()
  }

  const levelColor = (l?: string) => l === 'ready' ? 'text-green-600' : l === 'almost' ? 'text-amber-600' : 'text-red-500'

  if (state === 'loading') return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (state === 'not-cfi') return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">CFI Pro</h1>
      <p className="text-gray-500 mb-6">Manage and diagnose your students — roster, assigned scenarios, and per-student weak-spot reports.</p>
      <a href="/profile" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Upgrade to CFI Pro · $30/mo</a>
    </main>
  )

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
            <h1 className="text-xl font-semibold">Your students</h1>
          </div>
          <a href="/cfi/build" className="text-sm text-blue-600 hover:underline">Custom scenarios →</a>
        </div>

        {/* Add student */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Add a student</div>
          <div className="flex gap-2">
            <input value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') addStudent() }}
              placeholder="student@email.com" type="email"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <button onClick={addStudent} disabled={adding} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
          {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
          <p className="text-xs text-gray-400 mt-2">If they already have a Wilco account they&apos;re linked right away; otherwise share their invite link and they connect when they sign up.</p>
        </div>

        {/* This-week summary */}
        {roster && roster.some((s) => s.joined) && (() => {
          const j = roster.filter((s) => s.joined)
          const n = (f: string) => j.filter((s) => s.flag === f).length
          const active = j.filter((s) => s.weekCount > 0).length
          const cells = [
            { label: 'Checkride-ready', v: n('ready'), cls: 'text-green-600' },
            { label: 'Needs work', v: n('needs-work'), cls: 'text-red-600' },
            { label: 'Inactive 10d+', v: n('inactive'), cls: 'text-gray-500' },
            { label: 'Practiced this wk', v: active, cls: 'text-gray-900' },
          ]
          return (
            <div className="grid grid-cols-4 gap-2 mb-5">
              {cells.map((c) => (
                <div key={c.label} className="border border-gray-200 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${c.cls}`}>{c.v}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{c.label}</div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Roster — needs-attention first */}
        {roster && roster.length === 0 && <div className="text-center text-gray-400 py-10 text-sm">No students yet. Add one above.</div>}
        <div className="space-y-2">
          {roster && [...roster].sort((a, b) => {
            const order = (s: RosterStudent) => s.flag === 'needs-work' ? 0 : s.flag === 'inactive' ? 1 : s.flag === 'almost' ? 2 : s.flag === 'new' ? 3 : s.flag === 'ready' ? 4 : 5
            return order(a) - order(b)
          }).map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    <span className="truncate">{s.email}</span>
                    {s.flag && <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${FLAG_META[s.flag].cls}`}>{FLAG_META[s.flag].label}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {s.joined
                      ? <>{s.attempts} graded · {s.weekCount} this wk{s.lastDays != null ? ` · last ${s.lastDays === 0 ? 'today' : s.lastDays + 'd ago'}` : ''}{s.callsign ? ` · ${s.callsign}` : ''}</>
                      : <span className="text-amber-600">Invited — not joined yet</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.joined && s.readiness && (
                    <div className="text-right">
                      <div className={`text-lg font-bold ${levelColor(s.readiness.level)}`}>{s.readiness.score}</div>
                      <div className="text-[10px] text-gray-400 uppercase">ready</div>
                    </div>
                  )}
                  {s.joined
                    ? <a href={`/cfi/students/${s.id}`} className="text-sm bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-800">View</a>
                    : <button onClick={() => { navigator.clipboard?.writeText(s.joinUrl ?? ''); setCopied(s.id); setTimeout(() => setCopied(null), 2000) }}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:border-gray-500">{copied === s.id ? 'Copied!' : 'Copy invite'}</button>}
                  <button onClick={() => remove(s.id)} className="text-gray-300 hover:text-red-500 text-sm" title="Remove">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
