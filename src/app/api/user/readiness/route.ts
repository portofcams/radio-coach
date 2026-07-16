import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { computeReadiness } from '@/lib/readiness'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const r = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM rc_grades WHERE user_id = $1 AND role = 'pilot') AS attempts,
       (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades WHERE user_id = $1 AND role = 'pilot') AS passed_count,
       (SELECT COUNT(DISTINCT scenario_id) FROM rc_grades WHERE user_id = $1 AND passed AND role = 'pilot') AS distinct_passed,
       (SELECT ROUND(AVG(score)) FROM (
          SELECT score FROM rc_grades WHERE user_id = $1 AND role = 'pilot' ORDER BY created_at DESC LIMIT 30
       ) t) AS recent_avg`,
    [user.userId],
  )
  const row = r.rows[0]
  const readiness = computeReadiness({
    attempts: parseInt(row.attempts) || 0,
    passedCount: parseInt(row.passed_count) || 0,
    distinctPassed: parseInt(row.distinct_passed) || 0,
    recentAvg: parseInt(row.recent_avg) || 0,
  })
  return NextResponse.json(readiness)
}
