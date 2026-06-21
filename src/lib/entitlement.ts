import { getPool } from './db'

export const FREE_DAILY_LIMIT = 5

export interface Entitlement {
  pro: boolean
  plan: string | null
  status: string | null
  periodEnd: string | null
}

/** Pro = an active/trialing subscription whose period hasn't ended. Source of truth = DB (set by the Stripe webhook). */
export async function getEntitlement(userId: number): Promise<Entitlement> {
  const db = getPool()
  if (!db) return { pro: false, plan: null, status: null, periodEnd: null }
  const r = await db.query(
    'SELECT subscription_status, plan, current_period_end FROM rc_users WHERE id = $1',
    [userId],
  )
  const row = r.rows[0]
  if (!row) return { pro: false, plan: null, status: null, periodEnd: null }
  const active = ['active', 'trialing', 'past_due'].includes(row.subscription_status)
  const notExpired = !row.current_period_end || new Date(row.current_period_end) > new Date()
  const own: Entitlement = {
    pro: active && notExpired,
    plan: row.plan ?? null,
    status: row.subscription_status ?? null,
    periodEnd: row.current_period_end ? new Date(row.current_period_end).toISOString() : null,
  }
  if (own.pro) return own

  // Not pro on their own sub — they may be an instructor in a flight school
  // whose owner has an active sub. That grants CFI-level access.
  try {
    const s = await db.query(
      `SELECT 1 FROM rc_school_members m
         JOIN rc_schools sc ON sc.id = m.school_id
         JOIN rc_users o ON o.id = sc.owner_user_id
       WHERE m.user_id = $1 AND m.status = 'active'
         AND o.plan = 'school'
         AND o.subscription_status IN ('active', 'trialing', 'past_due')
         AND (o.current_period_end IS NULL OR o.current_period_end > now())
       LIMIT 1`,
      [userId],
    )
    if (s.rows[0]) return { pro: true, plan: 'cfi', status: 'active', periodEnd: null }
  } catch {
    /* school tables may not exist yet — fall back to own entitlement */
  }
  return own
}

/** How many scenarios this user has had graded today (UTC day) — used to enforce the free cap. */
export async function dailyGradeCount(userId: number): Promise<number> {
  const db = getPool()
  if (!db) return 0
  const r = await db.query(
    `SELECT COUNT(*)::int AS n FROM rc_grades
     WHERE user_id = $1 AND created_at >= date_trunc('day', NOW())`,
    [userId],
  )
  return r.rows[0]?.n ?? 0
}
