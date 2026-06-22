'use client'

import { useState } from 'react'

// Minimal embeddable crosswind widget. Designed to be iframed on flight-school
// sites — compact, with a "powered by Wilco" backlink.
export default function EmbedCrosswind() {
  const [runway, setRunway] = useState('')
  const [wd, setWd] = useState('')
  const [ws, setWs] = useState('')
  const rwy = parseInt(runway), d = parseInt(wd), s = parseInt(ws)
  const valid = rwy >= 1 && rwy <= 36 && d >= 0 && d <= 360 && s >= 0
  let r: null | { head: number; cross: number; side: string } = null
  if (valid) {
    let a = d - rwy * 10
    while (a > 180) a -= 360
    while (a < -180) a += 360
    const rad = (a * Math.PI) / 180
    r = { head: Math.round(s * Math.cos(rad)), cross: Math.round(Math.abs(s * Math.sin(rad))), side: a >= 0 ? 'right' : 'left' }
  }
  const fld = 'w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900'
  return (
    <div className="p-4 max-w-sm mx-auto font-sans">
      <div className="text-sm font-semibold text-gray-900 mb-3">Crosswind calculator</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input className={fld} inputMode="numeric" placeholder="Rwy" value={runway} onChange={(e) => setRunway(e.target.value)} />
        <input className={fld} inputMode="numeric" placeholder="Wind °" value={wd} onChange={(e) => setWd(e.target.value)} />
        <input className={fld} inputMode="numeric" placeholder="Kt" value={ws} onChange={(e) => setWs(e.target.value)} />
      </div>
      {r && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="border border-gray-200 rounded p-2 text-center">
            <div className={`text-xl font-bold ${r.head >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(r.head)}</div>
            <div className="text-[10px] text-gray-400">{r.head >= 0 ? 'headwind' : 'tailwind'}</div>
          </div>
          <div className="border border-gray-200 rounded p-2 text-center">
            <div className="text-xl font-bold text-gray-900">{r.cross}</div>
            <div className="text-[10px] text-gray-400">xwind from {r.side}</div>
          </div>
        </div>
      )}
      <a href="https://wilco.binnacleai.com/?utm_source=embed&utm_medium=crosswind" target="_blank" rel="noopener" className="block text-center text-[11px] text-gray-400 hover:text-gray-600">Powered by Wilco — practice radio calls →</a>
    </div>
  )
}
