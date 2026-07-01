import { Capacitor } from '@capacitor/core'

// The native iOS build loads a locally bundled static export (no origin
// server of its own), so every `fetch('/api/...')` call across the app needs
// to hit the real API host instead. Patching window.fetch once here means
// none of the ~50 call sites need to change — they keep writing relative
// paths exactly as the web build does.
let patched = false

export function installNativeFetchPatch(): void {
  if (typeof window === 'undefined' || patched) return
  let native = false
  try { native = Capacitor.isNativePlatform() } catch { native = false }
  const base = process.env.NEXT_PUBLIC_API_BASE
  if (!native || !base) return

  patched = true
  const original = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    if (url.startsWith('/api/')) return original(base + url, init)
    return original(input, init)
  }
}
