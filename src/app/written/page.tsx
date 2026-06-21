'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { WRITTEN, WRITTEN_CATEGORIES, type WrittenQ } from '@/lib/written'

function shuffle<T>(a: T[]): T[] {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function WrittenPage() {
  const [cat, setCat] = useState<string>('All')
  const [deck, setDeck] = useState<WrittenQ[] | null>(null)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)

  const pool = useMemo(() => (cat === 'All' ? WRITTEN : WRITTEN.filter((w) => w.category === cat)), [cat])

  function start() { setDeck(shuffle(pool)); setI(0); setPicked(null); setCorrect(0) }

  if (!deck) {
    return (
      <main className="min-h-screen">
        <div className="max-w-xl mx-auto px-6 py-12">
          <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
          <h1 className="text-2xl font-semibold mt-3 mb-1">Written test prep</h1>
          <p className="text-gray-500 mb-6">Private Pilot knowledge questions with explanations — pick a topic or take them all.</p>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {['All', ...WRITTEN_CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${cat === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}>{c}</button>
            ))}
          </div>
          <button onClick={start} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800">
            Start {cat === 'All' ? `${WRITTEN.length}` : pool.length} questions
          </button>
        </div>
      </main>
    )
  }

  if (i >= deck.length) {
    const pct = Math.round((100 * correct) / deck.length)
    return (
      <main className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold mb-1">{correct}/{deck.length} correct</h1>
        <p className={`text-lg font-semibold mb-6 ${pct >= 80 ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{pct}% — {pct >= 70 ? 'passing range' : 'keep studying'}</p>
        <button onClick={start} className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-gray-800">Retake</button>
        <p className="mt-4"><button onClick={() => setDeck(null)} className="text-sm text-gray-400 hover:text-gray-600">Pick another topic</button></p>
      </main>
    )
  }

  const q = deck[i]
  const answered = picked !== null
  return (
    <main className="min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setDeck(null)} className="text-gray-400 hover:text-gray-600 text-sm">← topics</button>
          <span className="font-mono text-xs text-gray-400">{i + 1}/{deck.length} · {q.category}</span>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-5">{q.q}</p>
        <div className="space-y-2">
          {q.choices.map((c, idx) => {
            const isAns = idx === q.answer
            const cls = !answered ? 'border-gray-300 hover:border-gray-500'
              : isAns ? 'border-green-500 bg-green-50'
              : idx === picked ? 'border-red-400 bg-red-50' : 'border-gray-200 opacity-60'
            return (
              <button key={idx} disabled={answered} onClick={() => { setPicked(idx); if (isAns) setCorrect((n) => n + 1) }}
                className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors ${cls}`}>
                {c}
              </button>
            )
          })}
        </div>
        {answered && (
          <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-700 leading-relaxed">{q.explain}</p>
            <button onClick={() => { setI((n) => n + 1); setPicked(null) }} className="mt-3 w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">
              {i + 1 >= deck.length ? 'See score →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
