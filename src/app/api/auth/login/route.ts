import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { verifyPassword, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'Auth not available' }, { status: 503 })

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const result = await db.query(
    'SELECT id, email, password_hash FROM rc_users WHERE email = $1',
    [email.toLowerCase()]
  )
  const user = result.rows[0]

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await setAuthCookie({ userId: user.id, email: user.email })
  return NextResponse.json({ user: { id: user.id, email: user.email }, token })
}
