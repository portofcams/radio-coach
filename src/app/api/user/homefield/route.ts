import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = clean(body.name, 40)
  const tower = clean(body.tower, 12)
  const runway = clean(body.runway, 6).toUpperCase()

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  // All-or-nothing: a partial home field can't generate scenarios, so blank one clears all.
  const complete = name && tower && runway
  await db.query(
    'UPDATE rc_users SET home_name = $1, home_tower = $2, home_runway = $3 WHERE id = $4',
    complete ? [name, tower, runway, user.userId] : [null, null, null, user.userId],
  )

  return NextResponse.json({ home: complete ? { name, tower, runway } : null })
}
