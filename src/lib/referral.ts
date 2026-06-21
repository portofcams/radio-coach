import type { Pool } from 'pg'
import { randomBytes } from 'node:crypto'

// Give-a-month / get-a-month referral. Rewards use a clean `comp_pro_until`
// field (decoupled from Stripe, so the webhook never clobbers it):
//   - referee gets 30 comp days the moment they sign up via a link
//   - referrer gets 30 comp days when that referee converts to a paid plan
export const COMP_DAYS = 30

/** Lazily assign a unique referral code to a user, returning it. */
export async function ensureReferralCode(db: Pool, userId: number): Promise<string> {
  const existing = await db.query('SELECT referral_code FROM rc_users WHERE id = $1', [userId])
  if (existing.rows[0]?.referral_code) return existing.rows[0].referral_code
  for (let i = 0; i < 6; i++) {
    const code = randomBytes(4).toString('hex') // 8 hex chars
    try {
      const r = await db.query(
        'UPDATE rc_users SET referral_code = $1 WHERE id = $2 AND referral_code IS NULL RETURNING referral_code',
        [code, userId],
      )
      if (r.rows[0]) return r.rows[0].referral_code
      // someone set it concurrently — re-read
      const again = await db.query('SELECT referral_code FROM rc_users WHERE id = $1', [userId])
      if (again.rows[0]?.referral_code) return again.rows[0].referral_code
    } catch {
      /* unique collision — retry with a new code */
    }
  }
  throw new Error('could not assign referral code')
}

/** New signup used a friend's code: link them and grant the referee a comp month. */
export async function applyReferralOnSignup(db: Pool, newUserId: number, code: string): Promise<boolean> {
  const refRow = await db.query('SELECT id FROM rc_users WHERE referral_code = $1', [code.trim()])
  const referrerId: number | undefined = refRow.rows[0]?.id
  if (!referrerId || referrerId === newUserId) return false
  await db.query(
    `UPDATE rc_users
       SET referred_by = $1,
           comp_pro_until = GREATEST(COALESCE(comp_pro_until, now()), now()) + ($2 || ' days')::interval
     WHERE id = $3`,
    [referrerId, COMP_DAYS, newUserId],
  )
  return true
}

/** A referred user converted to paid → reward the referrer one comp month, once. */
export async function grantReferrerOnConversion(db: Pool, refereeUserId: number): Promise<void> {
  const r = await db.query('SELECT referred_by, referral_rewarded FROM rc_users WHERE id = $1', [refereeUserId])
  const row = r.rows[0]
  if (!row?.referred_by || row.referral_rewarded) return
  await db.query(
    `UPDATE rc_users
       SET comp_pro_until = GREATEST(COALESCE(comp_pro_until, now()), now()) + ($2 || ' days')::interval
     WHERE id = $1`,
    [row.referred_by, COMP_DAYS],
  )
  await db.query('UPDATE rc_users SET referral_rewarded = true WHERE id = $1', [refereeUserId])
}

export interface ReferralStats {
  code: string
  referred: number
  converted: number
  compProUntil: string | null
}

export async function referralStats(db: Pool, userId: number): Promise<ReferralStats> {
  const code = await ensureReferralCode(db, userId)
  const referred = await db.query('SELECT COUNT(*)::int AS n FROM rc_users WHERE referred_by = $1', [userId])
  const converted = await db.query('SELECT COUNT(*)::int AS n FROM rc_users WHERE referred_by = $1 AND referral_rewarded = true', [userId])
  const me = await db.query('SELECT comp_pro_until FROM rc_users WHERE id = $1', [userId])
  const cpu = me.rows[0]?.comp_pro_until
  return {
    code,
    referred: referred.rows[0]?.n ?? 0,
    converted: converted.rows[0]?.n ?? 0,
    compProUntil: cpu ? new Date(cpu).toISOString() : null,
  }
}
