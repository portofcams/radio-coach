import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { hashPassword, setAuthCookie } from '@/lib/auth'
import { applyReferralOnSignup } from '@/lib/referral'

export async function POST(req: NextRequest) {
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'Auth not available' }, { status: 503 })

  const { email, password, ref } = await req.json()

  if (!email?.includes('@') || !password || password.length < 6) {
    return NextResponse.json({ error: 'Valid email and password (6+ chars) required' }, { status: 400 })
  }

  const existing = await db.query('SELECT id FROM rc_users WHERE email = $1', [email.toLowerCase()])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hash = await hashPassword(password)
  const result = await db.query(
    'INSERT INTO rc_users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email.toLowerCase(), hash]
  )
  const user = result.rows[0]

  // Auto-link any pending CFI-student invites addressed to this email.
  await db.query(
    `UPDATE rc_cfi_students SET student_user_id = $1, status = 'active'
     WHERE student_email = $2 AND student_user_id IS NULL`,
    [user.id, user.email],
  ).catch(() => {})
  // Auto-link any pending flight-school instructor invites for this email.
  await db.query(
    `UPDATE rc_school_members SET user_id = $1, status = 'active'
     WHERE email = $2 AND user_id IS NULL`,
    [user.id, user.email],
  ).catch(() => {})

  // Referral (give-a-month / get-a-month): a friend's code grants the new user a
  // free comp month now; the referrer earns their month when this user converts
  // to paid (handled in the Stripe webhook). Best-effort.
  if (ref && typeof ref === 'string') {
    try { await applyReferralOnSignup(db, user.id, ref) } catch { /* referral best-effort */ }
  }

  await setAuthCookie({ userId: user.id, email: user.email })
  return NextResponse.json({ user: { id: user.id, email: user.email } })
}
