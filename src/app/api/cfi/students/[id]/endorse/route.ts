import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getStudentRow, ENDORSEMENT_KINDS } from '@/lib/cfi'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const row = await getStudentRow(db, user.userId, parseInt(id))
  if (!row || !row.student_user_id) return NextResponse.json({ error: 'not_joined' }, { status: 404 })

  const { kind, remove } = await req.json()
  if (!ENDORSEMENT_KINDS.some((e) => e.key === kind)) return NextResponse.json({ error: 'bad_kind' }, { status: 400 })

  if (remove) {
    await db.query('DELETE FROM rc_endorsements WHERE cfi_user_id = $1 AND student_user_id = $2 AND kind = $3', [user.userId, row.student_user_id, kind])
  } else {
    const dup = await db.query('SELECT 1 FROM rc_endorsements WHERE cfi_user_id = $1 AND student_user_id = $2 AND kind = $3', [user.userId, row.student_user_id, kind])
    if (!dup.rows[0]) {
      await db.query('INSERT INTO rc_endorsements (cfi_user_id, student_user_id, kind) VALUES ($1, $2, $3)', [user.userId, row.student_user_id, kind])
    }
  }
  return NextResponse.json({ ok: true })
}
