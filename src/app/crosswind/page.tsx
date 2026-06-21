'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CrosswindPage() {
  const [runway, setRunway] = useState('')
  const [windDir, setWindDir] = useState('')
  const [windSpd, setWindSpd] = useState('')
  const [gust, setGust] = useState('')

  const rwy = parseInt(runway)
  const wd = parseInt(windDir)
  const ws = parseInt(windSpd)
  const g = parseInt(gust)
  const valid = rwy >= 1 && rwy <= 36 && wd >= 0 && wd <= 360 && ws >= 0

  let result: null | { head: number; cross: number; side: 'right' | 'left'; gustCross: number | null } = null
  if (valid) {
    const heading = rwy * 10
    let angle = wd - heading
    while (angle > 180) angle -= 360
    while (angle < -180) angle += 360
    const rad = (angle * Math.PI) / 180
    const head = Math.round(ws * Math.cos(rad))
    const cross = Math.round(Math.abs(ws * Math.sin(rad)))
    const gustCross = g > ws ? Math.round(Math.abs(g * Math.sin(rad))) : null
    result = { head, cross, side: angle >= 0 ? 'right' : 'left', gustCross }
  }

  const fld = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Crosswind calculator</h1>
        <p className="text-gray-500 mb-6">Runway + wind → headwind and crosswind components.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Runway (1–36)</label>
            <input value={runway} onChange={(e) => setRunway(e.target.value)} inputMode="numeric" placeholder="e.g. 27" className={fld} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Wind direction (°)</label>
              <input value={windDir} onChange={(e) => setWindDir(e.target.value)} inputMode="numeric" placeholder="e.g. 300" className={fld} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Wind speed (kt)</label>
              <input value={windSpd} onChange={(e) => setWindSpd(e.target.value)} inputMode="numeric" placeholder="e.g. 15" className={fld} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Gust (kt, optional)</label>
            <input value={gust} onChange={(e) => setGust(e.target.value)} inputMode="numeric" placeholder="e.g. 22" className={fld} />
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className={`text-3xl font-bold ${result.head >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(result.head)}</div>
              <div className="text-xs text-gray-400 mt-1">{result.head >= 0 ? 'headwind' : 'TAILWIND'} (kt)</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{result.cross}{result.gustCross != null && <span className="text-lg text-amber-600">/{result.gustCross}</span>}</div>
              <div className="text-xs text-gray-400 mt-1">crosswind from {result.side}{result.gustCross != null ? ' (gust)' : ''} (kt)</div>
            </div>
          </div>
        )}
        {result?.head != null && result.head < 0 && <p className="text-xs text-red-600 mt-3">Tailwind component — consider the opposite runway.</p>}
        <p className="text-xs text-gray-400 mt-4">Tip: compare the crosswind to your aircraft&apos;s maximum demonstrated crosswind component (in the POH).</p>
      </div>
    </main>
  )
}
