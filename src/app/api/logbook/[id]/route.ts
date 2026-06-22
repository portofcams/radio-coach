import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  await db.query('DELETE FROM rc_logbook WHERE id=$1 AND user_id=$2', [parseInt(id), user.userId])
  return NextResponse.json({ ok: true })
}
