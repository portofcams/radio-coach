import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { verifyTransactionJws, applyIapEntitlement, IAP_PRODUCT_IDS } from '@/lib/apple-iap'

// Called by the app right after a StoreKit 2 purchase/restore with the
// transaction's jwsRepresentation. Apple signed that JWS; we verify the chain
// server-side and unlock Pro for the signed-in account. The App Store Server
// Notifications webhook keeps renewals/cancellations in sync afterwards.
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 })

  const { jws } = (await req.json().catch(() => ({}))) as { jws?: string }
  if (!jws || typeof jws !== 'string') {
    return NextResponse.json({ error: 'jws required' }, { status: 400 })
  }

  const verified = await verifyTransactionJws(jws)
  if (!verified) return NextResponse.json({ error: 'invalid_transaction' }, { status: 400 })

  const { tx } = verified
  if (!tx.productId || !IAP_PRODUCT_IDS.has(tx.productId)) {
    return NextResponse.json({ error: 'unknown_product' }, { status: 400 })
  }

  const active = !!tx.expiresDate && tx.expiresDate > Date.now()
  await applyIapEntitlement({
    userId: user.userId,
    active,
    originalTransactionId: tx.originalTransactionId ?? null,
    periodEnd: tx.expiresDate ? new Date(tx.expiresDate).toISOString() : null,
  })

  return NextResponse.json({ pro: active })
}
