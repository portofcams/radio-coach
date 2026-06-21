import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

/** An instructor claims a flight-school invite token. */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const r = await db.query('SELECT id, school_id, user_id FROM rc_school_members WHERE token = $1', [token])
  const row = r.rows[0]
  if (!row) return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
  if (row.user_id && row.user_id !== user.userId) return NextResponse.json({ error: 'already_claimed' }, { status: 409 })

  await db.query(
    `UPDATE rc_school_members
       SET user_id = $1, status = 'active', email = COALESCE(email, (SELECT email FROM rc_users WHERE id = $1))
     WHERE id = $2`,
    [user.userId, row.id],
  )
  const sc = await db.query('SELECT name FROM rc_schools WHERE id = $1', [row.school_id])
  return NextResponse.json({ ok: true, school: sc.rows[0]?.name ?? null })
}
