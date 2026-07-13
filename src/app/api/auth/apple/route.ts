import { NextRequest, NextResponse } from 'next/server'
import { createPublicKey, randomBytes, type JsonWebKey as CryptoJsonWebKey } from 'crypto'
import jwt from 'jsonwebtoken'
import { getPool } from '@/lib/db'
import { hashPassword, setAuthCookie } from '@/lib/auth'
import { applyReferralOnSignup } from '@/lib/referral'
import { exchangeAppleCode } from '@/lib/apple-siwa'

// Sign in with Apple (native). The app sends Apple's identityToken (a JWT signed
// by Apple); we verify the signature against Apple's public keys and the aud/iss
// claims, then find-or-create the user keyed on the stable Apple `sub`. No new
// npm deps — Node's crypto.createPublicKey handles Apple's JWK directly.
const BUNDLE_ID = 'com.binnacleai.radiocoach'
const APPLE_ISS = 'https://appleid.apple.com'
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'

interface AppleJwk { kty: string; kid: string; use: string; alg: string; n: string; e: string }
let _keyCache: { at: number; keys: AppleJwk[] } | null = null

async function appleKeys(): Promise<AppleJwk[]> {
  if (_keyCache && Date.now() - _keyCache.at < 3_600_000) return _keyCache.keys
  const res = await fetch(APPLE_KEYS_URL)
  const data = (await res.json()) as { keys: AppleJwk[] }
  _keyCache = { at: Date.now(), keys: data.keys }
  return data.keys
}

async function verifyIdentityToken(token: string): Promise<{ sub: string; email?: string } | null> {
  const decoded = jwt.decode(token, { complete: true })
  if (!decoded || typeof decoded === 'string') return null
  const kid = decoded.header.kid
  const jwk = (await appleKeys()).find((k) => k.kid === kid)
  if (!jwk) return null

  const pubKey = createPublicKey({ key: jwk as unknown as CryptoJsonWebKey, format: 'jwk' })
  try {
    const payload = jwt.verify(token, pubKey, {
      algorithms: ['RS256'],
      issuer: APPLE_ISS,
      audience: BUNDLE_ID,
    }) as { sub?: string; email?: string }
    if (!payload.sub) return null
    return { sub: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const db = getPool()
  if (!db) return NextResponse.json({ error: 'Auth not available' }, { status: 503 })

  const {
    identityToken, email: bodyEmail, ref, authorizationCode,
  } = (await req.json().catch(() => ({}))) as {
    identityToken?: string; email?: string; ref?: string; authorizationCode?: string
  }
  if (!identityToken) return NextResponse.json({ error: 'identityToken required' }, { status: 400 })

  const verified = await verifyIdentityToken(identityToken)
  if (!verified) return NextResponse.json({ error: 'invalid_apple_token' }, { status: 401 })

  // Apple only returns email in the token on the first authorization; the app may
  // also pass it in the body that first time. Later sign-ins have neither, so we
  // rely on the sub.
  const email = (verified.email ?? bodyEmail ?? '').toLowerCase()

  // 1) existing Apple user
  let user = (await db.query('SELECT id, email FROM rc_users WHERE apple_sub = $1', [verified.sub])).rows[0]

  // 2) existing account with the same email — link it to this Apple id
  if (!user && email) {
    const byEmail = (await db.query('SELECT id, email FROM rc_users WHERE email = $1', [email])).rows[0]
    if (byEmail) {
      await db.query('UPDATE rc_users SET apple_sub = $1 WHERE id = $2', [verified.sub, byEmail.id])
      user = byEmail
    }
  }

  // 3) brand-new user — Apple accounts have no password, so store a random hash
  let isNew = false
  if (!user) {
    const placeholderEmail = email || `apple_${verified.sub.replace(/[^a-zA-Z0-9]/g, '')}@privaterelay.appleid.com`
    const hash = await hashPassword(randomBytes(24).toString('hex'))
    user = (await db.query(
      'INSERT INTO rc_users (email, password_hash, apple_sub) VALUES ($1, $2, $3) RETURNING id, email',
      [placeholderEmail, hash, verified.sub],
    )).rows[0]
    isNew = true

    // Link pending CFI-student / school invites for this email (mirrors signup).
    await db.query(
      `UPDATE rc_cfi_students SET student_user_id = $1, status = 'active'
       WHERE student_email = $2 AND student_user_id IS NULL`,
      [user.id, user.email],
    ).catch(() => {})
    if (ref && typeof ref === 'string') {
      try { await applyReferralOnSignup(db, user.id, ref) } catch { /* best-effort */ }
    }
  }

  // Exchange the one-time authorizationCode for a refresh token so we can revoke
  // it if the user later deletes their account (5.1.1(v)). No-ops until the SIWA
  // key is configured (see src/lib/apple-siwa.ts), so this can't break sign-in.
  if (authorizationCode) {
    const refresh = await exchangeAppleCode(authorizationCode)
    if (refresh) {
      await db.query('UPDATE rc_users SET apple_refresh_token = $1 WHERE id = $2', [refresh, user.id])
    }
  }

  const token = await setAuthCookie({ userId: user.id, email: user.email })
  return NextResponse.json({ user: { id: user.id, email: user.email }, token, isNew })
}
