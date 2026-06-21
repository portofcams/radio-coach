import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { hashPassword, setAuthCookie } from '@/lib/auth'

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

  // Referral: a friend's code grants the new user a 7-day Solo trial, and the
  // referrer 7 trial days (only if they're not on a paid Stripe sub).
  if (ref && typeof ref === 'string') {
    try {
      const refRow = await db.query('SELECT id, stripe_subscription_id, subscription_status, current_period_end FROM rc_users WHERE referral_code = $1', [ref.trim()])
      const referrer = refRow.rows[0]
      if (referrer && referrer.id !== user.id) {
        await db.query(
          `UPDATE rc_users SET referred_by = $1, plan = 'solo', subscription_status = 'trialing',
             current_period_end = now() + interval '7 days' WHERE id = $2`,
          [referrer.id, user.id],
        )
        if (!referrer.stripe_subscription_id) {
          // extend the referrer's trial from the later of now / their current end, capped at +60d
          await db.query(
            `UPDATE rc_users SET plan = COALESCE(plan, 'solo'), subscription_status = 'trialing',
               current_period_end = LEAST(now() + interval '60 days',
                 GREATEST(COALESCE(current_period_end, now()), now()) + interval '7 days')
             WHERE id = $1`,
            [referrer.id],
          )
        }
      }
    } catch { /* referral best-effort */ }
  }

  await setAuthCookie({ userId: user.id, email: user.email })
  return NextResponse.json({ user: { id: user.id, email: user.email } })
}
