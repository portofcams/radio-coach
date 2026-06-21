import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isSchoolOwner } from '@/lib/school-server'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isSchoolOwner(user.userId))) return NextResponse.json({ error: 'school_required' }, { status: 403 })
  // only delete a member of THIS owner's school
  await db.query(
    `DELETE FROM rc_school_members WHERE id = $1 AND school_id = (SELECT id FROM rc_schools WHERE owner_user_id = $2)`,
    [parseInt(id), user.userId],
  )
  return NextResponse.json({ ok: true })
}
