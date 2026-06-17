import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ user: null })

  const db = getPool()
  if (!db) return NextResponse.json({ user: null })

  const result = await db.query(
    'SELECT id, email, callsign FROM rc_users WHERE id = $1',
    [user.userId]
  )
  const row = result.rows[0]
  if (!row) return NextResponse.json({ user: null })

  return NextResponse.json({ user: { id: row.id, email: row.email, callsign: row.callsign } })
}
