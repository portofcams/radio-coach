import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { computeReadiness } from '@/lib/readiness'

interface Member { you: boolean; label: string; score: number; level: string }

/** #93 -- students on the same CFI's roster can see an anonymized (by
 *  default) readiness comparison. Labels are assigned by roster JOIN order
 *  ("Student A" = whoever joined this CFI first), not by current rank, so a
 *  label always refers to the same real person across visits even as the
 *  display re-sorts by score. */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Same "first-joined active CFI wins" resolution as /api/user/coach.
  const cfiRow = await db.query(
    `SELECT s.cfi_user_id, u.cohort_names_visible
     FROM rc_cfi_students s JOIN rc_users u ON u.id = s.cfi_user_id
     WHERE s.student_user_id = $1 AND s.status = 'active'
     ORDER BY s.created_at LIMIT 1`,
    [user.userId],
  )
  const cfi = cfiRow.rows[0]
  if (!cfi) return NextResponse.json({ inCohort: false })

  const roster = await db.query(
    `SELECT s.student_user_id, u.callsign
     FROM rc_cfi_students s LEFT JOIN rc_users u ON u.id = s.student_user_id
     WHERE s.cfi_user_id = $1 AND s.status = 'active' AND s.student_user_id IS NOT NULL
     ORDER BY s.created_at ASC`,
    [cfi.cfi_user_id],
  )
  // A roster of 1 (just this student) has no one to compare against.
  if (roster.rows.length <= 1) return NextResponse.json({ inCohort: false })

  const ids: number[] = roster.rows.map((r) => r.student_user_id)
  const aggRes = await db.query(
    `SELECT user_id,
       COUNT(*) AS attempts,
       COUNT(*) FILTER (WHERE passed) AS passed,
       COUNT(DISTINCT scenario_id) FILTER (WHERE passed) AS distinct_passed,
       (SELECT ROUND(AVG(g2.score)) FROM (
          SELECT score FROM rc_grades WHERE user_id = g.user_id AND role = 'pilot' ORDER BY created_at DESC LIMIT 30
        ) g2) AS recent_avg
     FROM rc_grades g
     WHERE user_id = ANY($1) AND role = 'pilot'
     GROUP BY user_id`,
    [ids],
  )
  const byUser = new Map<number, (typeof aggRes.rows)[number]>(aggRes.rows.map((r) => [r.user_id, r]))

  const members: Member[] = roster.rows.map((r, i) => {
    const a = byUser.get(r.student_user_id)
    const readiness = computeReadiness({
      attempts: parseInt(a?.attempts) || 0,
      passedCount: parseInt(a?.passed) || 0,
      distinctPassed: parseInt(a?.distinct_passed) || 0,
      recentAvg: parseInt(a?.recent_avg) || 0,
    })
    const you = r.student_user_id === user.userId
    return {
      you,
      label: you ? 'You' : (cfi.cohort_names_visible ? (r.callsign || 'Student pilot') : `Student ${String.fromCharCode(65 + i)}`),
      score: readiness.score,
      level: readiness.level,
    }
  })
  members.sort((a, b) => b.score - a.score)

  return NextResponse.json({ inCohort: true, namesVisible: !!cfi.cohort_names_visible, members })
}
