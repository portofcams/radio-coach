'use client'

import { useMemo, useState } from 'react'
import { toPhonetic } from '@/lib/phonetic'
import { runwayPhonetic } from '@/lib/homefield'
import type { RealFieldDiagram } from '@/lib/types'

/**
 * Interactive airport-diagram familiarization drill. Tasks are generated from
 * REAL geometry — tap the named taxiway (OSM ref) or the named runway end.
 * No fabricated routing: we only ask the pilot to identify things that exist.
 */
const W = 340, H = 240, PAD = 30

type Task = { kind: 'taxiway' | 'runway'; target: string; prompt: string }

export default function DiagramDrill({ field }: { field: RealFieldDiagram }) {
  // ── projection (same as RealFieldDiagram) ──
  const proj = useMemo(() => {
    const pts: Array<[number, number]> = []
    for (const r of field.runways) pts.push([r.leLon, r.leLat], [r.heLon, r.heLat])
    for (const t of field.taxiways ?? []) for (const p of t.points) pts.push([p.lon, p.lat])
    const lats = pts.map((p) => p[1]), lons = pts.map((p) => p[0])
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons)
    const kx = Math.cos(((minLat + maxLat) / 2 * Math.PI) / 180) || 1
    const spanX = (maxLon - minLon) * kx, spanY = maxLat - minLat, EPS = 1e-9
    const scale = Math.min((W - 2 * PAD) / (spanX || EPS), (H - 2 * PAD) / (spanY || EPS))
    const offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2
    const X = (lon: number) => Math.round((offX + (lon - minLon) * kx * scale) * 10) / 10
    const Y = (lat: number) => Math.round((offY + (maxLat - lat) * scale) * 10) / 10
    return { X, Y }
  }, [field])

  const tasks = useMemo<Task[]>(() => {
    const refs: string[] = []
    for (const t of field.taxiways ?? []) if (t.ref && !refs.includes(t.ref)) refs.push(t.ref)
    // up to 3 taxiways + up to 2 runway ends, lightly shuffled
    const pick = <T,>(arr: T[], n: number) => [...arr].sort(() => Math.random() - 0.5).slice(0, n)
    const twTasks: Task[] = pick(refs, 3).map((r) => ({ kind: 'taxiway', target: r, prompt: `Tap taxiway ${toPhonetic(r)}` }))
    const ends = field.runways.flatMap((r) => [r.le, r.he])
    const rwTasks: Task[] = pick(ends, 2).map((e) => ({ kind: 'runway', target: e, prompt: `Tap runway ${runwayPhonetic(e)}` }))
    return [...twTasks, ...rwTasks].sort(() => Math.random() - 0.5)
  }, [field])

  const [step, setStep] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<{ ok: boolean; key: string } | null>(null)
  const [locked, setLocked] = useState(false)
  const done = step >= tasks.length
  const task = tasks[step]

  function answer(ok: boolean, key: string) {
    if (locked || done) return
    setLocked(true)
    setFlash({ ok, key })
    if (ok) setScore((s) => s + 1)
    setTimeout(() => { setFlash(null); setLocked(false); setStep((s) => s + 1) }, 900)
  }

  if (!tasks.length) return <div className="text-sm text-gray-400">Not enough diagram data for a drill at this field.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-900">
          {done ? 'Drill complete' : task.prompt}
        </div>
        <div className="text-xs font-mono text-gray-400">{done ? '' : `${step + 1}/${tasks.length}`} · {score} correct</div>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0b0f14]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label={`${field.name} diagram drill`}>
          {/* taxiways */}
          {(field.taxiways ?? []).map((t, i) => {
            const poly = t.points.map((p) => `${proj.X(p.lon)},${proj.Y(p.lat)}`).join(' ')
            const isFlash = flash && flash.key === `tw${i}`
            const stroke = isFlash ? (flash!.ok ? '#22c55e' : '#ef4444') : '#3a4a2a'
            return (
              <polyline key={`tw${i}`} points={poly} fill="none" stroke={stroke} strokeWidth={isFlash ? 7 : 5}
                strokeLinejoin="round" strokeLinecap="round" style={{ cursor: 'pointer' }}
                onClick={() => answer(!done && task.kind === 'taxiway' && t.ref === task.target, `tw${i}`)} />
            )
          })}
          {/* runways */}
          {field.runways.map((r, i) => {
            const x1 = proj.X(r.leLon), y1 = proj.Y(r.leLat), x2 = proj.X(r.heLon), y2 = proj.Y(r.heLat)
            const isFlash = flash && flash.key === `rw${i}`
            const stroke = isFlash ? (flash!.ok ? '#22c55e' : '#ef4444') : '#2a3340'
            const hit = !done && task.kind === 'runway' && (r.le === task.target || r.he === task.target)
            return (
              <g key={`rw${i}`} style={{ cursor: 'pointer' }} onClick={() => answer(hit, `rw${i}`)}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={12} strokeLinecap="round" />
                <text x={x1} y={y1} dy="3" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748b">{r.le}</text>
                <text x={x2} y={y2} dy="3" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748b">{r.he}</text>
              </g>
            )
          })}
        </svg>
      </div>
      {done && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">{score}/{tasks.length} correct</span>
          <button onClick={() => { setStep(0); setScore(0) }} className="text-sm bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-800">Again</button>
        </div>
      )}
    </div>
  )
}
