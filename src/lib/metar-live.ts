// SERVER-ONLY. Fetches the current METAR for a field and caches it briefly in
// Postgres, modeled on osm-taxiways.ts's fetch+cache pattern. The short TTL
// exists so that within one practice attempt, the client-facing wx-scenario
// route and the grade route both resolve the SAME cached raw METAR -- a live
// scenario is graded against exactly the wind/runway the student heard, not
// one reissued in between the two independent server-side reads.
import type { Pool } from 'pg'
import { decodeMetar, type DecodedMetar } from './metar'

const TTL_MS = 15 * 60 * 1000 // real METARs reissue roughly hourly; 15 min covers one attempt with margin

async function fetchRawMetar(icao: string): Promise<string | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}&format=json`, {
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) && data[0]?.rawOb ? String(data[0].rawOb) : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Best-effort, cached, never throws. Returns null if no live METAR is available. */
export async function getLiveMetar(db: Pool | null, icaoRaw: string): Promise<DecodedMetar | null> {
  const icao = icaoRaw.trim().toUpperCase()
  if (!icao) return null

  if (db) {
    try {
      const c = await db.query('SELECT raw, fetched_at FROM rc_metar_cache WHERE icao = $1', [icao])
      const row = c.rows[0]
      if (row && Date.now() - new Date(row.fetched_at).getTime() < TTL_MS) return decodeMetar(row.raw)
    } catch {
      /* cache read best-effort */
    }
  }

  const raw = await fetchRawMetar(icao)
  if (!raw) return null

  if (db) {
    db.query(
      `INSERT INTO rc_metar_cache (icao, raw, fetched_at) VALUES ($1, $2, now())
       ON CONFLICT (icao) DO UPDATE SET raw = EXCLUDED.raw, fetched_at = now()`,
      [icao, raw],
    ).catch(() => { /* cache write best-effort */ })
  }

  return decodeMetar(raw)
}
