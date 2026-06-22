import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getScenario } from '@/lib/scenarios'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const r = await db.query('SELECT scenario_id, creator_name, creator_score, attempts, beaten FROM rc_duels WHERE id=$1', [parseInt(id)])
  const d = r.rows[0]
  if (!d) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const sc = getScenario(d.scenario_id)
  return NextResponse.json({ ...d, scenarioTitle: sc?.title ?? d.scenario_id })
}

// Record an attempt result (opponent finished): increments counters.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const body = await _req.json().catch(() => ({}))
  const beat = body?.beat ? 1 : 0
  await db.query('UPDATE rc_duels SET attempts = attempts + 1, beaten = beaten + $2 WHERE id=$1', [parseInt(id), beat])
  return NextResponse.json({ ok: true })
}
