// SERVER-ONLY (imports the airports dataset via lookupAirport).
import { lookupAirport } from './airports'
import type { HomeProfile } from './home-client'

export interface HomeRow {
  home_ident?: string | null
  home_name?: string | null
  home_tower?: string | null
  home_runway?: string | null
}

/** Build a HomeProfile from a rc_users row: real FAA field if ident resolves, else manual. */
export function resolveHomeProfile(row: HomeRow | undefined | null): HomeProfile | null {
  if (!row) return null
  if (row.home_ident) {
    const field = lookupAirport(row.home_ident)
    // shallow-copy so callers can attach taxiways without mutating the shared dataset
    if (field) return { mode: 'real', ident: row.home_ident.toUpperCase(), field: { ...field } }
  }
  if (row.home_name && row.home_tower && row.home_runway) {
    return { mode: 'manual', name: row.home_name, tower: row.home_tower, runway: row.home_runway }
  }
  return null
}
