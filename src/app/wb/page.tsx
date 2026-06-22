'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Aircraft } from '../aircraft/page'

function WB() {
  const router = useRouter()
  const params = useSearchParams()
  const [list, setList] = useState<Aircraft[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'anon' | 'none'>('loading')
  const [acId, setAcId] = useState<number | null>(null)
  const [front, setFront] = useState('')
  const [rear, setRear] = useState('')
  const [fuelGal, setFuelGal] = useState('')
  const [bag, setBag] = useState('')

  useEffect(() => {
    fetch('/api/aircraft').then((r) => { if (r.status === 401) { setState('anon'); return null } return r.json() })
      .then((d) => { if (!d) return; const a = d.aircraft ?? []; setList(a); if (!a.length) { setState('none'); return }
        const pre = parseInt(params.get('ac') || ''); setAcId(a.find((x: Aircraft) => x.id === pre)?.id ?? a[0].id); setState('ok') })
      .catch(() => setState('anon'))
  }, [params])

  const ac = list.find((a) => a.id === acId)
  const lbPerGal = ac?.fuel_lb_per_gal ?? 6

  const calc = useMemo(() => {
    if (!ac) return null
    const n = (v: string) => { const x = parseFloat(v); return isFinite(x) ? x : 0 }
    const rows = [
      { label: 'Empty', w: ac.empty_weight ?? 0, arm: ac.empty_arm ?? 0 },
      { label: 'Front seats', w: n(front), arm: ac.front_arm ?? 0 },
      { label: 'Rear seats', w: n(rear), arm: ac.rear_arm ?? 0 },
      { label: 'Fuel', w: n(fuelGal) * lbPerGal, arm: ac.fuel_arm ?? 0 },
      { label: 'Baggage', w: n(bag), arm: ac.baggage_arm ?? 0 },
    ]
    const weight = rows.reduce((s, r) => s + r.w, 0)
    const moment = rows.reduce((s, r) => s + r.w * r.arm, 0)
    const cg = weight ? moment / weight : 0
    const overGross = ac.max_gross != null && weight > ac.max_gross
    const cgOk = ac.cg_fwd != null && ac.cg_aft != null ? cg >= ac.cg_fwd && cg <= ac.cg_aft : null
    const bagOver = ac.max_baggage != null && n(bag) > ac.max_baggage
    const fuelOver = ac.fuel_cap_gal != null && n(fuelGal) > ac.fuel_cap_gal
    return { rows, weight, moment, cg, overGross, cgOk, bagOver, fuelOver }
  }, [ac, front, rear, fuelGal, bag, lbPerGal])

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>
  if (state === 'anon') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Weight &amp; balance</h1>
      <p className="text-gray-500 mb-6">Sign in and save an aircraft profile to run weight &amp; balance.</p>
      <button onClick={() => router.push('/login')} className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in</button>
    </main>
  )
  if (state === 'none') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Weight &amp; balance</h1>
      <p className="text-gray-500 mb-6">First, save an aircraft profile with its weights and arms.</p>
      <Link href="/aircraft" className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Add an aircraft →</Link>
    </main>
  )

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  const ok = calc && !calc.overGross && calc.cgOk !== false && !calc.bagOver && !calc.fuelOver
  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-4">Weight &amp; balance</h1>

        <select className={inp + ' mb-4'} value={acId ?? ''} onChange={(e) => setAcId(parseInt(e.target.value))}>
          {list.map((a) => <option key={a.id} value={a.id}>{a.name} {a.tail ? `(${a.tail})` : ''}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className="text-xs text-gray-500">Front seats (lb)</label><input className={inp} inputMode="decimal" value={front} onChange={(e) => setFront(e.target.value)} /></div>
          <div><label className="text-xs text-gray-500">Rear seats (lb)</label><input className={inp} inputMode="decimal" value={rear} onChange={(e) => setRear(e.target.value)} /></div>
          <div><label className="text-xs text-gray-500">Fuel (gal)</label><input className={inp} inputMode="decimal" value={fuelGal} onChange={(e) => setFuelGal(e.target.value)} /></div>
          <div><label className="text-xs text-gray-500">Baggage (lb)</label><input className={inp} inputMode="decimal" value={bag} onChange={(e) => setBag(e.target.value)} /></div>
        </div>

        {calc && (
          <>
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4 text-sm">
              {calc.rows.map((r) => (
                <div key={r.label} className="flex justify-between px-4 py-2">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-mono text-gray-700">{Math.round(r.w)} lb × {r.arm} = {Math.round(r.w * r.arm).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className={`rounded-xl p-5 border ${ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-gray-600">Gross weight</span>
                <span className={`font-bold text-lg ${calc.overGross ? 'text-red-600' : 'text-gray-900'}`}>{Math.round(calc.weight).toLocaleString()} lb{ac?.max_gross != null && <span className="text-sm font-normal text-gray-400"> / {ac.max_gross}</span>}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600">Center of gravity</span>
                <span className={`font-bold text-lg ${calc.cgOk === false ? 'text-red-600' : 'text-gray-900'}`}>{calc.cg.toFixed(2)} in{ac?.cg_fwd != null && <span className="text-sm font-normal text-gray-400"> ({ac.cg_fwd}–{ac.cg_aft})</span>}</span>
              </div>
              <div className={`mt-3 text-sm font-semibold ${ok ? 'text-green-700' : 'text-red-700'}`}>
                {ok ? '✓ Within limits' : [calc.overGross && 'Over max gross', calc.cgOk === false && 'CG out of limits', calc.bagOver && 'Over baggage limit', calc.fuelOver && 'Over fuel capacity'].filter(Boolean).join(' · ')}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Always verify against the actual POH loading chart — this is a planning aid, not a substitute.</p>
          </>
        )}
      </div>
    </main>
  )
}

export default function WBPage() {
  return <Suspense fallback={<div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>}><WB /></Suspense>
}
