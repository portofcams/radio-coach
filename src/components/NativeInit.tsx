'use client'

import { useEffect } from 'react'
import { scheduleDailyReminder, registerPush } from '@/lib/native'

/** App-open setup: native practice reminder + push + offline service worker + error capture. */
export default function NativeInit() {
  useEffect(() => {
    scheduleDailyReminder()
    registerPush()
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    // Lightweight client-error capture (throttled to a few per session).
    let sent = 0
    const report = (message: string, stack?: string) => {
      if (sent >= 5) return
      sent++
      fetch('/api/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: String(message).slice(0, 500), stack: stack?.slice(0, 2000), url: location.href }),
      }).catch(() => {})
    }
    const onErr = (e: ErrorEvent) => report(e.message, e.error?.stack)
    const onRej = (e: PromiseRejectionEvent) => report(`unhandledrejection: ${e.reason?.message ?? e.reason}`, e.reason?.stack)
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    return () => { window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej) }
  }, [])
  return null
}
