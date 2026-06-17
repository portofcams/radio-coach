'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { scenarios, getScenario } from '@/lib/scenarios'
import { getSession, incrementFreeUsed, FREE_DAILY_LIMIT } from '@/lib/session'
import { toPhonetic } from '@/lib/phonetic'
import PaywallModal from '@/components/PaywallModal'
import type { GradeResult } from '@/lib/types'

const DIFF_LABELS: Record<number, string> = {
  1: 'Student',
  2: 'Intermediate',
  3: 'Advanced',
}

interface UserProfile {
  id: number
  email: string
  callsign: string | null
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
  const [session, setSession] = useState({
    freeUsed: 0,
    freeLimit: FREE_DAILY_LIMIT,
    isPaid: false,
    canGrade: true,
    remaining: FREE_DAILY_LIMIT,
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const [timer, setTimer] = useState<number | null>(null)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [metar, setMetar] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Hydrate session + user on mount
  useEffect(() => {
    setSession(getSession())
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => {})
  }, [])

  // Fetch METAR for scenario airport
  useEffect(() => {
    if (!scenario?.airport) return
    fetch(
      `https://aviationweather.gov/api/data/metar?ids=${scenario.airport}&format=json&taf=false`
    )
      .then((r) => r.json())
      .then((data) => {
        const raw = data?.[0]?.rawOb
        if (raw) setMetar(raw)
      })
      .catch(() => {})
  }, [scenario?.airport])

  const startTimer = useCallback(() => {
    if (!timerEnabled) return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer(15)
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [timerEnabled])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
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
        startTimer()
      }
    } finally {
      setTtsLoading(false)
    }
  }, [scenario, startTimer])

  // Auto-play on load
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
    if (!SR) { alert('Voice input not supported — try Chrome.'); return }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    setRecording(true)
    recognition.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      setReadback(e.results[0][0].transcript)
      setRecording(false)
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)
    recognition.start()
  }, [])

  const submitReadback = useCallback(async () => {
    if (!scenario || !readback.trim() || grading) return

    const current = getSession()
    if (!current.canGrade && !user) {
      setShowPaywall(true)
      return
    }

    if (timerRef.current) { clearInterval(timerRef.current); setTimer(null) }

    setGrading(true)
    setResult(null)
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, readback, hintUsed: hintShown }),
      })
      const data = await res.json()
      setResult(data)
      if (!current.isPaid && !user) {
        incrementFreeUsed()
        setSession(getSession())
      }
    } finally {
      setGrading(false)
    }
  }, [scenario, readback, grading, hintShown, user])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submitReadback() }
    },
    [submitReadback],
  )

  const nextScenario = useCallback(() => {
    const idx = scenarios.findIndex((s) => s.id === id)
    const next = scenarios[(idx + 1) % scenarios.length]
    setReadback(''); setResult(null); setHintShown(false); autoPlayedRef.current = false
    router.push(`/train/${next.id}`)
  }, [id, router])

  if (!scenario) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        Scenario not found. <a href="/train" className="underline">Back to list</a>
      </div>
    )
  }

  const scoreColor = result === null ? '' : result.score >= 80 ? 'text-green-700' : result.score >= 60 ? 'text-yellow-700' : 'text-red-700'
  const scoreBg = result === null ? '' : result.score >= 80 ? 'bg-green-50 border-green-200' : result.score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
  const freeRemaining = (session.isPaid || user) ? null : session.remaining
  const callsignDisplay = user?.callsign ? toPhonetic(user.callsign) : null
  const timerColor = timer === null ? '' : timer <= 3 ? 'text-red-600' : timer <= 7 ? 'text-yellow-600' : 'text-gray-400'

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} />

      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} freeUsed={session.freeUsed} freeLimit={session.freeLimit} />
      )}

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← scenarios</a>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 capitalize">{scenario.phase}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${scenario.difficulty === 1 ? 'bg-green-100 text-green-800' : scenario.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {DIFF_LABELS[scenario.difficulty]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTimerEnabled((v) => !v)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${timerEnabled ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
              title="Toggle pressure timer — 15s countdown after ATC plays"
            >
              ⏱ {timerEnabled ? 'timer on' : 'timer off'}
            </button>
            {freeRemaining !== null && (
              <span className="text-xs text-gray-400">
                {freeRemaining > 0
                  ? `${freeRemaining} free left today`
                  : <button onClick={() => setShowPaywall(true)} className="text-blue-600 hover:underline">Upgrade</button>
                }
              </span>
            )}
            {user && (
              <a href="/profile" className="text-xs text-gray-400 hover:text-gray-600">
                {user.email.split('@')[0]}
              </a>
            )}
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2">{scenario.title}</h1>

        {/* Airport + METAR context */}
        {scenario.airport && (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
              {scenario.airport}
            </span>
            {metar && (
              <span className="text-xs text-gray-500 font-mono truncate">{metar}</span>
            )}
          </div>
        )}

        {/* Callsign badge */}
        {callsignDisplay && (
          <div className="mb-3 text-xs text-gray-500">
            Your aircraft: <span className="font-mono text-gray-700">{user!.callsign}</span>
            <span className="text-gray-400"> — {callsignDisplay}</span>
          </div>
        )}

        <p className="text-gray-600 mb-6 leading-relaxed">{scenario.setup}</p>

        {/* ATC Transmission */}
        <div className="bg-gray-950 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-mono text-xs uppercase tracking-widest">ATC Transmission</span>
            </div>
            <div className="flex items-center gap-3">
              {timer !== null && (
                <span className={`font-mono text-sm font-bold ${timerColor}`}>{timer}s</span>
              )}
              <button onClick={() => setListenMode((v) => !v)} className="text-xs text-gray-500 hover:text-gray-300 font-mono transition-colors">
                {listenMode ? '👁 show' : '🙈 hide text'}
              </button>
              <button onClick={playTransmission} disabled={ttsLoading} className="text-xs text-gray-400 hover:text-green-400 font-mono transition-colors disabled:opacity-40">
                {ttsLoading ? 'loading...' : '▶ play'}
              </button>
            </div>
          </div>
          <p className={`text-green-400 font-mono text-sm leading-relaxed transition-all duration-300 ${listenMode ? 'blur-md select-none pointer-events-none' : ''}`}>
            &ldquo;{scenario.atcTransmission}&rdquo;
          </p>
          {listenMode && <p className="text-center text-gray-500 text-xs mt-2">Listen-only — hear it, then type your readback</p>}
        </div>

        {/* Hint button */}
        {!result && !hintShown && (
          <button
            onClick={() => setHintShown(true)}
            className="text-xs text-gray-400 hover:text-gray-600 mb-4 border border-dashed border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            💡 Show required elements (−10 pts penalty)
          </button>
        )}

        {/* Hint panel */}
        {hintShown && !result && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-2">Required elements (−10 pts)</div>
            <div className="space-y-1">
              {scenario.requiredElements.map((el) => (
                <div key={el} className="text-sm text-yellow-800 flex items-center gap-2">
                  <span className="text-yellow-400">→</span> {el}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer bar */}
        {timerEnabled && timer !== null && !result && (
          <div className="mb-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timer <= 3 ? 'bg-red-500' : timer <= 7 ? 'bg-yellow-400' : 'bg-green-400'}`}
              style={{ width: `${(timer / 15) * 100}%` }}
            />
          </div>
        )}

        {/* Readback input */}
        {!result && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your readback</label>
            <textarea
              ref={textareaRef}
              value={readback}
              onChange={(e) => setReadback(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type exactly what you would say on the radio..."
              rows={3}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none transition-colors ${timer === 0 ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-300'}`}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
                <button
                  onClick={startVoiceInput}
                  disabled={recording}
                  className={`text-xs px-2 py-1 rounded font-mono border transition-colors ${recording ? 'border-red-300 text-red-600 bg-red-50 animate-pulse' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
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
            <div className={`border rounded-xl p-5 ${scoreBg}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className={`text-4xl font-bold ${scoreColor}`}>{result.score}</div>
                  <div className={`text-sm font-medium ${scoreColor}`}>
                    {result.passFail}
                    {hintShown && <span className="ml-2 text-xs text-gray-500">(hint used)</span>}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600 max-w-xs leading-relaxed">{result.feedback}</div>
              </div>
              <button onClick={playTransmission} disabled={ttsLoading} className="text-xs text-gray-500 hover:text-gray-700 font-mono border border-gray-200 px-2 py-1 rounded transition-colors disabled:opacity-40">
                {ttsLoading ? 'loading...' : '▶ replay ATC'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl p-5 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">You said</div>
                <p className="text-sm font-mono text-gray-700 bg-gray-50 rounded px-3 py-2">&ldquo;{readback}&rdquo;</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Standard readback</div>
                <p className="text-sm font-mono text-green-800 bg-green-50 rounded px-3 py-2">&ldquo;{result.correctReadback}&rdquo;</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Required elements</div>
              <div className="space-y-1.5">
                {result.elements.required.map((el) => {
                  const hit = result.elements.hit.includes(el)
                  return (
                    <div key={el} className="flex items-center gap-2 text-sm">
                      <span className={`shrink-0 ${hit ? 'text-green-600' : 'text-red-500'}`}>{hit ? '✓' : '✗'}</span>
                      <span className={hit ? 'text-gray-700' : 'text-red-700 font-medium'}>{el}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {result.phraseologyIssues.length > 0 && (
              <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-2">Phraseology</div>
                <ul className="space-y-1">
                  {result.phraseologyIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-800">— {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setResult(null); setReadback(''); setHintShown(false); setTimeout(() => textareaRef.current?.focus(), 50) }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
              >
                Try again
              </button>
              <button onClick={nextScenario} className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                Next scenario →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
