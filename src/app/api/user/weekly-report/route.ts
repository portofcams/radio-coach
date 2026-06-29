import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { emailConfigured, sendEmail } from '@/lib/resend'
import { buildWeeklyReportFor } from '@/lib/weekly-data'
import { rateLimit, clientIp } from '@/lib/ratelimit'

const APP_URL = process.env.APP_URL || 'https://clearsparradio.binnacleai.com'

/** Send the logged-in pilot their OWN weekly radio report on demand.
 * User-initiated + transactional, so opt-out doesn't apply; rate-limited. */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!emailConfigured()) return NextResponse.json({ error: 'no_email_key' }, { status: 503 })

  if (!rateLimit(`wr:${user.userId}`, 3, 60 * 60 * 1000) || !rateLimit(`wrip:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const u = await db.query('SELECT email, callsign, email_unsub_token FROM rc_users WHERE id = $1', [user.userId])
  const row = u.rows[0]
  if (!row?.email || !row.email.includes('@')) return NextResponse.json({ error: 'no_email' }, { status: 400 })

  let token = row.email_unsub_token
  if (!token) {
    token = randomUUID()
    await db.query('UPDATE rc_users SET email_unsub_token = $1 WHERE id = $2', [token, user.userId])
  }

  const report = await buildWeeklyReportFor(db, user.userId, {
    callsign: row.callsign,
    appUrl: APP_URL,
    unsubUrl: `${APP_URL}/api/unsubscribe?token=${token}`,
  })
  const r = await sendEmail({ to: row.email, subject: report.subject, html: report.html, text: report.text })
  if (!r.ok) return NextResponse.json({ error: r.error || 'send_failed' }, { status: 502 })
  await db.query('UPDATE rc_users SET last_weekly_email = now() WHERE id = $1', [user.userId]).catch(() => {})
  return NextResponse.json({ ok: true, to: row.email })
}
