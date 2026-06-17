import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

// Ground School progress sync. Anonymous users get { progress: null } and the
// client just keeps using localStorage. Logged-in users get a server-merged copy.

export async function GET() {
  const user = await getAuthUser()
  const db = getPool()
  if (!user || !db) return NextResponse.json({ progress: null })

  const r = await db.query(
    'SELECT completed, xp, streak, last_day FROM rc_gs_progress WHERE user_id = $1',
    [user.userId],
  )
  if (!r.rows.length) return NextResponse.json({ progress: null })
  const row = r.rows[0]
  return NextResponse.json({
    progress: { completed: row.completed, xp: row.xp, streak: row.streak, lastDay: row.last_day },
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ progress: null }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ progress: null }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const completed = Array.isArray(body.completed) ? body.completed : []
  const xp = Number.isFinite(body.xp) ? Math.trunc(body.xp) : 0
  const streak = Number.isFinite(body.streak) ? Math.trunc(body.streak) : 0
  const lastDay = typeof body.lastDay === 'string' ? body.lastDay : null

  // merge: union completed, max xp/streak, latest day
  await db.query(
    `INSERT INTO rc_gs_progress (user_id, completed, xp, streak, last_day, updated_at)
     VALUES ($1, $2::jsonb, $3, $4, $5, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       completed = COALESCE(
         (SELECT jsonb_agg(DISTINCT e)
            FROM jsonb_array_elements_text(rc_gs_progress.completed || EXCLUDED.completed) e),
         '[]'::jsonb),
       xp = GREATEST(rc_gs_progress.xp, EXCLUDED.xp),
       streak = GREATEST(rc_gs_progress.streak, EXCLUDED.streak),
       last_day = GREATEST(rc_gs_progress.last_day, EXCLUDED.last_day),
       updated_at = NOW()`,
    [user.userId, JSON.stringify(completed), xp, streak, lastDay],
  )

  const r = await db.query(
    'SELECT completed, xp, streak, last_day FROM rc_gs_progress WHERE user_id = $1',
    [user.userId],
  )
  const row = r.rows[0]
  return NextResponse.json({
    progress: { completed: row.completed, xp: row.xp, streak: row.streak, lastDay: row.last_day },
  })
}
