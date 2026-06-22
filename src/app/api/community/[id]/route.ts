import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getCommunityScenario } from '@/lib/community'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const scenario = await getCommunityScenario(db, parseInt(id))
  if (!scenario) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ scenario })
}
