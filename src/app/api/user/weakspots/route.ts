import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { computeWeakspots, drillScenariosFor } from '@/lib/weakspots'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ weakspots: [] })
  const db = getPool()
  if (!db) return NextResponse.json({ weakspots: [] })

  const r = await db.query(
    `SELECT scenario_id, missed_elements FROM rc_grades
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 300`,
    [user.userId],
  )
  const grades = r.rows.map((row) => ({
    scenario_id: row.scenario_id,
    missed_elements: Array.isArray(row.missed_elements) ? row.missed_elements : [],
  }))

  const weakspots = computeWeakspots(grades)
    .slice(0, 4)
    .map((w) => ({ ...w, drill: drillScenariosFor(w.key) }))

  return NextResponse.json({ weakspots })
}
