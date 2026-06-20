import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { lookupAirport } from '@/lib/airports'
import { resolveHomeProfile } from '@/lib/home-server'

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const ident = clean(body.ident, 8).toUpperCase()
  const name = clean(body.name, 40)
  const tower = clean(body.tower, 12)
  const runway = clean(body.runway, 6).toUpperCase()

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // Prefer a real, listed field by ident; else a complete manual field; else clear.
  if (ident && lookupAirport(ident)) {
    await db.query(
      'UPDATE rc_users SET home_ident = $1, home_name = NULL, home_tower = NULL, home_runway = NULL WHERE id = $2',
      [ident, user.userId],
    )
  } else if (ident) {
    return NextResponse.json({ error: 'unknown_ident', ident }, { status: 404 })
  } else if (name && tower && runway) {
    await db.query(
      'UPDATE rc_users SET home_ident = NULL, home_name = $1, home_tower = $2, home_runway = $3 WHERE id = $4',
      [name, tower, runway, user.userId],
    )
  } else {
    await db.query(
      'UPDATE rc_users SET home_ident = NULL, home_name = NULL, home_tower = NULL, home_runway = NULL WHERE id = $1',
      [user.userId],
    )
  }

  const r = await db.query(
    'SELECT home_ident, home_name, home_tower, home_runway FROM rc_users WHERE id = $1',
    [user.userId],
  )
  return NextResponse.json({ home: resolveHomeProfile(r.rows[0]) })
}
