import { NextRequest, NextResponse } from 'next/server'

// The native iOS app ships as a locally bundled static export (capacitor.config.ts
// has no server.url), so every request it makes to this host is cross-origin —
// capacitor://localhost calling https://clearsparradio.binnacleai.com. Without
// CORS headers here, the browser blocks the preflight and every fetch() from the
// app fails silently (see native-fetch.ts for the credentials side of this fix).
// Excluded from the iOS static-export build by scripts/build-ios.sh — Next.js
// doesn't support middleware with output: 'export'.
const ALLOWED_ORIGINS = new Set(['capacitor://localhost', 'https://clearsparradio.binnacleai.com'])

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null

  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    if (allowOrigin) {
      res.headers.set('Access-Control-Allow-Origin', allowOrigin)
      res.headers.set('Access-Control-Allow-Credentials', 'true')
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    }
    return res
  }

  const res = NextResponse.next()
  if (allowOrigin) {
    res.headers.set('Access-Control-Allow-Origin', allowOrigin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return res
}

export const config = {
  matcher: '/api/:path*',
}
