import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const COLS = 'id, flight_date, aircraft, dep, arr, total, pic, dual, night, day_ldg, night_ldg, remarks'
const num = (v: unknown): number => { const n = parseFloat(String(v)); return isFinite(n) ? n : 0 }
const int = (v: unknown): number => { const n = parseInt(String(v)); return isFinite(n) ? n : 0 }
const str = (v: unknown, m: number) => (v == null ? null : String(v).trim().slice(0, m) || null)

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const r = await db.query(`SELECT ${COLS} FROM rc_logbook WHERE user_id=$1 ORDER BY flight_date DESC, id DESC LIMIT 500`, [user.userId])
  const tot = await db.query(
    `SELECT COALESCE(SUM(total),0) total, COALESCE(SUM(pic),0) pic, COALESCE(SUM(night),0) night,
            COALESCE(SUM(day_ldg+night_ldg),0) ldg FROM rc_logbook WHERE user_id=$1`, [user.userId])
  return NextResponse.json({ entries: r.rows, totals: tot.rows[0] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const b = await req.json()
  const date = str(b.flight_date, 10)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Valid date required' }, { status: 400 })
  const r = await db.query(
    `INSERT INTO rc_logbook (user_id, flight_date, aircraft, dep, arr, total, pic, dual, night, day_ldg, night_ldg, remarks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ${COLS}`,
    [user.userId, date, str(b.aircraft, 20), str(b.dep, 8), str(b.arr, 8), num(b.total), num(b.pic), num(b.dual), num(b.night), int(b.day_ldg), int(b.night_ldg), str(b.remarks, 300)],
  )
  return NextResponse.json({ entry: r.rows[0] })
}
