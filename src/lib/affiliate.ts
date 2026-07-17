// SERVER-ONLY. #95 -- external flight-school affiliate tracking. Deliberately
// separate from rc_schools (the paid multi-CFI account tier): an affiliate
// need never hold a Clearspar account. Mechanism only -- revenue_share_pct
// is nullable and unset by design; the actual percentage is a real pricing
// term for a human to negotiate, and no payout/invoicing logic exists here
// or anywhere else in this codebase.
import type { Pool } from 'pg'
import { randomBytes } from 'node:crypto'
import { COMP_DAYS } from './referral'

export interface Affiliate {
  id: number
  name: string
  contactEmail: string | null
  code: string
  revenueSharePct: number | null
  createdAt: string
}

function shape(row: { id: number; name: string; contact_email: string | null; code: string; revenue_share_pct: string | null; created_at: string }): Affiliate {
  return {
    id: row.id,
    name: row.name,
    contactEmail: row.contact_email ?? null,
    code: row.code,
    revenueSharePct: row.revenue_share_pct != null ? parseFloat(row.revenue_share_pct) : null,
    createdAt: row.created_at,
  }
}

export async function createAffiliate(db: Pool, name: string, contactEmail: string | null): Promise<Affiliate> {
  for (let i = 0; i < 6; i++) {
    const code = randomBytes(4).toString('hex') // 8 hex chars -- same shape as ensureReferralCode
    try {
      const r = await db.query(
        `INSERT INTO rc_affiliates (name, contact_email, code) VALUES ($1, $2, $3)
         RETURNING id, name, contact_email, code, revenue_share_pct, created_at`,
        [name, contactEmail, code],
      )
      return shape(r.rows[0])
    } catch {
      /* unique collision on code -- retry with a new one */
    }
  }
  throw new Error('could not assign affiliate code')
}

/** New signup used a school's affiliate link: tag them and grant the SAME
 *  signup incentive a personal referral gets (comp_pro_until). The school's
 *  own compensation is a separate, external process this does not model. */
export async function applyAffiliateOnSignup(db: Pool, newUserId: number, code: string): Promise<boolean> {
  const row = await db.query('SELECT id FROM rc_affiliates WHERE code = $1', [code.trim()])
  const affiliateId: number | undefined = row.rows[0]?.id
  if (!affiliateId) return false
  await db.query(
    `UPDATE rc_users
       SET affiliate_id = $1,
           comp_pro_until = GREATEST(COALESCE(comp_pro_until, now()), now()) + ($2 || ' days')::interval
     WHERE id = $3`,
    [affiliateId, COMP_DAYS, newUserId],
  )
  return true
}

export interface AffiliateWithStats extends Affiliate {
  signups: number
  converted: number
}

/** subscription_status is the shared, rail-agnostic "are they paying" column
 *  (both the Stripe AND App Store Server Notifications webhooks write to it
 *  -- see db.ts's own comment on apple_transaction_id) and a comp-Pro-only
 *  user never sets it, so this correctly counts real paying conversions,
 *  not free comp months. */
export async function affiliateStats(db: Pool): Promise<AffiliateWithStats[]> {
  const r = await db.query(
    `SELECT a.id, a.name, a.contact_email, a.code, a.revenue_share_pct, a.created_at,
            COUNT(u.id) AS signups,
            COUNT(u.id) FILTER (WHERE u.subscription_status IN ('active','trialing','past_due')) AS converted
     FROM rc_affiliates a LEFT JOIN rc_users u ON u.affiliate_id = a.id
     GROUP BY a.id ORDER BY a.created_at DESC`,
  )
  return r.rows.map((row) => ({ ...shape(row), signups: parseInt(row.signups) || 0, converted: parseInt(row.converted) || 0 }))
}
