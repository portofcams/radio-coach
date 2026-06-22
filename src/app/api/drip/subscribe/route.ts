import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/ratelimit'

function token(): string {
  let s = ''
  for (let i = 0; i < 24; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

// Enroll an email in the 7-day course. Does NOT send — the cron handles delivery
// (dry-run until enabled), per the email-caution rule.
export async function POST(req: NextRequest) {
  if (!rateLimit(`drip:${clientIp(req)}`, 5, 600_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const { email } = await req.json()
  const clean = (email ?? '').toString().trim().toLowerCase()
  if (!clean.includes('@') || clean.length > 200 || clean.endsWith('@example.com')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  await db.query(
    `INSERT INTO rc_drip_subscribers (email, unsub_token) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET opted_out = false`,
    [clean, token()],
  )
  return NextResponse.json({ ok: true })
}
