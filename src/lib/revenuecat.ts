import { getPool } from './db'

// iOS Solo Pilot IAP entitlement, written by the RevenueCat webhook (and
// optimistically by /api/iap/sync right after a purchase). Mirrors the Stripe
// webhook's applySubscription() so getEntitlement() needs no changes.
// CFI/School plans stay Stripe-only (instructor/B2B purchases made on web).
export async function applyIapEntitlement(opts: {
  userId: number
  active: boolean
  transactionId?: string | null
  periodEnd?: string | null
}): Promise<void> {
  const db = getPool()
  if (!db) return
  await db.query(
    `UPDATE rc_users SET
       apple_transaction_id = $2,
       subscription_status = $3,
       plan = $4,
       current_period_end = $5
     WHERE id = $1`,
    [
      opts.userId,
      opts.transactionId ?? null,
      opts.active ? 'active' : 'inactive',
      opts.active ? 'solo' : null,
      opts.periodEnd ?? null,
    ],
  )
}

/** Look up the RevenueCat app_user_id → our rc_users.id. We set appUserID to
 * String(rc_users.id) at Purchases.configure()/logIn() time, so this is just
 * a numeric parse — kept as a function in case that mapping ever changes. */
export function userIdFromAppUserId(appUserId: string): number | null {
  const n = Number(appUserId)
  return Number.isInteger(n) ? n : null
}
