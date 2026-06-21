import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { chooseAdaptive, randomStarter } from '@/lib/adaptive'

export async function GET() {
  const user = await getAuthUser()
  const db = getPool()
  if (!user || !db) {
    return NextResponse.json({ scenarioId: randomStarter(), level: 1, reason: 'Sign in to tune difficulty to your scores' })
  }
  const pick = await chooseAdaptive(db, user.userId)
  return NextResponse.json(pick)
}
