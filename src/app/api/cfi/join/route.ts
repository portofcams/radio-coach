import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

/** A student claims a CFI invite token, linking their account to the roster row. */
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const r = await db.query('SELECT id, cfi_user_id, student_user_id FROM rc_cfi_students WHERE token = $1', [token])
  const row = r.rows[0]
  if (!row) return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
  if (row.cfi_user_id === user.userId) return NextResponse.json({ error: 'cannot_join_own' }, { status: 400 })
  if (row.student_user_id && row.student_user_id !== user.userId) {
    return NextResponse.json({ error: 'already_claimed' }, { status: 409 })
  }

  await db.query(
    `UPDATE rc_cfi_students
       SET student_user_id = $1, status = 'active',
           student_email = COALESCE(student_email, (SELECT email FROM rc_users WHERE id = $1))
     WHERE id = $2`,
    [user.userId, row.id],
  )
  const cfi = await db.query('SELECT email FROM rc_users WHERE id = $1', [row.cfi_user_id])
  return NextResponse.json({ ok: true, cfiEmail: cfi.rows[0]?.email ?? null })
}
