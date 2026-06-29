import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const API_VERSION = '2026-05-27.dahlia' as never

// Stripe Billing Portal — lets the user manage / cancel their subscription themselves.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'login_required' }, { status: 401 })

  const db = getPool()
  const r = await db?.query('SELECT stripe_customer_id FROM rc_users WHERE id = $1', [user.userId])
  const customerId = r?.rows[0]?.stripe_customer_id
  if (!customerId) return NextResponse.json({ error: 'no_customer' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: API_VERSION })
  const origin = req.headers.get('origin') ?? 'https://clearsparradio.binnacleai.com'
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/profile`,
  })
  return NextResponse.json({ url: session.url })
}
