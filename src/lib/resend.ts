// Minimal Resend sender. Only called when the weekly job runs in live mode.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.WEEKLY_FROM || 'Wilco <reports@wilco.binnacleai.com>'

export function emailConfigured(): boolean {
  return !!RESEND_API_KEY
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: 'no_key' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
    })
    if (!res.ok) return { ok: false, error: `resend_${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
