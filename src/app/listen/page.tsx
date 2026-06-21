'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { LISTEN_CALLS, pickListenCall, scoreListening } from '@/lib/listening'
import { attachRadioFx, type RadioFxController } from '@/lib/radio-fx'
import { voiceForKey } from '@/lib/voices'

export default function ListenPage() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * LISTEN_CALLS.length))
  const call = LISTEN_CALLS[idx % LISTEN_CALLS.length]
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [played, setPlayed] = useState(false)
  const [result, setResult] = useState<{ pct: number; matched: number; targetWords: number } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fxRef = useRef<RadioFxController | null>(null)

  const play = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: call.text, speed: 1.12, voice: voiceForKey(call.id) }),
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
      setPlayed(true)
    } finally { setLoading(false) }
  }, [call])

  const check = () => { if (typed.trim()) setResult(scoreListening(typed, call.text)) }
  const next = () => {
    setIdx((i) => (i + 1 + Math.floor(Math.random() * (LISTEN_CALLS.length - 1))) % LISTEN_CALLS.length)
    setTyped(''); setResult(null); setPlayed(false)
  }

  const color = !result ? '' : result.pct >= 85 ? 'text-green-700' : result.pct >= 60 ? 'text-yellow-700' : 'text-red-700'

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} className="hidden" />
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
            <h1 className="text-2xl font-semibold">Listening drill</h1>
          </div>
          <span className="font-mono text-xs text-gray-400">{call.context}</span>
        </div>
        <p className="text-gray-500 mb-6">Hit play, listen to the controller through the radio static, and type back exactly what you heard. You&apos;re scored on word accuracy.</p>

        <button onClick={play} disabled={loading} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 mb-2">
          {loading ? 'Loading…' : played ? 'Replay transmission' : 'Play transmission'}
        </button>

        {played && (
          <>
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type what the controller said…"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {!result ? (
              <button onClick={check} disabled={!typed.trim()} className="mt-2 w-full border border-gray-300 text-gray-800 rounded-lg px-4 py-2.5 text-sm font-medium hover:border-gray-500 disabled:opacity-40">
                Check
              </button>
            ) : (
              <div className="mt-4 border border-gray-200 rounded-xl p-4">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`text-3xl font-bold ${color}`}>{result.pct}%</span>
                  <span className="text-sm text-gray-500">{result.matched}/{result.targetWords} words</span>
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">What was said</div>
                <p className="text-sm font-mono text-gray-800 bg-gray-50 rounded px-3 py-2">{call.text}</p>
                <button onClick={next} className="mt-4 w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">Next transmission →</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
