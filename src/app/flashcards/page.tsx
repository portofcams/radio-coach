'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FLASHCARDS, type Flashcard } from '@/lib/flashcards'
import { loadStudyState, saveStudyState } from '@/lib/studysync'

// Leitner spaced repetition: box (1–5) + due time per card. Synced to the account
// when signed in (cross-device); localStorage otherwise.
const KEY = 'wilco_srs_v1'
const INTERVALS_H = [0, 4, 24, 72, 168, 336] // hours by box (1..5)
type Sched = Record<string, { box: number; due: number }>

function save(s: Sched) { saveStudyState('flashcards', KEY, s) }

export default function FlashcardsPage() {
  const [sched, setSched] = useState<Sched>({})
  const [ready, setReady] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  useEffect(() => { loadStudyState<Sched>('flashcards', KEY, {}).then((s) => { setSched(s); setReady(true) }) }, [])

  // Due = scheduled in the past, or never seen. Soonest-due first.
  const queue = useMemo(() => {
    if (!ready) return []
    const now = Date.now()
    return FLASHCARDS
      .map((c) => ({ c, s: sched[c.id] }))
      .filter(({ s }) => !s || s.due <= now)
      .sort((a, b) => (a.s?.due ?? 0) - (b.s?.due ?? 0))
      .map(({ c }) => c)
  }, [sched, ready])

  const card: Flashcard | undefined = queue[0]

  function rate(kind: 'again' | 'good' | 'easy') {
    if (!card) return
    const cur = sched[card.id]?.box ?? 1
    const box = kind === 'again' ? 1 : kind === 'easy' ? Math.min(5, cur + 2) : Math.min(5, cur + 1)
    const due = Date.now() + INTERVALS_H[box] * 3600_000
    const next = { ...sched, [card.id]: { box, due } }
    setSched(next); save(next); setRevealed(false); setReviewed((n) => n + 1)
  }

  if (!ready) return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>

  if (!card) {
    const next = FLASHCARDS.map((c) => sched[c.id]?.due).filter(Boolean).sort((a, b) => (a! - b!))[0]
    const hrs = next ? Math.max(0, Math.round((next - Date.now()) / 3600_000)) : 0
    return (
      <main className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold mb-2">All caught up</h1>
        <p className="text-gray-500 mb-6">You reviewed {reviewed} card{reviewed === 1 ? '' : 's'}. {next ? `Next due in about ${hrs}h.` : ''}</p>
        <button onClick={() => { const cleared: Sched = {}; setSched(cleared); save(cleared); setReviewed(0) }} className="text-sm text-gray-400 hover:text-gray-600">Reset deck</button>
        <p className="mt-4"><Link href="/train" className="text-sm text-blue-600 hover:underline">Back to training →</Link></p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
          <span className="font-mono text-xs text-gray-400">{queue.length} due · {card.category}</span>
        </div>
        <div className="border border-gray-200 rounded-2xl p-6 min-h-[220px] flex flex-col">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{card.category}</div>
          <p className="text-lg font-medium text-gray-900">{card.front}</p>
          {revealed ? (
            <p className="text-gray-700 leading-relaxed mt-4 border-t border-gray-100 pt-4">{card.back}</p>
          ) : (
            <div className="mt-auto pt-6">
              <button onClick={() => setRevealed(true)} className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">Reveal answer</button>
            </div>
          )}
        </div>
        {revealed && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button onClick={() => rate('again')} className="border border-red-300 text-red-700 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50">Again</button>
            <button onClick={() => rate('good')} className="border border-gray-300 text-gray-800 rounded-lg py-2.5 text-sm font-medium hover:border-gray-500">Good</button>
            <button onClick={() => rate('easy')} className="border border-green-300 text-green-700 rounded-lg py-2.5 text-sm font-medium hover:bg-green-50">Easy</button>
          </div>
        )}
      </div>
    </main>
  )
}
