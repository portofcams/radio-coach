import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Overall stats
  const overall = await db.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE passed) AS passed,
       ROUND(AVG(score)) AS avg_score
     FROM rc_grades WHERE user_id = $1`,
    [user.userId]
  )

  // Stats by phase (join with scenario lookup via scenario_id prefix)
  const byPhase = await db.query(
    `SELECT
       CASE
         WHEN scenario_id LIKE 'ground%' OR scenario_id LIKE 'runway%' OR scenario_id LIKE 'engine%' OR scenario_id LIKE 'atis%' OR scenario_id LIKE 'hold%' OR scenario_id LIKE 'amended%' THEN 'ground'
         WHEN scenario_id LIKE 'class-d%' OR scenario_id LIKE 'line-up%' OR scenario_id LIKE 'departure%' OR scenario_id LIKE 'wake%' THEN 'departure'
         WHEN scenario_id LIKE 'pattern%' OR scenario_id LIKE 'sequence%' OR scenario_id LIKE 'go-around%' OR scenario_id LIKE 'cleared-for%' THEN 'pattern'
         WHEN scenario_id LIKE 'traffic%' OR scenario_id LIKE 'flight-following%' OR scenario_id LIKE 'vfr%' OR scenario_id LIKE 'class-c%' OR scenario_id LIKE 'frequency%' OR scenario_id LIKE 'descent%' OR scenario_id LIKE 'ctaf%' THEN 'enroute'
         WHEN scenario_id LIKE 'ifr%' OR scenario_id LIKE 'clearance%' THEN 'ifr'
         ELSE 'other'
       END AS phase,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE passed) AS passed,
       ROUND(AVG(score)) AS avg_score
     FROM rc_grades
     WHERE user_id = $1
     GROUP BY 1
     ORDER BY 1`,
    [user.userId]
  )

  // Missed elements frequency
  const mistakes = await db.query(
    `SELECT elem, COUNT(*) AS cnt
     FROM rc_grades, jsonb_array_elements_text(missed_elements) AS elem
     WHERE user_id = $1
     GROUP BY elem
     ORDER BY cnt DESC
     LIMIT 10`,
    [user.userId]
  )

  // Recent grades (last 20)
  const recent = await db.query(
    `SELECT scenario_id, score, passed, hint_used, created_at
     FROM rc_grades
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [user.userId]
  )

  // 30-day daily trend (avg score + count) for the analytics dashboard
  const trend = await db.query(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(*) AS n,
            ROUND(AVG(score)) AS avg,
            COUNT(*) FILTER (WHERE passed) AS passed
     FROM rc_grades
     WHERE user_id = $1 AND created_at > now() - interval '30 days'
     GROUP BY 1 ORDER BY 1`,
    [user.userId]
  )

  const o = overall.rows[0]
  return NextResponse.json({
    total: parseInt(o.total),
    passed: parseInt(o.passed),
    passRate: o.total > 0 ? Math.round((o.passed / o.total) * 100) : 0,
    avgScore: parseInt(o.avg_score) || 0,
    byPhase: byPhase.rows,
    topMistakes: mistakes.rows,
    recent: recent.rows,
    trend: trend.rows,
  })
}
