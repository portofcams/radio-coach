import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

/** The logged-in student's instructor branding + endorsements + comments. */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ coach: null })
  const db = getPool()
  if (!db) return NextResponse.json({ coach: null })

  const cfi = await db.query(
    `SELECT u.cfi_org_name, u.cfi_logo_url, u.email
     FROM rc_cfi_students s JOIN rc_users u ON u.id = s.cfi_user_id
     WHERE s.student_user_id = $1 AND s.status = 'active'
     ORDER BY s.created_at LIMIT 1`,
    [user.userId],
  )
  if (!cfi.rows[0]) return NextResponse.json({ coach: null })

  const [endorse, comments] = await Promise.all([
    db.query('SELECT DISTINCT kind FROM rc_endorsements WHERE student_user_id = $1', [user.userId]),
    db.query('SELECT body, scenario_id, created_at FROM rc_cfi_comments WHERE student_user_id = $1 ORDER BY created_at DESC LIMIT 20', [user.userId]),
  ])

  return NextResponse.json({
    coach: {
      orgName: cfi.rows[0].cfi_org_name ?? null,
      logoUrl: cfi.rows[0].cfi_logo_url ?? null,
      cfiEmail: cfi.rows[0].email,
      endorsements: endorse.rows.map((r) => r.kind),
      comments: comments.rows,
    },
  })
}
