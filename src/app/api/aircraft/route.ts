import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const COLS = 'id, name, tail, type, empty_weight, empty_arm, max_gross, cg_fwd, cg_aft, front_arm, rear_arm, fuel_arm, baggage_arm, fuel_cap_gal, fuel_lb_per_gal, max_baggage, max_xwind'

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isFinite(n) ? n : null
}
const str = (v: unknown, max: number) => (v == null ? null : String(v).trim().slice(0, max) || null)

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const r = await db.query(`SELECT ${COLS} FROM rc_aircraft WHERE user_id = $1 ORDER BY name`, [user.userId])
  return NextResponse.json({ aircraft: r.rows })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const b = await req.json()
  const name = str(b.name, 60)
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const r = await db.query(
    `INSERT INTO rc_aircraft (user_id, name, tail, type, empty_weight, empty_arm, max_gross, cg_fwd, cg_aft, front_arm, rear_arm, fuel_arm, baggage_arm, fuel_cap_gal, fuel_lb_per_gal, max_baggage, max_xwind)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING ${COLS}`,
    [user.userId, name, str(b.tail, 12), str(b.type, 30), num(b.empty_weight), num(b.empty_arm), num(b.max_gross), num(b.cg_fwd), num(b.cg_aft), num(b.front_arm), num(b.rear_arm), num(b.fuel_arm), num(b.baggage_arm), num(b.fuel_cap_gal), num(b.fuel_lb_per_gal) ?? 6, num(b.max_baggage), num(b.max_xwind)],
  )
  return NextResponse.json({ aircraft: r.rows[0] })
}
