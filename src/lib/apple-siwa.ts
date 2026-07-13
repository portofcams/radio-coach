import jwt from 'jsonwebtoken'

// Sign in with Apple server-to-server helpers: mint a client_secret, exchange
// the app's one-time authorizationCode for a refresh token, and revoke that
// token when the user deletes their account (App Store Guideline 5.1.1(v)).
//
// Everything here NO-OPS gracefully when the SIWA key env vars aren't set, so
// the app keeps working before the key is provisioned: sign-in still succeeds
// (we just don't store a refresh token) and account deletion still succeeds
// (we just skip the revoke call). Nothing here can block those flows.
//
// To activate, create a "Sign in with Apple" key in the Apple Developer portal
// (Certificates, Identifiers & Profiles → Keys → +, enable Sign in with Apple,
// group under the primary App ID com.binnacleai.radiocoach), download the .p8,
// and set on the radio-coach container:
//   APPLE_SIWA_KEY_ID   = the 10-char Key ID
//   APPLE_SIWA_KEY_P8   = the .p8 contents (PEM; \n-escaped is fine)
//   APPLE_TEAM_ID       = CCSWC89S2V           (optional; this is the default)
//   APPLE_SIWA_BUNDLE_ID= com.binnacleai.radiocoach (optional; default)

const TEAM_ID = process.env.APPLE_TEAM_ID || 'CCSWC89S2V'
const BUNDLE_ID = process.env.APPLE_SIWA_BUNDLE_ID || 'com.binnacleai.radiocoach'
const KEY_ID = process.env.APPLE_SIWA_KEY_ID || ''
// The .p8 PEM. Env stores may escape newlines as \n — restore them.
const KEY_P8 = (process.env.APPLE_SIWA_KEY_P8 || '').replace(/\\n/g, '\n')

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token'
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke'

export function siwaConfigured(): boolean {
  return Boolean(KEY_ID && KEY_P8)
}

// A short-lived JWT proving we own the app, used as the OAuth client_secret.
function clientSecret(): string {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iss: TEAM_ID, iat: now, exp: now + 3600, aud: 'https://appleid.apple.com', sub: BUNDLE_ID },
    KEY_P8,
    { algorithm: 'ES256', keyid: KEY_ID },
  )
}

// Exchange the app's one-time authorizationCode for a long-lived refresh token.
// Returns null when SIWA isn't configured or the exchange fails (non-fatal).
export async function exchangeAppleCode(code: string): Promise<string | null> {
  if (!siwaConfigured() || !code) return null
  try {
    const body = new URLSearchParams({
      client_id: BUNDLE_ID,
      client_secret: clientSecret(),
      grant_type: 'authorization_code',
      code,
    })
    const res = await fetch(APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return null
    const data = (await res.json()) as { refresh_token?: string }
    return data.refresh_token ?? null
  } catch {
    return null
  }
}

// Revoke a stored refresh token when the user deletes their account (5.1.1(v)).
// Best-effort: never throws, so a revoke failure can't block account deletion.
export async function revokeAppleToken(refreshToken: string | null | undefined): Promise<void> {
  if (!siwaConfigured() || !refreshToken) return
  try {
    const body = new URLSearchParams({
      client_id: BUNDLE_ID,
      client_secret: clientSecret(),
      token: refreshToken,
      token_type_hint: 'refresh_token',
    })
    await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch {
    /* swallow — deletion proceeds regardless */
  }
}
