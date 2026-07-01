'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Custom { id: string; title: string; elements: string[] }
const FACILITIES = ['', 'GROUND', 'TOWER', 'APPROACH', 'DEPARTURE', 'CENTER', 'CLEARANCE', 'CTAF']

export default function BuildScenarioPage() {
  const router = useRouter()
  const [list, setList] = useState<Custom[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'not-cfi'>('loading')
  const [form, setForm] = useState({ title: '', setup: '', facility: 'TOWER', frequency: '', airport: '', atcTransmission: '', elements: '', correctReadback: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    const res = await fetch('/api/cfi/scenarios')
    if (res.status === 401) { router.push('/login'); return }
    if (res.status === 403) { setState('not-cfi'); return }
    const d = await res.json()
    setList(d.scenarios ?? [])
    setState('ok')
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  async function save() {
    setErr('')
    const requiredElements = form.elements.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!form.title.trim() || !form.atcTransmission.trim() || !form.correctReadback.trim() || requiredElements.length === 0) {
      setErr('Title, ATC transmission, correct readback, and at least one required element are needed.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/cfi/scenarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, requiredElements }),
      })
      if (!res.ok) { setErr((await res.json()).error ?? 'Could not save'); return }
      setForm({ title: '', setup: '', facility: 'TOWER', frequency: '', airport: '', atcTransmission: '', elements: '', correctReadback: '' })
      await load()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    await fetch(`/api/cfi/scenarios/${id}`, { method: 'DELETE' })
    load()
  }

  if (state === 'loading') return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (state === 'not-cfi') return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Custom scenarios</h1>
      <p className="text-gray-500 mb-6">Author your own local-airport or maneuver-specific scenarios — a CFI Pro feature.</p>
      <a href="/profile" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Upgrade to CFI Pro</a>
    </main>
  )

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <a href="/cfi" className="text-gray-400 hover:text-gray-600 text-sm">← students</a>
          <h1 className="text-xl font-semibold">Custom scenarios</h1>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">New scenario</div>
          <input className={inp} placeholder="Title (e.g. Palmer — taxi to the fuel pumps)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={inp} placeholder="Setup — what's the situation? (optional)" value={form.setup} onChange={(e) => setForm({ ...form, setup: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className={inp} value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })}>
              {FACILITIES.map((f) => <option key={f} value={f}>{f || 'Facility…'}</option>)}
            </select>
            <input className={inp} placeholder="Frequency (e.g. 118.6)" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
          </div>
          <input className={inp} placeholder="Airport ICAO (optional, e.g. PAMR — enables METAR + map)" value={form.airport} onChange={(e) => setForm({ ...form, airport: e.target.value.toUpperCase() })} />
          <p className="text-xs text-gray-400 -mt-1">After saving, hit <strong>Test</strong> on the scenario below to fly it yourself.</p>
          <textarea className={inp} rows={2} placeholder="What ATC says (played aloud)" value={form.atcTransmission} onChange={(e) => setForm({ ...form, atcTransmission: e.target.value })} />
          <textarea className={inp} rows={3} placeholder="Required elements — one per line (e.g.&#10;cleared for takeoff&#10;runway two four&#10;call sign)" value={form.elements} onChange={(e) => setForm({ ...form, elements: e.target.value })} />
          <textarea className={inp} rows={2} placeholder="The textbook-correct readback" value={form.correctReadback} onChange={(e) => setForm({ ...form, correctReadback: e.target.value })} />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button onClick={save} disabled={saving} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{saving ? 'Saving...' : 'Create scenario'}</button>
        </div>

        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Your scenarios ({list.length})</div>
        <div className="space-y-2">
          {list.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-xs text-gray-400 truncate">{s.elements.join(' · ')}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a href={`/train/scenario?id=${s.id}`} className="text-sm text-blue-600 hover:underline">Test</a>
                <button onClick={() => del(s.id)} className="text-gray-300 hover:text-red-500 text-sm" title="Delete">✕</button>
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="text-sm text-gray-400">None yet. Create one above, then assign it to a student.</div>}
        </div>
      </div>
    </main>
  )
}
