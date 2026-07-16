import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { weekIndexFor, weekBounds, bracketScenarioForWeek } from '@/lib/bracket'

interface Row { rank: number; callsign: string; score: number; you: boolean }

// Best score per user on one scenario within one week window. DISTINCT ON
// picks, per user, their highest-scoring attempt (earliest such attempt on
// ties) -- the outer query then ranks those best-of rows against each other.
// role='pilot' matches the DB-hygiene fix from #88: a bracket score is a
// pilot-readback competition, an ATC-mode attempt on the same scenario_id
// (if it ever has atcMode content) must not count.
async function rankFor(
  db: NonNullable<ReturnType<typeof getPool>>,
  scenarioId: string,
  start: Date,
  end: Date,
  meId: number | null,
): Promise<Row[]> {
  const r = await db.query(
    `SELECT id, callsign, best_score FROM (
       SELECT DISTINCT ON (g.user_id) u.id, u.callsign, g.score AS best_score, g.created_at
       FROM rc_grades g JOIN rc_users u ON u.id = g.user_id
       WHERE g.scenario_id = $1 AND g.created_at >= $2 AND g.created_at < $3 AND g.role = 'pilot'
       ORDER BY g.user_id, g.score DESC, g.created_at ASC
     ) t
     ORDER BY best_score DESC, created_at ASC
     LIMIT 50`,
    [scenarioId, start.toISOString(), end.toISOString()],
  )
  return r.rows.map((row, i) => ({
    rank: i + 1,
    callsign: row.callsign || 'Student pilot',
    score: parseInt(row.best_score) || 0,
    you: meId ? row.id === meId : false,
  }))
}

export async function GET() {
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const user = await getAuthUser()
  const meId = user?.userId ?? null

  const curIdx = weekIndexFor(new Date())
  const cur = bracketScenarioForWeek(curIdx)
  const curBounds = weekBounds(curIdx)
  const prevIdx = curIdx - 1
  const prev = bracketScenarioForWeek(prevIdx)
  const prevBounds = weekBounds(prevIdx)

  const [rows, prevRows] = await Promise.all([
    rankFor(db, cur.id, curBounds.start, curBounds.end, meId),
    rankFor(db, prev.id, prevBounds.start, prevBounds.end, null),
  ])

  return NextResponse.json({
    scenario: { id: cur.id, title: cur.title },
    weekStart: curBounds.start.toISOString(),
    weekEnd: curBounds.end.toISOString(),
    rows,
    you: rows.find((r) => r.you) ?? null,
    previousWeek: {
      scenario: { id: prev.id, title: prev.title },
      winner: prevRows[0] ?? null,
    },
  })
}
