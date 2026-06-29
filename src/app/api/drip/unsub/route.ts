import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const db = getPool()
  if (token && db) {
    await db.query('UPDATE rc_drip_subscribers SET opted_out = true WHERE unsub_token = $1', [token]).catch(() => {})
  }
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div style="font-family:-apple-system,sans-serif;max-width:420px;margin:80px auto;text-align:center;padding:0 20px"><h1 style="font-size:20px">Unsubscribed</h1><p style="color:#6b7280">You won't get any more emails from the radio-confidence course. Fly safe.</p><a href="https://clearsparradio.binnacleai.com" style="color:#2563eb">clearsparradio.binnacleai.com</a></div>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}
