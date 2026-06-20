import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getEntitlement } from '@/lib/entitlement'
import { resolveHomeProfile } from '@/lib/home-server'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ user: null })

  const db = getPool()
  if (!db) return NextResponse.json({ user: null })

  const result = await db.query(
    'SELECT id, email, callsign, home_ident, home_name, home_tower, home_runway FROM rc_users WHERE id = $1',
    [user.userId]
  )
  const row = result.rows[0]
  if (!row) return NextResponse.json({ user: null })

  const entitlement = await getEntitlement(row.id)
  const home = resolveHomeProfile(row)
  return NextResponse.json({
    user: { id: row.id, email: row.email, callsign: row.callsign, home },
    entitlement,
  })
}
