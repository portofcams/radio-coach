import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getRoster } from '@/lib/cfi'
import { computeWeakspots } from '@/lib/weakspots'

const csv = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// CSV of a CFI's roster — readiness + top weak spot per student, for records.
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const roster = await getRoster(db, user.userId, req.nextUrl.origin)
  const header = ['Email', 'Call sign', 'Status', 'Attempts', 'This week', 'Last seen (days)', 'Flag', 'Readiness', 'Top weak spot']
  const lines = [header.join(',')]

  for (const s of roster) {
    let weak = ''
    if (s.joined) {
      const g = await db.query(
        "SELECT scenario_id, missed_elements FROM rc_grades WHERE user_id = (SELECT student_user_id FROM rc_cfi_students WHERE id = $1) AND role = 'pilot' ORDER BY created_at DESC LIMIT 200",
        [s.id],
      )
      weak = computeWeakspots(g.rows)[0]?.label ?? ''
    }
    lines.push([
      csv(s.email), csv(s.callsign), csv(s.joined ? 'active' : 'invited'),
      csv(s.attempts), csv(s.weekCount), csv(s.lastDays ?? ''),
      csv(s.flag ?? ''), csv(s.readiness?.score ?? ''), csv(weak),
    ].join(','))
  }

  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clearspar-roster-${today}.csv"`,
    },
  })
}
