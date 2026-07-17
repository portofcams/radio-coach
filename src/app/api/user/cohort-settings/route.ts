import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi } from '@/lib/cfi'

/** CFI toggles whether their roster's cohort view shows real callsigns
 *  (default: anonymized "Student A/B/C" labels) -- #93. */
export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const b = await req.json()
  const namesVisible = !!b.namesVisible
  await db.query('UPDATE rc_users SET cohort_names_visible = $1 WHERE id = $2', [namesVisible, user.userId])
  return NextResponse.json({ namesVisible })
}
