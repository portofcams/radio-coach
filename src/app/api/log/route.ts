import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { captureMessage } from '@/lib/glitchtip'

/** Capture a client-side error (window.onerror / unhandledrejection). Rate-limited. */
export async function POST(req: NextRequest) {
  if (!rateLimit(`log:${clientIp(req)}`, 20, 600_000)) return NextResponse.json({ ok: false }, { status: 429 })
  const db = getPool()
  try {
    const b = await req.json()
    const t = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : null)
    if (db) {
      await db.query(
        'INSERT INTO rc_logs (level, message, url, stack, user_agent) VALUES ($1, $2, $3, $4, $5)',
        ['error', t(b.message, 500), t(b.url, 300), t(b.stack, 2000), t(req.headers.get('user-agent'), 300)],
      )
    }
    // Also forward to GlitchTip (no-op until GLITCHTIP_DSN is set).
    await captureMessage(`[client] ${t(b.message, 500) ?? 'error'}`, 'error', { url: t(b.url, 300), stack: t(b.stack, 2000) })
  } catch { /* best-effort */ }
  return NextResponse.json({ ok: true })
}
