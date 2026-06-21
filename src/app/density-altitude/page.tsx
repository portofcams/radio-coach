'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DensityAltitudePage() {
  const [elev, setElev] = useState('')
  const [alt, setAlt] = useState('29.92')
  const [oat, setOat] = useState('')

  const e = parseFloat(elev)
  const a = parseFloat(alt)
  const t = parseFloat(oat)
  const valid = isFinite(e) && isFinite(a) && a > 25 && a < 33 && isFinite(t)

  let r: null | { pa: number; da: number; isa: number; spread: number } = null
  if (valid) {
    const pa = Math.round(e + (29.92 - a) * 1000)
    const isa = 15 - 2 * (pa / 1000)
    const da = Math.round(pa + 120 * (t - isa))
    r = { pa, da, isa: Math.round(isa), spread: da - Math.round(e) }
  }

  const note = !r ? '' : r.spread > 3000
    ? 'High density altitude — expect a much longer takeoff roll, weak climb, and a higher true airspeed on approach. Recompute takeoff/landing distance from the POH.'
    : r.spread > 1500
    ? 'Noticeably degraded performance — plan for a longer ground roll and reduced climb.'
    : 'Performance close to standard.'

  const fld = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Density altitude</h1>
        <p className="text-gray-500 mb-6">Field elevation, altimeter, and temperature → pressure &amp; density altitude.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Field elevation (ft MSL)</label>
            <input value={elev} onChange={(e) => setElev(e.target.value)} inputMode="numeric" placeholder="e.g. 5885" className={fld} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Altimeter (in Hg)</label>
              <input value={alt} onChange={(e) => setAlt(e.target.value)} inputMode="decimal" placeholder="29.92" className={fld} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Temperature (°C)</label>
              <input value={oat} onChange={(e) => setOat(e.target.value)} inputMode="numeric" placeholder="e.g. 30" className={fld} />
            </div>
          </div>
        </div>

        {r && (
          <>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{r.pa.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">pressure altitude (ft)</div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${r.spread > 3000 ? 'text-red-600' : r.spread > 1500 ? 'text-amber-600' : 'text-green-600'}`}>{r.da.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">density altitude (ft)</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">{note}</p>
            <p className="text-xs text-gray-400 mt-2">ISA temp at this pressure altitude is {r.isa}°C; you&apos;re {t - r.isa >= 0 ? `${Math.round(t - r.isa)}°C above` : `${Math.round(r.isa - t)}°C below`} standard.</p>
          </>
        )}
      </div>
    </main>
  )
}
