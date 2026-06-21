'use client'

// Native-only helpers (Capacitor). All no-op on the web, so the same web build
// powers the iOS app and the browser. These are what move the app past App
// Store guideline 4.2 — real device features, not just a wrapped website.
import { Capacitor } from '@capacitor/core'

export function isNative(): boolean {
  try { return Capacitor.isNativePlatform() } catch { return false }
}

/** Tactile feedback on a graded readback — success vs. warning. */
export async function gradeHaptic(pass: boolean): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: pass ? NotificationType.Success : NotificationType.Warning })
  } catch { /* haptics unavailable */ }
}

/** Schedule a daily on-device practice reminder (no server / push needed). */
export async function scheduleDailyReminder(): Promise<void> {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] }).catch(() => {})
    await LocalNotifications.schedule({
      notifications: [{
        id: 1001,
        title: 'Keep your radio sharp',
        body: 'Two minutes of ATC practice keeps the phraseology fresh.',
        schedule: { on: { hour: 17, minute: 0 }, repeats: true, allowWhileIdle: true },
      }],
    })
  } catch { /* notifications unavailable */ }
}
