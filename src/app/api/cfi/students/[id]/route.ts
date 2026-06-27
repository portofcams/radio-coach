import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getStudentRow } from '@/lib/cfi'
import { computeWeakspots } from '@/lib/weakspots'
import { computeReadiness } from '@/lib/readiness'

type Guard = { user: { userId: number }; db: NonNullable<ReturnType<typeof getPool>>; row: NonNullable<Awaited<ReturnType<typeof getStudentRow>>> }

async function guard(id: string): Promise<NextResponse | Guard> {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })
  const row = await getStudentRow(db, user.userId, parseInt(id))
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return { user, db, row }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard(id)
  if (g instanceof NextResponse) return g
  const { user, db, row } = g
  const sid = row.student_user_id
  if (!sid) {
    return NextResponse.json({ joined: false, email: row.student_email, weakspots: [], readiness: null, recent: [], assignments: [] })
  }

  const [gradesRes, aggRes, recentRes, assignRes, profile, commentsRes, endorseRes] = await Promise.all([
    db.query('SELECT scenario_id, missed_elements FROM rc_grades WHERE user_id = $1 ORDER BY created_at DESC LIMIT 300', [sid]),
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM rc_grades WHERE user_id=$1) AS attempts,
         (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades WHERE user_id=$1) AS passed,
         (SELECT COUNT(DISTINCT scenario_id) FROM rc_grades WHERE user_id=$1 AND passed) AS distinct_passed,
         (SELECT ROUND(AVG(score)) FROM (SELECT score FROM rc_grades WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30) t) AS recent_avg`,
      [sid],
    ),
    db.query('SELECT id, scenario_id, score, passed, created_at FROM rc_grades WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12', [sid]),
    db.query(
      `SELECT a.scenario_id, a.created_at,
              EXISTS(SELECT 1 FROM rc_grades g WHERE g.user_id = $2 AND g.scenario_id = a.scenario_id AND g.passed) AS done
       FROM rc_assignments a WHERE a.cfi_user_id = $1 AND a.student_user_id = $2 ORDER BY a.created_at DESC`,
      [user.userId, sid],
    ),
    db.query('SELECT email, callsign FROM rc_users WHERE id = $1', [sid]),
    db.query('SELECT id, body, scenario_id, grade_id, created_at FROM rc_cfi_comments WHERE cfi_user_id = $1 AND student_user_id = $2 ORDER BY created_at DESC LIMIT 50', [user.userId, sid]),
    db.query('SELECT kind FROM rc_endorsements WHERE cfi_user_id = $1 AND student_user_id = $2', [user.userId, sid]),
  ])

  const a = aggRes.rows[0]
  return NextResponse.json({
    joined: true,
    email: profile.rows[0]?.email ?? row.student_email,
    callsign: profile.rows[0]?.callsign ?? null,
    weakspots: computeWeakspots(gradesRes.rows).slice(0, 5),
    readiness: computeReadiness({
      attempts: parseInt(a.attempts) || 0,
      passedCount: parseInt(a.passed) || 0,
      distinctPassed: parseInt(a.distinct_passed) || 0,
      recentAvg: parseInt(a.recent_avg) || 0,
    }),
    recent: recentRes.rows,
    assignments: assignRes.rows,
    comments: commentsRes.rows,
    endorsements: endorseRes.rows.map((r) => r.kind),
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard(id)
  if (g instanceof NextResponse) return g
  await g.db.query('DELETE FROM rc_cfi_students WHERE id = $1 AND cfi_user_id = $2', [parseInt(id), g.user.userId])
  return NextResponse.json({ ok: true })
}
