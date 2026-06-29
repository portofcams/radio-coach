'use client'
import { useState } from 'react'
import Link from 'next/link'
import { decodeMetar, type DecodedMetar } from '@/lib/metar'
import { decodeTaf, type DecodedTaf } from '@/lib/taf'

type Field = { icao: string; metar: DecodedMetar | null; taf: DecodedTaf | null; err?: string }

const RANK: Record<string, number> = { VFR: 0, MVFR: 1, IFR: 2, LIFR: 3 }
const CAT: Record<string, { box: string; dot: string }> = {
  VFR: { box: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' },
  MVFR: { box: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  IFR: { box: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  LIFR: { box: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200', dot: 'bg-fuchsia-500' },
}

async function fetchField(raw: string): Promise<Field> {
  const icao = raw.trim().toUpperCase()
  try {
    const [mr, tr] = await Promise.all([
      fetch(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}&format=json`).then((r) => r.json()).catch(() => null),
      fetch(`https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(icao)}&format=json`).then((r) => r.json()).catch(() => null),
    ])
    const ob = Array.isArray(mr) && mr[0]?.rawOb
    const rawTaf = Array.isArray(tr) && tr[0]?.rawTAF
    return { icao, metar: ob ? decodeMetar(ob) : null, taf: rawTaf ? decodeTaf(rawTaf) : null, err: ob ? undefined : 'No current METAR found for this field.' }
  } catch {
    return { icao, metar: null, taf: null, err: 'Could not reach the weather service.' }
  }
}

function verdict(fields: Field[]): { cat: string; title: string; note: string } {
  const cats = fields.map((f) => f.metar?.flightCategory).filter(Boolean) as string[]
  if (!cats.length) return { cat: 'IFR', title: 'No reports found', note: 'No current METARs were returned for these fields. Double-check the identifiers and get an official briefing.' }
  const worst = cats.reduce((w, c) => (RANK[c] > RANK[w] ? c : w), 'VFR')
  if (worst === 'VFR') return { cat: 'VFR', title: 'VFR at every reporting field', note: 'Good VFR conditions are being reported along the route. Still review the full picture and get an official briefing before you go.' }
  if (worst === 'MVFR') return { cat: 'MVFR', title: 'Marginal VFR on the route', note: 'At least one field is reporting marginal VFR. Look hard at the ceilings and visibility, and whether the trend is improving or worsening.' }
  if (worst === 'IFR') return { cat: 'IFR', title: 'IFR conditions on the route', note: 'At least one field is reporting IFR — this is not VFR weather. For a VFR flight, treat that as a no-go without a hard look and an official briefing.' }
  return { cat: 'LIFR', title: 'Low IFR on the route', note: 'At least one field is reporting low IFR. Conditions are well below VFR minimums.' }
}

export default function GoNoGo() {
  const [route, setRoute] = useState('')
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  async function check() {
    const ids = route.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
    if (!ids.length) return
    setLoading(true)
    try {
      setFields(await Promise.all(ids.map(fetchField)))
      setChecked(true)
    } finally {
      setLoading(false)
    }
  }

  const v = checked ? verdict(fields) : null

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Route weather: go / no-go</h1>
        <p className="text-gray-500 mb-6">Enter the fields along your route. You get the current flight category and forecast for each, plus a worst-case read on the whole route.</p>

        <div className="flex gap-2 mb-3">
          <input
            value={route}
            onChange={(e) => setRoute(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') check() }}
            placeholder="ICAOs along the route, e.g. KAPA KBJC KCOS"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button onClick={check} disabled={loading} className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{loading ? '…' : 'Check'}</button>
        </div>

        {v && (
          <div className={`border rounded-xl px-4 py-3 mb-5 ${CAT[v.cat].box}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${CAT[v.cat].dot}`} />
              <span className="font-semibold">{v.title}</span>
            </div>
            <p className="text-sm opacity-90">{v.note}</p>
          </div>
        )}

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.icao} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-semibold">{f.icao}</span>
                {f.metar?.flightCategory && (
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${CAT[f.metar.flightCategory].box}`}>{f.metar.flightCategory}</span>
                )}
              </div>
              {f.err && <p className="text-sm text-gray-500">{f.err}</p>}
              {f.metar && (
                <div className="text-sm text-gray-700 space-y-0.5">
                  {f.metar.lines?.slice(0, 6).map((l, i) => <div key={i}>{l}</div>)}
                  <div className="font-mono text-[11px] text-gray-400 pt-1 break-all">{f.metar.raw}</div>
                </div>
              )}
              {f.taf && f.taf.periods?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Forecast</div>
                  <div className="space-y-1.5">
                    {f.taf.periods.slice(0, 4).map((p, i) => (
                      <div key={i} className="text-sm text-gray-700">
                        <span className="font-medium">{p.label}:</span> {p.lines.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {checked && (
          <p className="text-[11px] text-gray-400 mt-6">Decision aid only — this is not an official weather briefing and is no substitute for one. Always get a full briefing (1800wxbrief.com or Flight Service) and make your own go/no-go decision as pilot in command. Source: NOAA Aviation Weather Center.</p>
        )}

        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 mb-3">Know the weather — now nail the radio calls for the trip.</p>
          <Link href="/brief" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Build a radio brief →</Link>
        </div>
      </div>
    </main>
  )
}
