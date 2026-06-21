// APNs sender — HTTP/2 + ES256 JWT (no third-party deps). Server-only.
// Gated on config: returns { configured:false } until the APNs key env is set.
// Env: APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8 (the .p8 PEM contents, \n-joined),
//      APNS_BUNDLE (default com.binnacleai.radiocoach), APNS_HOST (default prod).
import http2 from 'node:http2'
import { createPrivateKey, createSign } from 'node:crypto'

const KEY_ID = process.env.APNS_KEY_ID
const TEAM_ID = process.env.APNS_TEAM_ID
const P8 = process.env.APNS_KEY_P8
const BUNDLE = process.env.APNS_BUNDLE || 'com.binnacleai.radiocoach'
const HOST = process.env.APNS_HOST || 'https://api.push.apple.com'

export function apnsConfigured(): boolean {
  return Boolean(KEY_ID && TEAM_ID && P8)
}

const b64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

// APNs provider JWT — valid up to 1h; cache and refresh at ~50 min.
let cachedToken: { jwt: string; at: number } | null = null
function providerToken(): string {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now - cachedToken.at < 3000) return cachedToken.jwt
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID })))
  const payload = b64url(Buffer.from(JSON.stringify({ iss: TEAM_ID, iat: now })))
  const signer = createSign('SHA256')
  signer.update(`${header}.${payload}`)
  const key = createPrivateKey({ key: (P8 as string).replace(/\\n/g, '\n'), format: 'pem' })
  const sig = b64url(signer.sign({ key, dsaEncoding: 'ieee-p1363' }))
  const jwt = `${header}.${payload}.${sig}`
  cachedToken = { jwt, at: now }
  return jwt
}

export interface PushPayload { title: string; body: string; data?: Record<string, string> }

/** Send one alert to many device tokens. Resolves with per-token results. */
export async function sendApns(tokens: string[], payload: PushPayload): Promise<Array<{ token: string; ok: boolean; status?: number }>> {
  if (!apnsConfigured() || tokens.length === 0) return tokens.map((token) => ({ token, ok: false }))
  const jwt = providerToken()
  const client = http2.connect(HOST)
  const body = JSON.stringify({ aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' }, ...(payload.data ?? {}) })

  const results = await Promise.all(
    tokens.map(
      (token) =>
        new Promise<{ token: string; ok: boolean; status?: number }>((resolve) => {
          const req = client.request({
            ':method': 'POST',
            ':path': `/3/device/${token}`,
            authorization: `bearer ${jwt}`,
            'apns-topic': BUNDLE,
            'apns-push-type': 'alert',
            'content-type': 'application/json',
          })
          let status = 0
          req.on('response', (h) => { status = Number(h[':status']) || 0 })
          req.on('error', () => resolve({ token, ok: false }))
          req.on('end', () => resolve({ token, ok: status === 200, status }))
          req.setEncoding('utf8')
          req.on('data', () => {})
          req.write(body)
          req.end()
        }),
    ),
  )
  client.close()
  return results
}
