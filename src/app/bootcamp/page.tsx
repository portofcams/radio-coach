'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Block { key: string; label: string; tip: string; missRate: number | null; scenarios: Array<{ id: string; title: string }> }

export default function BootcampPage() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [fallback, setFallback] = useState(false)
  const [state, setState] = useState<'loading' | 'ok'>('loading')

  useEffect(() => {
    fetch('/api/bootcamp').then((r) => r.json()).then((d) => { setBlocks(d.blocks ?? []); setFallback(!!d.fallback); setState('ok') }).catch(() => setState('ok'))
  }, [])

  const all = blocks.flatMap((b) => b.scenarios.map((s) => s.id))
  const start = () => { if (all[0]) router.push(`/train/${all[0]}`) }

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Building your plan…</div>

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Weak-spot bootcamp</h1>
        <p className="text-gray-500 mb-6">
          {fallback
            ? 'A focused plan on the calls most pilots trip on. Fly a few graded scenarios and it tunes to your own weak spots.'
            : 'Built from the elements you\'ve been missing lately — drill these and your readiness climbs fastest.'}
        </p>

        {all.length > 0 && (
          <button onClick={start} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800 mb-8">
            Start bootcamp ({all.length} scenarios) →
          </button>
        )}

        <div className="space-y-6">
          {blocks.map((b) => (
            <div key={b.key}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900">{b.label}</h2>
                {b.missRate != null && <span className="text-xs font-mono text-red-600">{b.missRate}% missed</span>}
              </div>
              <p className="text-sm text-gray-500 mb-2">{b.tip}</p>
              <div className="space-y-1.5">
                {b.scenarios.map((s) => (
                  <Link key={s.id} href={`/train/${s.id}`} className="block border border-gray-200 rounded-lg px-3 py-2 text-sm hover:border-gray-400 transition-colors">
                    {s.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
