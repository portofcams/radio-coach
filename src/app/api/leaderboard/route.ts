import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { lookupAirport } from '@/lib/airports'

type Row = { rank: number; callsign: string; passes: number; avg: number; week: number; streak?: number; referred?: number; you: boolean }

const shape = (rows: { id: number; callsign: string | null; passes: string; avg: string; week: string; streak?: string; referred?: string }[], meId: number | null): Row[] =>
  rows.map((r, i) => ({
    rank: i + 1,
    callsign: r.callsign || 'Student pilot',
    passes: parseInt(r.passes) || 0,
    avg: parseInt(r.avg) || 0,
    week: parseInt(r.week) || 0,
    ...(r.streak !== undefined ? { streak: parseInt(r.streak) || 0 } : {}),
    ...(r.referred !== undefined ? { referred: parseInt(r.referred) || 0 } : {}),
    you: meId ? r.id === meId : false,
  }))

export async function GET(req: NextRequest) {
  const db = getPool()
  if (!db) return NextResponse.json({ rows: [] })
  const user = await getAuthUser()
  const meId = user?.userId ?? null
  const scope = req.nextUrl.searchParams.get('scope') ?? 'all'

  // Current practice streak (consecutive UTC days with ≥1 grade, alive today/yesterday)
  if (scope === 'streak') {
    const r = await db.query(
      `WITH days AS (
         SELECT user_id, (created_at AT TIME ZONE 'UTC')::date AS d FROM rc_grades GROUP BY 1, 2
       ), islands AS (
         SELECT user_id, d, d - (row_number() OVER (PARTITION BY user_id ORDER BY d))::int AS grp FROM days
       ), s AS (
         SELECT user_id, MAX(d) AS last_day, COUNT(*) AS len FROM islands GROUP BY user_id, grp
       )
       SELECT u.id, u.callsign, s.len AS streak,
              (SELECT COUNT(*) FILTER (WHERE passed) FROM rc_grades g WHERE g.user_id=u.id) AS passes,
              0 AS avg, 0 AS week
       FROM s JOIN rc_users u ON u.id = s.user_id
       WHERE s.last_day >= CURRENT_DATE - 1
       ORDER BY s.len DESC, passes DESC LIMIT 50`,
    )
    const rows = shape(r.rows, meId)
    return NextResponse.json({ scope, rows, you: rows.find((x) => x.you) ?? null })
  }

  // Referral leaderboard: ranked by converted referrals (real value delivered),
  // reach (total signups) as the tiebreaker/secondary column.
  if (scope === 'referrals') {
    const r = await db.query(
      `SELECT u.id, u.callsign,
              COUNT(*) FILTER (WHERE ref.referral_rewarded) AS passes,
              COUNT(*) AS referred,
              0 AS avg, 0 AS week
       FROM rc_users u JOIN rc_users ref ON ref.referred_by = u.id
       GROUP BY u.id, u.callsign
       ORDER BY passes DESC, referred DESC LIMIT 50`,
    )
    const rows = shape(r.rows, meId)
    return NextResponse.json({ scope, rows, you: rows.find((x) => x.you) ?? null })
  }

  // Within-school: students of the viewer's school (owner or active instructor)
  if (scope === 'school') {
    if (!meId) return NextResponse.json({ scope, rows: [], unavailable: true })
    const sc = await db.query(
      `SELECT id FROM rc_schools WHERE owner_user_id=$1
       UNION SELECT school_id FROM rc_school_members WHERE user_id=$1 AND status='active' LIMIT 1`,
      [meId],
    )
    const schoolId = sc.rows[0]?.id
    if (!schoolId) return NextResponse.json({ scope, rows: [], unavailable: true })
    const r = await db.query(
      `WITH cfis AS (
         SELECT owner_user_id AS uid FROM rc_schools WHERE id=$1
         UNION SELECT user_id FROM rc_school_members WHERE school_id=$1 AND status='active' AND user_id IS NOT NULL
       ), studs AS (
         SELECT DISTINCT student_user_id AS uid FROM rc_cfi_students
         WHERE cfi_user_id IN (SELECT uid FROM cfis) AND status='active' AND student_user_id IS NOT NULL
       )
       SELECT u.id, u.callsign,
              COUNT(*) FILTER (WHERE g.passed) AS passes, ROUND(AVG(g.score)) AS avg,
              COUNT(*) FILTER (WHERE g.passed AND g.created_at > now()-interval '7 days') AS week
       FROM studs s JOIN rc_users u ON u.id=s.uid JOIN rc_grades g ON g.user_id=u.id
       GROUP BY u.id, u.callsign ORDER BY passes DESC, avg DESC LIMIT 50`,
      [schoolId],
    )
    const rows = shape(r.rows, meId)
    return NextResponse.json({ scope, rows, you: rows.find((x) => x.you) ?? null })
  }

  // all / week / towered / nontowered — top by passes (week orders by week)
  const orderWeek = scope === 'week'
  const r = await db.query(
    `SELECT u.id, u.callsign, u.home_ident,
            COUNT(*) FILTER (WHERE g.passed) AS passes, ROUND(AVG(g.score)) AS avg,
            COUNT(*) FILTER (WHERE g.passed AND g.created_at > now()-interval '7 days') AS week
     FROM rc_users u JOIN rc_grades g ON g.user_id = u.id
     GROUP BY u.id, u.callsign, u.home_ident
     HAVING COUNT(*) FILTER (WHERE g.passed) > 0
     ORDER BY ${orderWeek ? 'week' : 'passes'} DESC, avg DESC
     LIMIT 200`,
  )
  let rows = r.rows
  if (scope === 'towered' || scope === 'nontowered') {
    const wantTowered = scope === 'towered'
    rows = rows.filter((row) => {
      const f = row.home_ident ? lookupAirport(row.home_ident) : null
      return f ? f.towered === wantTowered : false
    })
  }
  if (orderWeek) rows = rows.filter((row) => (parseInt(row.week) || 0) > 0)
  const shaped = shape(rows.slice(0, 50), meId)
  return NextResponse.json({ scope, rows: shaped, you: shaped.find((x) => x.you) ?? null })
}
