import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { applyIapEntitlement } from '@/lib/revenuecat'

const ENTITLEMENT_ID = 'pro'

// Called right after a client-side purchase/restore so Pro unlocks
// immediately instead of waiting on the RevenueCat webhook (which is the
// durable source of truth but can lag a few seconds). Re-verifies against
// RevenueCat's REST API using the signed-in session's own id — never trusts
// a client-supplied entitlement claim.
export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 })

  const secretKey = process.env.REVENUECAT_SECRET_API_KEY
  if (!secretKey) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const appUserId = String(user.userId)
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  if (!res.ok) return NextResponse.json({ error: 'revenuecat_lookup_failed' }, { status: 502 })

  const data = await res.json()
  const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID]
  const active = !!entitlement && (!entitlement.expires_date || new Date(entitlement.expires_date) > new Date())

  await applyIapEntitlement({
    userId: user.userId,
    active,
    transactionId: entitlement?.original_purchase_date ?? null,
    periodEnd: entitlement?.expires_date ?? null,
  })

  return NextResponse.json({ pro: active })
}
