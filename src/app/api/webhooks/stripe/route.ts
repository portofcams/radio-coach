import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPool } from '@/lib/db'
import { grantReferrerOnConversion } from '@/lib/referral'

const API_VERSION = '2026-05-27.dahlia' as never

function planFor(priceId: string | undefined): string | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_FLIGHT_SCHOOL) return 'school'
  if (priceId === process.env.STRIPE_PRICE_CFI_PRO) return 'cfi'
  return 'solo'
}

// Write a subscription's state onto the matching user (keyed by Stripe customer id).
async function applySubscription(sub: Stripe.Subscription) {
  const db = getPool()
  if (!db) return
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const priceId = sub.items.data[0]?.price?.id
  // current_period_end may live at top level or on the item depending on API version
  const cpe =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number })?.current_period_end
  const periodEnd = cpe ? new Date(cpe * 1000).toISOString() : null
  await db.query(
    `UPDATE rc_users SET
       stripe_subscription_id = $2,
       subscription_status = $3,
       plan = $4,
       current_period_end = $5
     WHERE stripe_customer_id = $1`,
    [customerId, sub.id, sub.status, planFor(priceId), periodEnd],
  )

  // Referral payoff: a referred user who actually starts paying earns their
  // referrer a comp month (granted once).
  if (sub.status === 'active') {
    const u = await db.query('SELECT id FROM rc_users WHERE stripe_customer_id = $1', [customerId])
    if (u.rows[0]) await grantReferrerOnConversion(db, u.rows[0].id).catch(() => {})
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }

  try {
    const db = getPool()
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const userId = s.client_reference_id
        const customerId = typeof s.customer === 'string' ? s.customer : s.customer?.id
        if (db && userId && customerId) {
          await db.query('UPDATE rc_users SET stripe_customer_id = $2 WHERE id = $1', [Number(userId), customerId])
        }
        if (s.subscription) {
          const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id
          await applySubscription(await stripe.subscriptions.retrieve(subId))
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const inv = event.data.object as unknown as { subscription?: string | { id: string } }
        if (inv.subscription) {
          const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id
          await applySubscription(await stripe.subscriptions.retrieve(subId))
        }
        break
      }
    }
  } catch (e) {
    console.error('[stripe webhook] handler error', e)
    return NextResponse.json({ error: 'handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
