import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { callsign } = await req.json()
  const clean = (callsign ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  await db.query('UPDATE rc_users SET callsign = $1 WHERE id = $2', [clean || null, user.userId])
  return NextResponse.json({ callsign: clean || null })
}
