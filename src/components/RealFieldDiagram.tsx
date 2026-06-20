'use client'

import type { RealFieldDiagram as RealField } from '@/lib/types'

/**
 * Renders a true-to-life runway layout from real OurAirports/FAA endpoint
 * coordinates (public domain). Ownship sits at a real coordinate (e.g. a runway
 * threshold), so its position is correct by construction — no eyeballing.
 * Reference only — NOT FOR NAVIGATION.
 */
const W = 340
const H = 240
const PAD = 30

export default function RealFieldDiagram({ field }: { field: RealField }) {
  const pts: Array<[number, number]> = []
  for (const r of field.runways) {
    pts.push([r.leLon, r.leLat], [r.heLon, r.heLat])
  }
  for (const t of field.taxiways ?? []) {
    for (const p of t.points) pts.push([p.lon, p.lat])
  }
  if (field.ownship) pts.push([field.ownship.lon, field.ownship.lat])
  if (pts.length < 2) return null

  const lats = pts.map((p) => p[1])
  const lons = pts.map((p) => p[0])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const midLat = (minLat + maxLat) / 2
  const kx = Math.cos((midLat * Math.PI) / 180) || 1

  // Local planar coords (east-positive x, north-positive y)
  const lx = (lon: number) => (lon - minLon) * kx
  const ly = (lat: number) => maxLat - lat // screen y grows downward (north up)
  const spanX = (maxLon - minLon) * kx
  const spanY = maxLat - minLat
  const EPS = 1e-9
  const scale = Math.min((W - 2 * PAD) / (spanX || EPS), (H - 2 * PAD) / (spanY || EPS))
  // center the drawing
  const offX = (W - (spanX * scale)) / 2
  const offY = (H - (spanY * scale)) / 2
  // round to 1 dp so tiny float differences never trip SSR hydration
  const X = (lon: number) => Math.round((offX + lx(lon) * scale) * 10) / 10
  const Y = (lat: number) => Math.round((offY + ly(lat) * scale) * 10) / 10

  const own = field.ownship
  const ox = own ? X(own.lon) : 0
  const oy = own ? Y(own.lat) : 0

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0b0f14]">
      <div className="flex items-center justify-between px-3 pt-2 text-[10px] font-mono tracking-wider">
        <span className="text-gray-500">{field.name.toUpperCase()} · RUNWAY LAYOUT</span>
        <span className="text-amber-500/80">NOT FOR NAVIGATION</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${field.name} runway layout`}>
        {/* Taxiways (real OSM geometry) — drawn beneath the runways */}
        {(() => {
          const shownRefs = new Set<string>()
          return (field.taxiways ?? []).map((t, i) => {
            const poly = t.points.map((p) => `${X(p.lon).toFixed(1)},${Y(p.lat).toFixed(1)}`).join(' ')
            // label each ref once, at the midpoint of a segment long enough to read
            let label = null
            if (t.ref && !shownRefs.has(t.ref)) {
              const a = t.points[0], b = t.points[t.points.length - 1]
              const len = Math.hypot(X(b.lon) - X(a.lon), Y(b.lat) - Y(a.lat))
              if (len > 26) {
                shownRefs.add(t.ref)
                const m = t.points[Math.floor(t.points.length / 2)]
                label = <text x={X(m.lon)} y={Y(m.lat)} dy="-2" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#3f6212">{t.ref}</text>
              }
            }
            return (
              <g key={`tw${i}`}>
                <polyline points={poly} fill="none" stroke="#3a4a2a" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
                {label}
              </g>
            )
          })
        })()}
        {field.runways.map((r, i) => {
          const x1 = X(r.leLon), y1 = Y(r.leLat), x2 = X(r.heLon), y2 = Y(r.heLat)
          const active = field.activeEnd && (r.le === field.activeEnd || r.he === field.activeEnd)
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={active ? '#2a3340' : '#222a33'} strokeWidth={11} strokeLinecap="round" />
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#475569" strokeWidth={1} strokeDasharray="4 5" />
              <text x={x1} y={y1} dy="3" textAnchor="middle"
                fontSize="8" fontFamily="monospace"
                fill={r.le === field.activeEnd ? '#22d3ee' : '#64748b'}>{r.le}</text>
              <text x={x2} y={y2} dy="3" textAnchor="middle"
                fontSize="8" fontFamily="monospace"
                fill={r.he === field.activeEnd ? '#22d3ee' : '#64748b'}>{r.he}</text>
            </g>
          )
        })}
        {own && (
          <g transform={`translate(${ox} ${oy}) rotate(${own.heading})`}>
            <circle r="9" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.5">
              <animate attributeName="r" values="6;11;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <path d="M0,-7 L4,5 L0,2 L-4,5 Z" fill="#22d3ee" stroke="#0b0f14" strokeWidth="0.5" />
          </g>
        )}
      </svg>
    </div>
  )
}
