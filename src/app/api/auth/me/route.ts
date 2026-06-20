import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getEntitlement } from '@/lib/entitlement'
import { resolveHomeProfile } from '@/lib/home-server'
import { getCachedTaxiways, ensureTaxiways } from '@/lib/osm-taxiways'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ user: null })

  const db = getPool()
  if (!db) return NextResponse.json({ user: null })

  const result = await db.query(
    'SELECT id, email, callsign, home_ident, home_name, home_tower, home_runway, cfi_org_name, cfi_logo_url FROM rc_users WHERE id = $1',
    [user.userId]
  )
  const row = result.rows[0]
  if (!row) return NextResponse.json({ user: null })

  const entitlement = await getEntitlement(row.id)
  const home = resolveHomeProfile(row)

  // Attach real taxiway geometry to a real home field (cached; fetch once if missing).
  if (home?.mode === 'real') {
    const cached = await getCachedTaxiways(db, home.ident)
    if (cached) home.field.taxiways = cached
    else void ensureTaxiways(db, home.ident, home.field.lat, home.field.lon) // populate for next load
  }

  return NextResponse.json({
    user: {
      id: row.id, email: row.email, callsign: row.callsign, home,
      cfiOrgName: row.cfi_org_name ?? null, cfiLogoUrl: row.cfi_logo_url ?? null,
    },
    entitlement,
  })
}
