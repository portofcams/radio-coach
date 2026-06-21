import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

/** Uptime/health probe — checks DB connectivity. 200 = healthy, 503 = degraded. */
export async function GET() {
  const db = getPool()
  let dbOk = false
  try { if (db) { await db.query('SELECT 1'); dbOk = true } } catch { dbOk = false }
  return NextResponse.json({ ok: dbOk, db: dbOk }, { status: dbOk ? 200 : 503 })
}
