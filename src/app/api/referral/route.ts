import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { referralStats } from '@/lib/referral'

const APP_URL = process.env.APP_URL || 'https://wilco.binnacleai.com'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const stats = await referralStats(db, user.userId)
  return NextResponse.json({
    ...stats,
    link: `${APP_URL}/login?ref=${stats.code}`,
  })
}
