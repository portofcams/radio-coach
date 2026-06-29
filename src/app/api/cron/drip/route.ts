import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { composeDrip, DRIP } from '@/lib/drip'
import { emailConfigured, sendEmail } from '@/lib/resend'

const APP_URL = process.env.APP_URL || 'https://clearsparradio.binnacleai.com'

/**
 * Drip sender. DRY-RUN BY DEFAULT — sends nothing unless ?send=1 AND a Resend key
 * is configured. Secret-gated. Sends at most one (the next due) email per subscriber
 * per run, paced one day apart. ?sample=<email> sends a single test of a given day.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  const given = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
  if (given !== secret) return NextResponse.json({ error: 'forbidden' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Test mode: one email of a given day to a single address.
  const sampleTo = req.nextUrl.searchParams.get('sample')
  if (sampleTo) {
    if (!emailConfigured()) return NextResponse.json({ error: 'no_email_key' }, { status: 503 })
    const day = Math.max(0, Math.min(DRIP.length - 1, parseInt(req.nextUrl.searchParams.get('day') || '0')))
    const m = composeDrip(day, { unsubUrl: `${APP_URL}/api/drip/unsub?token=sample`, appUrl: APP_URL })!
    const r = await sendEmail({ to: sampleTo, subject: m.subject, html: m.html, text: m.text })
    return NextResponse.json({ mode: 'sample', day, to: sampleTo, sent: r.ok, error: r.error })
  }

  const live = req.nextUrl.searchParams.get('send') === '1' && emailConfigured()
  const subs = await db.query(
    `SELECT id, email, day_sent, unsub_token,
       FLOOR(EXTRACT(EPOCH FROM (now() - created_at)) / 86400)::int AS days_in
     FROM rc_drip_subscribers WHERE opted_out = false ORDER BY id LIMIT 1000`,
  )
  const results: Array<{ to: string; day: number; sent?: boolean }> = []
  for (const s of subs.rows) {
    const dueDay = Math.min(DRIP.length - 1, s.days_in) // day index a subscriber should have received
    const nextDay = s.day_sent + 1
    if (nextDay > dueDay || nextDay >= DRIP.length) continue // nothing due (or finished)
    const m = composeDrip(nextDay, { unsubUrl: `${APP_URL}/api/drip/unsub?token=${s.unsub_token}`, appUrl: APP_URL })
    if (!m) continue
    if (live) {
      const r = await sendEmail({ to: s.email, subject: m.subject, html: m.html, text: m.text })
      if (r.ok) await db.query('UPDATE rc_drip_subscribers SET day_sent = $1, last_sent = now() WHERE id = $2', [nextDay, s.id])
      results.push({ to: s.email, day: nextDay, sent: r.ok })
    } else {
      results.push({ to: s.email, day: nextDay })
    }
  }
  return NextResponse.json({
    mode: live ? 'live' : 'dry-run',
    emailConfigured: emailConfigured(),
    due: results.length,
    sent: live ? results.filter((r) => r.sent).length : 0,
    sample: results.slice(0, 10),
  })
}
