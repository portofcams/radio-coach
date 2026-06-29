import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

/** One-click unsubscribe from weekly report emails (CAN-SPAM). */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const db = getPool()
  let ok = false
  if (token && db) {
    const r = await db.query('UPDATE rc_users SET email_opt_out = true WHERE email_unsub_token = $1 RETURNING id', [token])
    ok = (r.rowCount ?? 0) > 0
  }
  const body = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f6f7f9;padding:48px 16px;text-align:center">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px">
      <div style="font-weight:600;letter-spacing:.08em;color:#0b0f14;margin-bottom:12px">CLEARSPAR</div>
      <h1 style="font-size:18px;color:#111827;margin:0 0 8px">${ok ? 'Unsubscribed' : 'Link not recognized'}</h1>
      <p style="color:#6b7280;font-size:14px;margin:0 0 16px">${ok ? "You won't receive weekly radio reports anymore. Your account and progress are untouched." : 'This unsubscribe link is invalid or expired.'}</p>
      <a href="https://clearsparradio.binnacleai.com/train" style="color:#2563eb;font-size:14px">Back to Clearspar Radio Trainer</a>
    </div></body></html>`
  return new NextResponse(body, { status: ok ? 200 : 404, headers: { 'Content-Type': 'text/html' } })
}
