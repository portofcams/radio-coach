// SERVER-ONLY. CFI Pro roster / assignments helpers.
import type { Pool } from 'pg'
import { getEntitlement } from './entitlement'
import { computeReadiness, type Readiness } from './readiness'

/** CFI Pro = an active subscription on the cfi plan. */
export async function isCfi(userId: number): Promise<boolean> {
  const ent = await getEntitlement(userId)
  return !!ent.pro && ent.plan === 'cfi'
}

export interface RosterStudent {
  id: number
  status: string
  email: string
  callsign: string | null
  joined: boolean
  joinUrl: string | null
  attempts: number
  readiness: Readiness | null
}

export async function getRoster(db: Pool, cfiId: number, origin: string): Promise<RosterStudent[]> {
  const r = await db.query(
    `SELECT s.id, s.status, s.token, s.student_user_id, s.student_email,
            u.email AS user_email, u.callsign,
            (SELECT COUNT(*) FROM rc_grades g WHERE g.user_id = s.student_user_id) AS attempts,
            (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades g WHERE g.user_id = s.student_user_id) AS passed,
            (SELECT COUNT(DISTINCT scenario_id) FROM rc_grades g WHERE g.user_id = s.student_user_id AND passed) AS distinct_passed,
            (SELECT ROUND(AVG(score)) FROM (SELECT score FROM rc_grades g WHERE g.user_id = s.student_user_id ORDER BY created_at DESC LIMIT 30) t) AS recent_avg
     FROM rc_cfi_students s LEFT JOIN rc_users u ON u.id = s.student_user_id
     WHERE s.cfi_user_id = $1 ORDER BY s.created_at`,
    [cfiId],
  )
  return r.rows.map((row) => {
    const joined = !!row.student_user_id
    const attempts = parseInt(row.attempts) || 0
    return {
      id: row.id,
      status: row.status,
      email: row.user_email || row.student_email || '—',
      callsign: row.callsign ?? null,
      joined,
      joinUrl: joined ? null : `${origin}/cfi/join/${row.token}`,
      attempts,
      readiness: joined
        ? computeReadiness({
            attempts,
            passedCount: parseInt(row.passed) || 0,
            distinctPassed: parseInt(row.distinct_passed) || 0,
            recentAvg: parseInt(row.recent_avg) || 0,
          })
        : null,
    }
  })
}

/** A roster row that belongs to this CFI (or null). */
export async function getStudentRow(
  db: Pool,
  cfiId: number,
  rosterId: number,
): Promise<{ id: number; student_user_id: number | null; student_email: string | null; status: string } | null> {
  const r = await db.query(
    'SELECT id, student_user_id, student_email, status FROM rc_cfi_students WHERE id = $1 AND cfi_user_id = $2',
    [rosterId, cfiId],
  )
  return r.rows[0] ?? null
}
