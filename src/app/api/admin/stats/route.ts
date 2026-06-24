import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// Owner usage dashboard data. Gated by ?key=ADMIN_KEY (env). Every query is
// graceful so a missing table/column degrades to 0 rather than 500ing.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'no_db' }, { status: 503 })

  const num = (sql: string) => db.query(sql).then((r) => Number(r.rows[0]?.n ?? 0)).catch(() => 0)
  const rows = (sql: string) => db.query(sql).then((r) => r.rows).catch(() => [] as Record<string, unknown>[])

  const [users, signups7, grades7, pageviews7, visitors7, paid, platforms, topPaths, daily] = await Promise.all([
    num('SELECT count(*) n FROM rc_users'),
    num("SELECT count(*) n FROM rc_users WHERE created_at > now() - interval '7 days'"),
    num("SELECT count(*) n FROM rc_grades WHERE created_at > now() - interval '7 days'"),
    num("SELECT count(*) n FROM rc_events WHERE event = 'pageview' AND ts > now() - interval '7 days'"),
    num("SELECT count(DISTINCT anon_id) n FROM rc_events WHERE ts > now() - interval '7 days'"),
    num("SELECT count(*) n FROM rc_users WHERE subscription_status IN ('active','trialing','past_due')"),
    rows("SELECT platform, count(DISTINCT anon_id)::int visitors, count(*)::int views FROM rc_events WHERE ts > now() - interval '7 days' GROUP BY platform ORDER BY views DESC"),
    rows("SELECT path, count(*)::int views FROM rc_events WHERE event = 'pageview' AND ts > now() - interval '7 days' GROUP BY path ORDER BY views DESC LIMIT 12"),
    rows("SELECT to_char(ts::date, 'Mon DD') d, count(DISTINCT anon_id)::int visitors, count(*)::int views FROM rc_events WHERE ts > now() - interval '14 days' GROUP BY ts::date ORDER BY ts::date"),
  ])

  return NextResponse.json({ users, signups7, grades7, pageviews7, visitors7, paid, platforms, topPaths, daily })
}
