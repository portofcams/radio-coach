import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isFinite(n) ? n : null
}
const str = (v: unknown, max: number) => (v == null ? null : String(v).trim().slice(0, max) || null)

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const b = await req.json()
  const name = str(b.name, 60)
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const r = await db.query(
    `UPDATE rc_aircraft SET name=$1, tail=$2, type=$3, empty_weight=$4, empty_arm=$5, max_gross=$6, cg_fwd=$7, cg_aft=$8,
       front_arm=$9, rear_arm=$10, fuel_arm=$11, baggage_arm=$12, fuel_cap_gal=$13, fuel_lb_per_gal=$14, max_baggage=$15, max_xwind=$16
     WHERE id=$17 AND user_id=$18 RETURNING id`,
    [name, str(b.tail, 12), str(b.type, 30), num(b.empty_weight), num(b.empty_arm), num(b.max_gross), num(b.cg_fwd), num(b.cg_aft), num(b.front_arm), num(b.rear_arm), num(b.fuel_arm), num(b.baggage_arm), num(b.fuel_cap_gal), num(b.fuel_lb_per_gal) ?? 6, num(b.max_baggage), num(b.max_xwind), parseInt(id), user.userId],
  )
  if (!r.rows[0]) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  await db.query('DELETE FROM rc_aircraft WHERE id=$1 AND user_id=$2', [parseInt(id), user.userId])
  return NextResponse.json({ ok: true })
}
