import { NextRequest, NextResponse } from 'next/server'
import { lookupAirport, airportSummary } from '@/lib/airports'

/** Preview a field by ident (for the profile home-field lookup). */
export async function GET(req: NextRequest) {
  const ident = req.nextUrl.searchParams.get('ident')?.trim().toUpperCase()
  if (!ident) return NextResponse.json({ error: 'Missing ident' }, { status: 400 })
  const field = lookupAirport(ident)
  if (!field) return NextResponse.json({ field: null }, { status: 404 })
  return NextResponse.json({ field: airportSummary(field) })
}
