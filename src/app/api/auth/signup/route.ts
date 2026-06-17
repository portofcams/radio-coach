import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { hashPassword, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'Auth not available' }, { status: 503 })

  const { email, password } = await req.json()

  if (!email?.includes('@') || !password || password.length < 6) {
    return NextResponse.json({ error: 'Valid email and password (6+ chars) required' }, { status: 400 })
  }

  const existing = await db.query('SELECT id FROM rc_users WHERE email = $1', [email.toLowerCase()])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hash = await hashPassword(password)
  const result = await db.query(
    'INSERT INTO rc_users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email.toLowerCase(), hash]
  )
  const user = result.rows[0]

  await setAuthCookie({ userId: user.id, email: user.email })
  return NextResponse.json({ user: { id: user.id, email: user.email } })
}
