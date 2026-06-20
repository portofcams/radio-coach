'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { scenarios, getScenario } from '@/lib/scenarios'
import { getSession, incrementFreeUsed, FREE_DAILY_LIMIT } from '@/lib/session'
import { toPhonetic } from '@/lib/phonetic'
import PaywallModal from '@/components/PaywallModal'
import AirportDiagram from '@/components/AirportDiagram'
import RealFieldDiagram from '@/components/RealFieldDiagram'
import type { GradeResult, Scenario } from '@/lib/types'
import { attachRadioFx, getRadioFx, setRadioFx, ttsSpeed, type RadioFxController, type RadioFxSettings, type RadioMode, type RadioSpeed } from '@/lib/radio-fx'
import { personalizeText } from '@/lib/personalize'
import { homeScenario, type HomeProfile } from '@/lib/home-client'

const DIFF_LABELS: Record<number, string> = { 1: 'Student', 2: 'Intermediate', 3: 'Advanced' }

// Radio state machine
type RadioState = 'idle' | 'atc_loading' | 'atc_playing' | 'ready' | 'listening' | 'transcribed' | 'grading' | 'done'

interface UserProfile { id: number; email: string; callsign: string | null; home?: HomeProfile | null }

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  // Static library scenario, or a per-user "home field" scenario resolved after /api/auth/me.
  const [scenario, setScenario] = useState<Scenario | undefined>(() => getScenario(id))
  const isHomeId = id.startsWith('home-')

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
  const [paywallReason, setPaywallReason] = useState<'daily' | 'pro'>('daily')
  const [session, setSession] = useState({
    freeUsed: 0, freeLimit: FREE_DAILY_LIMIT, isPaid: false, canGrade: true, remaining: FREE_DAILY_LIMIT,
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [pro, setPro] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timer, setTimer] = useState<number | null>(null)
  const [metar, setMetar] = useState<string | null>(null)

  const [displayScore, setDisplayScore] = useState(0)
  useEffect(() => {
    if (!result) { setDisplayScore(0); return }
    const target = result.score
    let cur = 0
    const step = Math.max(1, Math.ceil(target / 22))
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target)
      setDisplayScore(cur)
      if (cur >= target) clearInterval(iv)
    }, 28)
    return () => clearInterval(iv)
  }, [result])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fxRef = useRef<RadioFxController | null>(null)
  const [fx, setFx] = useState<RadioFxSettings>({ mode: 'radio', speed: 'normal' })
  const fxValueRef = useRef(fx)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const isNativeRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nativeListenerRef = useRef<{ remove: () => void } | null>(null)

  // Detect voice support + load session/user
  useEffect(() => {
    const init = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          isNativeRef.current = true
          setVoiceAvailable(true)
          setVoiceMode(true)
          // Pre-request mic permission so first tap doesn't feel slow
          const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
          await SpeechRecognition.requestPermissions()
          return
        }
      } catch {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any
      const hasVoice = !!(w.SpeechRecognition ?? w.webkitSpeechRecognition)
      setVoiceAvailable(hasVoice)
      setVoiceMode(hasVoice)
    }
    init()
    setSession(getSession())
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user)
      if (d.entitlement?.pro) setPro(true)
      // Resolve a home-field scenario from the pilot's saved field + callsign
      if (isHomeId && d.user?.home) {
        const sc = homeScenario(id, d.user.home, d.user.callsign)
        if (sc) setScenario(sc)
      }
    }).catch(() => {})
  }, [id, isHomeId])

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
    if (nativeListenerRef.current) {
      try { nativeListenerRef.current.remove() } catch {}
      nativeListenerRef.current = null
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
  }, [])

  // Voice recognition
  const startListening = useCallback(async () => {
    stopRecognition()
    setInterimText('')
    setRadioState('listening')

    if (isNativeRef.current) {
      // ── Native iOS path via Capacitor plugin ──────────────────────────
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handle = await (SpeechRecognition as any).addListener(
          'partialResults',
          (data: { matches?: string[] }) => {
            if (data.matches?.[0]) setInterimText(data.matches[0])
          },
        )
        nativeListenerRef.current = handle
        recognitionRef.current = {
          stop: () => { SpeechRecognition.stop().catch(() => {}) },
        }
        await SpeechRecognition.start({ language: 'en-US', maxResults: 1, partialResults: true, popup: false })
      } catch {
        setInterimText('')
        setRadioState('ready')
      }
      return
    }

    // ── Web: high-accuracy path via ElevenLabs Scribe (record → transcribe) ──
    const canScribe = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
    if (canScribe) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mr = new MediaRecorder(stream)
        const chunks: BlobPart[] = []
        mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop())
          setInterimText('Transcribing…')
          try {
            const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' })
            const fd = new FormData()
            fd.append('audio', blob, 'readback.webm')
            const res = await fetch('/api/stt', { method: 'POST', body: fd })
            const data = await res.json()
            if (res.ok && data.text) { setReadback(data.text); setInterimText(''); setRadioState('transcribed') }
            else { setInterimText(''); setRadioState('ready') }
          } catch {
            setInterimText(''); setRadioState('ready')
          }
          recognitionRef.current = null
        }
        recognitionRef.current = { stop: () => { try { mr.stop() } catch {} } }
        mr.start()
        return
      } catch {
        // mic blocked / unavailable — fall through to Web Speech
      }
    }

    // ── Web Speech API fallback ──────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { setVoiceMode(false); setRadioState('ready'); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

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

  // Load saved comms-FX preference
  useEffect(() => { const v = getRadioFx(); fxValueRef.current = v; setFx(v) }, [])

  const updateFx = useCallback((patch: Partial<RadioFxSettings>) => {
    const next = { ...fxValueRef.current, ...patch }
    fxValueRef.current = next
    setFx(next)
    setRadioFx(next)
    fxRef.current?.setMode(next.mode)
  }, [])

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
        body: JSON.stringify({ text: personalizeText(scenario.atcTransmission, user?.callsign ?? null), speed: ttsSpeed(fx.speed) }),
      })
      if (!res.ok) { setRadioState('ready'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = audioRef.current
      if (!audio) { setRadioState('ready'); return }
      // Route the ATC voice through the radio FX graph (attach once per element)
      if (!fxRef.current) fxRef.current = attachRadioFx(audio, fx.mode)
      else fxRef.current.setMode(fx.mode)
      audio.src = url
      audio.onended = () => {
        fxRef.current?.release()
        setRadioState('ready')
        startTimer()
        // Auto-mic after ATC finishes
        if (voiceMode) setTimeout(() => startListening(), 700)
      }
      setRadioState('atc_playing')
      fxRef.current?.cue()
      await audio.play().catch(() => setRadioState('ready'))
    } catch {
      setRadioState('ready')
    }
  }, [scenario, voiceMode, fx, user, startTimer, startListening, stopRecognition])

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
      // server-enforced gate (daily cap, or a Pro-only advanced scenario) → paywall
      if (res.status === 402) {
        const body = await res.json().catch(() => ({}))
        setPaywallReason(body?.error === 'pro_scenario' ? 'pro' : 'daily')
        setShowPaywall(true)
        setRadioState('transcribed')
        return
      }
      const data = await res.json()
      setResult(data)
      setRadioState('done')
      if (!pro && !user) { incrementFreeUsed(); setSession(getSession()) }
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

  // Keyboard shortcuts — after all callbacks are declared
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.key === ' ') {
        e.preventDefault()
        if (radioState === 'idle' || radioState === 'ready' || radioState === 'done') playTransmission()
      }
      if (e.key === 'Enter' && radioState === 'transcribed' && readback.trim()) {
        e.preventDefault()
        submitReadback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [radioState, readback, playTransmission, submitReadback])

  if (!scenario) {
    if (isHomeId) return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        <p className="mb-3">Set up your home field to fly your own tower-pattern scenarios.</p>
        <a href="/profile" className="underline">Add your home field in your profile</a>
        <span className="mx-2 text-gray-300">·</span>
        <a href="/train" className="underline">Back to list</a>
      </div>
    )
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        Scenario not found. <a href="/train" className="underline">Back to list</a>
      </div>
    )
  }

  const scoreColor = !result ? '' : result.score >= 80 ? 'text-green-700' : result.score >= 60 ? 'text-yellow-700' : 'text-red-700'
  const scoreBg = !result ? '' : result.score >= 80 ? 'bg-green-50 border-green-200' : result.score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
  const freeRemaining = (pro || user) ? null : session.remaining
  const callsign = user?.callsign ?? null
  const callsignDisplay = user?.callsign ? toPhonetic(user.callsign) : null
  const timerColor = timer === null ? '' : timer <= 3 ? 'text-red-600' : timer <= 7 ? 'text-yellow-600' : 'text-gray-400'
  const isAtcActive = radioState === 'atc_loading' || radioState === 'atc_playing'

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} />
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} freeUsed={session.freeUsed} freeLimit={session.freeLimit} isLoggedIn={!!user} reason={paywallReason} />}

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
              {timerEnabled ? 'timer on' : 'timer off'}
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

        {/* Radio Stack Panel */}
        <div className={`rounded-xl mb-4 overflow-hidden transition-all border ${isAtcActive ? 'border-amber-500/60 shadow-lg shadow-amber-900/20' : 'border-gray-800'}`} style={{ background: '#111214' }}>
          {/* Avionics header row */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-800">
            <div className="flex items-center gap-3">
              {/* Facility badge */}
              <span className={`font-mono text-xs px-2 py-0.5 rounded tracking-widest font-bold border ${
                scenario.facility === 'GROUND'    ? 'text-amber-400 border-amber-700 bg-amber-950/60' :
                scenario.facility === 'TOWER'     ? 'text-green-400 border-green-700 bg-green-950/60' :
                scenario.facility === 'APPROACH'  ? 'text-sky-400 border-sky-700 bg-sky-950/60' :
                scenario.facility === 'DEPARTURE' ? 'text-violet-400 border-violet-700 bg-violet-950/60' :
                scenario.facility === 'CENTER'    ? 'text-blue-400 border-blue-700 bg-blue-950/60' :
                scenario.facility === 'CLEARANCE' ? 'text-orange-400 border-orange-700 bg-orange-950/60' :
                scenario.facility === 'CTAF'      ? 'text-cyan-400 border-cyan-700 bg-cyan-950/60' :
                'text-gray-400 border-gray-700 bg-gray-900'
              }`}>
                {scenario.facility ?? 'ATC'}
              </span>
              {/* LCD Frequency */}
              {scenario.frequency && (
                <span className="font-mono text-lg tracking-wider leading-none" style={{ color: '#f5a623', textShadow: '0 0 8px rgba(245,166,35,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                  {scenario.frequency}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Signal bars */}
              <div className="flex items-end gap-0.5 h-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-1 rounded-sm transition-colors ${isAtcActive ? 'bg-green-400' : i <= 2 ? 'bg-gray-600' : 'bg-gray-800'}`}
                    style={{ height: `${i * 25}%` }} />
                ))}
              </div>
              {/* Status pill */}
              <span className={`font-mono text-xs tracking-widest font-bold ${isAtcActive ? 'text-green-400' : 'text-gray-600'}`}>
                {radioState === 'atc_loading' ? '···' : radioState === 'atc_playing' ? 'RX' : 'STBY'}
              </span>
            </div>
          </div>

          {/* Transmission area */}
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${isAtcActive ? 'bg-green-400 animate-pulse' : 'bg-gray-700'}`} />
                <p className={`text-green-400 font-mono text-sm leading-relaxed ${listenMode ? 'blur-md select-none' : ''}`}>
                  &ldquo;{personalizeText(scenario.atcTransmission, callsign)}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              {timer !== null && <span className={`font-mono text-sm font-bold tabular-nums ${timerColor}`}>{timer}s</span>}
              {!isAtcActive && timer === null && (
                <span className="text-xs text-gray-700 font-mono">SPACE to replay</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setListenMode(v => !v)} className="text-xs text-gray-600 hover:text-gray-400 font-mono transition-colors">
                {listenMode ? 'show' : 'hide'}
              </button>
              <button onClick={playTransmission} disabled={isAtcActive} className="text-xs text-amber-600 hover:text-amber-400 font-mono disabled:opacity-30 transition-colors tracking-wider">
                ▶ REPLAY
              </button>
            </div>
          </div>
        </div>

        {/* Comms realism — radio filter + controller pace (saved per device) */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 mb-4 text-xs font-mono">
          <span className="text-gray-400 tracking-wider">COMMS</span>
          {(['clean', 'radio', 'busy'] as RadioMode[]).map((m) => (
            <button
              key={m}
              onClick={() => updateFx({ mode: m })}
              className={`px-2 py-0.5 rounded border transition-colors capitalize ${fx.mode === m ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              {m}
            </button>
          ))}
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-gray-400 tracking-wider">PACE</span>
          {(['normal', 'fast', 'real'] as RadioSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => updateFx({ speed: s })}
              className={`px-2 py-0.5 rounded border transition-colors capitalize ${fx.speed === s ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              {s === 'real' ? 'real-time' : s}
            </button>
          ))}
        </div>

        {/* Airport diagram — schematic taxi chart; reveals the cleared route after grading */}
        {scenario.diagram && (
          <div className="mb-4">
            <AirportDiagram diagram={scenario.diagram} revealed={!!result} />
          </div>
        )}

        {/* Real-geometry field diagram (home field — drawn from real runway coords) */}
        {scenario.realField && (
          <div className="mb-4">
            <RealFieldDiagram field={scenario.realField} />
          </div>
        )}

        {/* Hint */}
        {radioState !== 'done' && !hintShown && (
          <button onClick={() => setHintShown(true)} className="text-xs text-gray-400 hover:text-gray-600 mb-4 border border-dashed border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Required elements (−10 pts)
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
                if (radioState === 'listening') {
                  if (isNativeRef.current && interimText) {
                    // Native: tap-to-stop takes current interim as final
                    const finalText = interimText
                    stopRecognition()
                    setReadback(finalText)
                    setInterimText('')
                    setRadioState('transcribed')
                  } else {
                    // web (Scribe record→transcribe, or Web Speech): stopping lets
                    // the recorder's onstop/onend drive transcription + next state
                    stopRecognition()
                  }
                } else {
                  startListening()
                }
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
                  <div className={`text-4xl font-bold tabular-nums ${scoreColor}`}>{displayScore}</div>
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
                <p className="text-sm font-mono text-green-800 bg-green-50 rounded px-3 py-2">&ldquo;{personalizeText(result.correctReadback, callsign)}&rdquo;</p>
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
            {isListening ? '■' : isGrading ? '…' : 'REC'}
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
              Use voice
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
