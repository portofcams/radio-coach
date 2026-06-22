import type { Pool } from 'pg'
import type { Scenario, Facility } from './types'

export interface CommunityRow {
  id: number
  title: string
  setup: string
  atc_transmission: string
  required_elements: string[]
  correct_readback: string
  facility: string | null
  frequency: string | null
  airport: string | null
}

export function rowToScenario(row: CommunityRow): Scenario {
  return {
    id: `community-${row.id}`,
    title: row.title,
    phase: 'pattern',
    difficulty: 2,
    airport: row.airport || '',
    facility: (row.facility as Facility) || undefined,
    frequency: row.frequency || undefined,
    setup: row.setup || '',
    atcTransmission: row.atc_transmission,
    requiredElements: Array.isArray(row.required_elements) ? row.required_elements : [],
    correctReadback: row.correct_readback,
    commonMistakes: [],
  }
}

/** Load an APPROVED community scenario as a playable Scenario. */
export async function getCommunityScenario(db: Pool, communityId: number): Promise<Scenario | null> {
  const r = await db.query(
    `SELECT id, title, setup, atc_transmission, required_elements, correct_readback, facility, frequency, airport
     FROM rc_community_scenarios WHERE id = $1 AND status = 'approved'`,
    [communityId],
  )
  return r.rows[0] ? rowToScenario(r.rows[0]) : null
}
