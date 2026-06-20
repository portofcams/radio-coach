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
