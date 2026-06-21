import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi } from '@/lib/cfi'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })
  const r = await db.query(
    'SELECT id, title, required_elements, created_at FROM rc_custom_scenarios WHERE cfi_user_id = $1 ORDER BY created_at DESC',
    [user.userId],
  )
  return NextResponse.json({ scenarios: r.rows.map((s) => ({ id: `custom-${s.id}`, title: s.title, elements: s.required_elements })) })
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const b = await req.json()
  const title = clean(b.title, 80)
  const atc = clean(b.atcTransmission, 600)
  const readback = clean(b.correctReadback, 600)
  const setup = clean(b.setup, 600)
  const facility = clean(b.facility, 12).toUpperCase() || null
  const frequency = clean(b.frequency, 12) || null
  const airport = clean(b.airport, 8).toUpperCase() || null
  const elements = Array.isArray(b.requiredElements)
    ? b.requiredElements.map((e: unknown) => clean(e, 80)).filter(Boolean).slice(0, 12)
    : []
  if (!title || !atc || !readback || elements.length === 0) {
    return NextResponse.json({ error: 'title, ATC transmission, correct readback, and ≥1 required element are required' }, { status: 400 })
  }

  await db.query(
    `INSERT INTO rc_custom_scenarios (cfi_user_id, title, setup, atc_transmission, required_elements, correct_readback, facility, frequency, airport)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [user.userId, title, setup, atc, JSON.stringify(elements), readback, facility, frequency, airport],
  )
  return NextResponse.json({ ok: true })
}
