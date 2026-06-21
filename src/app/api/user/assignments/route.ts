import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

/** The logged-in student's CFI-assigned scenarios, with completion. */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ assignments: [] })
  const db = getPool()
  if (!db) return NextResponse.json({ assignments: [] })

  const r = await db.query(
    `SELECT a.scenario_id, a.created_at, a.due_at,
            EXISTS(SELECT 1 FROM rc_grades g WHERE g.user_id = $1 AND g.scenario_id = a.scenario_id AND g.passed) AS done
     FROM rc_assignments a
     WHERE a.student_user_id = $1
     ORDER BY (a.due_at IS NULL), a.due_at ASC, a.created_at DESC`,
    [user.userId],
  )
  return NextResponse.json({ assignments: r.rows })
}
