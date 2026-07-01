import { NextRequest, NextResponse } from 'next/server'
import { applyIapEntitlement, userIdFromAppUserId } from '@/lib/revenuecat'

// RevenueCat sends a fixed Authorization header value you set in the
// dashboard (Project Settings → Integrations → Webhooks). Compare it directly
// — this is a shared secret, not a signature.
const ACTIVE_TYPES = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'])
const INACTIVE_TYPES = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'])

interface RevenueCatEvent {
  type: string
  app_user_id: string
  transaction_id?: string
  expiration_at_ms?: number | null
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (req.headers.get('authorization') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as { event?: RevenueCatEvent }
  const event = body.event
  if (!event?.app_user_id || !event.type) return NextResponse.json({ ok: true })

  const userId = userIdFromAppUserId(event.app_user_id)
  if (userId === null) return NextResponse.json({ ok: true })

  if (ACTIVE_TYPES.has(event.type)) {
    await applyIapEntitlement({
      userId,
      active: true,
      transactionId: event.transaction_id ?? null,
      periodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    })
  } else if (INACTIVE_TYPES.has(event.type)) {
    await applyIapEntitlement({ userId, active: false, transactionId: event.transaction_id ?? null })
  }

  return NextResponse.json({ ok: true })
}
