'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DiagramDrill from '@/components/DiagramDrill'
import TaxiTrace from '@/components/TaxiTrace'
import type { RealFieldDiagram } from '@/lib/types'

export default function DiagramDrillPage() {
  const router = useRouter()
  const [field, setField] = useState<RealFieldDiagram | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'no-field'>('loading')
  const [mode, setMode] = useState<'identify' | 'trace'>('identify')

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (!d.user) { router.push('/login'); return }
      const h = d.user.home
      if (h?.mode === 'real') {
        setField({
          name: h.field.radioName || h.field.name,
          runways: h.field.runways.map((r: { le: string; he: string; leLat: number; leLon: number; heLat: number; heLon: number }) => ({ le: r.le, he: r.he, leLat: r.leLat, leLon: r.leLon, heLat: r.heLat, heLon: r.heLon })),
          taxiways: h.field.taxiways ?? [],
        })
        setState('ok')
      } else {
        setState('no-field')
      }
    }).catch(() => setState('no-field'))
  }, [router])

  if (state === 'loading') return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (state === 'no-field') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Airport diagram drill</h1>
      <p className="text-gray-500 mb-6">Set a listed home field (by ICAO ident) to drill your airport&apos;s real runways and taxiways.</p>
      <a href="/profile" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Set your home field</a>
    </main>
  )

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
          <h1 className="text-xl font-semibold">Diagram drill</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">Know your field — real layout for {field!.name}.</p>
        <div className="flex gap-1.5 mb-4">
          {(['identify', 'trace'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${mode === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {m === 'identify' ? 'Identify' : 'Trace a route'}
            </button>
          ))}
        </div>
        {field && (mode === 'identify' ? <DiagramDrill field={field} /> : <TaxiTrace field={field} />)}
      </div>
    </main>
  )
}
