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
