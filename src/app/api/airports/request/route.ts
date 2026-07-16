import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { lookupAirport } from '@/lib/airports'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { requestAirport } from '@/lib/airport-requests'
import { captureMessage } from '@/lib/glitchtip'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`airport-req:${clientIp(req)}`, 10, 3_600_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const b = await req.json()
  const ident = (b.ident ?? '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  const note = (b.note ?? '').toString().trim().slice(0, 300) || null
  if (ident.length < 3) return NextResponse.json({ error: 'invalid_ident' }, { status: 400 })
  if (lookupAirport(ident)) return NextResponse.json({ error: 'already_available', ident }, { status: 409 })

  const { requestCount, alreadyRequested } = await requestAirport(db, ident, user.userId, note)
  await captureMessage(`[airport-request] ${ident} (${requestCount} pilot${requestCount === 1 ? '' : 's'})`, 'info', { ident, note })
  return NextResponse.json({ ok: true, ident, requestCount, alreadyRequested })
}
