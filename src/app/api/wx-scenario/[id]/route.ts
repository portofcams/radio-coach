import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { resolveHomeProfile } from '@/lib/home-server'
import { getLiveMetar } from '@/lib/metar-live'
import { liveWeatherScenario } from '@/lib/live-weather'

/**
 * Resolve a live-weather (`wx-*`) scenario. This is the ONLY place the client
 * gets one from -- it never independently fetches/decodes a METAR itself, so
 * this route and the grade route below both read the same short-TTL
 * rc_metar_cache row and generate byte-identical scenarios within one attempt.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ scenario: null }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ scenario: null }, { status: 503 })

  const r = await db.query(
    'SELECT callsign, home_ident, home_name, home_tower, home_runway, home_towered FROM rc_users WHERE id = $1',
    [user.userId],
  )
  const home = resolveHomeProfile(r.rows[0])
  if (!home || home.mode !== 'real') {
    return NextResponse.json({ error: 'no_real_home_field' }, { status: 400 })
  }

  const metar = await getLiveMetar(db, home.ident)
  if (!metar) return NextResponse.json({ error: 'no_live_metar', icao: home.ident }, { status: 404 })

  const scenario = liveWeatherScenario(id, home.field, r.rows[0]?.callsign, metar)
  if (!scenario) return NextResponse.json({ scenario: null }, { status: 404 })
  return NextResponse.json({ scenario })
}
