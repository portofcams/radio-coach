import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { referralStats, CFI_COMP_DAYS } from '@/lib/referral'
import { isCfi } from '@/lib/cfi'

const APP_URL = process.env.APP_URL || 'https://clearsparradio.binnacleai.com'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const [stats, cfi] = await Promise.all([referralStats(db, user.userId), isCfi(user.userId)])
  return NextResponse.json({
    ...stats,
    link: `${APP_URL}/login?ref=${stats.code}`,
    isCfi: cfi,
    cfiCompDays: CFI_COMP_DAYS,
  })
}
