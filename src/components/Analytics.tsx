'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { platformTag } from '@/lib/native'

function anonId(): string {
  try {
    let id = localStorage.getItem('rc_anon_id')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('rc_anon_id', id)
    }
    return id
  } catch {
    return 'na'
  }
}

// utm_source/utm_medium only ever matter on the landing hit itself (e.g. a
// widget "powered by" backlink or a directory listing's CTA) -- read the raw
// query string via window.location instead of useSearchParams() so this
// component doesn't force a Suspense boundary (and a dynamic-render opt-out)
// on every page in the app just to catch a param that's rarely even present.
function attributionTag(): string {
  try {
    const p = new URLSearchParams(window.location.search)
    const source = p.get('utm_source')
    const medium = p.get('utm_medium')
    return source ? `${source}${medium ? `:${medium}` : ''}` : ''
  } catch {
    return ''
  }
}

// First-party pageview beacon — fires on every route change. Uses sendBeacon so
// it survives navigation; no cookies, anonymous random id only.
export default function Analytics() {
  const pathname = usePathname()
  useEffect(() => {
    try {
      const body = JSON.stringify({
        event: 'pageview',
        path: pathname,
        platform: platformTag(),
        anonId: anonId(),
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        ref: attributionTag(),
      })
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      } else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }, [pathname])
  return null
}
