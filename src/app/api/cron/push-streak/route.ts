import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { pushToUser } from '@/lib/push-server'
import { apnsConfigured } from '@/lib/apns'

/**
 * Streak-reminder push. DRY-RUN BY DEFAULT — sends nothing unless ?send=1 AND
 * the APNs key is configured. Secret-gated. Targets pilots with an iOS device
 * who practiced in the last ~36h but not yet today, so they don't break a daily
 * habit. ?test=<userId> pushes one user immediately (end-to-end APNs check).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  const given = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
  if (given !== secret) return NextResponse.json({ error: 'forbidden' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Test mode: push ONE user right now to verify the APNs path to a real device.
  const test = req.nextUrl.searchParams.get('test')
  if (test) {
    const uid = parseInt(test)
    if (!Number.isFinite(uid)) return NextResponse.json({ error: 'bad_user' }, { status: 400 })
    const res = await pushToUser(db, uid, {
      title: 'Clearspar Radio Trainer',
      body: 'Push is wired up — your radio reminders are live.',
      data: { type: 'test' },
    })
    return NextResponse.json({ mode: 'test', user: uid, ...res })
  }

  const wantSend = req.nextUrl.searchParams.get('send') === '1'
  const live = wantSend && apnsConfigured()

  const rows = await db.query(
    `SELECT u.id, u.callsign,
       (SELECT MAX(created_at) FROM rc_grades g WHERE g.user_id = u.id AND g.role = 'pilot') AS last_at,
       (SELECT COUNT(*) FROM rc_grades g WHERE g.user_id = u.id AND g.created_at::date = (now() AT TIME ZONE 'UTC')::date AND g.role = 'pilot') AS today
     FROM rc_users u
     WHERE EXISTS (SELECT 1 FROM rc_push_tokens p WHERE p.user_id = u.id AND p.platform = 'ios')`,
  )
  const now = Date.now()
  const targets = rows.rows.filter((r) => {
    if (parseInt(r.today) > 0) return false
    if (!r.last_at) return false
    const ageH = (now - new Date(r.last_at).getTime()) / 3_600_000
    return ageH >= 12 && ageH <= 36
  })

  const results: Array<{ user: number; sent?: number }> = []
  for (const t of targets) {
    if (live) {
      const res = await pushToUser(db, t.id, {
        title: 'Keep your radio streak alive',
        body: 'A two-minute readback keeps the phraseology — and your streak — sharp.',
        data: { type: 'streak' },
      })
      results.push({ user: t.id, sent: res.sent })
    } else {
      results.push({ user: t.id })
    }
  }

  return NextResponse.json({
    mode: live ? 'live' : 'dry-run',
    apnsConfigured: apnsConfigured(),
    candidates: targets.length,
    sent: live ? results.reduce((n, r) => n + (r.sent || 0), 0) : 0,
    sample: results.slice(0, 20),
  })
}
