import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser, clearAuthCookie } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { revokeAppleToken } from '@/lib/apple-siwa'

const API_VERSION = '2026-05-27.dahlia' as never

// Permanently deletes the signed-in user's account. FK constraints on every
// rc_* table reference rc_users(id) with ON DELETE CASCADE / SET NULL, so a
// single row delete is sufficient to remove grades, logbook, aircraft, CFI
// links, push tokens, etc.
export async function DELETE() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 })

  const db = getPool()
  if (!db) return NextResponse.json({ error: 'db_unavailable' }, { status: 503 })

  const r = await db.query(
    'SELECT stripe_subscription_id, apple_refresh_token FROM rc_users WHERE id = $1',
    [user.userId],
  )
  const subscriptionId = r.rows[0]?.stripe_subscription_id
  if (subscriptionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION })
    await stripe.subscriptions.cancel(subscriptionId).catch(() => {})
  }

  // Sign in with Apple requires revoking the user's token on deletion (5.1.1(v)).
  // Best-effort + no-ops until the SIWA key is configured (src/lib/apple-siwa.ts).
  await revokeAppleToken(r.rows[0]?.apple_refresh_token)

  await db.query('DELETE FROM rc_users WHERE id = $1', [user.userId])
  await clearAuthCookie()
  return NextResponse.json({ ok: true })
}
