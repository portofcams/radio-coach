import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// Lightweight first-party analytics beacon. Anonymous (random localStorage id),
// no cookies, no PII — just pageviews/events with a web/ios/android platform tag
// so we can see visitors, sessions, and app-vs-web split. Best-effort: never
// throws, never blocks the client.
export async function POST(req: NextRequest) {
  const db = getPool()
  if (!db) return NextResponse.json({ ok: false })
  try {
    const { event, path, platform, anonId, referrer } = await req.json()
    if (!event || typeof event !== 'string') return NextResponse.json({ ok: false })
    const plat = platform === 'ios' || platform === 'android' ? platform : 'web'
    await db
      .query(
        `INSERT INTO rc_events (anon_id, event, path, platform, referrer) VALUES ($1,$2,$3,$4,$5)`,
        [
          (anonId || '').slice(0, 40) || null,
          event.slice(0, 40),
          (path || '').slice(0, 200) || null,
          plat,
          (referrer || '').slice(0, 200) || null,
        ],
      )
      .catch(() => {})
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
