'use client'

import { useEffect } from 'react'
import { scheduleDailyReminder } from '@/lib/native'

/** App-open setup: native practice reminder + offline service worker. */
export default function NativeInit() {
  useEffect(() => {
    scheduleDailyReminder()
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
