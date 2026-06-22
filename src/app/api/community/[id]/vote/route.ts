import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

// Upvote a community scenario (once per user).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const sid = parseInt(id)
  const ins = await db.query(
    'INSERT INTO rc_community_votes (scenario_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING scenario_id',
    [sid, user.userId],
  )
  if (ins.rows[0]) await db.query('UPDATE rc_community_scenarios SET upvotes = upvotes + 1 WHERE id=$1', [sid])
  const r = await db.query('SELECT upvotes FROM rc_community_scenarios WHERE id=$1', [sid])
  return NextResponse.json({ upvotes: r.rows[0]?.upvotes ?? 0, voted: !!ins.rows[0] })
}
