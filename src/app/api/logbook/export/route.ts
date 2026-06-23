import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const csv = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const r = await db.query(
    'SELECT flight_date, aircraft, dep, arr, total, pic, dual, night, day_ldg, night_ldg, remarks FROM rc_logbook WHERE user_id=$1 ORDER BY flight_date',
    [user.userId],
  )
  const header = ['Date', 'Aircraft', 'From', 'To', 'Total', 'PIC', 'Dual', 'Night', 'Day Ldg', 'Night Ldg', 'Remarks']
  const lines = [header.join(',')]
  for (const e of r.rows) {
    lines.push([e.flight_date instanceof Date ? e.flight_date.toISOString().slice(0, 10) : e.flight_date,
      csv(e.aircraft), csv(e.dep), csv(e.arr), e.total, e.pic, e.dual, e.night, e.day_ldg, e.night_ldg, csv(e.remarks)].join(','))
  }
  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="clearspar-logbook-${today}.csv"` },
  })
}
