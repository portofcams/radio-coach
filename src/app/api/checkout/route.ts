import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia' as never,
  })

  const PRICE_MAP: Record<string, string | undefined> = {
    solo: process.env.STRIPE_PRICE_SOLO_PILOT,
    cfi: process.env.STRIPE_PRICE_CFI_PRO,
  }

  const { plan } = await req.json()
  const priceId = PRICE_MAP[plan]

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'https://radiocoach.binnacleai.com'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/api/activate?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
