import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getCustomScenarioFor } from '@/lib/customscenarios'

/** Return a custom scenario (for the player) if the user owns or is assigned it. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ scenario: null }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ scenario: null }, { status: 503 })
  const numId = parseInt(id.replace(/^custom-/, ''))
  if (!numId) return NextResponse.json({ scenario: null }, { status: 400 })
  const scenario = await getCustomScenarioFor(db, numId, user.userId)
  if (!scenario) return NextResponse.json({ scenario: null }, { status: 404 })
  return NextResponse.json({ scenario })
}
