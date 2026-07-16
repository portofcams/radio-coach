import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { computeReadiness } from '@/lib/readiness'

const DEFAULT_WEEKS = 12
const MAX_WEEKS = 52 // clamp -- an unclamped `weeks` query param would let generate_series()
                      // fan out into hundreds of correlated subqueries per request

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const raw = parseInt(req.nextUrl.searchParams.get('weeks') ?? '')
  const weeks = Number.isFinite(raw) ? Math.max(1, Math.min(MAX_WEEKS, raw)) : DEFAULT_WEEKS

  // For each of the last `weeks` calendar weeks, reconstruct what
  // computeReadiness() would have returned as of that week's end -- same
  // shape as /api/user/readiness's own query, just re-run at N historical
  // cutoffs. The final bucket's cutoff is clamped to now() (not a future
  // Sunday) so the last point matches what GET /api/user/readiness returns
  // right now.
  const r = await db.query(
    `WITH bounds AS (
       SELECT
         gs AS week_start,
         LEAST(gs + interval '7 days', now()) AS week_end
       FROM generate_series(
         date_trunc('week', now()) - ($2::int - 1) * interval '1 week',
         date_trunc('week', now()),
         interval '1 week'
       ) AS gs
     )
     SELECT
       to_char(b.week_end, 'YYYY-MM-DD') AS week_end,
       (SELECT COUNT(*) FROM rc_grades g WHERE g.user_id = $1 AND g.created_at <= b.week_end AND g.role = 'pilot') AS attempts,
       (SELECT COUNT(*) FILTER (WHERE g.passed) FROM rc_grades g WHERE g.user_id = $1 AND g.created_at <= b.week_end AND g.role = 'pilot') AS passed_count,
       (SELECT COUNT(DISTINCT g.scenario_id) FROM rc_grades g WHERE g.user_id = $1 AND g.passed AND g.created_at <= b.week_end AND g.role = 'pilot') AS distinct_passed,
       (SELECT ROUND(AVG(t.score)) FROM (
          SELECT score FROM rc_grades WHERE user_id = $1 AND created_at <= b.week_end AND role = 'pilot' ORDER BY created_at DESC LIMIT 30
        ) t) AS recent_avg,
       (SELECT COUNT(*) FROM rc_grades g WHERE g.user_id = $1 AND g.created_at > b.week_start AND g.created_at <= b.week_end AND g.role = 'pilot') AS week_attempts
     FROM bounds b
     ORDER BY b.week_start`,
    [user.userId, weeks],
  )

  const points = r.rows.map((row) => {
    const readiness = computeReadiness({
      attempts: parseInt(row.attempts) || 0,
      passedCount: parseInt(row.passed_count) || 0,
      distinctPassed: parseInt(row.distinct_passed) || 0,
      recentAvg: parseInt(row.recent_avg) || 0,
    })
    return {
      weekEnd: row.week_end as string,
      score: readiness.score,
      level: readiness.level,
      cumulativeAttempts: parseInt(row.attempts) || 0,
      weekAttempts: parseInt(row.week_attempts) || 0,
    }
  })

  // Trim leading weeks before the user's first-ever grade -- cumulativeAttempts
  // stays 0 until then -- so a brand-new account doesn't render a flat line of
  // zero-score weeks before they'd even started.
  const firstActive = points.findIndex((p) => p.cumulativeAttempts > 0)
  const weeksOut = firstActive === -1 ? [] : points.slice(firstActive)

  return NextResponse.json({ weeks: weeksOut })
}
