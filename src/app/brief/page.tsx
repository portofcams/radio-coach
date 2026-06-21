'use client'

import { useState } from 'react'
import Link from 'next/link'

interface BriefStep { phase: string; facility: string; freq?: string; calls: string[] }
interface Brief { ok: boolean; error?: string; dep?: { icao: string; name: string; towered: boolean }; dest?: { icao: string; name: string; towered: boolean }; callsign: string; steps: BriefStep[] }

const FAC_CLS: Record<string, string> = {
  GROUND: 'text-amber-700 bg-amber-50 border-amber-200', TOWER: 'text-green-700 bg-green-50 border-green-200',
  APPROACH: 'text-sky-700 bg-sky-50 border-sky-200', DEPARTURE: 'text-violet-700 bg-violet-50 border-violet-200',
  CLEARANCE: 'text-orange-700 bg-orange-50 border-orange-200', CTAF: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  ATIS: 'text-gray-600 bg-gray-50 border-gray-200',
}

export default function BriefPage() {
  const [dep, setDep] = useState('')
  const [dest, setDest] = useState('')
  const [callsign, setCallsign] = useState('')
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(false)

  async function go() {
    if (!dep.trim() || !dest.trim()) return
    setLoading(true)
    try {
      const p = new URLSearchParams({ dep: dep.trim(), dest: dest.trim() })
      if (callsign.trim()) p.set('callsign', callsign.trim())
      const r = await fetch(`/api/brief?${p}`)
      setBrief(await r.json())
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Flight radio brief</h1>
        <p className="text-gray-500 mb-6">Enter your route and get the exact call sequence — real frequencies, towered or not, departure to parking.</p>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={dep} onChange={(e) => setDep(e.target.value.toUpperCase())} placeholder="From (ICAO, e.g. KAPA)" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <input value={dest} onChange={(e) => setDest(e.target.value.toUpperCase())} placeholder="To (ICAO, e.g. KBJC)" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <input value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="Your call sign (optional, e.g. Skyhawk Four Five X-ray)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        <button onClick={go} disabled={loading || !dep.trim() || !dest.trim()} className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
          {loading ? 'Building…' : 'Build my radio brief'}
        </button>

        {brief && !brief.ok && <p className="text-sm text-red-600 mt-4">{brief.error}</p>}

        {brief?.ok && (
          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
              <span className="font-mono font-semibold text-gray-900">{brief.dep!.icao}</span>
              <span>{brief.dep!.towered ? '(towered)' : '(non-towered)'}</span>
              <span>→</span>
              <span className="font-mono font-semibold text-gray-900">{brief.dest!.icao}</span>
              <span>{brief.dest!.towered ? '(towered)' : '(non-towered)'}</span>
            </div>
            <div className="space-y-3">
              {brief.steps.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{s.phase}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${FAC_CLS[s.facility] ?? 'text-gray-600 border-gray-200'}`}>{s.facility}</span>
                      {s.freq && <span className="font-mono text-xs text-gray-500">{s.freq}</span>}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {s.calls.map((c, j) => <li key={j} className="text-sm text-gray-700 leading-relaxed">{c}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-gray-500">Now drill it — <Link href="/train" className="text-blue-600 hover:underline">graded scenarios →</Link></p>
          </div>
        )}
      </div>
    </main>
  )
}
