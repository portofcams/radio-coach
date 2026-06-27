import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getStudentRow } from '@/lib/cfi'
import { pushToUser } from '@/lib/push-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const row = await getStudentRow(db, user.userId, parseInt(id))
  if (!row || !row.student_user_id) return NextResponse.json({ error: 'not_joined' }, { status: 404 })
  const studentId = row.student_user_id

  const payload = await req.json()
  const body = (payload.body ?? '').toString().trim().slice(0, 1000)
  let scenarioId = payload.scenarioId ? String(payload.scenarioId).slice(0, 60) : null
  if (!body) return NextResponse.json({ error: 'empty' }, { status: 400 })

  // Optional: attach the note to ONE specific graded attempt. Validate that the
  // grade belongs to THIS student before trusting the id, and adopt its scenario.
  let gradeId: number | null = null
  if (payload.gradeId != null) {
    const gid = parseInt(String(payload.gradeId))
    if (Number.isFinite(gid)) {
      const g = await db.query('SELECT id, scenario_id FROM rc_grades WHERE id = $1 AND user_id = $2', [gid, studentId])
      if (g.rows[0]) { gradeId = gid; scenarioId = g.rows[0].scenario_id }
    }
  }

  await db.query(
    'INSERT INTO rc_cfi_comments (cfi_user_id, student_user_id, body, scenario_id, grade_id) VALUES ($1, $2, $3, $4, $5)',
    [user.userId, studentId, body, scenarioId, gradeId],
  )

  // Notify the student on their devices (no-op until APNs key is configured).
  const where = scenarioId ? ` on ${scenarioId.replace(/-/g, ' ')}` : ''
  pushToUser(db, studentId, {
    title: 'New note from your instructor',
    body: `${body.slice(0, 120)}${where}`.trim(),
    data: { type: 'coach-note' },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
