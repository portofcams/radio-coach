'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ORAL_QUESTIONS } from '@/lib/oral'
import { attachRadioFx, type RadioFxController } from '@/lib/radio-fx'
import { voiceForKey } from '@/lib/voices'

function shuffle<T>(a: T[], seed: number): T[] {
  const arr = [...a]
  let s = seed
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function OralPage() {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9))
  const deck = useMemo(() => shuffle(ORAL_QUESTIONS, seed), [seed])
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [got, setGot] = useState(0)
  const [review, setReview] = useState(0)
  const [done, setDone] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fxRef = useRef<RadioFxController | null>(null)
  const q = deck[i]

  const hear = useCallback(async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q.question, speed: 1.0, voice: voiceForKey(q.id) }),
      })
      if (!res.ok) return
      const url = URL.createObjectURL(await res.blob())
      const audio = audioRef.current
      if (!audio) return
      if (!fxRef.current) fxRef.current = attachRadioFx(audio, 'radio')
      audio.src = url
      audio.onended = () => fxRef.current?.release()
      fxRef.current?.cue()
      await audio.play().catch(() => {})
    } catch { /* ignore */ }
  }, [q])

  const rate = (good: boolean) => {
    if (good) setGot((n) => n + 1); else setReview((n) => n + 1)
    if (i + 1 >= deck.length) { setDone(true); return }
    setI((n) => n + 1); setRevealed(false)
  }

  if (done) {
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Mock oral complete</h1>
        <p className="text-gray-500 mb-6">You felt solid on <strong className="text-green-600">{got}</strong> and flagged <strong className="text-amber-600">{review}</strong> to review.</p>
        <button onClick={() => { setI(0); setGot(0); setReview(0); setDone(false); setRevealed(false) }} className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-gray-800">Run it again</button>
        <p className="mt-4"><Link href="/checkride" className="text-sm text-blue-600 hover:underline">Ready for the full mock DPE? Chain this into a live radio checkride →</Link></p>
        <p className="mt-6"><Link href="/train" className="text-sm text-gray-400 hover:text-gray-600">← training</Link></p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} className="hidden" />
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
            <h1 className="text-2xl font-semibold">Mock oral</h1>
          </div>
          <span className="font-mono text-xs text-gray-400">{i + 1}/{deck.length}</span>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-400">{q.area}</span>
            <button onClick={hear} className="text-xs text-blue-600 hover:underline">Hear the examiner →</button>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-5">{q.question}</p>

          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">
              Answer aloud, then reveal
            </button>
          ) : (
            <div>
              <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-800 leading-relaxed mb-3">{q.answer}</p>
                <ul className="space-y-1">
                  {q.keyPoints.map((k) => (
                    <li key={k} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-green-600">✓</span>{k}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3">
                <button onClick={() => rate(false)} className="flex-1 border border-amber-300 text-amber-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-50">Review this</button>
                <button onClick={() => rate(true)} className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">I had it →</button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400 text-center">Answer out loud like a real checkride, then reveal the model answer and rate yourself honestly.</p>
      </div>
    </main>
  )
}
