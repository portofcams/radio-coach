'use client'

// Native-only helpers (Capacitor). All no-op on the web, so the same web build
// powers the iOS app and the browser. These are what move the app past App
// Store guideline 4.2 — real device features, not just a wrapped website.
import { Capacitor } from '@capacitor/core'

export function isNative(): boolean {
  try { return Capacitor.isNativePlatform() } catch { return false }
}

/** Platform tag for analytics: 'ios' | 'android' | 'web'. */
export function platformTag(): 'ios' | 'android' | 'web' {
  try {
    const p = Capacitor.getPlatform()
    return p === 'ios' || p === 'android' ? p : 'web'
  } catch {
    return 'web'
  }
}

/** Tactile feedback on a graded readback — success vs. warning. */
export async function gradeHaptic(pass: boolean): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: pass ? NotificationType.Success : NotificationType.Warning })
  } catch { /* haptics unavailable */ }
}

/** Native mic record (Capacitor) → returns true if recording started. */
export async function startNativeRecording(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { VoiceRecorder } = await import('capacitor-voice-recorder')
    const perm = await VoiceRecorder.requestAudioRecordingPermission()
    if (!perm.value) return false
    await VoiceRecorder.startRecording()
    return true
  } catch { return false }
}

/** Stop native recording and transcribe via ElevenLabs Scribe (better than
 * on-device ASR). Returns the transcript AND the raw audio blob so the caller
 * can offer playback-through-the-radio. */
export async function stopNativeRecordingTranscribe(): Promise<{ text: string | null; blob: Blob | null }> {
  if (!isNative()) return { text: null, blob: null }
  try {
    const { VoiceRecorder } = await import('capacitor-voice-recorder')
    const res = await VoiceRecorder.stopRecording()
    const { recordDataBase64, mimeType } = res.value
    if (!recordDataBase64) return { text: null, blob: null }
    const bin = atob(recordDataBase64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const blob = new Blob([bytes], { type: mimeType || 'audio/aac' })
    const fd = new FormData()
    fd.append('audio', blob, 'readback.m4a')
    const r = await fetch('/api/stt', { method: 'POST', body: fd })
    if (!r.ok) return { text: null, blob }
    return { text: (await r.json()).text ?? null, blob }
  } catch { return { text: null, blob: null } }
}

/** Register for remote push (APNs/FCM) and send the device token to the server.
 * Safe no-op on web or if the user hasn't granted push. */
export async function registerPush(): Promise<void> {
  if (!isNative()) return
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return
    PushNotifications.addListener('registration', (t: { value: string }) => {
      const platform = Capacitor.getPlatform() === 'android' ? 'android' : 'ios'
      fetch('/api/push/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t.value, platform }),
      }).catch(() => {})
    })
    // Tapping a notification deep-links into the relevant screen.
    PushNotifications.addListener('pushNotificationActionPerformed', (a: { notification?: { data?: Record<string, string> } }) => {
      const type = a?.notification?.data?.type
      try {
        if (type === 'coach-note') location.assign('/progress')
        else if (type === 'streak') location.assign('/train')
      } catch { /* navigation unavailable */ }
    })
    await PushNotifications.register()
  } catch { /* push unavailable */ }
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
