// SERVER-ONLY. Imports the 3.2 MB OurAirports-derived dataset — never import
// this from a client component (it would ship the whole table to the browser).
// Client code receives a single resolved field via /api/auth/me or /api/airports.
import airportsData from '@/data/airports.json'
import type { AirportData } from './realfield'

const DB = airportsData as unknown as Record<string, AirportData>

/** Look up a field by ICAO/local ident (case-insensitive). */
export function lookupAirport(ident: string): AirportData | null {
  if (!ident) return null
  return DB[ident.trim().toUpperCase()] ?? null
}

/** Biggest US towered fields first (max runway length as a popularity proxy) — for SEO index + sitemap. */
export function curatedAirports(limit = 250): Array<{ ident: string; name: string; city: string; region: string }> {
  return Object.entries(DB)
    .filter(([, a]) => a.towered && a.country === 'US' && a.runways.length > 0)
    .map(([ident, a]) => ({ ident, name: a.name, city: a.city, region: a.region, len: Math.max(...a.runways.map((r) => r.length ?? 0)) }))
    .sort((x, y) => y.len - x.len)
    .slice(0, limit)
    .map(({ ident, name, city, region }) => ({ ident, name, city, region }))
}

/** A compact summary for the profile lookup preview (what the pilot is saving). */
export function airportSummary(field: AirportData) {
  return {
    icao: field.icao,
    name: field.name,
    city: field.city,
    region: field.region,
    towered: field.towered,
    freqs: field.freqs,
    runways: field.runways.map((r) => `${r.le}/${r.he}`),
  }
}
