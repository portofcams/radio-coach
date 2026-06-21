import type { NextRequest } from 'next/server'

// Lightweight in-memory rate limiter. Single-container app, so a per-process Map
// is enough to stop abuse loops on the paid (ElevenLabs) endpoints. Resets on
// restart — that's fine; it's a backstop, not billing.
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (arr.length >= limit) { hits.set(key, arr); return false }
  arr.push(now)
  hits.set(key, arr)
  // opportunistic cleanup so the Map can't grow unbounded
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  return true
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
