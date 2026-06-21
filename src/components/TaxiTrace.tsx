'use client'

import { useMemo, useState } from 'react'
import { runwayPhonetic } from '@/lib/homefield'
import type { RealFieldDiagram, Taxiway } from '@/lib/types'

/**
 * Trace-a-route drill on the real diagram. The pilot taps connecting taxiways
 * to build a path that reaches the active runway. Connectivity + runway-touch
 * are checked against the REAL OSM geometry — we accept ANY valid connected
 * route (not one prescribed one), so nothing is fabricated.
 */
const W = 340, H = 240, PAD = 30

export default function TaxiTrace({ field }: { field: RealFieldDiagram }) {
  const taxiways = field.taxiways ?? []
  const active = field.runways.find((r) => r.le === field.activeEnd || r.he === field.activeEnd) ?? field.runways[0]

  const geo = useMemo(() => {
    const pts: Array<[number, number]> = []
    for (const r of field.runways) pts.push([r.leLon, r.leLat], [r.heLon, r.heLat])
    for (const t of taxiways) for (const p of t.points) pts.push([p.lon, p.lat])
    const lats = pts.map((p) => p[1]), lons = pts.map((p) => p[0])
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons)
    const kx = Math.cos(((minLat + maxLat) / 2 * Math.PI) / 180) || 1
    const spanX = (maxLon - minLon) * kx, spanY = maxLat - minLat, EPS = 1e-9
    const scale = Math.min((W - 2 * PAD) / (spanX || EPS), (H - 2 * PAD) / (spanY || EPS))
    const offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2
    const X = (lon: number) => Math.round((offX + (lon - minLon) * kx * scale) * 10) / 10
    const Y = (lat: number) => Math.round((offY + (maxLat - lat) * scale) * 10) / 10
    return { X, Y, kx }
  }, [field, taxiways])

  // distance in lat-degrees (lon scaled by cos lat) — small-area planar approx
  const d = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
    Math.hypot((a.lon - b.lon) * geo.kx, a.lat - b.lat)
  const TOL = 0.0006 // ~66 m — absorbs OSM junction sloppiness
  const ends = (t: Taxiway) => [t.points[0], t.points[t.points.length - 1]]

  const connects = (i: number, j: number) => {
    const ti = taxiways[i], tj = taxiways[j]
    for (const e of ends(ti)) for (const p of tj.points) if (d(e, p) < TOL) return true
    for (const e of ends(tj)) for (const p of ti.points) if (d(e, p) < TOL) return true
    return false
  }
  // point-to-segment distance to the active runway
  const touchesRunway = (i: number) => {
    if (!active) return false
    const a = { lat: active.leLat, lon: active.leLon }, b = { lat: active.heLat, lon: active.heLon }
    const seg = (p: { lat: number; lon: number }) => {
      const ax = a.lon * geo.kx, ay = a.lat, bx = b.lon * geo.kx, by = b.lat, px = p.lon * geo.kx, py = p.lat
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1e-12
      let t = ((px - ax) * dx + (py - ay) * dy) / len2; t = Math.max(0, Math.min(1, t))
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    }
    return taxiways[i].points.some((p) => seg(p) < TOL * 1.4)
  }

  const [path, setPath] = useState<number[]>([])
  const [flash, setFlash] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  function tap(i: number) {
    if (done || path.includes(i)) return
    const ok = path.length === 0 ? true : connects(path[path.length - 1], i)
    if (!ok) { setFlash(i); setTimeout(() => setFlash(null), 500); return }
    const next = [...path, i]
    setPath(next)
    if (touchesRunway(i)) setDone(true)
  }
  const reset = () => { setPath([]); setDone(false); setFlash(null) }

  if (!taxiways.length || !active) return <div className="text-sm text-gray-400">Not enough taxiway data at this field to trace a route.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-900">
          {done ? `Route to runway ${runwayPhonetic(active.le)} complete` : `Tap connecting taxiways to reach runway ${runwayPhonetic(active.le)}`}
        </div>
        <div className="text-xs font-mono text-gray-400">{path.length} taxiway{path.length === 1 ? '' : 's'}</div>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0b0f14]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
          {taxiways.map((t, i) => {
            const poly = t.points.map((p) => `${geo.X(p.lon)},${geo.Y(p.lat)}`).join(' ')
            const inPath = path.includes(i)
            const stroke = flash === i ? '#ef4444' : inPath ? '#22c55e' : '#3a4a2a'
            return <polyline key={i} points={poly} fill="none" stroke={stroke} strokeWidth={inPath || flash === i ? 7 : 5} strokeLinejoin="round" strokeLinecap="round" style={{ cursor: 'pointer' }} onClick={() => tap(i)} />
          })}
          {field.runways.map((r, i) => {
            const isActive = r.le === active.le && r.he === active.he
            return <line key={i} x1={geo.X(r.leLon)} y1={geo.Y(r.leLat)} x2={geo.X(r.heLon)} y2={geo.Y(r.heLat)} stroke={isActive ? (done ? '#22c55e' : '#2a3340') : '#222a33'} strokeWidth={12} strokeLinecap="round" />
          })}
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{done ? 'Nice — that route connects to the runway.' : 'Each taxiway must connect to the last.'}</span>
        <button onClick={reset} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:border-gray-500">Reset</button>
      </div>
    </div>
  )
}
