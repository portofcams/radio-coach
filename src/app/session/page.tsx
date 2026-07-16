'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { getSessionOrDrill as getFlightSession } from '@/lib/flight-sessions'
import { getScenario } from '@/lib/scenarios'
import { getOralQuestion } from '@/lib/oral'
import type { GradeResult } from '@/lib/types'
import { safetyTieInFor } from '@/lib/safety-tiein'
import { CheckIcon } from '@/components/icons'
import { attachRadioFx, getRadioFx, ttsSpeed, type RadioFxController } from '@/lib/radio-fx'
import { personalizeText } from '@/lib/personalize'
import { voiceForKey } from '@/lib/voices'

export default function FlightSessionPage() {
  return (
    <Suspense fallback={null}>
      <FlightSessionPageInner />
    </Suspense>
  )
}

function FlightSessionPageInner() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  const isDrill = id.startsWith('drill-')
  // Three-state: undefined = still loading (only the async drill-auto path
  // ever goes through this), null = resolved, not found, FlightSession =
  // resolved, found. getFlightSession's own `undefined` return ("not found")
  // is normalized to `null` here so it's never confused with "still loading".
  const [session, setSession] = useState<ReturnType<typeof getFlightSession> | null | undefined>(
    () => (id === 'drill-auto' ? undefined : (getFlightSession(id) ?? null))
  )

  useEffect(() => {
    let cancelled = false
    if (id === 'drill-auto') {
      setSession(undefined)
      fetch('/api/bootcamp')
        .then((r) => r.json())
        .then((d: { blocks?: Array<{ scenarios: Array<{ id: string }> }> }) => {
          if (cancelled) return
          const ids = Array.from(new Set(
            (d.blocks ?? []).flatMap((b) => b.scenarios.slice(0, 2).map((s) => s.id))
          ))
          setSession(ids.length > 0 ? {
            id: 'drill-auto',
            title: 'Weak-spot focus session',
            description: 'Your weakest categories, back to back.',
            airport: '',
            difficulty: 'intermediate',
            scenarioIds: ids,
          } : null)
        })
        .catch(() => { if (!cancelled) setSession(null) })
    } else {
      setSession(getFlightSession(id) ?? null)
    }
    return () => { cancelled = true }
  }, [id])

  // Two-phase state machine: an optional oral-quiz preamble (self-rated Q&A,
  // same bank as /oral), then the existing radio-leg machine takes over
  // unchanged. Sessions with no oralQuestionIds skip straight to 'radio'.
  const [phase, setPhase] = useState<'oral' | 'radio'>(() => (session?.oralQuestionIds?.length ? 'oral' : 'radio'))
  const [oralStep, setOralStep] = useState(0)
  const [oralRevealed, setOralRevealed] = useState(false)
  const [oralResults, setOralResults] = useState<Array<{ questionId: string; rating: 'got' | 'review' }>>([])
  const [oralTtsLoading, setOralTtsLoading] = useState(false)
  const [usingFallbackVoice, setUsingFallbackVoice] = useState(false)

  const [step, setStep] = useState(0)
  const [readback, setReadback] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ scenarioId: string; score: number; passed: boolean; missed: string[] }>>([])
  const [ttsLoading, setTtsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [pro, setPro] = useState(false)
  const [entLoaded, setEntLoaded] = useState(false)
  const [callsign, setCallsign] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { setPro(!!d.entitlement?.pro); setCallsign(d.user?.callsign ?? null) })
      .catch(() => {})
      .finally(() => setEntLoaded(true))
  }, [])

  // Resume progress across an accidental refresh. Combined oral+radio sessions
  // roughly double the total steps versus the existing radio-only sessions, so
  // losing progress to a reload costs more here -- worth the small persistence
  // this file otherwise has none of. One restore attempt per distinct session id.
  const restoredForIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!session || restoredForIdRef.current === session.id) return
    restoredForIdRef.current = session.id
    try {
      const raw = sessionStorage.getItem(`wilco_session_${session.id}`)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (typeof saved.phase === 'string') setPhase(saved.phase)
      if (typeof saved.oralStep === 'number') setOralStep(saved.oralStep)
      if (Array.isArray(saved.oralResults)) setOralResults(saved.oralResults)
      if (typeof saved.step === 'number') setStep(saved.step)
      if (Array.isArray(saved.results)) setResults(saved.results)
    } catch { /* malformed or unavailable storage -- ignore, start fresh */ }
  }, [session])

  useEffect(() => {
    if (!session || done) return
    try {
      sessionStorage.setItem(`wilco_session_${session.id}`, JSON.stringify({ phase, oralStep, oralResults, step, results }))
    } catch { /* ignore */ }
  }, [session, phase, oralStep, oralResults, step, results, done])

  useEffect(() => {
    if (!session || !done) return
    try { sessionStorage.removeItem(`wilco_session_${session.id}`) } catch { /* ignore */ }
  }, [session, done])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fxRef = useRef<RadioFxController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)

  const scenario = session ? getScenario(session.scenarioIds[step]) : null
  const totalSteps = session?.scenarioIds.length ?? 0
  const oralCount = session?.oralQuestionIds?.length ?? 0
  const totalUnits = oralCount + totalSteps
  const unitsDone = phase === 'oral' ? oralStep : oralCount + step + (result ? 1 : 0)
  const progress = totalUnits > 0 ? (unitsDone / totalUnits) * 100 : 0
  const oralQuestion = session?.oralQuestionIds?.length ? getOralQuestion(session.oralQuestionIds[oralStep]) : null

  // ElevenLabs down/out of quota -> speak with the browser's built-in voice
  // instead of silently going dead-air. No radio FX (plain utterance), but at
  // least the pilot hears SOMETHING. Unlike train/scenario/page.tsx's version,
  // nothing here needs to run once speech ends (no auto-listen/timer chain in
  // this simpler text-only player), so this is a one-shot fire-and-forget.
  const speakFallback = useCallback((text: string): boolean => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false
    setUsingFallbackVoice(true)
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.0
    window.speechSynthesis.speak(u)
    return true
  }, [])

  const hearOral = useCallback(async () => {
    if (!oralQuestion || !session) return
    setOralTtsLoading(true)
    try {
      setUsingFallbackVoice(false)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Voice pinned to the SESSION (not per-question) so the examiner sounds
        // like one consistent person across all oral questions -- distinct from
        // the (also constant, but separately-keyed) controller voice used for
        // the radio legs, matching how a real DPE's voice differs from ATC's.
        body: JSON.stringify({ text: oralQuestion.question, speed: 1.0, voice: voiceForKey(session.id) }),
      })
      if (!res.ok) { speakFallback(oralQuestion.question); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        if (!fxRef.current) fxRef.current = attachRadioFx(audioRef.current, 'radio')
        audioRef.current.src = url
        audioRef.current.onended = () => fxRef.current?.release()
        fxRef.current?.cue()
        await audioRef.current.play().catch(() => {})
      }
    } finally {
      setOralTtsLoading(false)
    }
  }, [oralQuestion, session, speakFallback])

  const oralRate = useCallback((gotIt: boolean) => {
    if (!session?.oralQuestionIds || !oralQuestion) return
    const newOralResults = [...oralResults, { questionId: oralQuestion.id, rating: gotIt ? ('got' as const) : ('review' as const) }]
    setOralResults(newOralResults)
    if (oralStep + 1 >= session.oralQuestionIds.length) {
      setPhase('radio')
    } else {
      setOralStep((s) => s + 1)
      setOralRevealed(false)
    }
  }, [session, oralQuestion, oralStep, oralResults])

  const playTransmission = useCallback(async () => {
    if (!scenario) return
    setTtsLoading(true)
    try {
      setUsingFallbackVoice(false)
      const fx = getRadioFx()
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: personalizeText(scenario.atcTransmission, callsign), speed: ttsSpeed(fx.speed) }),
      })
      if (!res.ok) { speakFallback(personalizeText(scenario.atcTransmission, callsign)); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        if (!fxRef.current) fxRef.current = attachRadioFx(audioRef.current, fx.mode)
        else fxRef.current.setMode(fx.mode)
        audioRef.current.src = url
        audioRef.current.onended = () => fxRef.current?.release()
        fxRef.current?.cue(!!scenario.steppedOn)
        await audioRef.current.play().catch(() => {})
      }
    } finally {
      setTtsLoading(false)
    }
  }, [scenario, callsign, speakFallback])

  useEffect(() => {
    autoPlayedRef.current = false
  }, [step])

  useEffect(() => {
    if (phase === 'radio' && !autoPlayedRef.current && scenario) {
      autoPlayedRef.current = true
      playTransmission()
    }
  }, [phase, scenario, playTransmission])

  const submitReadback = useCallback(async () => {
    if (!scenario || !readback.trim() || grading) return
    setGrading(true)
    setGradeError(null)
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, readback }),
      })
      const data = await res.json()
      if (!res.ok) { setGradeError('Something went wrong grading that one — try again.'); return }
      setResult(data)
    } catch {
      setGradeError('Something went wrong grading that one — try again.')
    } finally {
      setGrading(false)
    }
  }, [scenario, readback, grading])

  const advance = useCallback(() => {
    if (!result || !scenario) return
    const newResults = [...results, { scenarioId: scenario.id, score: result.score, passed: result.passFail === 'PASS', missed: result.elements?.missed ?? [] }]
    setResults(newResults)
    if (step + 1 >= totalSteps) {
      setDone(true)
    } else {
      setStep((s) => s + 1)
      setReadback('')
      setResult(null)
    }
  }, [result, scenario, step, totalSteps, results])

  if (session === undefined) {
    return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Building your focus session…</div>
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        Session not found. <a href="/train" className="underline">Back to training</a>
      </div>
    )
  }

  // Checkrides AND weak-spot drills are a Solo Pilot feature — free users get sent to upgrade
  if (entLoaded && !pro) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-semibold mb-2">{isDrill ? 'Weak-spot drills' : 'Checkride mode'}</h1>
          <p className="text-gray-500 mb-6">
            {isDrill
              ? 'Targeted, back-to-back drills on your weakest elements are a Solo Pilot feature. Go unlimited to auto-focus your practice.'
              : 'Full-flight checkrides are a Solo Pilot feature. Go unlimited to fly them and see your readiness verdict.'}
          </p>
          <a href={isDrill ? '/profile' : '/checkride'} className="inline-block bg-gray-900 hover:bg-black text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            {isDrill ? 'See my weak spots' : 'View checkrides'}
          </a>
        </div>
      </main>
    )
  }

  if (done) {
    const total = results.length
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed)
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / total)
    // checkride-style verdict: any failed leg/scenario is a "below standard" item
    const verdict = isDrill
      ? (failed.length === 0 ? { label: 'WEAK SPOTS CLEARED', tone: 'green', line: 'Every scenario to standard — nice work.' }
        : failed.length === 1 && avg >= 80 ? { label: 'ALMOST THERE', tone: 'amber', line: 'One scenario below standard. Clean that up and you are set.' }
        : { label: 'KEEP DRILLING', tone: 'red', line: `${failed.length} scenarios below standard. Drill these, then re-fly.` })
      : (failed.length === 0 ? { label: 'CHECKRIDE READY', tone: 'green', line: 'Every leg to standard — your radio work is checkride-ready.' }
        : failed.length === 1 && avg >= 80 ? { label: 'ALMOST THERE', tone: 'amber', line: 'One leg below standard. Clean that up and you are ready.' }
        : { label: 'NOT YET', tone: 'red', line: `${failed.length} legs below standard. Drill these, then re-fly.` })
    const toneBg = verdict.tone === 'green' ? 'bg-green-500' : verdict.tone === 'amber' ? 'bg-amber-500' : 'bg-red-500'
    const toneText = verdict.tone === 'green' ? 'text-green-600' : verdict.tone === 'amber' ? 'text-amber-600' : 'text-red-600'
    // Oral tally is informational only -- kept entirely separate from the
    // radio-leg verdict/avg above, which stays computed from `results` alone.
    // Self-rated Q&A and deterministically rule-graded readbacks are two
    // different kinds of signal; blending them would cheapen the one Checkride
    // mode is actually sold on.
    const oralGot = oralResults.filter((r) => r.rating === 'got').length
    const oralReview = oralResults.filter((r) => r.rating === 'review').length

    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full text-center">
          <div className={`mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center text-white ${toneBg}`}>
            <CheckIcon className="text-2xl" />
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-1">{isDrill ? 'Drill report' : 'Checkride report'} · {session.title}</div>
          {oralResults.length > 0 && (
            <p className="text-xs text-gray-500 mb-2">
              Oral: <span className="text-green-600 font-medium">{oralGot} solid</span>, <span className="text-amber-600 font-medium">{oralReview} flagged to review</span>
            </p>
          )}
          <h1 className={`text-3xl font-bold mb-1 ${toneText}`}>{verdict.label}</h1>
          <p className="text-gray-500 text-sm mb-5">
            {verdict.line}
            {oralReview > 0 && <span className="block text-gray-400 text-xs mt-1">Also flagged {oralReview} oral question{oralReview === 1 ? '' : 's'} to review.</span>}
          </p>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div><div className="text-2xl font-bold">{passed}/{total}</div><div className="text-xs text-gray-400 uppercase tracking-wide">{isDrill ? 'scenarios' : 'legs'} to standard</div></div>
            <div><div className="text-2xl font-bold">{avg}</div><div className="text-xs text-gray-400 uppercase tracking-wide">avg score</div></div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-2">
            {results.map((r, i) => {
              const s = getScenario(r.scenarioId)
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{i + 1}. {s?.title ?? r.scenarioId}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{r.score}</span>
                    <span className={r.passed ? 'text-green-600' : 'text-red-500'}>{r.passed ? '✓' : '✗'}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {failed.length > 0 && (
            <div className="text-left border border-red-100 bg-red-50/50 rounded-xl p-4 mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-2">{isDrill ? 'Still shaky on' : 'Focus before your checkride'}</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {failed.map((r, i) => {
                  const s = getScenario(r.scenarioId)
                  return <li key={i}>· <span className="font-medium">{s?.title}</span>{r.missed.length > 0 && <span className="text-gray-500"> — missed: {r.missed.slice(0, 2).join(', ')}</span>}</li>
                })}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(0); setResults([]); setResult(null); setReadback(''); setDone(false)
                setOralStep(0); setOralResults([]); setOralRevealed(false)
                setPhase(session?.oralQuestionIds?.length ? 'oral' : 'radio')
              }}
              className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium hover:border-gray-400"
            >
              Re-fly
            </button>
            <a href={isDrill ? '/profile' : '/checkride'} className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium text-center hover:bg-gray-800">
              {isDrill ? 'Back to my weak spots' : 'All checkrides'}
            </a>
          </div>
        </div>
      </main>
    )
  }

  if (phase === 'oral' && oralQuestion) {
    return (
      <main className="min-h-screen">
        <audio ref={audioRef} />
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Session header — spans both the oral preamble and the radio legs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">{session.title}</span>
              </div>
              <span className="text-sm text-gray-400">Oral {oralStep + 1} / {oralCount}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-400">{oralQuestion.area}</span>
              <div className="flex items-center gap-2">
                {usingFallbackVoice && (
                  <span className="text-xs text-amber-600 font-mono" title="Primary voice is unavailable right now — using your device's built-in voice instead.">backup voice</span>
                )}
                <button onClick={hearOral} disabled={oralTtsLoading} className="text-xs text-blue-600 hover:underline disabled:opacity-40">
                  {oralTtsLoading ? 'loading...' : 'Hear the examiner →'}
                </button>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-5">{oralQuestion.question}</p>

            {!oralRevealed ? (
              <button onClick={() => setOralRevealed(true)} className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">
                Answer aloud, then reveal
              </button>
            ) : (
              <div>
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-800 leading-relaxed mb-3">{oralQuestion.answer}</p>
                  <ul className="space-y-1">
                    {oralQuestion.keyPoints.map((k) => (
                      <li key={k} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-green-600">✓</span>{k}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => oralRate(false)} className="flex-1 border border-amber-300 text-amber-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-50">Review this</button>
                  <button onClick={() => oralRate(true)} className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800">I had it →</button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">Answer out loud like a real examiner question, then reveal the model answer and rate yourself honestly.</p>
        </div>
      </main>
    )
  }

  if (!scenario) return null

  return (
    <main className="min-h-screen">
      <audio ref={audioRef} />
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Session header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-medium text-gray-700">{session.title}</span>
            </div>
            <span className="text-sm text-gray-400">{oralCount > 0 ? `Leg ${step + 1} / ${totalSteps}` : `${step + 1} / ${totalSteps}`}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-semibold">
          Step {step + 1} · {scenario.phase}
        </div>
        <h1 className="text-xl font-semibold mb-2">{scenario.title}</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">{scenario.setup}</p>

        {/* ATC */}
        <div className="bg-gray-950 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-mono text-xs uppercase tracking-widest">ATC</span>
            </div>
            <div className="flex items-center gap-2">
              {usingFallbackVoice && (
                <span className="text-xs text-amber-500 font-mono" title="Primary voice is unavailable right now — using your device's built-in voice instead.">backup voice</span>
              )}
              <button onClick={playTransmission} disabled={ttsLoading} className="text-xs text-gray-400 hover:text-green-400 font-mono disabled:opacity-40">
                {ttsLoading ? 'loading...' : '▶ play'}
              </button>
            </div>
          </div>
          <p className="text-green-400 font-mono text-sm leading-relaxed">
            &ldquo;{personalizeText(scenario.atcTransmission, callsign)}&rdquo;
          </p>
        </div>

        {/* Input */}
        {!result && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your readback</label>
            <textarea
              ref={textareaRef}
              value={readback}
              onChange={(e) => setReadback(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submitReadback() } }}
              placeholder="Type exactly what you would say on the radio..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
              <button onClick={submitReadback} disabled={!readback.trim() || grading} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">
                {grading ? 'Grading...' : 'Submit'}
              </button>
            </div>
            {gradeError && (
              <div className="mt-3 flex items-center justify-between gap-3 border border-red-200 bg-red-50 rounded-lg px-4 py-2.5">
                <span className="text-sm text-red-700">{gradeError}</span>
                <button onClick={submitReadback} className="shrink-0 text-sm font-medium text-red-700 hover:underline">Retry</button>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className={`border rounded-xl p-5 ${result.score >= 80 ? 'bg-green-50 border-green-200' : result.score >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-4xl font-bold ${result.score >= 80 ? 'text-green-700' : result.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>{result.score}</div>
                  <div className={`text-sm font-medium ${result.score >= 80 ? 'text-green-700' : result.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>{result.passFail}</div>
                </div>
                <div className="text-right text-sm text-gray-600 max-w-xs leading-relaxed">{result.feedback}</div>
              </div>
            </div>

            {result.cfiTip && (
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">What a CFI would say</div>
                <p className="text-sm text-slate-700 leading-relaxed">{result.cfiTip}</p>
              </div>
            )}

            {safetyTieInFor(result) && (
              <p className="text-xs text-gray-500 leading-relaxed px-1">
                <span className="font-semibold text-gray-600">Why this matters — </span>
                {safetyTieInFor(result)}
              </p>
            )}

            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">You said</div>
                <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded">&ldquo;{readback}&rdquo;</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Standard readback</div>
                <p className="text-sm font-mono bg-green-50 text-green-800 px-3 py-2 rounded">&ldquo;{personalizeText(result.correctReadback, callsign)}&rdquo;</p>
              </div>
            </div>

            <button onClick={advance} className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800">
              {step + 1 >= totalSteps ? 'See results →' : `Next — ${getScenario(session.scenarioIds[step + 1])?.title ?? 'Continue'} →`}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
