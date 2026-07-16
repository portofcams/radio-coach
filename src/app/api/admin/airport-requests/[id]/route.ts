import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

const STATUSES = ['open', 'added', 'declined']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const key = req.nextUrl.searchParams.get('key')
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { status } = await req.json()
  if (!STATUSES.includes(status)) return NextResponse.json({ error: 'bad_status' }, { status: 400 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'no_db' }, { status: 503 })

  await db.query('UPDATE rc_airport_requests SET status=$1, updated_at=now() WHERE id=$2', [status, id])
  return NextResponse.json({ ok: true })
}
