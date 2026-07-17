import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createAffiliate, affiliateStats } from '@/lib/affiliate'

const APP_URL = process.env.APP_URL || 'https://clearsparradio.binnacleai.com'

function checkKey(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key')
  return !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY
}

export async function GET(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'no_db' }, { status: 503 })

  const affiliates = await affiliateStats(db)
  return NextResponse.json({
    affiliates: affiliates.map((a) => ({ ...a, link: `${APP_URL}/login?aff=${a.code}&mode=signup` })),
  })
}

export async function POST(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'no_db' }, { status: 503 })

  const b = await req.json()
  const name = (b.name ?? '').toString().trim().slice(0, 120)
  const contactEmail = (b.contactEmail ?? '').toString().trim().slice(0, 200) || null
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 })

  const affiliate = await createAffiliate(db, name, contactEmail)
  return NextResponse.json({ affiliate: { ...affiliate, link: `${APP_URL}/login?aff=${affiliate.code}&mode=signup` } })
}
