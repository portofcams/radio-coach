import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getPool } from '@/lib/db'
import { composeWeeklyReport, composeCfiDigest } from '@/lib/weekly-email'
import { buildWeeklyReportFor } from '@/lib/weekly-data'
import { emailConfigured, sendEmail } from '@/lib/resend'
import { isCfi, getRoster } from '@/lib/cfi'

const APP_URL = process.env.APP_URL || 'https://clearsparradio.binnacleai.com'
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

  // Test mode: send ONE sample email to a single address (no real users touched).
  const sampleTo = req.nextUrl.searchParams.get('sample')
  if (sampleTo) {
    if (!emailConfigured()) return NextResponse.json({ error: 'no_email_key' }, { status: 503 })
    const report = composeWeeklyReport({
      callsign: 'N172SP', weekScenarios: 5, weekPassed: 4,
      readinessScore: 78, readinessLabel: 'Almost checkride ready',
      topWeakspot: 'Hold short', unsubUrl: `${APP_URL}/api/unsubscribe?token=sample`, appUrl: APP_URL,
    })
    const r = await sendEmail({ to: sampleTo, subject: report.subject, html: report.html, text: report.text })
    return NextResponse.json({ mode: 'sample', to: sampleTo, sent: r.ok, error: r.error })
  }

  const wantSend = req.nextUrl.searchParams.get('send') === '1'
  const live = wantSend && emailConfigured()

  // Eligible: real-looking email, graded ≥1 scenario ever, not opted out.
  const elig = await db.query(
    `SELECT u.id, u.email, u.callsign, u.email_unsub_token
     FROM rc_users u
     WHERE u.email LIKE '%@%'
       AND u.email NOT LIKE '%@example.com'
       AND COALESCE(u.email_opt_out, false) = false
       AND EXISTS (SELECT 1 FROM rc_grades g WHERE g.user_id = u.id AND g.role = 'pilot')
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

    const report = await buildWeeklyReportFor(db, u.id, {
      callsign: u.callsign,
      appUrl: APP_URL,
      unsubUrl: `${APP_URL}/api/unsubscribe?token=${token}`,
    })

    if (live) {
      const r = await sendEmail({ to: u.email, subject: report.subject, html: report.html, text: report.text })
      if (r.ok) await db.query('UPDATE rc_users SET last_weekly_email = now() WHERE id = $1', [u.id])
      results.push({ to: u.email, subject: report.subject, sent: r.ok, error: r.error })
    } else {
      results.push({ to: u.email, subject: report.subject })
    }
  }

  // CFI weekly digests — "who's stuck / who's ready" to each entitled instructor.
  const cfiResults: Array<{ to: string; students: number; sent?: boolean; error?: string }> = []
  const cfiRows = await db.query('SELECT DISTINCT cfi_user_id FROM rc_cfi_students')
  for (const row of cfiRows.rows) {
    const cfiId: number = row.cfi_user_id
    if (!(await isCfi(cfiId))) continue
    const cu = await db.query(
      `SELECT email, callsign, email_unsub_token, COALESCE(email_opt_out,false) AS opt FROM rc_users WHERE id = $1`,
      [cfiId],
    )
    const c = cu.rows[0]
    if (!c || !c.email || !c.email.includes('@') || c.email.endsWith('@example.com') || c.opt) continue
    const roster = await getRoster(db, cfiId, APP_URL)
    const joined = roster.filter((s) => s.joined)
    if (joined.length === 0) continue

    let token = c.email_unsub_token
    if (!token) {
      token = randomUUID()
      await db.query('UPDATE rc_users SET email_unsub_token = $1 WHERE id = $2', [token, cfiId])
    }
    const digest = composeCfiDigest({
      instructorName: c.callsign,
      total: joined.length,
      ready: joined.filter((s) => s.flag === 'ready').length,
      needsWork: joined.filter((s) => s.flag === 'needs-work').length,
      inactive: joined.filter((s) => s.flag === 'inactive').length,
      activeThisWeek: joined.filter((s) => s.weekCount > 0).length,
      highlights: joined.filter((s) => s.flag === 'needs-work' || s.flag === 'ready')
        .slice(0, 8)
        .map((s) => ({ email: s.email, flag: s.flag ?? 'new', weekCount: s.weekCount, lastDays: s.lastDays })),
      unsubUrl: `${APP_URL}/api/unsubscribe?token=${token}`,
      appUrl: APP_URL,
    })
    if (live) {
      const r = await sendEmail({ to: c.email, subject: digest.subject, html: digest.html, text: digest.text })
      cfiResults.push({ to: c.email, students: joined.length, sent: r.ok, error: r.error })
    } else {
      cfiResults.push({ to: c.email, students: joined.length })
    }
  }

  return NextResponse.json({
    mode: live ? 'live' : 'dry-run',
    emailConfigured: emailConfigured(),
    recipients: results.length,
    sent: live ? results.filter((r) => r.sent).length : 0,
    sample: results.slice(0, 10),
    cfiDigests: { recipients: cfiResults.length, sent: live ? cfiResults.filter((r) => r.sent).length : 0, sample: cfiResults.slice(0, 10) },
  })
}
