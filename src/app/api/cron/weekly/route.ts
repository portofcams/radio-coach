import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getPool } from '@/lib/db'
import { computeReadiness } from '@/lib/readiness'
import { computeWeakspots } from '@/lib/weakspots'
import { composeWeeklyReport } from '@/lib/weekly-email'
import { emailConfigured, sendEmail } from '@/lib/resend'

const APP_URL = process.env.APP_URL || 'https://wilco.binnacleai.com'
const MAX_RECIPIENTS = 500

/**
 * Weekly "your radio report". DRY-RUN BY DEFAULT — it sends nothing unless
 * BOTH ?send=1 is passed AND a Resend key is configured. Secret-gated.
 * Targets: users with a real email + at least one graded scenario ever,
 * not opted out. Returns a summary of who would (or did) get an email.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  const given = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
  if (given !== secret) return NextResponse.json({ error: 'forbidden' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const wantSend = req.nextUrl.searchParams.get('send') === '1'
  const live = wantSend && emailConfigured()

  // Eligible: real-looking email, graded ≥1 scenario ever, not opted out.
  const elig = await db.query(
    `SELECT u.id, u.email, u.callsign, u.email_unsub_token
     FROM rc_users u
     WHERE u.email LIKE '%@%'
       AND u.email NOT LIKE '%@example.com'
       AND COALESCE(u.email_opt_out, false) = false
       AND EXISTS (SELECT 1 FROM rc_grades g WHERE g.user_id = u.id)
     ORDER BY u.id
     LIMIT ${MAX_RECIPIENTS}`,
  )

  const results: Array<{ to: string; subject: string; sent?: boolean; error?: string }> = []
  for (const u of elig.rows) {
    let token = u.email_unsub_token
    if (!token) {
      token = randomUUID()
      await db.query('UPDATE rc_users SET email_unsub_token = $1 WHERE id = $2', [token, u.id])
    }

    const agg = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM rc_grades WHERE user_id=$1) AS attempts,
         (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades WHERE user_id=$1) AS passed,
         (SELECT COUNT(DISTINCT scenario_id) FROM rc_grades WHERE user_id=$1 AND passed) AS distinct_passed,
         (SELECT ROUND(AVG(score)) FROM (SELECT score FROM rc_grades WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30) t) AS recent_avg,
         (SELECT COUNT(*) FROM rc_grades WHERE user_id=$1 AND created_at > now()-interval '7 days') AS week_scenarios,
         (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades WHERE user_id=$1 AND created_at > now()-interval '7 days') AS week_passed`,
      [u.id],
    )
    const a = agg.rows[0]
    const readiness = computeReadiness({
      attempts: parseInt(a.attempts) || 0,
      passedCount: parseInt(a.passed) || 0,
      distinctPassed: parseInt(a.distinct_passed) || 0,
      recentAvg: parseInt(a.recent_avg) || 0,
    })
    const grades = await db.query('SELECT scenario_id, missed_elements FROM rc_grades WHERE user_id=$1 ORDER BY created_at DESC LIMIT 300', [u.id])
    const top = computeWeakspots(grades.rows)[0]

    const report = composeWeeklyReport({
      callsign: u.callsign,
      weekScenarios: parseInt(a.week_scenarios) || 0,
      weekPassed: parseInt(a.week_passed) || 0,
      readinessScore: readiness.score,
      readinessLabel: readiness.label,
      topWeakspot: top?.label ?? null,
      unsubUrl: `${APP_URL}/api/unsubscribe?token=${token}`,
      appUrl: APP_URL,
    })

    if (live) {
      const r = await sendEmail({ to: u.email, subject: report.subject, html: report.html, text: report.text })
      if (r.ok) await db.query('UPDATE rc_users SET last_weekly_email = now() WHERE id = $1', [u.id])
      results.push({ to: u.email, subject: report.subject, sent: r.ok, error: r.error })
    } else {
      results.push({ to: u.email, subject: report.subject })
    }
  }

  return NextResponse.json({
    mode: live ? 'live' : 'dry-run',
    emailConfigured: emailConfigured(),
    recipients: results.length,
    sent: live ? results.filter((r) => r.sent).length : 0,
    sample: results.slice(0, 10),
  })
}
