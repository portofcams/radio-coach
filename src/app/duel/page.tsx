'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Duel { scenario_id: string; creator_name: string; creator_score: number; attempts: number; beaten: number; scenarioTitle: string }

export default function DuelPage() {
  return (
    <Suspense fallback={null}>
      <DuelPageInner />
    </Suspense>
  )
}

function DuelPageInner() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  const [duel, setDuel] = useState<Duel | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')

  useEffect(() => {
    fetch(`/api/duel/${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.scenario_id) { setDuel(d); setState('ok') } else setState('missing')
    }).catch(() => setState('missing'))
  }, [id])

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>
  if (state === 'missing') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Challenge not found</h1>
      <Link href="/train" className="text-blue-600 hover:underline text-sm">Go to training →</Link>
    </main>
  )

  return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <div className="font-mono text-xs font-bold tracking-widest text-amber-600 mb-3">RADIO DUEL</div>
      <h1 className="text-2xl font-semibold mb-1">{duel!.creator_name} challenged you</h1>
      <p className="text-gray-500 mb-6">Beat their score on <strong className="text-gray-700">{duel!.scenarioTitle}</strong>.</p>
      <div className="border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="text-5xl font-bold text-gray-900">{duel!.creator_score}%</div>
        <div className="text-sm text-gray-400 mt-1">the score to beat</div>
      </div>
      <button onClick={() => router.push(`/train/scenario?id=${duel!.scenario_id}&duel=${id}`)} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800">
        Take the challenge →
      </button>
      {duel!.attempts > 0 && <p className="text-xs text-gray-400 mt-4">{duel!.beaten} of {duel!.attempts} challengers have beaten it.</p>}
    </main>
  )
}
