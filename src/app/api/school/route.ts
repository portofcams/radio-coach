import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { isSchoolOwner, ensureSchool, schoolMembers } from '@/lib/school-server'
import { ensureSlug } from '@/lib/directory'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isSchoolOwner(user.userId))) return NextResponse.json({ error: 'school_required' }, { status: 403 })
  const school = await ensureSchool(db, user.userId)
  const extra = await db.query(
    'SELECT public_listing, slug, city, region, website, blurb FROM rc_schools WHERE owner_user_id = $1',
    [user.userId],
  )
  return NextResponse.json({ school: { ...school, ...extra.rows[0] }, members: await schoolMembers(db, school.id, req.nextUrl.origin) })
}

const str = (v: unknown, max: number) => (v == null ? null : String(v).trim().slice(0, max) || null)

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  if (!(await isSchoolOwner(user.userId))) return NextResponse.json({ error: 'school_required' }, { status: 403 })
  await ensureSchool(db, user.userId)

  const body = await req.json()
  const name = (body.name ?? '').toString().trim().slice(0, 60) || 'My Flight School'
  const publicListing = Boolean(body.public_listing)
  const city = str(body.city, 60)
  const region = str(body.region, 60)
  let website = str(body.website, 200)
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`
  const blurb = str(body.blurb, 280)
  // A public listing needs a slug.
  const slug = publicListing ? await ensureSlug(db, user.userId, name) : null

  await db.query(
    `UPDATE rc_schools SET name = $1, public_listing = $2, city = $3, region = $4, website = $5, blurb = $6,
       slug = COALESCE($7, slug)
     WHERE owner_user_id = $8`,
    [name, publicListing, city, region, website, blurb, slug, user.userId],
  )
  return NextResponse.json({ ok: true, name, slug })
}
