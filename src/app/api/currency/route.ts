import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const str = (v: unknown) => (v && /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : null)

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const r = await db.query(
    `SELECT
       (SELECT COALESCE(SUM(day_ldg+night_ldg),0) FROM rc_logbook WHERE user_id=$1 AND flight_date > now()-interval '90 days') AS ldg90,
       (SELECT COALESCE(SUM(night_ldg),0) FROM rc_logbook WHERE user_id=$1 AND flight_date > now()-interval '90 days') AS nldg90,
       to_char(flight_review_date,'YYYY-MM-DD') AS flight_review_date,
       to_char(medical_expiry,'YYYY-MM-DD') AS medical_expiry
     FROM rc_users WHERE id=$1`, [user.userId])
  const row = r.rows[0] ?? {}
  return NextResponse.json({
    passengerDay: { count: Number(row.ldg90) || 0, required: 3 },
    passengerNight: { count: Number(row.nldg90) || 0, required: 3 },
    flightReviewDate: row.flight_review_date ?? null, // last completed; due +24 cal months
    medicalExpiry: row.medical_expiry ?? null,
  })
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const b = await req.json()
  await db.query('UPDATE rc_users SET flight_review_date=$1, medical_expiry=$2 WHERE id=$3',
    [str(b.flightReviewDate), str(b.medicalExpiry), user.userId])
  return NextResponse.json({ ok: true })
}
