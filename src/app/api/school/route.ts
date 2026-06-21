import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isSchoolOwner, ensureSchool, schoolMembers } from '@/lib/school-server'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isSchoolOwner(user.userId))) return NextResponse.json({ error: 'school_required' }, { status: 403 })
  const school = await ensureSchool(db, user.userId)
  return NextResponse.json({ school, members: await schoolMembers(db, school.id, req.nextUrl.origin) })
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isSchoolOwner(user.userId))) return NextResponse.json({ error: 'school_required' }, { status: 403 })
  const name = ((await req.json()).name ?? '').toString().trim().slice(0, 60) || 'My Flight School'
  await db.query('UPDATE rc_schools SET name = $1 WHERE owner_user_id = $2', [name, user.userId])
  return NextResponse.json({ ok: true, name })
}
