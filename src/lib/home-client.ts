import { homeFieldScenarios, homeFieldScenario } from './homefield'
import { realFieldScenarios, realFieldScenario, type AirportData } from './realfield'
import type { Scenario } from './types'

/**
 * A pilot's resolved home field, as returned by /api/auth/me. Either a real FAA
 * field (full data → real-geometry scenarios) or a manual lean field (unlisted).
 * Isomorphic: no large dataset import, safe on the client.
 */
export type HomeProfile =
  | { mode: 'real'; ident: string; field: AirportData }
  | { mode: 'manual'; name: string; tower: string; runway: string }

export function homeScenarios(home: HomeProfile, callsign?: string | null): Scenario[] {
  return home.mode === 'real'
    ? realFieldScenarios(home.field, callsign)
    : homeFieldScenarios(home, callsign)
}

export function homeScenario(id: string, home: HomeProfile, callsign?: string | null): Scenario | null {
  return home.mode === 'real'
    ? realFieldScenario(id, home.field, callsign)
    : homeFieldScenario(id, home, callsign)
}

/** A short human label for the home field (used in headings). */
export function homeLabel(home: HomeProfile): string {
  return home.mode === 'real' ? `${home.field.name} (${home.ident})` : home.name
}
