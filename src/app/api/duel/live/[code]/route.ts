import { NextRequest, NextResponse } from 'next/server'
import { setReady, submit, join, currentSnapshot } from '@/lib/duelroom'

export const dynamic = 'force-dynamic'

// Poll: registers presence (idempotent) + returns the room snapshot.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const pid = req.nextUrl.searchParams.get('pid') || ''
  const name = req.nextUrl.searchParams.get('name') || 'Pilot'
  if (pid) join(code, pid, name)
  return NextResponse.json(currentSnapshot(code))
}

// Player actions: ready up, or submit a graded result.
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const b = await req.json().catch(() => ({}))
  if (!b.pid) return NextResponse.json({ error: 'no_pid' }, { status: 400 })
  if (b.action === 'ready') setReady(code, b.pid)
  else if (b.action === 'submit') submit(code, b.pid, Number(b.score) || 0, Number(b.timeMs) || 0)
  return NextResponse.json({ ok: true })
}
