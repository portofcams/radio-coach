'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export interface Aircraft {
  id: number; name: string; tail: string | null; type: string | null
  empty_weight: number | null; empty_arm: number | null; max_gross: number | null
  cg_fwd: number | null; cg_aft: number | null
  front_arm: number | null; rear_arm: number | null; fuel_arm: number | null; baggage_arm: number | null
  fuel_cap_gal: number | null; fuel_lb_per_gal: number | null; max_baggage: number | null; max_xwind: number | null
}

const BLANK = { name: '', tail: '', type: '', empty_weight: '', empty_arm: '', max_gross: '', cg_fwd: '', cg_aft: '', front_arm: '', rear_arm: '', fuel_arm: '', baggage_arm: '', fuel_cap_gal: '', fuel_lb_per_gal: '6', max_baggage: '', max_xwind: '' }
type FormT = typeof BLANK

const FIELDS: Array<{ k: keyof FormT; label: string }> = [
  { k: 'empty_weight', label: 'Empty weight (lb)' }, { k: 'empty_arm', label: 'Empty arm (in)' },
  { k: 'max_gross', label: 'Max gross (lb)' }, { k: 'cg_fwd', label: 'Fwd CG limit (in)' }, { k: 'cg_aft', label: 'Aft CG limit (in)' },
  { k: 'front_arm', label: 'Front seat arm (in)' }, { k: 'rear_arm', label: 'Rear seat arm (in)' },
  { k: 'fuel_arm', label: 'Fuel arm (in)' }, { k: 'fuel_cap_gal', label: 'Fuel capacity (gal)' }, { k: 'fuel_lb_per_gal', label: 'Lb/gal (6 = 100LL)' },
  { k: 'baggage_arm', label: 'Baggage arm (in)' }, { k: 'max_baggage', label: 'Max baggage (lb)' }, { k: 'max_xwind', label: 'Max demo crosswind (kt)' },
]

export default function AircraftPage() {
  const router = useRouter()
  const [list, setList] = useState<Aircraft[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'anon'>('loading')
  const [form, setForm] = useState<FormT>(BLANK)
  const [editId, setEditId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const r = await fetch('/api/aircraft')
    if (r.status === 401) { setState('anon'); return }
    const d = await r.json(); setList(d.aircraft ?? []); setState('ok')
  }
  useEffect(() => { load() }, [])

  async function save() {
    if (!form.name.trim()) return
    setBusy(true)
    try {
      const url = editId ? `/api/aircraft/${editId}` : '/api/aircraft'
      await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setForm(BLANK); setEditId(null); await load()
    } finally { setBusy(false) }
  }
  function edit(a: Aircraft) {
    setEditId(a.id)
    setForm({ ...BLANK, ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v == null ? '' : String(v)])) } as FormT)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function del(id: number) { await fetch(`/api/aircraft/${id}`, { method: 'DELETE' }); load() }

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>
  if (state === 'anon') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Your aircraft</h1>
      <p className="text-gray-500 mb-6">Sign in to save aircraft profiles for weight &amp; balance and your logbook.</p>
      <button onClick={() => router.push('/login')} className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in</button>
    </main>
  )

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Your aircraft</h1>
        <p className="text-gray-500 mb-6">Save the numbers once (from the POH/W&amp;B sheet) and reuse them for weight &amp; balance.</p>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{editId ? 'Edit aircraft' : 'Add aircraft'}</div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input className={inp} placeholder="Name*" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inp} placeholder="Tail #" value={form.tail} onChange={(e) => setForm({ ...form, tail: e.target.value })} />
            <input className={inp} placeholder="Type (C172)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FIELDS.map((f) => (
              <input key={f.k} className={inp} inputMode="decimal" placeholder={f.label} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={save} disabled={busy || !form.name.trim()} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{busy ? 'Saving…' : editId ? 'Save changes' : 'Add aircraft'}</button>
            {editId && <button onClick={() => { setForm(BLANK); setEditId(null) }} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>}
          </div>
        </div>

        <div className="space-y-2">
          {list.length === 0 && <div className="text-sm text-gray-400">No aircraft yet.</div>}
          {list.map((a) => (
            <div key={a.id} className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{a.name} {a.tail && <span className="text-gray-400 font-mono text-sm">{a.tail}</span>}</div>
                <div className="text-xs text-gray-400">{a.type || '—'} · max gross {a.max_gross ?? '—'} lb</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/wb?ac=${a.id}`} className="text-sm text-blue-600 hover:underline">W&amp;B</Link>
                <button onClick={() => edit(a)} className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
                <button onClick={() => del(a.id)} className="text-gray-300 hover:text-red-500 text-sm" title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
