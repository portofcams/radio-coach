'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Entry { id: number; flight_date: string; aircraft: string | null; dep: string | null; arr: string | null; total: number; pic: number; dual: number; night: number; day_ldg: number; night_ldg: number; remarks: string | null }
interface Totals { total: number; pic: number; night: number; ldg: number }

const BLANK = { flight_date: '', aircraft: '', dep: '', arr: '', total: '', pic: '', dual: '', night: '', day_ldg: '', night_ldg: '', remarks: '' }

export default function LogbookPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'anon'>('loading')
  const [form, setForm] = useState({ ...BLANK })
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  async function load() {
    const r = await fetch('/api/logbook')
    if (r.status === 401) { setState('anon'); return }
    const d = await r.json(); setEntries(d.entries ?? []); setTotals(d.totals ?? null); setState('ok')
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!form.flight_date) return
    setBusy(true)
    try {
      await fetch('/api/logbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setForm({ ...BLANK }); setShow(false); await load()
    } finally { setBusy(false) }
  }
  async function del(id: number) { await fetch(`/api/logbook/${id}`, { method: 'DELETE' }); load() }

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>
  if (state === 'anon') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Logbook</h1>
      <p className="text-gray-500 mb-6">Sign in to keep your logbook synced across devices.</p>
      <button onClick={() => router.push('/login')} className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in</button>
    </main>
  )

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  const fmtDate = (d: string) => (d?.length >= 10 ? d.slice(0, 10) : d)
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
            <h1 className="text-2xl font-semibold">Logbook</h1>
          </div>
          <div className="flex items-center gap-4">
            {entries.length > 0 && <a href="/api/logbook/export" className="text-sm text-blue-600 hover:underline">Export CSV</a>}
            <button onClick={() => setShow((v) => !v)} className="text-sm text-blue-600 hover:underline">{show ? 'Cancel' : '+ Add'}</button>
          </div>
        </div>

        {totals && (
          <div className="grid grid-cols-4 gap-2 mb-6 text-center">
            {[['Total', totals.total], ['PIC', totals.pic], ['Night', totals.night], ['Landings', totals.ldg]].map(([l, v]) => (
              <div key={l as string} className="border border-gray-200 rounded-xl py-3">
                <div className="text-lg font-bold">{Number(v).toFixed(l === 'Landings' ? 0 : 1)}</div>
                <div className="text-[11px] text-gray-400">{l}</div>
              </div>
            ))}
          </div>
        )}

        {show && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input type="date" className={inp} value={form.flight_date} onChange={(e) => setForm({ ...form, flight_date: e.target.value })} />
              <input className={inp} placeholder="Aircraft (N172SP)" value={form.aircraft} onChange={(e) => setForm({ ...form, aircraft: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="From" value={form.dep} onChange={(e) => setForm({ ...form, dep: e.target.value })} />
                <input className={inp} placeholder="To" value={form.arr} onChange={(e) => setForm({ ...form, arr: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input className={inp} inputMode="decimal" placeholder="Total" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              <input className={inp} inputMode="decimal" placeholder="PIC" value={form.pic} onChange={(e) => setForm({ ...form, pic: e.target.value })} />
              <input className={inp} inputMode="decimal" placeholder="Dual" value={form.dual} onChange={(e) => setForm({ ...form, dual: e.target.value })} />
              <input className={inp} inputMode="decimal" placeholder="Night" value={form.night} onChange={(e) => setForm({ ...form, night: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} inputMode="numeric" placeholder="Day landings" value={form.day_ldg} onChange={(e) => setForm({ ...form, day_ldg: e.target.value })} />
              <input className={inp} inputMode="numeric" placeholder="Night landings" value={form.night_ldg} onChange={(e) => setForm({ ...form, night_ldg: e.target.value })} />
            </div>
            <input className={inp} placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            <button onClick={add} disabled={busy || !form.flight_date} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{busy ? 'Saving…' : 'Add entry'}</button>
          </div>
        )}

        <div className="space-y-2">
          {entries.length === 0 && <div className="text-sm text-gray-400">No entries yet.</div>}
          {entries.map((e) => (
            <div key={e.id} className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 group">
              <div className="min-w-0">
                <div className="font-medium text-sm">{fmtDate(e.flight_date)} · {e.aircraft || '—'} {e.dep && e.arr && <span className="text-gray-400">{e.dep}→{e.arr}</span>}</div>
                <div className="text-xs text-gray-400">{e.total} hr{e.night > 0 ? ` · ${e.night} night` : ''} · {e.day_ldg + e.night_ldg} ldg{e.remarks ? ` · ${e.remarks}` : ''}</div>
              </div>
              <button onClick={() => del(e.id)} className="text-gray-300 hover:text-red-500 text-sm shrink-0 opacity-0 group-hover:opacity-100" title="Delete">✕</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
