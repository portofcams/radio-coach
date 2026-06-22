'use client'

import { useState } from 'react'
import Link from 'next/link'
import { decodeNotam } from '@/lib/notam'

export default function NotamPage() {
  const [raw, setRaw] = useState('')
  const [out, setOut] = useState<{ expanded: string; found: number } | null>(null)

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">NOTAM decoder</h1>
        <p className="text-gray-500 mb-6">Paste a NOTAM and expand the contractions (RWY → runway, CLSD → closed, WEF → with effect from…).</p>

        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={4} placeholder="RWY 17L/35R CLSD WEF 2206221200 TIL 2206281800 WIP"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        <button onClick={() => setOut(decodeNotam(raw))} disabled={!raw.trim()} className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-40">Decode</button>

        {out && (
          <div className="mt-6">
            <div className="text-xs text-gray-400 mb-2">{out.found} contraction{out.found === 1 ? '' : 's'} expanded</div>
            <div className="border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed">{out.expanded}</div>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">Contraction expansion only — always read the official NOTAM and confirm dates/times. Not for operational decisions.</p>
      </div>
    </main>
  )
}
