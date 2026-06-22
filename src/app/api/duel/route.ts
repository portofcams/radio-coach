import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { getScenario } from '@/lib/scenarios'

// Create a duel from a completed scenario (anyone — shareable). Rate-limited.
export async function POST(req: NextRequest) {
  if (!rateLimit(`duel:${clientIp(req)}`, 20, 600_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const b = await req.json()
  const scenarioId = String(b.scenarioId ?? '')
  if (!getScenario(scenarioId)) return NextResponse.json({ error: 'bad_scenario' }, { status: 400 })
  const score = Math.max(0, Math.min(100, Math.round(Number(b.score) || 0)))
  const name = (String(b.name ?? '').trim().slice(0, 40)) || 'A pilot'
  const r = await db.query(
    'INSERT INTO rc_duels (scenario_id, creator_name, creator_score) VALUES ($1,$2,$3) RETURNING id',
    [scenarioId, name, score],
  )
  return NextResponse.json({ id: r.rows[0].id })
}
