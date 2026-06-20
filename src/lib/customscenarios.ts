// SERVER-ONLY. Build a Scenario from a CFI-authored custom-scenario row.
import type { Pool } from 'pg'
import type { Scenario, Facility } from './types'

export interface CustomRow {
  id: number
  cfi_user_id: number
  title: string
  setup: string
  atc_transmission: string
  required_elements: string[]
  correct_readback: string
  facility: string | null
  frequency: string | null
}

export function rowToScenario(row: CustomRow): Scenario {
  return {
    id: `custom-${row.id}`,
    title: row.title,
    phase: 'pattern',
    difficulty: 2,
    airport: '',
    facility: (row.facility as Facility) || undefined,
    frequency: row.frequency || undefined,
    setup: row.setup || '',
    atcTransmission: row.atc_transmission,
    requiredElements: Array.isArray(row.required_elements) ? row.required_elements : [],
    correctReadback: row.correct_readback,
    commonMistakes: [],
  }
}

/** Load a custom scenario as a Scenario IF the user owns it (CFI) or it's assigned to them. */
export async function getCustomScenarioFor(db: Pool, customId: number, userId: number): Promise<Scenario | null> {
  const r = await db.query(
    `SELECT cs.* FROM rc_custom_scenarios cs
     WHERE cs.id = $1 AND (
       cs.cfi_user_id = $2
       OR EXISTS (SELECT 1 FROM rc_assignments a WHERE a.scenario_id = $3 AND a.student_user_id = $2)
     )`,
    [customId, userId, `custom-${customId}`],
  )
  return r.rows[0] ? rowToScenario(r.rows[0] as CustomRow) : null
}
