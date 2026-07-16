// SERVER-ONLY. CFI Pro roster / assignments helpers.
import type { Pool } from 'pg'
import { getEntitlement } from './entitlement'
import { computeReadiness, type Readiness } from './readiness'
export { ENDORSEMENT_KINDS, endorsementLabel } from './endorsements'

/** CFI capability = an active cfi sub, a flight-school owner, or a school instructor.
 * (getEntitlement reports plan 'cfi' for school instructors, 'school' for owners.) */
export async function isCfi(userId: number): Promise<boolean> {
  const ent = await getEntitlement(userId)
  return !!ent.pro && (ent.plan === 'cfi' || ent.plan === 'school')
}

export interface RosterStudent {
  id: number
  status: string
  email: string
  callsign: string | null
  joined: boolean
  joinUrl: string | null
  attempts: number
  weekCount: number
  lastDays: number | null
  flag: 'ready' | 'almost' | 'needs-work' | 'inactive' | 'new' | null
  readiness: Readiness | null
}

export async function getRoster(db: Pool, cfiId: number, origin: string): Promise<RosterStudent[]> {
  const r = await db.query(
    `SELECT s.id, s.status, s.token, s.student_user_id, s.student_email,
            u.email AS user_email, u.callsign,
            (SELECT COUNT(*) FROM rc_grades g WHERE g.user_id = s.student_user_id AND g.role = 'pilot') AS attempts,
            (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades g WHERE g.user_id = s.student_user_id AND g.role = 'pilot') AS passed,
            (SELECT COUNT(DISTINCT scenario_id) FROM rc_grades g WHERE g.user_id = s.student_user_id AND passed AND g.role = 'pilot') AS distinct_passed,
            (SELECT ROUND(AVG(score)) FROM (SELECT score FROM rc_grades g WHERE g.user_id = s.student_user_id AND g.role = 'pilot' ORDER BY created_at DESC LIMIT 30) t) AS recent_avg,
            (SELECT COUNT(*) FROM rc_grades g WHERE g.user_id = s.student_user_id AND g.created_at > now()-interval '7 days' AND g.role = 'pilot') AS week,
            (SELECT EXTRACT(EPOCH FROM now() - MAX(created_at))/86400 FROM rc_grades g WHERE g.user_id = s.student_user_id AND g.role = 'pilot') AS last_days
     FROM rc_cfi_students s LEFT JOIN rc_users u ON u.id = s.student_user_id
     WHERE s.cfi_user_id = $1 ORDER BY s.created_at`,
    [cfiId],
  )
  return r.rows.map((row) => {
    const joined = !!row.student_user_id
    const attempts = parseInt(row.attempts) || 0
    const weekCount = parseInt(row.week) || 0
    const lastDays = row.last_days != null ? Math.floor(parseFloat(row.last_days)) : null
    const readiness = joined
      ? computeReadiness({
          attempts,
          passedCount: parseInt(row.passed) || 0,
          distinctPassed: parseInt(row.distinct_passed) || 0,
          recentAvg: parseInt(row.recent_avg) || 0,
        })
      : null
    let flag: RosterStudent['flag'] = null
    if (joined) {
      if (attempts === 0) flag = 'new'
      else if (lastDays != null && lastDays > 10) flag = 'inactive'
      else if (readiness?.level === 'ready') flag = 'ready'
      else if (readiness?.level === 'almost') flag = 'almost'
      else flag = 'needs-work'
    }
    return {
      id: row.id,
      status: row.status,
      email: row.user_email || row.student_email || '—',
      callsign: row.callsign ?? null,
      joined,
      joinUrl: joined ? null : `${origin}/cfi/join/${row.token}`,
      attempts,
      weekCount,
      lastDays,
      flag,
      readiness,
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
