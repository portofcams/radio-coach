import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  const baseUrl = new URL('/', req.url)

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return NextResponse.redirect(baseUrl)

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia' as never,
  })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/?error=payment', req.url))
    }

    const proUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const cookieStore = await cookies()

    cookieStore.set('rc_pro_until', proUntil, {
      httpOnly: false,
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.redirect(new URL('/success', req.url))
  } catch {
    return NextResponse.redirect(new URL('/?error=activation', req.url))
  }
}
