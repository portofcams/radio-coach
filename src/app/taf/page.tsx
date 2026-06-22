'use client'

import { useState } from 'react'
import Link from 'next/link'
import { decodeTaf, type DecodedTaf } from '@/lib/taf'

export default function TafPage() {
  const [icao, setIcao] = useState('')
  const [raw, setRaw] = useState('')
  const [decoded, setDecoded] = useState<DecodedTaf | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function decode(text: string) {
    const d = decodeTaf(text)
    setDecoded(d.periods.length ? d : null)
    setErr(d.periods.length ? '' : 'Could not read that — paste a full TAF.')
  }
  async function fetchIcao() {
    if (!icao.trim()) return
    setLoading(true); setErr('')
    try {
      const r = await fetch(`https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(icao.trim())}&format=json`)
      const j = await r.json()
      const ob = Array.isArray(j) && j[0]?.rawTAF
      if (!ob) { setErr(`No current TAF for ${icao.trim().toUpperCase()}.`); setDecoded(null); return }
      setRaw(ob); decode(ob)
    } catch { setErr('Could not reach the weather service.') } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">TAF decoder</h1>
        <p className="text-gray-500 mb-6">Turn a terminal forecast into plain-English periods — fetch a field or paste a raw TAF.</p>

        <div className="flex gap-2 mb-3">
          <input value={icao} onChange={(e) => setIcao(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') fetchIcao() }}
            placeholder="ICAO (e.g. KAPA)" className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <button onClick={fetchIcao} disabled={loading} className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{loading ? '…' : 'Fetch'}</button>
        </div>
        <div className="text-center text-xs text-gray-400 mb-3">or paste a raw TAF</div>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={3} placeholder="KAPA 211720Z 2118/2218 27012KT P6SM SCT100 FM220200 30008KT P6SM FEW120"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        <button onClick={() => decode(raw)} disabled={!raw.trim()} className="w-full border border-gray-300 text-gray-800 rounded-lg px-4 py-2 text-sm font-medium hover:border-gray-500 disabled:opacity-40">Decode</button>

        {err && <p className="text-sm text-red-600 mt-4">{err}</p>}

        {decoded && (
          <div className="mt-6">
            <div className="text-sm text-gray-500 mb-4">
              {decoded.station && <span className="font-mono font-semibold text-gray-900">{decoded.station}</span>}
              {decoded.valid && <> · valid {decoded.valid}</>}
            </div>
            <div className="space-y-3">
              {decoded.periods.map((p, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-1.5">{p.label}</div>
                  <ul className="space-y-1">{p.lines.map((l, j) => <li key={j} className="text-sm text-gray-700">{l}</li>)}</ul>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-gray-400 mt-3">{decoded.raw}</p>
          </div>
        )}
      </div>
    </main>
  )
}
