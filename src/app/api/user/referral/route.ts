import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

/** The logged-in user's referral link + how many friends they've brought in. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  let code: string
  const r = await db.query('SELECT referral_code FROM rc_users WHERE id = $1', [user.userId])
  code = r.rows[0]?.referral_code
  if (!code) {
    code = randomUUID().slice(0, 8)
    await db.query('UPDATE rc_users SET referral_code = $1 WHERE id = $2', [code, user.userId])
  }
  const count = await db.query('SELECT COUNT(*) AS n FROM rc_users WHERE referred_by = $1', [user.userId])
  return NextResponse.json({
    code,
    link: `${req.nextUrl.origin}/login?ref=${code}`,
    referrals: parseInt(count.rows[0].n) || 0,
  })
}
