'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { scenarios, getScenario } from '@/lib/scenarios'
import { getSession, incrementFreeUsed, FREE_DAILY_LIMIT } from '@/lib/session'
import { toPhonetic } from '@/lib/phonetic'
import PaywallModal from '@/components/PaywallModal'
import type { GradeResult } from '@/lib/types'

const DIFF_LABELS: Record<number, string> = { 1: 'Student', 2: 'Intermediate', 3: 'Advanced' }

// Radio state machine
type RadioState = 'idle' | 'atc_loading' | 'atc_playing' | 'ready' | 'listening' | 'transcribed' | 'grading' | 'done'

interface UserProfile { id: number; email: string; callsign: string | null }

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const scenario = getScenario(id)

  // Core state machine
  const [radioState, setRadioState] = useState<RadioState>('idle')
  const [readback, setReadback] = useState('')
  const [interimText, setInterimText] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [voiceAvailable, setVoiceAvailable] = useState(false)
  const [voiceMode, setVoiceMode] = useState(true)
  const [listenMode, setListenMode] = useState(false)

  // Extras
  const [showPaywall, setShowPaywall] = useState(false)
  const [session, setSession] = useState({
    freeUsed: 0, freeLimit: FREE_DAILY_LIMIT, isPaid: false, canGrade: true, remaining: FREE_DAILY_LIMIT,
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timer, setTimer] = useState<number | null>(null)
  const [metar, setMetar] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<unknown>(null)

  // Detect voice support + load session/user
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const hasVoice = !!(w.SpeechRecognition ?? w.webkitSpeechRecognition)
    setVoiceAvailable(hasVoice)
    setVoiceMode(hasVoice)
    setSession(getSession())
    fetch('/api/auth/me').then(r => r.json()).then(d => d.user && setUser(d.user)).catch(() => {})
  }, [])

  // METAR
  useEffect(() => {
    if (!scenario?.airport) return
    fetch(`https://aviationweather.gov/api/data/metar?ids=${scenario.airport}&format=json&taf=false`)
      .then(r => r.json())
      .then(data => { const raw = data?.[0]?.rawOb; if (raw) setMetar(raw) })
      .catch(() => {})
  }, [scenario?.airport])

  // Timer
  const startTimer = useCallback(() => {
    if (!timerEnabled) return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer(15)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t === null || t <= 1) { clearInterval(timerRef.current!); return 0 }
        return t - 1
      })
    }, 1000)
  }, [timerEnabled])
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Stop any active recognition
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { (recognitionRef.current as { stop(): void }).stop() } catch {}
      recognitionRef.current = null
    }
  }, [])

  // Voice recognition
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { setVoiceMode(false); return }
    stopRecognition()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    setInterimText('')
    setRadioState('listening')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(' ')
      setInterimText(transcript)
      if (e.results[e.results.length - 1].isFinal) {
        setReadback(transcript)
        setInterimText('')
        setRadioState('transcribed')
        recognitionRef.current = null
      }
    }
    recognition.onerror = () => {
      setInterimText('')
      setRadioState('ready')
      recognitionRef.current = null
    }
    recognition.onend = () => {
      setRadioState(prev => prev === 'listening' ? 'ready' : prev)
      recognitionRef.current = null
    }
    recognition.start()
  }, [stopRecognition])

  // Play ATC
  const playTransmission = useCallback(async () => {
    if (!scenario) return
    stopRecognition()
    setRadioState('atc_loading')
    setResult(null)
    setReadback('')
    setInterimText('')
    setHintShown(false)
    if (timerRef.current) { clearInterval(timerRef.current); setTimer(null) }
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scenario.atcTransmission }),
      })
      if (!res.ok) { setRadioState('ready'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = audioRef.current
      if (!audio) { setRadioState('ready'); return }
      audio.src = url
      audio.onended = () => {
        setRadioState('ready')
        startTimer()
        // Auto-mic after ATC finishes
        if (voiceMode) setTimeout(() => startListening(), 700)
      }
      setRadioState('atc_playing')
      await audio.play().catch(() => setRadioState('ready'))
    } catch {
      setRadioState('ready')
    }
  }, [scenario, voiceMode, startTimer, startListening, stopRecognition])

  // Auto-play on mount
  useEffect(() => {
    if (!autoPlayedRef.current && scenario) {
      autoPlayedRef.current = true
      playTransmission()
    }
  }, [scenario, playTransmission])

  // Submit
  const submitReadback = useCallback(async (text?: string) => {
    const rb = text ?? readback
    if (!scenario || !rb.trim() || radioState === 'grading') return

    const current = getSession()
    if (!current.canGrade && !user) { setShowPaywall(true); return }
    if (timerRef.current) { clearInterval(timerRef.current); setTimer(null) }

    setRadioState('grading')
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, readback: rb, hintUsed: hintShown }),
      })
      const data = await res.json()
      setResult(data)
      setRadioState('done')
      if (!current.isPaid && !user) { incrementFreeUsed(); setSession(getSession()) }
    } catch {
      setRadioState('transcribed')
    }
  }, [scenario, readback, radioState, hintShown, user])

  const nextScenario = useCallback(() => {
    const idx = scenarios.findIndex(s => s.id === id)
    const next = scenarios[(idx + 1) % scenarios.length]
    setReadback(''); setResult(null); setHintShown(false); setInterimText('')
    autoPlayedRef.current = false
    setRadioState('idle')
    router.push(`/train/${next.id}`)
  }, [id, router])

  const reset = useCallback(() => {
    setResult(null); setReadback(''); setInterimText(''); setHintShown(false)
    setRadioState('ready')
    if (!voiceMode) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [voiceMode])

  if (!scenario) return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
      Scenario not found. <a href="/train" className="underline">Back to list</a>
    </div>
  )

  const scoreColor = !result ? '' : result.score >= 80 ? 'text-green-700' : result.score >= 60 ? 'text-yellow-700' : 'text-red-700'
  const scoreBg = !result ? '' : result.score >= 80 ? 'bg-green-50 border-green-200' : result.score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
  const freeRemaining = (session.isPaid || user) ? null : session.remaining
  const callsignDisplay = user?.callsign ? toPhonetic(user.callsign) : null
  const timerColor = timer === null ? '' : timer <= 3 ? 'text-red-600' : timer <= 7 ? 'text-yellow-600' : 'text-gray-400'
  const isAtcActive = radioState === 'atc_loading' || radioState === 'atc_playing'

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} />
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} freeUsed={session.freeUsed} freeLimit={session.freeLimit} />}

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
              onClick={() => setTimerEnabled(v => !v)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${timerEnabled ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              ⏱ {timerEnabled ? 'timer on' : 'timer off'}
            </button>
            {freeRemaining !== null && (
              <span className="text-xs text-gray-400">
                {freeRemaining > 0
                  ? `${freeRemaining} free left today`
                  : <button onClick={() => setShowPaywall(true)} className="text-blue-600 hover:underline">Upgrade</button>}
              </span>
            )}
            {user && <a href="/profile" className="text-xs text-gray-400 hover:text-gray-600">{user.email.split('@')[0]}</a>}
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2">{scenario.title}</h1>

        {/* Airport + METAR */}
        {scenario.airport && (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">{scenario.airport}</span>
            {metar && <span className="text-xs text-gray-500 font-mono truncate">{metar}</span>}
          </div>
        )}
        {callsignDisplay && (
          <div className="mb-3 text-xs text-gray-500">
            Your aircraft: <span className="font-mono text-gray-700">{user!.callsign}</span>
            <span className="text-gray-400"> — {callsignDisplay}</span>
          </div>
        )}

        <p className="text-gray-600 mb-6 leading-relaxed">{scenario.setup}</p>

        {/* ATC block */}
        <div className={`rounded-xl p-5 mb-4 transition-all ${isAtcActive ? 'bg-gray-950 ring-2 ring-green-500/40' : 'bg-gray-950'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAtcActive ? 'bg-green-400 animate-ping' : 'bg-green-400 animate-pulse'}`} />
              <span className="text-green-400 font-mono text-xs uppercase tracking-widest">
                {radioState === 'atc_loading' ? 'Loading...' : radioState === 'atc_playing' ? 'Transmitting...' : 'ATC'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {timer !== null && <span className={`font-mono text-sm font-bold ${timerColor}`}>{timer}s</span>}
              <button onClick={() => setListenMode(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 font-mono">
                {listenMode ? '👁 show' : '🙈 hide'}
              </button>
              <button onClick={playTransmission} disabled={isAtcActive} className="text-xs text-gray-400 hover:text-green-400 font-mono disabled:opacity-40">
                ▶ replay
              </button>
            </div>
          </div>
          <p className={`text-green-400 font-mono text-sm leading-relaxed ${listenMode ? 'blur-md select-none' : ''}`}>
            &ldquo;{scenario.atcTransmission}&rdquo;
          </p>
        </div>

        {/* Hint */}
        {radioState !== 'done' && !hintShown && (
          <button onClick={() => setHintShown(true)} className="text-xs text-gray-400 hover:text-gray-600 mb-4 border border-dashed border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            💡 Required elements (−10 pts)
          </button>
        )}
        {hintShown && radioState !== 'done' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-2">Required elements (−10 pts)</div>
            {scenario.requiredElements.map(el => (
              <div key={el} className="text-sm text-yellow-800 flex items-center gap-2">
                <span className="text-yellow-400">→</span> {el}
              </div>
            ))}
          </div>
        )}

        {/* Timer bar */}
        {timerEnabled && timer !== null && radioState !== 'done' && (
          <div className="mb-4 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${timer <= 3 ? 'bg-red-500' : timer <= 7 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${(timer / 15) * 100}%` }} />
          </div>
        )}

        {/* ── INPUT AREA ── */}
        {radioState !== 'done' && (
          voiceMode ? (
            <VoiceInput
              radioState={radioState}
              interimText={interimText}
              readback={readback}
              onMicClick={() => {
                if (radioState === 'listening') { stopRecognition(); setRadioState('ready') }
                else startListening()
              }}
              onSubmit={() => submitReadback()}
              onRerecord={() => { setReadback(''); setInterimText(''); startListening() }}
              onSwitchToText={() => { stopRecognition(); setVoiceMode(false); setRadioState(r => r === 'listening' ? 'ready' : r) }}
            />
          ) : (
            <TextInput
              readback={readback}
              onChange={setReadback}
              onSubmit={() => submitReadback()}
              grading={radioState === 'grading'}
              textareaRef={textareaRef}
              onSwitchToVoice={voiceAvailable ? () => { setVoiceMode(true); setRadioState('ready') } : undefined}
            />
          )
        )}

        {/* ── RESULT ── */}
        {result && radioState === 'done' && (
          <div className="space-y-4 mt-2">
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
              <button onClick={playTransmission} className="text-xs text-gray-500 hover:text-gray-700 font-mono border border-gray-200 px-2 py-1 rounded">
                ▶ replay ATC
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
                {result.elements.required.map(el => {
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
                  {result.phraseologyIssues.map((issue, i) => <li key={i} className="text-sm text-yellow-800">— {issue}</li>)}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={reset} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400">
                Try again
              </button>
              <button onClick={nextScenario} className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                Next scenario →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Voice Input Component ──────────────────────────────────────────────────────

function VoiceInput({
  radioState, interimText, readback,
  onMicClick, onSubmit, onRerecord, onSwitchToText,
}: {
  radioState: RadioState
  interimText: string
  readback: string
  onMicClick: () => void
  onSubmit: () => void
  onRerecord: () => void
  onSwitchToText: () => void
}) {
  const isListening = radioState === 'listening'
  const isTranscribed = radioState === 'transcribed'
  const isGrading = radioState === 'grading'
  const isReady = radioState === 'ready' || radioState === 'idle'
  const displayText = interimText || readback

  return (
    <div className="mb-4">
      {/* Big mic button area */}
      <div className="flex flex-col items-center py-6">

        {/* State label above mic */}
        <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-5 h-4">
          {isListening && 'Listening — speak your readback'}
          {isReady && !isGrading && 'Tap mic to transmit'}
          {isGrading && 'Grading...'}
          {isTranscribed && 'Got it — submit or re-record'}
        </div>

        {/* Mic button with pulse rings */}
        <div className="relative flex items-center justify-center mb-5">
          {isListening && (
            <>
              <div className="absolute w-24 h-24 rounded-full bg-red-400/20 animate-ping" />
              <div className="absolute w-32 h-32 rounded-full bg-red-400/10 animate-ping" style={{ animationDelay: '0.15s' }} />
            </>
          )}
          <button
            onClick={onMicClick}
            disabled={isGrading}
            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all duration-150 active:scale-95 disabled:opacity-40 ${
              isListening
                ? 'bg-red-500 text-white shadow-red-200 scale-110'
                : isTranscribed
                ? 'bg-green-500 text-white'
                : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
          >
            {isListening ? '■' : isGrading ? '…' : '🎙'}
          </button>
        </div>

        {/* Live / final transcript */}
        {displayText && (
          <div className={`w-full max-w-sm bg-gray-50 border rounded-xl px-4 py-3 text-sm font-mono text-center leading-relaxed mb-4 ${isListening ? 'border-red-200 text-gray-500 italic' : 'border-gray-200 text-gray-800'}`}>
            &ldquo;{displayText}&rdquo;
          </div>
        )}

        {!displayText && isReady && (
          <p className="text-xs text-gray-400 text-center max-w-xs">
            Your readback will appear here as you speak
          </p>
        )}

        {/* Action buttons after transcription */}
        {isTranscribed && (
          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={onRerecord}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:border-gray-400"
            >
              Re-record
            </button>
            <button
              onClick={onSubmit}
              disabled={!readback.trim()}
              className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              Submit
            </button>
          </div>
        )}

        {isGrading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="animate-spin">⟳</span> Grading your readback...
          </div>
        )}
      </div>

      {/* Switch to text */}
      <div className="text-center">
        <button onClick={onSwitchToText} className="text-xs text-gray-400 hover:text-gray-600 underline">
          Type instead
        </button>
      </div>
    </div>
  )
}

// ── Text Input Component ───────────────────────────────────────────────────────

function TextInput({
  readback, onChange, onSubmit, grading, textareaRef, onSwitchToVoice,
}: {
  readback: string
  onChange: (v: string) => void
  onSubmit: () => void
  grading: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onSwitchToVoice?: () => void
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Your readback</label>
      <textarea
        ref={textareaRef}
        value={readback}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onSubmit() } }}
        placeholder="Type exactly what you would say on the radio..."
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        autoFocus
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
          {onSwitchToVoice && (
            <button onClick={onSwitchToVoice} className="text-xs text-gray-400 hover:text-gray-600 underline">
              🎙 Use voice
            </button>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!readback.trim() || grading}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
        >
          {grading ? 'Grading...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
