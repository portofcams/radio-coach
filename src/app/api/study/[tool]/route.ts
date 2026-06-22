import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

const TOOLS = new Set(['flashcards', 'acs'])

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  if (!TOOLS.has(tool)) return NextResponse.json({ error: 'bad_tool' }, { status: 400 })
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ state: null })
  const db = getPool()
  if (!db) return NextResponse.json({ state: null })
  const r = await db.query('SELECT state FROM rc_study_state WHERE user_id=$1 AND tool=$2', [user.userId, tool])
  return NextResponse.json({ state: r.rows[0]?.state ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params
  if (!TOOLS.has(tool)) return NextResponse.json({ error: 'bad_tool' }, { status: 400 })
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ ok: false })
  const db = getPool()
  if (!db) return NextResponse.json({ ok: false })
  const body = await req.json()
  const state = body?.state ?? {}
  // guard: keep it bounded
  if (JSON.stringify(state).length > 50_000) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  await db.query(
    `INSERT INTO rc_study_state (user_id, tool, state, updated_at) VALUES ($1,$2,$3, now())
     ON CONFLICT (user_id, tool) DO UPDATE SET state = $3, updated_at = now()`,
    [user.userId, tool, JSON.stringify(state)],
  )
  return NextResponse.json({ ok: true })
}
