import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { captureMessage } from '@/lib/glitchtip'

const KINDS = ['bug', 'idea', 'general']

export async function POST(req: NextRequest) {
  if (!rateLimit(`fb:${clientIp(req)}`, 6, 600_000)) return NextResponse.json({ ok: false }, { status: 429 })
  const db = getPool()
  if (!db) return NextResponse.json({ ok: false }, { status: 503 })

  const b = await req.json()
  const message = (b.message ?? '').toString().trim().slice(0, 2000)
  if (!message) return NextResponse.json({ error: 'empty' }, { status: 400 })
  const kind = KINDS.includes(b.kind) ? b.kind : 'general'

  const user = await getAuthUser()
  const email = user?.email ?? ((b.email ?? '').toString().trim().slice(0, 200) || null)
  const url = (b.url ?? '').toString().slice(0, 300) || null

  await db.query(
    'INSERT INTO rc_feedback (user_id, email, kind, message, url, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
    [user?.userId ?? null, email, kind, message, url, req.headers.get('user-agent')?.slice(0, 300) ?? null],
  )
  // Surface it in GlitchTip too (no-op until DSN set).
  await captureMessage(`[feedback:${kind}] ${message.slice(0, 200)}`, 'info', { email, url })
  return NextResponse.json({ ok: true })
}
