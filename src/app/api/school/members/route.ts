import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isSchoolOwner, ensureSchool, schoolMembers } from '@/lib/school-server'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isSchoolOwner(user.userId))) return NextResponse.json({ error: 'school_required' }, { status: 403 })

  const email = ((await req.json()).email ?? '').toString().trim().toLowerCase()
  if (!email.includes('@')) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  const school = await ensureSchool(db, user.userId)
  const existing = await db.query('SELECT id FROM rc_users WHERE email = $1', [email])
  const memberUserId: number | null = existing.rows[0]?.id ?? null

  const dup = await db.query(
    `SELECT id FROM rc_school_members WHERE school_id = $1 AND (email = $2 OR (user_id IS NOT NULL AND user_id = $3))`,
    [school.id, email, memberUserId],
  )
  if (dup.rows[0]) return NextResponse.json({ error: 'already_added' }, { status: 409 })

  await db.query(
    `INSERT INTO rc_school_members (school_id, user_id, email, token, role, status)
     VALUES ($1, $2, $3, $4, 'instructor', $5)`,
    [school.id, memberUserId, email, randomUUID(), memberUserId ? 'active' : 'pending'],
  )
  return NextResponse.json({ members: await schoolMembers(db, school.id, req.nextUrl.origin) })
}
