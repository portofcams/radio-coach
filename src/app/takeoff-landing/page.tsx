'use client'

import { useState } from 'react'
import Link from 'next/link'

// Rule-of-thumb performance estimator. The pilot supplies their aircraft's own
// sea-level, standard-day POH distances (we never invent aircraft numbers); we
// apply the standard corrections: ~10% more distance per 1,000 ft of density
// altitude, a headwind credit, and a soft-surface penalty. Estimate only.
export default function TakeoffLandingPage() {
  const [elev, setElev] = useState('')
  const [alt, setAlt] = useState('29.92')
  const [oat, setOat] = useState('')
  const [to, setTo] = useState('')
  const [ldg, setLdg] = useState('')
  const [hw, setHw] = useState('')
  const [grass, setGrass] = useState(false)

  const e = parseFloat(elev), a = parseFloat(alt), t = parseFloat(oat)
  const baseTo = parseFloat(to), baseLdg = parseFloat(ldg)
  const wind = isFinite(parseFloat(hw)) ? parseFloat(hw) : 0
  const daValid = isFinite(e) && isFinite(a) && a > 25 && a < 33 && isFinite(t)

  let out: null | { da: number; toDist: number; ldgDist: number; daFactor: number } = null
  if (daValid && (isFinite(baseTo) || isFinite(baseLdg))) {
    const pa = e + (29.92 - a) * 1000
    const isa = 15 - 2 * (pa / 1000)
    const da = pa + 120 * (t - isa)
    // ~10% per 1000 ft DA (never credit below sea level)
    const daFactor = 1 + 0.10 * (Math.max(0, da) / 1000)
    // headwind credit ~10% per 9 kt; tailwind penalty; cap the credit at 27 kt
    const windFactor = 1 - 0.10 * (Math.max(-10, Math.min(27, wind)) / 9)
    const surfFactor = grass ? 1.15 : 1
    const f = daFactor * windFactor * surfFactor
    out = {
      da: Math.round(da),
      toDist: isFinite(baseTo) ? Math.round(baseTo * f) : NaN,
      ldgDist: isFinite(baseLdg) ? Math.round(baseLdg * f) : NaN,
      daFactor,
    }
  }

  const fld = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Takeoff &amp; landing distance</h1>
        <p className="text-gray-500 mb-6">Your POH&rsquo;s sea-level numbers, corrected for today&rsquo;s density altitude, wind, and surface.</p>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Conditions</div>
          <div>
            <label className="text-xs text-gray-500">Field elevation (ft MSL)</label>
            <input value={elev} onChange={(e) => setElev(e.target.value)} inputMode="numeric" placeholder="e.g. 5885" className={fld} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Altimeter</label>
              <input value={alt} onChange={(e) => setAlt(e.target.value)} inputMode="decimal" placeholder="29.92" className={fld} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Temp (°C)</label>
              <input value={oat} onChange={(e) => setOat(e.target.value)} inputMode="numeric" placeholder="30" className={fld} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Headwind (kt)</label>
              <input value={hw} onChange={(e) => setHw(e.target.value)} inputMode="numeric" placeholder="0" className={fld} />
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 pt-2">Your POH — sea level, standard day (over a 50 ft obstacle)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Takeoff distance (ft)</label>
              <input value={to} onChange={(e) => setTo(e.target.value)} inputMode="numeric" placeholder="e.g. 1685" className={fld} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Landing distance (ft)</label>
              <input value={ldg} onChange={(e) => setLdg(e.target.value)} inputMode="numeric" placeholder="e.g. 1280" className={fld} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 pt-1">
            <input type="checkbox" checked={grass} onChange={(e) => setGrass(e.target.checked)} className="rounded" />
            Grass / soft field (+15%)
          </label>
        </div>

        {out && (
          <>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${isFinite(out.toDist) ? 'text-gray-900' : 'text-gray-300'}`}>{isFinite(out.toDist) ? out.toDist.toLocaleString() : '—'}</div>
                <div className="text-xs text-gray-400 mt-1">est. takeoff (ft)</div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${isFinite(out.ldgDist) ? 'text-gray-900' : 'text-gray-300'}`}>{isFinite(out.ldgDist) ? out.ldgDist.toLocaleString() : '—'}</div>
                <div className="text-xs text-gray-400 mt-1">est. landing (ft)</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              Density altitude <strong>{out.da.toLocaleString()} ft</strong> adds about <strong>{Math.round((out.daFactor - 1) * 100)}%</strong> to your ground-roll and total distance{grass ? ', plus 15% for the soft surface' : ''}{wind > 0 ? `, minus a credit for the ${wind}-kt headwind` : wind < 0 ? `, plus a penalty for the ${-wind}-kt tailwind` : ''}.
            </p>
            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">Rule-of-thumb estimate only (~10% per 1,000 ft DA + wind + surface). This is <strong>not</strong> your POH performance chart — use the actual chart for the real numbers, add your own safety margin, and account for runway slope, weight, and technique.</p>
          </>
        )}

        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 mb-3">Density altitude is the killer on a hot day — check it first.</p>
          <Link href="/density-altitude" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Density altitude →</Link>
        </div>
      </div>
    </main>
  )
}
