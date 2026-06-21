// GlitchTip / Sentry error reporting — dependency-free (Sentry store endpoint).
// Gated on GLITCHTIP_DSN; a clean no-op until that env is set.
// DSN form: https://<publicKey>@<host>/<projectId>  (GlitchTip = errors.portofcams.com)
import { randomUUID } from 'node:crypto'

const DSN = process.env.GLITCHTIP_DSN

export function glitchtipConfigured(): boolean {
  return Boolean(DSN)
}

function parseDsn(dsn: string) {
  const m = dsn.match(/^(https?):\/\/([^@]+)@([^/]+)\/(.+)$/)
  if (!m) return null
  return { scheme: m[1], key: m[2], host: m[3], project: m[4] }
}

async function send(event: Record<string, unknown>): Promise<void> {
  if (!DSN) return
  const d = parseDsn(DSN)
  if (!d) return
  try {
    await fetch(`${d.scheme}://${d.host}/api/${d.project}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${d.key}, sentry_client=wilco/1.0`,
      },
      body: JSON.stringify({
        event_id: randomUUID().replace(/-/g, ''),
        timestamp: new Date().toISOString(),
        platform: 'node',
        environment: 'production',
        tags: { app: 'wilco' },
        ...event,
      }),
    })
  } catch {
    /* never let reporting break the request */
  }
}

export async function captureException(err: unknown, extra?: Record<string, unknown>): Promise<void> {
  const e = err as { name?: string; message?: string; stack?: string }
  await send({
    level: 'error',
    exception: { values: [{ type: e?.name ?? 'Error', value: String(e?.message ?? err) }] },
    extra: { ...extra, stack: e?.stack?.slice(0, 4000) },
  })
}

export async function captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'error', extra?: Record<string, unknown>): Promise<void> {
  await send({ level, message: message.slice(0, 1000), extra })
}
