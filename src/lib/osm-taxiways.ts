// SERVER-ONLY. Fetches real taxiway geometry from OpenStreetMap (Overpass) and
// caches it per field in rc_field_geo, so we hit Overpass at most once per field.
import type { Pool } from 'pg'
import type { Taxiway } from './types'

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const MAX_TAXIWAYS = 80
const MAX_PTS = 24

type OverpassWay = {
  type: string
  geometry?: Array<{ lat: number; lon: number }>
  tags?: Record<string, string>
}

/** Down-sample a polyline to at most MAX_PTS points (keep ends). */
function simplify(points: Array<{ lat: number; lon: number }>): Array<{ lat: number; lon: number }> {
  if (points.length <= MAX_PTS) return points
  const step = (points.length - 1) / (MAX_PTS - 1)
  const out: Array<{ lat: number; lon: number }> = []
  for (let i = 0; i < MAX_PTS; i++) out.push(points[Math.round(i * step)])
  return out
}

/** Query Overpass for taxiways within ~2.5 km of the field center. */
export async function fetchTaxiways(lat: number, lon: number): Promise<Taxiway[]> {
  const q = `[out:json][timeout:25];way["aeroway"="taxiway"](around:2500,${lat},${lon});out geom;`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12000)
  try {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ClearsparRadioTrainer/1.0 (radio training; clearsparradio.binnacleai.com)' },
      body: 'data=' + encodeURIComponent(q),
      signal: ctrl.signal,
    })
    if (!res.ok) return []
    const data = await res.json()
    const ways: OverpassWay[] = data.elements ?? []
    const out: Taxiway[] = []
    for (const w of ways) {
      if (w.type !== 'way' || !w.geometry || w.geometry.length < 2) continue
      out.push({
        ref: w.tags?.ref ?? w.tags?.name ?? null,
        points: simplify(w.geometry.map((g) => ({ lat: g.lat, lon: g.lon }))),
      })
      if (out.length >= MAX_TAXIWAYS) break
    }
    return out
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

/** Read cached taxiways for a field (null = never fetched). */
export async function getCachedTaxiways(db: Pool, ident: string): Promise<Taxiway[] | null> {
  try {
    const r = await db.query('SELECT taxiways FROM rc_field_geo WHERE ident = $1', [ident.toUpperCase()])
    return r.rows[0] ? (r.rows[0].taxiways as Taxiway[]) : null
  } catch {
    return null
  }
}

/** Fetch + cache taxiways if not already cached. Best-effort; never throws. */
export async function ensureTaxiways(db: Pool, ident: string, lat: number | null, lon: number | null): Promise<Taxiway[]> {
  const cached = await getCachedTaxiways(db, ident)
  if (cached) return cached
  if (lat == null || lon == null) return []
  const taxiways = await fetchTaxiways(lat, lon)
  try {
    await db.query(
      `INSERT INTO rc_field_geo (ident, taxiways, fetched_at) VALUES ($1, $2, now())
       ON CONFLICT (ident) DO UPDATE SET taxiways = EXCLUDED.taxiways, fetched_at = now()`,
      [ident.toUpperCase(), JSON.stringify(taxiways)],
    )
  } catch {
    /* cache write best-effort */
  }
  return taxiways
}
