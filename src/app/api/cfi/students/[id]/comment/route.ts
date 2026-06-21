import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getStudentRow } from '@/lib/cfi'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const row = await getStudentRow(db, user.userId, parseInt(id))
  if (!row || !row.student_user_id) return NextResponse.json({ error: 'not_joined' }, { status: 404 })

  const payload = await req.json()
  const body = (payload.body ?? '').toString().trim().slice(0, 1000)
  const scenarioId = payload.scenarioId ? String(payload.scenarioId).slice(0, 60) : null
  if (!body) return NextResponse.json({ error: 'empty' }, { status: 400 })

  await db.query(
    'INSERT INTO rc_cfi_comments (cfi_user_id, student_user_id, body, scenario_id) VALUES ($1, $2, $3, $4)',
    [user.userId, row.student_user_id, body, scenarioId],
  )
  return NextResponse.json({ ok: true })
}
