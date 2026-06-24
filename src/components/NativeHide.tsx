'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { isNative } from '@/lib/native'

// Hides its children inside the native iOS app — App Store 3.1.1 forbids
// surfacing non-IAP purchase UI (prices, "subscribe" CTAs) in-app. Renders
// normally on the web. (Brief render-then-hide on native is acceptable.)
export default function NativeHide({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => { if (isNative()) setHidden(true) }, [])
  if (hidden) return null
  return <>{children}</>
}
