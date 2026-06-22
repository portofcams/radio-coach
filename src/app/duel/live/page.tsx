'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getScenario } from '@/lib/scenarios'
import { ttsSpeed } from '@/lib/radio-fx'
import { voiceForKey } from '@/lib/voices'

interface PlayerView { pid: string; name: string; ready: boolean; submitted: boolean; score: number | null; timeMs: number | null }
type Phase = 'setup' | 'lobby' | 'racing' | 'done'

function rand(n: number) { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 36).toString(36); return s }

export default function LiveDuelPage() {
  const [pid] = useState(() => rand(10))
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<Phase>('setup')
  const [players, setPlayers] = useState<PlayerView[]>([])
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [readback, setReadback] = useState('')
  const [grading, setGrading] = useState(false)
  const [myResult, setMyResult] = useState<{ score: number; timeMs: number } | null>(null)
  const [result, setResult] = useState<{ winner: string | null; players: PlayerView[] } | null>(null)
  const [played, setPlayed] = useState(false)
  const [copied, setCopied] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => { if (d.user?.callsign) setName(d.user.callsign) }).catch(() => {})
    const r = new URLSearchParams(window.location.search).get('room')
    if (r) setCode(r.toUpperCase())
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // Short-poll the room state (works through any proxy; ~1.5s latency).
  function connect(c: string) {
    const tick = async () => {
      try {
        const r = await fetch(`/api/duel/live/${c}?pid=${pid}&name=${encodeURIComponent(name || 'Pilot')}`)
        if (!r.ok) return
        const m = await r.json()
        setPlayers(m.players || [])
        if (m.state === 'racing') { setScenarioId(m.scenarioId); setPhase((ph) => (ph === 'done' ? ph : 'racing')) }
        if (m.state === 'done' && m.result) {
          setResult(m.result); setPhase('done')
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
      } catch { /* keep polling */ }
    }
    tick()
    pollRef.current = setInterval(tick, 1500)
  }

  function startDuel(create: boolean) {
    const c = create ? rand(4).toUpperCase() : code.trim().toUpperCase()
    if (!c) return
    setCode(c)
    window.history.replaceState(null, '', `/duel/live?room=${c}`)
    setPhase('lobby')
    connect(c)
  }

  // Play the ATC call once we enter the race.
  useEffect(() => {
    if (phase !== 'racing' || !scenarioId || played) return
    const sc = getScenario(scenarioId)
    if (!sc) return
    setPlayed(true)
    ;(async () => {
      try {
        const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: sc.atcTransmission, speed: ttsSpeed('normal'), voice: voiceForKey(sc.id) }) })
        if (res.ok && audioRef.current) {
          audioRef.current.src = URL.createObjectURL(await res.blob())
          audioRef.current.onended = () => { startTimeRef.current = Date.now() }
          await audioRef.current.play().catch(() => { startTimeRef.current = Date.now() })
        } else startTimeRef.current = Date.now()
      } catch { startTimeRef.current = Date.now() }
    })()
  }, [phase, scenarioId, played])

  async function submit() {
    if (!scenarioId || !readback.trim() || myResult) return
    setGrading(true)
    const timeMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0
    try {
      const res = await fetch('/api/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenarioId, readback }) })
      const d = await res.json()
      const score = d.score ?? 0
      setMyResult({ score, timeMs })
      await fetch(`/api/duel/live/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', pid, score, timeMs }) })
    } finally { setGrading(false) }
  }

  const me = players.find((p) => p.pid === pid)
  const opp = players.find((p) => p.pid !== pid)
  const sc = scenarioId ? getScenario(scenarioId) : null

  // ---- SETUP ----
  if (phase === 'setup') {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Live radio duel</h1>
        <p className="text-gray-500 mb-6">Race another pilot on the same ATC call — fastest clean readback wins.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your call sign / name" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        {code ? (
          <button onClick={() => startDuel(false)} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800 mb-2">Join duel {code}</button>
        ) : (
          <button onClick={() => startDuel(true)} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800 mb-2">Create a duel</button>
        )}
        {!code && <p className="text-xs text-gray-400 text-center">You&apos;ll get a link to send your opponent.</p>}
      </main>
    )
  }

  // ---- LOBBY ----
  if (phase === 'lobby') {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/duel/live?room=${code}` : ''
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="font-mono text-xs font-bold tracking-widest text-amber-600 mb-2">DUEL {code}</div>
        <h1 className="text-xl font-semibold mb-4">Waiting for your opponent…</h1>
        <div className="space-y-2 mb-6">
          {players.map((p) => (
            <div key={p.pid} className="border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
              <span className="font-medium">{p.name}{p.pid === pid && ' (you)'}</span>
              <span className={p.ready ? 'text-green-600' : 'text-gray-400'}>{p.ready ? 'ready' : 'not ready'}</span>
            </div>
          ))}
          {players.length < 2 && <div className="border border-dashed border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-400">empty seat</div>}
        </div>
        <div className="flex gap-2 mb-4">
          <input readOnly value={link} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50" />
          <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium">{copied ? 'Copied' : 'Copy'}</button>
        </div>
        <button onClick={() => fetch(`/api/duel/live/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ready', pid }) })}
          disabled={me?.ready} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
          {me?.ready ? 'Ready — waiting for opponent' : "I'm ready"}
        </button>
      </main>
    )
  }

  // ---- RACING ----
  if (phase === 'racing') {
    return (
      <main className="max-w-md mx-auto px-6 py-12">
        <audio ref={audioRef} className="hidden" />
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-xs font-bold tracking-widest text-amber-600">DUEL {code}</div>
          <div className="text-xs text-gray-400">{opp ? `${opp.name}: ${opp.submitted ? 'submitted ✓' : 'reading back…'}` : 'opponent left'}</div>
        </div>
        <p className="text-gray-600 mb-2">{sc?.setup}</p>
        <button onClick={() => { if (audioRef.current) audioRef.current.play().catch(() => {}) }} className="text-xs text-blue-600 hover:underline mb-4">Replay ATC</button>
        {myResult ? (
          <div className="border border-gray-200 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold">{myResult.score}%</div>
            <div className="text-sm text-gray-400 mt-1">in {(myResult.timeMs / 1000).toFixed(1)}s — waiting for the result…</div>
          </div>
        ) : (
          <>
            <textarea value={readback} onChange={(e) => setReadback(e.target.value)} rows={3} placeholder="Read it back…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <button onClick={submit} disabled={grading || !readback.trim()} className="w-full bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">{grading ? 'Grading…' : 'Submit readback'}</button>
          </>
        )}
      </main>
    )
  }

  // ---- DONE ----
  const won = result?.winner === pid
  const tie = result && !result.winner
  return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <div className="font-mono text-xs font-bold tracking-widest text-amber-600 mb-2">DUEL {code}</div>
      <h1 className={`text-3xl font-semibold mb-6 ${won ? 'text-green-600' : tie ? 'text-amber-600' : 'text-gray-900'}`}>{won ? 'You win!' : tie ? 'Dead heat' : 'You lost'}</h1>
      <div className="space-y-2 mb-6">
        {result?.players.map((p) => (
          <div key={p.pid} className={`border rounded-lg px-4 py-3 flex items-center justify-between text-sm ${p.pid === result?.winner ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
            <span className="font-medium">{p.name}{p.pid === pid && ' (you)'}</span>
            <span className="font-mono">{p.score ?? '—'}%{p.timeMs != null ? ` · ${(p.timeMs / 1000).toFixed(1)}s` : ''}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { window.location.href = '/duel/live' }} className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-gray-800">New duel</button>
      <p className="mt-4"><Link href="/train" className="text-sm text-gray-400 hover:text-gray-600">← training</Link></p>
    </main>
  )
}
