'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CScenario { id: string; title: string; author_name: string; upvotes: number; airport: string | null; facility: string | null }

const BLANK = { title: '', setup: '', facility: '', frequency: '', airport: '', atcTransmission: '', elements: '', correctReadback: '' }

export default function CommunityPage() {
  const [list, setList] = useState<CScenario[]>([])
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const r = await fetch('/api/community'); const d = await r.json(); setList(d.scenarios ?? [])
  }
  useEffect(() => { load() }, [])

  async function upvote(id: string) {
    if (voted.has(id)) return
    const num = id.replace(/^community-/, '')
    const r = await fetch(`/api/community/${num}/vote`, { method: 'POST' })
    if (r.status === 401) { setMsg('Sign in to vote.'); return }
    const d = await r.json()
    setList((l) => l.map((s) => (s.id === id ? { ...s, upvotes: d.upvotes } : s)))
    setVoted((v) => new Set(v).add(id))
  }

  async function submit() {
    const requiredElements = form.elements.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!form.title.trim() || !form.atcTransmission.trim() || !form.correctReadback.trim() || requiredElements.length === 0) {
      setMsg('Title, ATC line, correct readback, and at least one required element are needed.'); return
    }
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, requiredElements }) })
      const d = await r.json()
      if (r.status === 401) { setMsg('Sign in to submit a scenario.'); return }
      if (!r.ok) { setMsg(d.error ?? 'Could not submit.'); return }
      setForm({ ...BLANK }); setShowForm(false); setMsg('Published! Thanks for contributing.'); await load()
    } finally { setBusy(false) }
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
            <h1 className="text-2xl font-semibold">Community scenarios</h1>
          </div>
          <button onClick={() => { setShowForm((v) => !v); setMsg('') }} className="text-sm text-blue-600 hover:underline">{showForm ? 'Cancel' : '+ Submit'}</button>
        </div>
        <p className="text-gray-500 mb-6">Scenarios written by other pilots — fly them and upvote the best.</p>

        {msg && <p className="text-sm text-gray-600 mb-4">{msg}</p>}

        {showForm && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6 space-y-2">
            <input className={inp} placeholder="Title (e.g. Aspen — sidestep on short final)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className={inp} placeholder="Setup — the situation (optional)" value={form.setup} onChange={(e) => setForm({ ...form, setup: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input className={inp} placeholder="Facility (TOWER)" value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })} />
              <input className={inp} placeholder="Freq (118.6)" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
              <input className={inp} placeholder="Airport (KASE)" value={form.airport} onChange={(e) => setForm({ ...form, airport: e.target.value.toUpperCase() })} />
            </div>
            <textarea className={inp} rows={2} placeholder="What ATC says (played aloud)" value={form.atcTransmission} onChange={(e) => setForm({ ...form, atcTransmission: e.target.value })} />
            <textarea className={inp} rows={3} placeholder={'Required elements — one per line\ncleared to land\nrunway one five\ncall sign'} value={form.elements} onChange={(e) => setForm({ ...form, elements: e.target.value })} />
            <textarea className={inp} rows={2} placeholder="The textbook-correct readback (must cover the elements above)" value={form.correctReadback} onChange={(e) => setForm({ ...form, correctReadback: e.target.value })} />
            <button onClick={submit} disabled={busy} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{busy ? 'Checking…' : 'Publish scenario'}</button>
            <p className="text-xs text-gray-400">Auto-validated: your correct readback must satisfy the elements you list, so the scenario grades cleanly.</p>
          </div>
        )}

        <div className="space-y-2">
          {list.length === 0 && <div className="text-sm text-gray-400">No community scenarios yet — be the first.</div>}
          {list.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-xs text-gray-400">by {s.author_name}{s.airport ? ` · ${s.airport}` : ''}{s.facility ? ` · ${s.facility}` : ''}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => upvote(s.id)} className={`text-sm flex items-center gap-1 ${voted.has(s.id) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>▲ {s.upvotes}</button>
                <Link href={`/train/scenario?id=${s.id}`} className="text-sm text-blue-600 hover:underline">Fly it</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
