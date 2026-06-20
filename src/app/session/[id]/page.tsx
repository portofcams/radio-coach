'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { getSessionOrDrill as getFlightSession } from '@/lib/flight-sessions'
import { getScenario } from '@/lib/scenarios'
import type { GradeResult } from '@/lib/types'
import { CheckIcon } from '@/components/icons'
import { attachRadioFx, getRadioFx, ttsSpeed, type RadioFxController } from '@/lib/radio-fx'
import { personalizeText } from '@/lib/personalize'

export default function FlightSessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const session = getFlightSession(id)

  const [step, setStep] = useState(0)
  const [readback, setReadback] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
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

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fxRef = useRef<RadioFxController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoPlayedRef = useRef(false)

  const scenario = session ? getScenario(session.scenarioIds[step]) : null
  const totalSteps = session?.scenarioIds.length ?? 0
  const progress = totalSteps > 0 ? ((step + (result ? 1 : 0)) / totalSteps) * 100 : 0

  const playTransmission = useCallback(async () => {
    if (!scenario) return
    setTtsLoading(true)
    try {
      const fx = getRadioFx()
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: personalizeText(scenario.atcTransmission, callsign), speed: ttsSpeed(fx.speed) }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        if (!fxRef.current) fxRef.current = attachRadioFx(audioRef.current, fx.mode)
        else fxRef.current.setMode(fx.mode)
        audioRef.current.src = url
        audioRef.current.onended = () => fxRef.current?.release()
        fxRef.current?.cue()
        await audioRef.current.play().catch(() => {})
      }
    } finally {
      setTtsLoading(false)
    }
  }, [scenario, callsign])

  useEffect(() => {
    autoPlayedRef.current = false
  }, [step])

  useEffect(() => {
    if (!autoPlayedRef.current && scenario) {
      autoPlayedRef.current = true
      playTransmission()
    }
  }, [scenario, playTransmission])

  const submitReadback = useCallback(async () => {
    if (!scenario || !readback.trim() || grading) return
    setGrading(true)
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, readback }),
      })
      const data = await res.json()
      setResult(data)
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

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-gray-500">
        Session not found. <a href="/train" className="underline">Back to training</a>
      </div>
    )
  }

  // Checkrides are a Solo Pilot feature — free users get sent to the launcher to upgrade
  if (entLoaded && !pro) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-semibold mb-2">Checkride mode</h1>
          <p className="text-gray-500 mb-6">Full-flight checkrides are a Solo Pilot feature. Go unlimited to fly them and see your readiness verdict.</p>
          <a href="/checkride" className="inline-block bg-gray-900 hover:bg-black text-white font-semibold px-6 py-3 rounded-xl transition-colors">View checkrides</a>
        </div>
      </main>
    )
  }

  if (done) {
    const total = results.length
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed)
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / total)
    // checkride-style verdict: any failed leg is a "below standard" item
    const verdict =
      failed.length === 0 ? { label: 'CHECKRIDE READY', tone: 'green', line: 'Every leg to standard — your radio work is checkride-ready.' }
      : failed.length === 1 && avg >= 80 ? { label: 'ALMOST THERE', tone: 'amber', line: 'One leg below standard. Clean that up and you are ready.' }
      : { label: 'NOT YET', tone: 'red', line: `${failed.length} legs below standard. Drill these, then re-fly.` }
    const toneBg = verdict.tone === 'green' ? 'bg-green-500' : verdict.tone === 'amber' ? 'bg-amber-500' : 'bg-red-500'
    const toneText = verdict.tone === 'green' ? 'text-green-600' : verdict.tone === 'amber' ? 'text-amber-600' : 'text-red-600'

    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full text-center">
          <div className={`mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center text-white ${toneBg}`}>
            <CheckIcon className="text-2xl" />
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-1">Checkride report · {session.title}</div>
          <h1 className={`text-3xl font-bold mb-1 ${toneText}`}>{verdict.label}</h1>
          <p className="text-gray-500 text-sm mb-5">{verdict.line}</p>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div><div className="text-2xl font-bold">{passed}/{total}</div><div className="text-xs text-gray-400 uppercase tracking-wide">legs to standard</div></div>
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
              <div className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-2">Focus before your checkride</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {failed.map((r, i) => {
                  const s = getScenario(r.scenarioId)
                  return <li key={i}>· <span className="font-medium">{s?.title}</span>{r.missed.length > 0 && <span className="text-gray-500"> — missed: {r.missed.slice(0, 2).join(', ')}</span>}</li>
                })}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep(0); setResults([]); setResult(null); setReadback(''); setDone(false) }} className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium hover:border-gray-400">
              Re-fly
            </button>
            <a href="/checkride" className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium text-center hover:bg-gray-800">
              All checkrides
            </a>
          </div>
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
            <span className="text-sm text-gray-400">{step + 1} / {totalSteps}</span>
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
            <button onClick={playTransmission} disabled={ttsLoading} className="text-xs text-gray-400 hover:text-green-400 font-mono disabled:opacity-40">
              {ttsLoading ? 'loading...' : '▶ play'}
            </button>
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
