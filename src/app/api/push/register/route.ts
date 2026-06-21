import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

// A native client posts its APNs/FCM device token here after the OS grants push.
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const { token, platform } = await req.json()
  if (!token || typeof token !== 'string' || token.length > 400) {
    return NextResponse.json({ error: 'bad_token' }, { status: 400 })
  }
  const plat = platform === 'android' ? 'android' : 'ios'

  await db.query(
    `INSERT INTO rc_push_tokens (user_id, token, platform, last_seen)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (token) DO UPDATE SET user_id = $1, platform = $3, last_seen = now()`,
    [user.userId, token, plat],
  )
  return NextResponse.json({ ok: true })
}
