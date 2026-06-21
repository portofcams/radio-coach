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

export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
}

/** US states that have at least one towered field, with a field count — for the /airports state index. */
export function usStatesWithFields(): Array<{ code: string; name: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const a of Object.values(DB)) {
    if (!a.towered || a.country !== 'US' || a.runways.length === 0) continue
    const code = (a.region || '').replace(/^US-/, '')
    if (US_STATES[code]) counts[code] = (counts[code] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([code, count]) => ({ code, name: US_STATES[code], count }))
    .sort((x, y) => x.name.localeCompare(y.name))
}

/** Towered fields in one US state (region code like "CA"), biggest runways first. */
export function regionAirports(code: string, limit = 400): Array<{ ident: string; name: string; city: string; region: string }> {
  const region = `US-${code.toUpperCase()}`
  return Object.entries(DB)
    .filter(([, a]) => a.towered && a.region === region && a.runways.length > 0)
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
