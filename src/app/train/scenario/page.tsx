'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { scenarios, getScenario } from '@/lib/scenarios'
import { getSession, incrementFreeUsed, FREE_DAILY_LIMIT } from '@/lib/session'
import { toPhonetic } from '@/lib/phonetic'
import PaywallModal from '@/components/PaywallModal'
import AirportDiagram from '@/components/AirportDiagram'
import RealFieldDiagram from '@/components/RealFieldDiagram'
import type { GradeResult, Scenario } from '@/lib/types'
import { attachRadioFx, getRadioFx, setRadioFx, ttsSpeed, type RadioFxController, type RadioFxSettings, type RadioMode, type RadioSpeed } from '@/lib/radio-fx'
import { personalizeText } from '@/lib/personalize'
import { voiceForKey } from '@/lib/voices'
import { explainElement } from '@/lib/explain'
import { safetyTieInFor } from '@/lib/safety-tiein'
import { gradeHaptic, startNativeRecording, stopNativeRecordingTranscribe } from '@/lib/native'
import { saveRecording, loadRecording } from '@/lib/recordings'
import { homeScenario, type HomeProfile } from '@/lib/home-client'
import { generateScenario } from '@/lib/procedural'

const DIFF_LABELS: Record<number, string> = { 1: 'Student', 2: 'Intermediate', 3: 'Advanced' }

// Radio state machine
type RadioState = 'idle' | 'atc_loading' | 'atc_playing' | 'ready' | 'listening' | 'transcribed' | 'grading' | 'done'

interface UserProfile { id: number; email: string; callsign: string | null; home?: HomeProfile | null }

export default function ScenarioPage() {
  return (
    <Suspense fallback={null}>
      <ScenarioPageInner />
    </Suspense>
  )
}

function ScenarioPageInner() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  // Static library scenario, a procedural one (gen-<seed>, deterministic), or a
  // per-user "home field" / custom scenario resolved after fetch.
  const [scenario, setScenario] = useState<Scenario | undefined>(() => {
    if (id.startsWith('gen-')) { const n = parseInt(id.slice(4)); return Number.isFinite(n) ? generateScenario(n) : undefined }
    return getScenario(id)
  })
  const isHomeId = id.startsWith('home-')
  const isCustomId = id.startsWith('custom-')
  const isCommunityId = id.startsWith('community-')
  const isWxId = id.startsWith('wx-')
  const [wxError, setWxError] = useState<'no_home' | 'no_metar' | null>(null)

  // Core state machine
  const [radioState, setRadioState] = useState<RadioState>('idle')
  const [readback, setReadback] = useState('')
  const [interimText, setInterimText] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [voiceAvailable, setVoiceAvailable] = useState(false)
  const [voiceMode, setVoiceMode] = useState(true)
  const [listenMode, setListenMode] = useState(false)
  const [usingFallbackVoice, setUsingFallbackVoice] = useState(false)
  const [usingFallbackStt, setUsingFallbackStt] = useState(false)
  // Consecutive passes this sitting -- in-memory only (resets on reload), distinct
  // from the DB-backed daily practice streak on /leaderboard. Immediate, in-session
  // feedback rather than a cross-day habit signal.
  const [momentum, setMomentum] = useState(0)

  // Extras
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallReason, setPaywallReason] = useState<'daily' | 'pro'>('daily')
  const [session, setSession] = useState({
    freeUsed: 0, freeLimit: FREE_DAILY_LIMIT, isPaid: false, canGrade: true, remaining: FREE_DAILY_LIMIT,
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [pro, setPro] = useState(false)
  const [hintShown, setHintShown] = useState(false)
  const [exchange, setExchange] = useState<'initial' | 'curveball'>('initial')
  const [showWhy, setShowWhy] = useState(false)
  const exchangeRef = useRef<'initial' | 'curveball'>('initial')
  const [duelTarget, setDuelTarget] = useState<{ name: string; score: number } | null>(null)
  const duelIdRef = useRef<string | null>(null)
  const duelRecordedRef = useRef(false)
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null)
  const [challengeCopied, setChallengeCopied] = useState(false)
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
  // Item 3: hear your own readback played back through the radio FX.
  const replayAudioRef = useRef<HTMLAudioElement | null>(null)
  const replayFxRef = useRef<RadioFxController | null>(null)
  const replayUrlRef = useRef<string | null>(null)
  const [replayUrl, setReplayUrl] = useState<string | null>(null)
  const [replaying, setReplaying] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Timing-pressure measurement: T0 = ATC keyed off, T1 = student keyed up.
  // Only meaningful when timerEnabled was on at the moment ATC finished.
  const atcEndedAtRef = useRef<number | null>(null)
  const keyUpAtRef = useRef<number | null>(null)
  const pressureFiredRef = useRef(false)
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
      // Resolve a CFI custom scenario (owned or assigned)
      if (isCustomId && d.user) {
        fetch(`/api/custom/${id}`).then((r) => r.json()).then((c) => { if (c.scenario) setScenario(c.scenario) }).catch(() => {})
      }
      // Resolve a live-weather scenario -- server-side, never regenerated
      // client-side, so grading matches exactly what was heard.
      if (isWxId && d.user) {
        fetch(`/api/wx-scenario/${id}`).then((r) => r.json()).then((w) => {
          if (w.scenario) setScenario(w.scenario)
          else setWxError(w.error === 'no_real_home_field' ? 'no_home' : 'no_metar')
        }).catch(() => setWxError('no_metar'))
      }
    }).catch(() => {})
    // Resolve a community scenario (public — no auth needed)
    if (isCommunityId) {
      fetch(`/api/community/${id.replace(/^community-/, '')}`).then((r) => r.json()).then((c) => { if (c.scenario) setScenario(c.scenario) }).catch(() => {})
    }
  }, [id, isHomeId, isCustomId, isCommunityId, isWxId])

  // Always start a scenario on its initial exchange (the page persists across nav).
  useEffect(() => { exchangeRef.current = 'initial'; setExchange('initial') }, [id])

  // Duel mode: a ?duel=ID challenge to beat. (Read from URL to avoid a Suspense boundary.)
  useEffect(() => {
    const did = new URLSearchParams(window.location.search).get('duel')
    duelIdRef.current = did
    duelRecordedRef.current = false
    setDuelTarget(null)
    setChallengeUrl(null)
    if (did) {
      fetch(`/api/duel/${did}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
        if (d?.scenario_id) setDuelTarget({ name: d.creator_name, score: d.creator_score })
      }).catch(() => {})
    }
  }, [id])

  // Record the duel attempt once a graded result lands.
  useEffect(() => {
    if (radioState === 'done' && result && duelIdRef.current && duelTarget && !duelRecordedRef.current) {
      duelRecordedRef.current = true
      fetch(`/api/duel/${duelIdRef.current}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beat: result.score > duelTarget.score }),
      }).catch(() => {})
    }
  }, [radioState, result, duelTarget])

  async function createChallenge() {
    if (!scenario || !result) return
    try {
      const res = await fetch('/api/duel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, name: user?.callsign || 'A pilot', score: result.score }),
      })
      const d = await res.json()
      if (d.id) setChallengeUrl(`${window.location.origin}/duel?id=${d.id}`)
    } catch { /* ignore */ }
  }

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
    keyUpAtRef.current = null
    pressureFiredRef.current = false
    // Only stamp T0 if timing-pressure mode was ON at the moment ATC
    // finished — a mid-scenario toggle shouldn't produce a surprise
    // deduction on submit for an exchange that wasn't timed.
    atcEndedAtRef.current = timerEnabled ? Date.now() : null
    if (!timerEnabled) return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer(15)
    timerRef.current = setInterval(() => {
      if (!pressureFiredRef.current && keyUpAtRef.current === null && atcEndedAtRef.current !== null
          && Date.now() - atcEndedAtRef.current >= 3000) {
        pressureFiredRef.current = true
        fxRef.current?.pressureCue()
      }
      setTimer(t => {
        if (t === null || t <= 1) { clearInterval(timerRef.current!); return 0 }
        return t - 1
      })
    }, 1000)
  }, [timerEnabled])
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // ── Item 3: record-yourself playback through the radio FX ──────────────
  const captureRecording = useCallback((blob: Blob) => {
    const sid = scenario?.id
    if (!sid) return
    try {
      if (replayUrlRef.current) URL.revokeObjectURL(replayUrlRef.current)
      const url = URL.createObjectURL(blob)
      replayUrlRef.current = url
      setReplayUrl(url)
      saveRecording(sid, blob).catch(() => {})
    } catch { /* storage / object-URL unavailable */ }
  }, [scenario?.id])

  const stopReplay = useCallback(() => {
    try { replayAudioRef.current?.pause() } catch {}
    replayFxRef.current?.release()
    setReplaying(false)
  }, [])

  const toggleReplay = useCallback(async () => {
    const url = replayUrlRef.current
    if (!url) return
    if (replaying) { stopReplay(); return }
    try {
      let el = replayAudioRef.current
      if (!el) { el = new Audio(); replayAudioRef.current = el }
      el.src = url
      if (!replayFxRef.current) replayFxRef.current = attachRadioFx(el, fxValueRef.current.mode)
      else replayFxRef.current.setMode(fxValueRef.current.mode)
      el.onended = () => { replayFxRef.current?.release(); setReplaying(false) }
      replayFxRef.current?.cue()
      setReplaying(true)
      await el.play()
    } catch { stopReplay() }
  }, [replaying, stopReplay])

  // Load any saved recording when the scenario changes; clear the old one.
  // Guard against a slow IndexedDB read resolving after the scenario already
  // changed (which would replay the wrong scenario's audio + leak a URL).
  useEffect(() => {
    const sid = scenario?.id
    if (!sid) return
    let cancelled = false
    stopReplay()
    if (replayUrlRef.current) { URL.revokeObjectURL(replayUrlRef.current); replayUrlRef.current = null }
    setReplayUrl(null)
    loadRecording(sid).then((b) => {
      if (cancelled || !b || scenario?.id !== sid) return
      const url = URL.createObjectURL(b)
      replayUrlRef.current = url
      setReplayUrl(url)
    }).catch(() => {})
    return () => {
      cancelled = true
      stopReplay()
      if (replayUrlRef.current) { URL.revokeObjectURL(replayUrlRef.current); replayUrlRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id])

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
  // Browser-native live recognition — used both as the last-resort path (no
  // mic/MediaRecorder support) and as a fallback when Scribe transcription
  // fails (quota/outage). Can't replay an already-recorded blob through it —
  // it only listens live — so a Scribe failure means asking for a fresh
  // utterance, same tradeoff as the TTS fallback needing a fresh utterance
  // to speak. Returns whether it actually started.
  const startWebSpeechFallback = useCallback((): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { setVoiceMode(false); setRadioState('ready'); return false }

    setUsingFallbackStt(true)
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
    return true
  }, [])

  const startListening = useCallback(async () => {
    // Only the FIRST key-up per exchange counts — re-records/STT-fallback
    // retries shouldn't reset (or let a slow start be gamed away by) the clock.
    if (keyUpAtRef.current === null) keyUpAtRef.current = Date.now()
    stopRecognition()
    setInterimText('')
    setUsingFallbackStt(false)
    setRadioState('listening')

    if (isNativeRef.current) {
      // ── Native iOS: record with the mic, transcribe via Scribe (best accuracy) ──
      const started = await startNativeRecording()
      if (!started) { setInterimText(''); setRadioState('ready'); return }
      recognitionRef.current = {
        stop: () => {
          setInterimText('Transcribing…')
          stopNativeRecordingTranscribe().then(({ text, blob }) => {
            setInterimText('')
            if (blob) captureRecording(blob)
            if (text) { setReadback(text); setRadioState('transcribed') }
            else setRadioState('ready')
          })
        },
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
          let usedFallback = false
          try {
            const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' })
            captureRecording(blob)
            const fd = new FormData()
            fd.append('audio', blob, 'readback.webm')
            const res = await fetch('/api/stt', { method: 'POST', body: fd })
            const data = await res.json()
            if (res.ok && data.text) { setReadback(data.text); setInterimText(''); setRadioState('transcribed') }
            else {
              // Scribe failed (quota/outage) — ask for the readback again via
              // the browser's own recognition instead of silently discarding it.
              setInterimText('')
              usedFallback = startWebSpeechFallback()
              if (!usedFallback) setRadioState('ready')
            }
          } catch {
            setInterimText('')
            usedFallback = startWebSpeechFallback()
            if (!usedFallback) setRadioState('ready')
          }
          if (!usedFallback) recognitionRef.current = null
        }
        recognitionRef.current = { stop: () => { try { mr.stop() } catch {} } }
        mr.start()
        return
      } catch {
        // mic blocked / unavailable — fall through to Web Speech
      }
    }

    // ── Web Speech API fallback (also the last-resort path above) ────────
    startWebSpeechFallback()
  }, [stopRecognition, startWebSpeechFallback])

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
    // A steppedOn scenario's garble only applies to its initial (blocked)
    // exchange — the curveball leg (if any) is ATC's clean repeat, so it's
    // fine to fall back to browser TTS there like any other scenario.
    const isSteppedOnLeg = exchangeRef.current === 'initial' && !!scenario.steppedOn
    // ElevenLabs is down or out of quota → speak with the browser's built-in
    // voice instead of silently doing nothing. No radio FX (plain utterance),
    // but the readback loop (timer + auto-mic) still runs normally.
    const speakFallback = (text: string): boolean => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return false
      setUsingFallbackVoice(true)
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.0
      u.onend = () => {
        setRadioState('ready')
        startTimer()
        if (voiceMode && !timerEnabled) setTimeout(() => startListening(), 700)
      }
      u.onerror = () => setRadioState('ready')
      setRadioState('atc_playing')
      window.speechSynthesis.speak(u)
      return true
    }
    try {
      const tx = exchangeRef.current === 'curveball' && scenario.curveball ? scenario.curveball.atcTransmission : scenario.atcTransmission
      const text = personalizeText(tx, user?.callsign ?? null)
      setUsingFallbackVoice(false)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speed: ttsSpeed(fx.speed), voice: voiceForKey(scenario.id) }),
      })
      if (!res.ok) { if (isSteppedOnLeg || !speakFallback(text)) setRadioState('ready'); return }
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
        if (voiceMode && !timerEnabled) setTimeout(() => startListening(), 700)
      }
      setRadioState('atc_playing')
      fxRef.current?.cue(isSteppedOnLeg)
      await audio.play().catch(() => setRadioState('ready'))
    } catch {
      const tx = exchangeRef.current === 'curveball' && scenario.curveball ? scenario.curveball.atcTransmission : scenario.atcTransmission
      if (isSteppedOnLeg || !speakFallback(personalizeText(tx, user?.callsign ?? null))) setRadioState('ready')
    }
  }, [scenario, voiceMode, fx, user, startTimer, startListening, stopRecognition])

  // Curveball: after a passing initial readback, ATC throws an amendment.
  const startCurveball = useCallback(() => {
    exchangeRef.current = 'curveball'
    setExchange('curveball')
    setResult(null); setReadback(''); setInterimText(''); setHintShown(false)
    autoPlayedRef.current = true
    setRadioState('idle')
    setTimeout(() => playTransmission(), 50)
  }, [playTransmission])

  // Auto-play on mount
  useEffect(() => {
    if (!autoPlayedRef.current && scenario) {
      autoPlayedRef.current = true
      playTransmission()
    }
  }, [scenario, playTransmission])

  // Text-mode has no auto-mic-open to suppress — the first keystroke IS the
  // key-up moment. Same first-write-wins guard as startListening's T1 stamp.
  const handleReadbackChange = useCallback((v: string) => {
    if (keyUpAtRef.current === null && v.length > 0) keyUpAtRef.current = Date.now()
    setReadback(v)
  }, [])

  // Submit
  const submitReadback = useCallback(async (text?: string) => {
    const rb = text ?? readback
    if (!scenario || !rb.trim() || radioState === 'grading') return

    const current = getSession()
    if (!current.canGrade && !user) { setShowPaywall(true); return }
    if (timerRef.current) { clearInterval(timerRef.current); setTimer(null) }

    setRadioState('grading')
    try {
      const paceMs = (atcEndedAtRef.current != null && keyUpAtRef.current != null)
        ? Math.max(0, keyUpAtRef.current - atcEndedAtRef.current)
        : null
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, readback: rb, hintUsed: hintShown, part: exchangeRef.current === 'curveball' ? 'curveball' : undefined, paceMs }),
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
      gradeHaptic(data.passFail === 'PASS')
      setMomentum((m) => (data.passFail === 'PASS' ? m + 1 : 0))
      if (!pro && !user) { incrementFreeUsed(); setSession(getSession()) }
    } catch {
      setRadioState('transcribed')
    }
  }, [scenario, readback, radioState, hintShown, user])

  const nextScenario = useCallback(() => {
    setReadback(''); setResult(null); setHintShown(false); setInterimText('')
    exchangeRef.current = 'initial'; setExchange('initial')
    autoPlayedRef.current = false
    setRadioState('idle')
    if (id.startsWith('gen-')) {
      // endless practice — keep generating fresh scenarios
      router.push(`/train/scenario?id=gen-${Math.floor(Math.random() * 1_000_000_000)}`)
      return
    }
    const idx = scenarios.findIndex(s => s.id === id)
    if (idx === -1) {
      // Not in the static library (home-*/custom-*/community-*/wx-*) -- there's
      // no sensible "next" in that array, so don't silently land on scenarios[0].
      router.push('/train')
      return
    }
    const next = scenarios[(idx + 1) % scenarios.length]
    router.push(`/train/scenario?id=${next.id}`)
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
    if (isWxId) return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        <p className="mb-3">
          {wxError === 'no_home'
            ? <>Live weather needs a real, listed home airport.</>
            : <>No live weather is being reported for your home field right now (it may not have an ASOS/AWOS station).</>}
        </p>
        {wxError === 'no_home' && <a href="/profile" className="underline">Set one in your profile</a>}
        <span className="mx-2 text-gray-300">·</span>
        <a href="/train" className="underline">Back to your home-field scenarios</a>
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
  const safetyTieIn = result ? safetyTieInFor(result) : null
  const freeRemaining = (pro || user) ? null : session.remaining
  const callsign = user?.callsign ?? null
  const callsignDisplay = user?.callsign ? toPhonetic(user.callsign) : null
  const timerColor = timer === null ? '' : timer <= 3 ? 'text-red-600' : timer <= 7 ? 'text-yellow-600' : 'text-gray-400'
  const isAtcActive = radioState === 'atc_loading' || radioState === 'atc_playing'

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} />
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} freeUsed={session.freeUsed} freeLimit={session.freeLimit} isLoggedIn={!!user} userId={user?.id} reason={paywallReason} />}

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
              title="Adds a soft pace penalty for slow readbacks and requires you to key up the mic yourself — mimics a congested frequency."
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

        {exchange === 'curveball' && scenario.curveball ? (
          <div className="mb-6">
            <span className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white tracking-widest mb-2 ${scenario.steppedOn ? 'bg-cyan-600' : 'bg-amber-500'}`}>
              {scenario.steppedOn ? 'REPEAT' : 'AMENDMENT'}
            </span>
            <p className="text-gray-600 leading-relaxed">
              {scenario.curveball.setup ?? (scenario.steppedOn ? 'ATC repeats the instruction — read it back.' : 'ATC has an amended instruction — read it back.')}
            </p>
          </div>
        ) : (
          <p className="text-gray-600 mb-6 leading-relaxed">{scenario.setup}</p>
        )}

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
              {usingFallbackVoice && (
                <span className="text-xs text-amber-600 font-mono" title="Primary ATC voice is unavailable right now — using your device's built-in voice instead.">
                  backup voice
                </span>
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
            {(exchange === 'curveball' && scenario.curveball ? scenario.curveball.requiredElements : scenario.requiredElements).map(el => (
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
              usingFallbackStt={usingFallbackStt}
              timerEnabled={timerEnabled}
              onMicClick={() => {
                // Stopping (native record→Scribe, web Scribe, or Web Speech) lets the
                // recorder's stop handler drive transcription + the next state.
                if (radioState === 'listening') stopRecognition()
                else startListening()
              }}
              onSubmit={() => submitReadback()}
              onRerecord={() => { setReadback(''); setInterimText(''); startListening() }}
              onSwitchToText={() => { stopRecognition(); setVoiceMode(false); setRadioState(r => r === 'listening' ? 'ready' : r) }}
            />
          ) : (
            <TextInput
              readback={readback}
              onChange={handleReadbackChange}
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
                    {momentum >= 2 && (
                      <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                        {momentum} in a row
                      </span>
                    )}
                    {result.paceNote && (
                      <span title={result.paceNote} className="ml-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        slow to key up
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600 max-w-xs leading-relaxed">{result.feedback}</div>
              </div>
              <button onClick={playTransmission} className="text-xs text-gray-500 hover:text-gray-700 font-mono border border-gray-200 px-2 py-1 rounded">
                ▶ replay ATC
              </button>
            </div>

            {result.cfiTip && (
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">What a CFI would say</div>
                <p className="text-sm text-slate-700 leading-relaxed">{result.cfiTip}</p>
              </div>
            )}

            {safetyTieIn && (
              <p className="text-xs text-gray-500 leading-relaxed px-1">
                <span className="font-semibold text-gray-600">Why this matters — </span>
                {safetyTieIn}
              </p>
            )}

            <div className="border border-gray-200 rounded-xl p-5 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">You said</div>
                <p className="text-sm font-mono text-gray-700 bg-gray-50 rounded px-3 py-2">&ldquo;{readback}&rdquo;</p>
                {replayUrl && (
                  <button onClick={toggleReplay} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    {replaying ? '■ stop' : '▶ hear your readback (through the radio)'}
                  </button>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Standard readback</div>
                <p className="text-sm font-mono text-green-800 bg-green-50 rounded px-3 py-2">&ldquo;{personalizeText(result.correctReadback, callsign)}&rdquo;</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Required elements</div>
                <button onClick={() => setShowWhy((v) => !v)} className="text-xs text-blue-600 hover:underline">
                  {showWhy ? 'Hide why' : 'Why each part matters'}
                </button>
              </div>
              <div className="space-y-1.5">
                {result.elements.required.map(el => {
                  const hit = result.elements.hit.includes(el)
                  return (
                    <div key={el}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`shrink-0 ${hit ? 'text-green-600' : 'text-red-500'}`}>{hit ? '✓' : '✗'}</span>
                        <span className={hit ? 'text-gray-700' : 'text-red-700 font-medium'}>{el}</span>
                      </div>
                      {showWhy && (
                        <p className="text-xs text-gray-500 leading-relaxed ml-6 mt-0.5 mb-1.5">{explainElement(el)}</p>
                      )}
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

            {result.deliveryNotes?.fillerCount ? (
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-2">Delivery</div>
                <p className="text-sm text-blue-800">
                  {result.deliveryNotes.fillerCount} filler word{result.deliveryNotes.fillerCount > 1 ? 's' : ''}
                  {result.deliveryNotes.fillerWords?.length ? ` (${result.deliveryNotes.fillerWords.join(', ')})` : ''}.
                </p>
                {result.deliveryNotes.hesitationNote && (
                  <p className="text-sm text-blue-800 mt-1">{result.deliveryNotes.hesitationNote}</p>
                )}
              </div>
            ) : null}

            {duelTarget && (
              <div className={`rounded-xl p-4 border text-center ${result.score > duelTarget.score ? 'border-green-300 bg-green-50' : result.score === duelTarget.score ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
                <div className="font-mono text-[10px] font-bold tracking-widest text-amber-600 mb-1">RADIO DUEL</div>
                <div className="text-sm text-gray-700">You {result.score}% vs {duelTarget.name} {duelTarget.score}%</div>
                <div className={`text-lg font-bold ${result.score > duelTarget.score ? 'text-green-700' : result.score === duelTarget.score ? 'text-amber-700' : 'text-red-700'}`}>
                  {result.score > duelTarget.score ? 'You win!' : result.score === duelTarget.score ? 'Dead heat' : 'They beat you'}
                </div>
              </div>
            )}

            {!duelTarget && getScenario(id) && (
              challengeUrl ? (
                <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-2">
                  <input readOnly value={challengeUrl} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50" />
                  <button onClick={() => { navigator.clipboard?.writeText(challengeUrl); setChallengeCopied(true); setTimeout(() => setChallengeCopied(false), 1500) }} className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-800">{challengeCopied ? 'Copied' : 'Copy'}</button>
                </div>
              ) : (
                <button onClick={createChallenge} className="w-full border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400">
                  Challenge a friend to beat {result.score}% →
                </button>
              )
            )}

            {scenario?.curveball && exchange === 'initial' && result.passFail !== 'FAIL' ? (
              <div className="flex gap-3 pt-2">
                <button onClick={startCurveball} className={`flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-bold ${scenario.steppedOn ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                  {scenario.steppedOn ? 'Ready to hear it again →' : 'Amendment incoming →'}
                </button>
                <button onClick={nextScenario} className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-400">
                  Skip
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400">
                  Try again
                </button>
                <button onClick={nextScenario} className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800">
                  Next scenario →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ── Voice Input Component ──────────────────────────────────────────────────────

function VoiceInput({
  radioState, interimText, readback, usingFallbackStt, timerEnabled,
  onMicClick, onSubmit, onRerecord, onSwitchToText,
}: {
  radioState: RadioState
  interimText: string
  readback: string
  usingFallbackStt: boolean
  timerEnabled?: boolean
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
          {isReady && !isGrading && (timerEnabled ? "Tap mic to transmit — you're on the clock" : 'Tap mic to transmit')}
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

        {usingFallbackStt && (isListening || isGrading) && (
          <p className="text-xs text-amber-600 font-mono text-center -mt-2 mb-2" title="High-accuracy transcription is unavailable right now — using your browser's built-in speech recognition instead.">
            backup transcription
          </p>
        )}

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
