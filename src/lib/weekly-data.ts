// SERVER-ONLY. Computes one user's weekly-report data from the DB and composes
// the email. Shared by the weekly cron (bulk) and the on-demand "email me my
// report" button so the two can never drift.
import type { Pool } from 'pg'
import { computeReadiness } from './readiness'
import { computeWeakspots } from './weakspots'
import { composeWeeklyReport } from './weekly-email'

export async function buildWeeklyReportFor(
  db: Pool,
  userId: number,
  opts: { callsign: string | null; appUrl: string; unsubUrl: string },
): Promise<{ subject: string; html: string; text: string; weekScenarios: number }> {
  const agg = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM rc_grades WHERE user_id=$1 AND role='pilot') AS attempts,
       (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades WHERE user_id=$1 AND role='pilot') AS passed,
       (SELECT COUNT(DISTINCT scenario_id) FROM rc_grades WHERE user_id=$1 AND passed AND role='pilot') AS distinct_passed,
       (SELECT ROUND(AVG(score)) FROM (SELECT score FROM rc_grades WHERE user_id=$1 AND role='pilot' ORDER BY created_at DESC LIMIT 30) t) AS recent_avg,
       (SELECT COUNT(*) FROM rc_grades WHERE user_id=$1 AND created_at > now()-interval '7 days' AND role='pilot') AS week_scenarios,
       (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades WHERE user_id=$1 AND created_at > now()-interval '7 days' AND role='pilot') AS week_passed`,
    [userId],
  )
  const a = agg.rows[0]
  const readiness = computeReadiness({
    attempts: parseInt(a.attempts) || 0,
    passedCount: parseInt(a.passed) || 0,
    distinctPassed: parseInt(a.distinct_passed) || 0,
    recentAvg: parseInt(a.recent_avg) || 0,
  })
  const grades = await db.query('SELECT scenario_id, missed_elements FROM rc_grades WHERE user_id=$1 AND role=\'pilot\' ORDER BY created_at DESC LIMIT 300', [userId])
  const top = computeWeakspots(grades.rows)[0]
  const weekScenarios = parseInt(a.week_scenarios) || 0

  const report = composeWeeklyReport({
    callsign: opts.callsign,
    weekScenarios,
    weekPassed: parseInt(a.week_passed) || 0,
    readinessScore: readiness.score,
    readinessLabel: readiness.label,
    topWeakspot: top?.label ?? null,
    unsubUrl: opts.unsubUrl,
    appUrl: opts.appUrl,
  })
  return { ...report, weekScenarios }
}
