import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isCfi } from '@/lib/cfi'

/** CFI sets their school/org name + optional logo URL (shown on student reports). */
export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isCfi(user.userId))) return NextResponse.json({ error: 'cfi_required' }, { status: 403 })

  const b = await req.json()
  const orgName = (b.orgName ?? '').toString().trim().slice(0, 60) || null
  let logoUrl = (b.logoUrl ?? '').toString().trim().slice(0, 300) || null
  if (logoUrl && !/^https:\/\//i.test(logoUrl)) logoUrl = null // only allow https image URLs

  await db.query('UPDATE rc_users SET cfi_org_name = $1, cfi_logo_url = $2 WHERE id = $3', [orgName, logoUrl, user.userId])
  return NextResponse.json({ cfiOrgName: orgName, cfiLogoUrl: logoUrl })
}
