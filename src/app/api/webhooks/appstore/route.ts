import { NextRequest, NextResponse } from 'next/server'
import {
  verifyNotification,
  decodeNotificationTransaction,
  applyIapEntitlement,
  userIdForOriginalTransaction,
} from '@/lib/apple-iap'

// App Store Server Notifications V2. Configure both Production and Sandbox
// URLs in App Store Connect (App Information → App Store Server Notifications)
// to point here. The payload is an Apple-signed JWS — signature verification
// IS the authentication; there is no shared secret to check.
const FORCE_INACTIVE = new Set(['REFUND', 'REVOKE', 'GRACE_PERIOD_EXPIRED', 'EXPIRED'])

export async function POST(req: NextRequest) {
  const { signedPayload } = (await req.json().catch(() => ({}))) as { signedPayload?: string }
  if (!signedPayload) return NextResponse.json({ ok: true })

  const verified = await verifyNotification(signedPayload)
  if (!verified) return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })

  const { payload, environment } = verified
  const signedTx = payload.data?.signedTransactionInfo
  if (!signedTx) return NextResponse.json({ ok: true })

  const tx = await decodeNotificationTransaction(signedTx, environment)
  if (!tx?.originalTransactionId) return NextResponse.json({ ok: true })

  const userId = await userIdForOriginalTransaction(tx.originalTransactionId)
  // Unknown transaction (e.g. purchase never verified through /api/iap/verify)
  // — nothing to update; 200 so Apple doesn't retry forever.
  if (userId === null) return NextResponse.json({ ok: true })

  const type = payload.notificationType ?? ''
  const active = FORCE_INACTIVE.has(type) ? false : !!tx.expiresDate && tx.expiresDate > Date.now()

  await applyIapEntitlement({
    userId,
    active,
    originalTransactionId: tx.originalTransactionId,
    periodEnd: active && tx.expiresDate ? new Date(tx.expiresDate).toISOString() : null,
  })

  return NextResponse.json({ ok: true })
}
