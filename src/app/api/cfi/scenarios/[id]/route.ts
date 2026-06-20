import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi } from '@/lib/cfi'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })
  const numId = parseInt(id.replace(/^custom-/, ''))
  await db.query('DELETE FROM rc_custom_scenarios WHERE id = $1 AND cfi_user_id = $2', [numId, user.userId])
  return NextResponse.json({ ok: true })
}
