'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { scenarios, getScenario } from '@/lib/scenarios'
import { getSession, incrementFreeUsed, FREE_DAILY_LIMIT } from '@/lib/session'
import PaywallModal from '@/components/PaywallModal'
import type { GradeResult } from '@/lib/types'

const DIFF_LABELS: Record<number, string> = {
  1: 'Student',
  2: 'Intermediate',
  3: 'Advanced',
}

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const scenario = getScenario(id)

  const [readback, setReadback] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [listenMode, setListenMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  // Safe SSR default; useEffect hydrates from localStorage after mount
  const [session, setSession] = useState({
    freeUsed: 0,
    freeLimit: FREE_DAILY_LIMIT,
    isPaid: false,
    canGrade: true,
    remaining: FREE_DAILY_LIMIT,
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)

  // Sync session state from localStorage on mount
  useEffect(() => {
    setSession(getSession())
  }, [])

  const playTransmission = useCallback(async () => {
    if (!scenario) return
    setTtsLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scenario.atcTransmission }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.src = url
        await audioRef.current.play().catch(() => {})
      }
    } finally {
      setTtsLoading(false)
    }
  }, [scenario])

  // Auto-play ATC on load (best-effort — browsers may block without prior interaction)
  useEffect(() => {
    if (!autoPlayedRef.current && scenario) {
      autoPlayedRef.current = true
      playTransmission()
    }
  }, [scenario, playTransmission])

  const startVoiceInput = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition

    if (!SR) {
      alert('Voice input not supported in this browser — try Chrome.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setRecording(true)

    recognition.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const transcript = e.results[0][0].transcript
      setReadback(transcript)
      setRecording(false)
    }

    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recognition.start()
  }, [])

  const submitReadback = useCallback(async () => {
    if (!scenario || !readback.trim() || grading) return

    const current = getSession()
    if (!current.canGrade) {
      setShowPaywall(true)
      return
    }

    setGrading(true)
    setResult(null)
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, readback }),
      })
      const data = await res.json()
      setResult(data)
      if (!current.isPaid) {
        incrementFreeUsed()
        setSession(getSession())
      }
    } finally {
      setGrading(false)
    }
  }, [scenario, readback, grading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        submitReadback()
      }
    },
    [submitReadback],
  )

  const nextScenario = useCallback(() => {
    const idx = scenarios.findIndex((s) => s.id === id)
    const next = scenarios[(idx + 1) % scenarios.length]
    setReadback('')
    setResult(null)
    router.push(`/train/${next.id}`)
  }, [id, router])

  if (!scenario) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        Scenario not found.{' '}
        <a href="/train" className="underline">
          Back to list
        </a>
      </div>
    )
  }

  const scoreColor =
    result === null
      ? ''
      : result.score >= 80
        ? 'text-green-700'
        : result.score >= 60
          ? 'text-yellow-700'
          : 'text-red-700'

  const scoreBg =
    result === null
      ? ''
      : result.score >= 80
        ? 'bg-green-50 border-green-200'
        : result.score >= 60
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200'

  const freeRemaining = session.isPaid ? null : session.remaining

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} />

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          freeUsed={session.freeUsed}
          freeLimit={session.freeLimit}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">
              ← scenarios
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 capitalize">{scenario.phase}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                scenario.difficulty === 1
                  ? 'bg-green-100 text-green-800'
                  : scenario.difficulty === 2
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {DIFF_LABELS[scenario.difficulty]}
            </span>
          </div>
          {freeRemaining !== null && (
            <span className="text-xs text-gray-400">
              {freeRemaining > 0
                ? `${freeRemaining} free left today`
                : <button onClick={() => setShowPaywall(true)} className="text-blue-600 hover:underline">Upgrade for unlimited</button>
              }
            </span>
          )}
        </div>

        <h1 className="text-xl font-semibold mb-2">{scenario.title}</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">{scenario.setup}</p>

        {/* ATC Transmission */}
        <div className="bg-gray-950 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-mono text-xs uppercase tracking-widest">
                ATC Transmission
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setListenMode((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 font-mono transition-colors"
                title="Toggle listen-only mode (hide text to train your ear)"
              >
                {listenMode ? '👁 show' : '🙈 hide text'}
              </button>
              <button
                onClick={playTransmission}
                disabled={ttsLoading}
                className="text-xs text-gray-400 hover:text-green-400 font-mono transition-colors disabled:opacity-40"
              >
                {ttsLoading ? 'loading...' : '▶ play'}
              </button>
            </div>
          </div>
          <p
            className={`text-green-400 font-mono text-sm leading-relaxed transition-all duration-300 ${
              listenMode ? 'blur-md select-none pointer-events-none' : ''
            }`}
          >
            &ldquo;{scenario.atcTransmission}&rdquo;
          </p>
          {listenMode && (
            <p className="text-center text-gray-500 text-xs mt-2">
              Listen-only mode — hear it, then type your readback
            </p>
          )}
        </div>

        {/* Readback input */}
        {!result && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your readback
            </label>
            <textarea
              ref={textareaRef}
              value={readback}
              onChange={(e) => setReadback(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type exactly what you would say on the radio..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
                <button
                  onClick={startVoiceInput}
                  disabled={recording}
                  className={`text-xs px-2 py-1 rounded font-mono border transition-colors ${
                    recording
                      ? 'border-red-300 text-red-600 bg-red-50 animate-pulse'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                  title="Speak your readback"
                >
                  {recording ? '● recording...' : '🎙 speak'}
                </button>
              </div>
              <button
                onClick={submitReadback}
                disabled={!readback.trim() || grading}
                className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {grading ? 'Grading...' : 'Submit readback'}
              </button>
            </div>
          </div>
        )}

        {/* Grade result */}
        {result && (
          <div className="space-y-4">
            {/* Score card */}
            <div className={`border rounded-xl p-5 ${scoreBg}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className={`text-4xl font-bold ${scoreColor}`}>{result.score}</div>
                  <div className={`text-sm font-medium ${scoreColor}`}>{result.passFail}</div>
                </div>
                <div className="text-right text-sm text-gray-600 max-w-xs leading-relaxed">
                  {result.feedback}
                </div>
              </div>
              <button
                onClick={playTransmission}
                disabled={ttsLoading}
                className="text-xs text-gray-500 hover:text-gray-700 font-mono border border-gray-200 px-2 py-1 rounded transition-colors disabled:opacity-40"
              >
                {ttsLoading ? 'loading...' : '▶ replay ATC'}
              </button>
            </div>

            {/* You said vs standard */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  You said
                </div>
                <p className="text-sm font-mono text-gray-700 bg-gray-50 rounded px-3 py-2">
                  &ldquo;{readback}&rdquo;
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  Standard readback
                </div>
                <p className="text-sm font-mono text-green-800 bg-green-50 rounded px-3 py-2">
                  &ldquo;{result.correctReadback}&rdquo;
                </p>
              </div>
            </div>

            {/* Elements */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Required elements
              </div>
              <div className="space-y-1.5">
                {result.elements.required.map((el) => {
                  const hit = result.elements.hit.includes(el)
                  return (
                    <div key={el} className="flex items-center gap-2 text-sm">
                      <span className={`shrink-0 ${hit ? 'text-green-600' : 'text-red-500'}`}>
                        {hit ? '✓' : '✗'}
                      </span>
                      <span className={hit ? 'text-gray-700' : 'text-red-700 font-medium'}>
                        {el}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Phraseology issues */}
            {result.phraseologyIssues.length > 0 && (
              <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-2">
                  Phraseology
                </div>
                <ul className="space-y-1">
                  {result.phraseologyIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-800">
                      — {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setResult(null)
                  setReadback('')
                  setTimeout(() => textareaRef.current?.focus(), 50)
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={nextScenario}
                className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Next scenario →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
