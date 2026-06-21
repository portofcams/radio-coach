// Wilco service worker — conservative offline support.
// Online users ALWAYS get fresh content (network-first for pages); pages you've
// visited are served from cache when offline (so Ground School works on the ramp).
// Hashed static assets are cache-first. Bump VERSION to invalidate.
const VERSION = 'wilco-v1'
const CACHE = `wilco-cache-${VERSION}`

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

const OFFLINE_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Wilco</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0f14;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center">
<div style="max-width:300px;padding:24px"><div style="font-weight:600;letter-spacing:.1em;margin-bottom:12px">WILCO</div>
<p style="color:#9ca3af;font-size:14px">You're offline. Pages you've already opened — including Ground School — still work. Reconnect for live comms.</p></div></body></html>`

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // don't touch cross-origin (TTS/STT/etc.)
  if (url.pathname.startsWith('/api/')) return // never cache API

  // Hashed/static assets — cache-first (immutable)
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/charts') || url.pathname.startsWith('/icons')) {
    event.respondWith((async () => {
      const cached = await caches.match(req)
      if (cached) return cached
      try {
        const res = await fetch(req)
        const c = await caches.open(CACHE); c.put(req, res.clone())
        return res
      } catch { return cached || Response.error() }
    })())
    return
  }

  // Navigations / pages — network-first, fall back to cache, then offline page
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req)
        const c = await caches.open(CACHE); c.put(req, res.clone())
        return res
      } catch {
        const cached = await caches.match(req)
        return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } })
      }
    })())
  }
})
