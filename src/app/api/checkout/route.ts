import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const API_VERSION = '2026-05-27.dahlia' as never

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  // subscriptions tie to an account → must be logged in
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION })

  const PRICE_MAP: Record<string, string | undefined> = {
    solo: process.env.STRIPE_PRICE_SOLO_PILOT,
    cfi: process.env.STRIPE_PRICE_CFI_PRO,
    school: process.env.STRIPE_PRICE_FLIGHT_SCHOOL,
    'solo:year': process.env.STRIPE_PRICE_SOLO_PILOT_ANNUAL,
    'cfi:year': process.env.STRIPE_PRICE_CFI_PRO_ANNUAL,
    'school:year': process.env.STRIPE_PRICE_FLIGHT_SCHOOL_ANNUAL,
  }
  const { plan, interval } = await req.json()
  const key = interval === 'year' ? `${plan}:year` : plan
  const priceId = PRICE_MAP[key] ?? PRICE_MAP[plan]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  // reuse or create the Stripe customer for this user
  const db = getPool()
  let customerId: string | undefined
  if (db) {
    const r = await db.query('SELECT stripe_customer_id FROM rc_users WHERE id = $1', [user.userId])
    customerId = r.rows[0]?.stripe_customer_id ?? undefined
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: String(user.userId), app: 'clearspar' },
    })
    customerId = customer.id
    if (db) await db.query('UPDATE rc_users SET stripe_customer_id = $2 WHERE id = $1', [user.userId, customerId])
  }

  const origin = req.headers.get('origin') ?? 'https://clearsparradio.binnacleai.com'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: String(user.userId),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/success`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
