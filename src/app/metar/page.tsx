'use client'

import { useState } from 'react'
import Link from 'next/link'
import { decodeMetar, type DecodedMetar } from '@/lib/metar'

const CAT_CLS: Record<string, string> = {
  VFR: 'text-green-700 bg-green-50 border-green-300',
  MVFR: 'text-blue-700 bg-blue-50 border-blue-300',
  IFR: 'text-red-700 bg-red-50 border-red-300',
  LIFR: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-300',
}

export default function MetarPage() {
  const [icao, setIcao] = useState('')
  const [raw, setRaw] = useState('')
  const [decoded, setDecoded] = useState<DecodedMetar | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function decode(text: string) {
    const d = decodeMetar(text)
    setDecoded(d.lines.length ? d : null)
    setErr(d.lines.length ? '' : 'Could not read that — paste a full METAR.')
  }

  async function fetchIcao() {
    if (!icao.trim()) return
    setLoading(true); setErr('')
    try {
      const r = await fetch(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao.trim())}&format=json`)
      const j = await r.json()
      const ob = Array.isArray(j) && j[0]?.rawOb
      if (!ob) { setErr(`No current METAR for ${icao.trim().toUpperCase()}.`); setDecoded(null); return }
      setRaw(ob); decode(ob)
    } catch { setErr('Could not reach the weather service.') } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">METAR decoder</h1>
        <p className="text-gray-500 mb-6">Look up a field or paste a raw report — get it in plain English with the flight category.</p>

        <div className="flex gap-2 mb-3">
          <input value={icao} onChange={(e) => setIcao(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') fetchIcao() }}
            placeholder="ICAO (e.g. KAPA)" className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <button onClick={fetchIcao} disabled={loading} className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{loading ? '…' : 'Fetch'}</button>
        </div>
        <div className="text-center text-xs text-gray-400 mb-3">or paste a raw METAR</div>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={2} placeholder="KAPA 211853Z 27015G22KT 10SM FEW120 28/06 A2992"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        <button onClick={() => decode(raw)} disabled={!raw.trim()} className="w-full border border-gray-300 text-gray-800 rounded-lg px-4 py-2 text-sm font-medium hover:border-gray-500 disabled:opacity-40">Decode</button>

        {err && <p className="text-sm text-red-600 mt-4">{err}</p>}

        {decoded && (
          <div className="mt-6">
            {decoded.flightCategory && (
              <span className={`inline-block font-mono text-sm font-bold px-3 py-1 rounded border mb-4 ${CAT_CLS[decoded.flightCategory]}`}>
                {decoded.flightCategory}
                {decoded.ceilingFt != null && ` · ceiling ${decoded.ceilingFt.toLocaleString()} ft`}
                {decoded.visSm != null && ` · ${decoded.visSm} SM`}
              </span>
            )}
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
              {decoded.lines.map((l, i) => <div key={i} className="px-4 py-2.5 text-sm text-gray-700">{l}</div>)}
            </div>
            <p className="font-mono text-xs text-gray-400 mt-3">{decoded.raw}</p>
          </div>
        )}
      </div>
    </main>
  )
}
