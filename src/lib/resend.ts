// Minimal Resend sender. Only called when the weekly job runs in live mode.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.WEEKLY_FROM || 'Clearspar Radio Trainer <reports@wilco.binnacleai.com>'
// reports@wilco.binnacleai.com has no inbox (subdomain has no MX), so replies
// must route to an address that actually receives.
// TODO(email): TEMPORARY — replies point at a raw Gmail. Replace with a branded
// domain reply-to (e.g. john@binnacleai.com via Cloudflare Email Routing) and
// verify the sending domain in Resend (DKIM/SPF) before the weekly/drip crons go
// live. Tracked in claude-config/radio-coach/wilco-backlog.md.
const REPLY_TO = process.env.WEEKLY_REPLY_TO || 'portofcams@gmail.com'

export function emailConfigured(): boolean {
  return !!RESEND_API_KEY
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: 'no_key' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
    })
    if (!res.ok) return { ok: false, error: `resend_${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
