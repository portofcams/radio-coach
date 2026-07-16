import type { Pool } from 'pg'

export interface TopPilot { rank: number; callsign: string; week: number; passes: number }

/** Top pilots by scenarios passed in the last 7 days — for the public SEO page. */
export async function topWeekly(db: Pool, limit = 25): Promise<TopPilot[]> {
  const r = await db.query(
    `SELECT u.callsign,
            COUNT(*) FILTER (WHERE g.passed AND g.created_at > now()-interval '7 days') AS week,
            COUNT(*) FILTER (WHERE g.passed) AS passes
     FROM rc_users u JOIN rc_grades g ON g.user_id = u.id AND g.role = 'pilot'
     GROUP BY u.id, u.callsign
     HAVING COUNT(*) FILTER (WHERE g.passed AND g.created_at > now()-interval '7 days') > 0
     ORDER BY week DESC, passes DESC
     LIMIT $1`,
    [limit],
  )
  return r.rows.map((row, i) => ({
    rank: i + 1,
    callsign: row.callsign || 'Student pilot',
    week: parseInt(row.week) || 0,
    passes: parseInt(row.passes) || 0,
  }))
}
