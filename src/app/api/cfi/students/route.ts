import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi, getRoster } from '@/lib/cfi'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })
  return NextResponse.json({ roster: await getRoster(db, user.userId, req.nextUrl.origin) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const body = await req.json()
  // Accept a single { email } or a bulk { emails: [...] } (paste/CSV import).
  const raw: string[] = Array.isArray(body.emails) ? body.emails : [body.email]
  const emails = [...new Set(raw.map((e) => (e ?? '').trim().toLowerCase()).filter((e) => e.includes('@')))]
  if (emails.length === 0) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  let added = 0
  const skipped: Array<{ email: string; reason: string }> = []
  for (const clean of emails) {
    // Link an existing account immediately; else hold a pending invite.
    const existing = await db.query('SELECT id FROM rc_users WHERE email = $1', [clean])
    const studentUserId: number | null = existing.rows[0]?.id ?? null
    if (studentUserId === user.userId) { skipped.push({ email: clean, reason: 'self' }); continue }

    // Avoid duplicate roster rows for the same student/email under this CFI.
    const dup = await db.query(
      `SELECT id FROM rc_cfi_students WHERE cfi_user_id = $1 AND (student_email = $2 OR (student_user_id IS NOT NULL AND student_user_id = $3))`,
      [user.userId, clean, studentUserId],
    )
    if (dup.rows[0]) { skipped.push({ email: clean, reason: 'already_added' }); continue }

    await db.query(
      `INSERT INTO rc_cfi_students (cfi_user_id, student_user_id, student_email, token, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.userId, studentUserId, clean, randomUUID(), studentUserId ? 'active' : 'pending'],
    )
    added++
  }
  return NextResponse.json({ added, skipped, roster: await getRoster(db, user.userId, req.nextUrl.origin) })
}
