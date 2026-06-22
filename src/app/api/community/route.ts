import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { ruleGradeReadback } from '@/lib/rule-grader'
import type { Scenario } from '@/lib/types'

const str = (v: unknown, m: number) => (v == null ? null : String(v).trim().slice(0, m) || null)

// Browse approved community scenarios (top-voted first).
export async function GET() {
  const db = getPool()
  if (!db) return NextResponse.json({ scenarios: [] })
  const r = await db.query(
    `SELECT id, title, author_name, upvotes, airport, facility FROM rc_community_scenarios
     WHERE status='approved' ORDER BY upvotes DESC, created_at DESC LIMIT 100`,
  )
  return NextResponse.json({ scenarios: r.rows.map((s) => ({ ...s, id: `community-${s.id}` })) })
}

// Submit a scenario. Auto-validated: the author's own correct readback must pass
// the rule grader (so the scenario is internally consistent) → approved.
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const b = await req.json()
  const title = str(b.title, 80)
  const atc = str(b.atcTransmission, 600)
  const readback = str(b.correctReadback, 600)
  const elements = Array.isArray(b.requiredElements)
    ? b.requiredElements.map((e: unknown) => str(e, 80)).filter(Boolean).slice(0, 12) as string[]
    : []
  if (!title || !atc || !readback || elements.length === 0) {
    return NextResponse.json({ error: 'Title, ATC transmission, correct readback, and at least one required element are required.' }, { status: 400 })
  }

  // Validate: the supplied correct readback must satisfy the supplied elements.
  const probe = { id: 'probe', title, phase: 'pattern', difficulty: 2, airport: '', setup: '', atcTransmission: atc, requiredElements: elements, correctReadback: readback, commonMistakes: [] } as Scenario
  const g = ruleGradeReadback(probe, readback)
  if (g.score < 80) {
    return NextResponse.json({ error: 'Your correct readback doesn\'t cover all the required elements you listed. Make them consistent and resubmit.', missed: g.elements.missed }, { status: 422 })
  }

  const me = await db.query('SELECT callsign FROM rc_users WHERE id=$1', [user.userId])
  const name = me.rows[0]?.callsign || 'A pilot'
  const r = await db.query(
    `INSERT INTO rc_community_scenarios (author_user_id, author_name, title, setup, atc_transmission, required_elements, correct_readback, facility, frequency, airport, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved') RETURNING id`,
    [user.userId, name, title, str(b.setup, 600) ?? '', atc, JSON.stringify(elements), readback, str(b.facility, 12), str(b.frequency, 12), (str(b.airport, 8) || '')?.toUpperCase() || null],
  )
  return NextResponse.json({ ok: true, id: `community-${r.rows[0].id}` })
}
