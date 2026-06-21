import { NextRequest, NextResponse } from 'next/server'
import { generateBrief } from '@/lib/brief'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const dep = (sp.get('dep') || '').trim()
  const dest = (sp.get('dest') || '').trim()
  const callsign = sp.get('callsign') || undefined
  if (!dep || !dest) return NextResponse.json({ ok: false, error: 'Enter a departure and destination ICAO', steps: [] }, { status: 400 })
  return NextResponse.json(generateBrief(dep, dest, callsign))
}
