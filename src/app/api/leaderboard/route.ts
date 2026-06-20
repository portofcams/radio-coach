import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

/** Public-ish leaderboard: top pilots by scenarios passed (all-time + this week). */
export async function GET() {
  const db = getPool()
  if (!db) return NextResponse.json({ rows: [], you: null })
  const user = await getAuthUser()

  const r = await db.query(
    `SELECT u.id, u.callsign,
            COUNT(*) FILTER (WHERE g.passed) AS passes,
            ROUND(AVG(g.score)) AS avg,
            COUNT(*) FILTER (WHERE g.passed AND g.created_at > now() - interval '7 days') AS week
     FROM rc_users u JOIN rc_grades g ON g.user_id = u.id
     GROUP BY u.id, u.callsign
     HAVING COUNT(*) FILTER (WHERE g.passed) > 0
     ORDER BY passes DESC, avg DESC
     LIMIT 50`,
  )
  const rows = r.rows.map((row, i) => ({
    rank: i + 1,
    callsign: row.callsign || 'Student pilot',
    passes: parseInt(row.passes) || 0,
    avg: parseInt(row.avg) || 0,
    week: parseInt(row.week) || 0,
    you: user ? row.id === user.userId : false,
  }))
  return NextResponse.json({ rows, you: rows.find((x) => x.you) ?? null })
}
