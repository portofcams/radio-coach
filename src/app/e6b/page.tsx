'use client'

import { useState } from 'react'
import Link from 'next/link'

const num = (v: string) => { const n = parseFloat(v); return isFinite(n) ? n : null }
const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

function TSD() {
  const [gs, setGs] = useState(''); const [dist, setDist] = useState(''); const [time, setTime] = useState('')
  const g = num(gs), d = num(dist), t = num(time)
  let out = ''
  if (g != null && d != null && (t == null || time === '')) out = `Time: ${Math.round((d / g) * 60)} min`
  else if (g != null && t != null && (d == null || dist === '')) out = `Distance: ${(g * (t / 60)).toFixed(1)} NM`
  else if (d != null && t != null && (g == null || gs === '')) out = `Groundspeed: ${Math.round(d / (t / 60))} kt`
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Enter any two — the third is computed.</p>
      <div><label className="text-xs text-gray-500">Groundspeed (kt)</label><input className={inp} inputMode="decimal" value={gs} onChange={(e) => setGs(e.target.value)} /></div>
      <div><label className="text-xs text-gray-500">Distance (NM)</label><input className={inp} inputMode="decimal" value={dist} onChange={(e) => setDist(e.target.value)} /></div>
      <div><label className="text-xs text-gray-500">Time (min)</label><input className={inp} inputMode="decimal" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      {out && <div className="border border-gray-200 rounded-xl p-4 text-center text-xl font-bold">{out}</div>}
    </div>
  )
}

function Fuel() {
  const [gph, setGph] = useState(''); const [time, setTime] = useState(''); const [avail, setAvail] = useState('')
  const g = num(gph), t = num(time), a = num(avail)
  const burn = g != null && t != null ? g * (t / 60) : null
  const endur = g != null && a != null && g > 0 ? a / g : null
  return (
    <div className="space-y-3">
      <div><label className="text-xs text-gray-500">Fuel burn (GPH)</label><input className={inp} inputMode="decimal" value={gph} onChange={(e) => setGph(e.target.value)} /></div>
      <div><label className="text-xs text-gray-500">Time (min)</label><input className={inp} inputMode="decimal" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <div><label className="text-xs text-gray-500">Fuel available (gal)</label><input className={inp} inputMode="decimal" value={avail} onChange={(e) => setAvail(e.target.value)} /></div>
      {burn != null && <div className="border border-gray-200 rounded-xl p-4 text-center"><div className="text-xl font-bold">{burn.toFixed(1)} gal</div><div className="text-xs text-gray-400">fuel needed for {time} min</div></div>}
      {endur != null && <div className="border border-gray-200 rounded-xl p-4 text-center"><div className="text-xl font-bold">{Math.floor(endur)}h {Math.round((endur % 1) * 60)}m</div><div className="text-xs text-gray-400">endurance on {avail} gal</div></div>}
    </div>
  )
}

function Wind() {
  const [tc, setTc] = useState(''); const [tas, setTas] = useState(''); const [wd, setWd] = useState(''); const [ws, setWs] = useState('')
  const c = num(tc), v = num(tas), d = num(wd), s = num(ws)
  let out: null | { wca: number; hdg: number; gs: number } = null
  if (c != null && v != null && d != null && s != null && v > 0) {
    const angle = ((d - c) * Math.PI) / 180
    const wca = (Math.asin(Math.max(-1, Math.min(1, (s * Math.sin(angle)) / v))) * 180) / Math.PI
    const hdg = ((c + wca) % 360 + 360) % 360
    const gs = v * Math.cos((wca * Math.PI) / 180) - s * Math.cos(angle)
    out = { wca: Math.round(wca), hdg: Math.round(hdg), gs: Math.round(gs) }
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500">True course (°)</label><input className={inp} inputMode="numeric" value={tc} onChange={(e) => setTc(e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">TAS (kt)</label><input className={inp} inputMode="numeric" value={tas} onChange={(e) => setTas(e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">Wind from (°)</label><input className={inp} inputMode="numeric" value={wd} onChange={(e) => setWd(e.target.value)} /></div>
        <div><label className="text-xs text-gray-500">Wind speed (kt)</label><input className={inp} inputMode="numeric" value={ws} onChange={(e) => setWs(e.target.value)} /></div>
      </div>
      {out && (
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-gray-200 rounded-xl p-3 text-center"><div className="text-lg font-bold">{out.hdg}°</div><div className="text-[11px] text-gray-400">heading</div></div>
          <div className="border border-gray-200 rounded-xl p-3 text-center"><div className="text-lg font-bold">{out.gs}</div><div className="text-[11px] text-gray-400">groundspeed</div></div>
          <div className="border border-gray-200 rounded-xl p-3 text-center"><div className="text-lg font-bold">{out.wca > 0 ? `+${out.wca}` : out.wca}°</div><div className="text-[11px] text-gray-400">wind correction</div></div>
        </div>
      )}
    </div>
  )
}

export default function E6BPage() {
  const [tab, setTab] = useState<'tsd' | 'fuel' | 'wind'>('tsd')
  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-4">E6B calculator</h1>
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
          {([['tsd', 'Time/Speed/Dist'], ['fuel', 'Fuel'], ['wind', 'Wind']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
        {tab === 'tsd' && <TSD />}
        {tab === 'fuel' && <Fuel />}
        {tab === 'wind' && <Wind />}
      </div>
    </main>
  )
}
