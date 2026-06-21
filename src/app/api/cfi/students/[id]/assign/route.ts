import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getStudentRow } from '@/lib/cfi'
import { getScenario } from '@/lib/scenarios'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const row = await getStudentRow(db, user.userId, parseInt(id))
  if (!row || !row.student_user_id) return NextResponse.json({ error: 'not_joined' }, { status: 404 })

  const { scenarioIds, dueInDays } = await req.json()
  const raw: string[] = Array.isArray(scenarioIds) ? scenarioIds.filter((s) => typeof s === 'string') : []
  // Optional deadline: a positive number of days from now.
  const days = Number(dueInDays)
  const dueAt = Number.isFinite(days) && days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null
  // valid = a static scenario, or one of this CFI's own custom scenarios
  const customIds = raw.filter((s) => s.startsWith('custom-')).map((s) => parseInt(s.replace(/^custom-/, '')))
  const ownedCustom = new Set<string>()
  if (customIds.length) {
    const cr = await db.query('SELECT id FROM rc_custom_scenarios WHERE cfi_user_id = $1 AND id = ANY($2)', [user.userId, customIds])
    cr.rows.forEach((r) => ownedCustom.add(`custom-${r.id}`))
  }
  const ids = raw.filter((s) => getScenario(s) || ownedCustom.has(s))
  if (!ids.length) return NextResponse.json({ error: 'no_valid_scenarios' }, { status: 400 })

  // Skip already-assigned (and not yet completed) duplicates.
  const existing = await db.query(
    'SELECT scenario_id FROM rc_assignments WHERE cfi_user_id = $1 AND student_user_id = $2',
    [user.userId, row.student_user_id],
  )
  const have = new Set(existing.rows.map((r) => r.scenario_id))
  const fresh = ids.filter((s) => !have.has(s))
  for (const sid of fresh) {
    await db.query(
      'INSERT INTO rc_assignments (cfi_user_id, student_user_id, scenario_id, due_at) VALUES ($1, $2, $3, $4)',
      [user.userId, row.student_user_id, sid, dueAt],
    )
  }
  // Applying a deadline also (re)sets it on any already-assigned items in this batch.
  if (dueAt) {
    await db.query(
      'UPDATE rc_assignments SET due_at = $1 WHERE cfi_user_id = $2 AND student_user_id = $3 AND scenario_id = ANY($4)',
      [dueAt, user.userId, row.student_user_id, ids],
    )
  }
  return NextResponse.json({ added: fresh.length, dueAt })
}
