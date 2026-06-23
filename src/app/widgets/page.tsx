'use client'

import { useState } from 'react'
import Link from 'next/link'

const BASE = 'https://wilco.binnacleai.com'
const WIDGETS = [
  { key: 'crosswind', name: 'Crosswind calculator', height: 230, desc: 'A runway + wind → crosswind component calculator.' },
  { key: 'phonetic', name: 'Phonetic alphabet', height: 260, desc: 'A clean phonetic-alphabet reference card.' },
]

function snippet(key: string, height: number) {
  return `<iframe src="${BASE}/embed/${key}" width="100%" height="${height}" style="border:1px solid #e5e7eb;border-radius:12px;max-width:480px" loading="lazy" title="Clearspar ${key} widget"></iframe>`
}

export default function WidgetsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Free widgets for your flight-school site</h1>
        <p className="text-gray-500 mb-8">Drop a useful tool on your site or blog — free, no signup. Just paste the snippet.</p>

        <div className="space-y-10">
          {WIDGETS.map((w) => (
            <div key={w.key}>
              <div className="font-semibold text-gray-900">{w.name}</div>
              <p className="text-sm text-gray-500 mb-3">{w.desc}</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                <iframe src={`/embed/${w.key}`} width="100%" height={w.height} style={{ border: 0 }} title={`${w.name} preview`} />
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto"><code>{snippet(w.key, w.height)}</code></pre>
                <button
                  onClick={() => { navigator.clipboard?.writeText(snippet(w.key, w.height)); setCopied(w.key); setTimeout(() => setCopied(null), 1500) }}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded"
                >{copied === w.key ? 'Copied' : 'Copy'}</button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-10">Want the full radio trainer for your students? <Link href="/school" className="text-blue-600 hover:underline">Clearspar for flight schools →</Link></p>
      </div>
    </main>
  )
}
