// SERVER-ONLY. Send a push notification to every device a user has registered.
// Thin wrapper over apns.ts that handles token lookup + dead-token pruning.
// No-ops cleanly (sent:0, configured:false) until the APNs key env is set.
import type { Pool } from 'pg'
import { sendApns, apnsConfigured, type PushPayload } from './apns'

export interface PushResult { sent: number; pruned: number; configured: boolean; tokens: number }

/** Push to all of a user's iOS devices. Prunes tokens APNs reports as dead. */
export async function pushToUser(db: Pool, userId: number, payload: PushPayload): Promise<PushResult> {
  if (!apnsConfigured()) return { sent: 0, pruned: 0, configured: false, tokens: 0 }
  const r = await db.query('SELECT token FROM rc_push_tokens WHERE user_id = $1 AND platform = $2', [userId, 'ios'])
  const tokens: string[] = r.rows.map((row) => row.token)
  if (tokens.length === 0) return { sent: 0, pruned: 0, configured: true, tokens: 0 }

  const results = await sendApns(tokens, payload)
  let sent = 0
  const dead: string[] = []
  for (const res of results) {
    if (res.ok) sent++
    // 410 = device token no longer active; 400 = BadDeviceToken. Drop both.
    else if (res.status === 410 || res.status === 400) dead.push(res.token)
  }
  if (dead.length) {
    await db.query('DELETE FROM rc_push_tokens WHERE token = ANY($1)', [dead]).catch(() => {})
  }
  return { sent, pruned: dead.length, configured: true, tokens: tokens.length }
}
