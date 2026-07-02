import {
  SignedDataVerifier,
  Environment,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from '@apple/app-store-server-library'
import { APPLE_ROOT_CAS } from './apple-certs'
import { getPool } from './db'

// Native StoreKit 2 entitlement plumbing — no third-party IAP service. The
// client sends Apple's own signed transaction (JWS); we verify the signature
// chain against Apple's root CAs and never trust client-supplied claims.
const BUNDLE_ID = 'com.binnacleai.radiocoach'
const APP_APPLE_ID = 6781150292 // App Store Connect app id, required for prod verification
export const IAP_PRODUCT_IDS = new Set(['com.binnacleai.radiocoach.pro.monthly'])

function makeVerifier(env: Environment): SignedDataVerifier {
  // enableOnlineChecks=true adds OCSP revocation checking on the cert chain.
  return new SignedDataVerifier(APPLE_ROOT_CAS, true, env, BUNDLE_ID, APP_APPLE_ID)
}

/** Verify a StoreKit 2 transaction JWS. Tries Production first, then Sandbox
 * (TestFlight and App Review purchases are sandbox-signed). */
export async function verifyTransactionJws(
  jws: string,
): Promise<{ tx: JWSTransactionDecodedPayload; environment: Environment } | null> {
  for (const env of [Environment.PRODUCTION, Environment.SANDBOX]) {
    try {
      const tx = await makeVerifier(env).verifyAndDecodeTransaction(jws)
      return { tx, environment: env }
    } catch {
      // fall through to next environment
    }
  }
  return null
}

/** Verify an App Store Server Notification V2 signedPayload. */
export async function verifyNotification(
  signedPayload: string,
): Promise<{ payload: ResponseBodyV2DecodedPayload; environment: Environment } | null> {
  for (const env of [Environment.PRODUCTION, Environment.SANDBOX]) {
    try {
      const payload = await makeVerifier(env).verifyAndDecodeNotification(signedPayload)
      return { payload, environment: env }
    } catch {
      // fall through to next environment
    }
  }
  return null
}

/** Decode the signedTransactionInfo embedded in a notification, using the
 * same environment the outer payload verified against. */
export async function decodeNotificationTransaction(
  signedTransactionInfo: string,
  environment: Environment,
): Promise<JWSTransactionDecodedPayload | null> {
  try {
    return await makeVerifier(environment).verifyAndDecodeTransaction(signedTransactionInfo)
  } catch {
    return null
  }
}

/** Mirrors the Stripe webhook's applySubscription() so getEntitlement() needs
 * no changes. apple_transaction_id stores the ORIGINAL transaction id — the
 * stable key App Store Server Notifications are matched back on. CFI/School
 * plans stay Stripe-only (instructor/B2B purchases made on web). */
export async function applyIapEntitlement(opts: {
  userId: number
  active: boolean
  originalTransactionId?: string | null
  periodEnd?: string | null
}): Promise<void> {
  const db = getPool()
  if (!db) return
  await db.query(
    `UPDATE rc_users SET
       apple_transaction_id = $2,
       subscription_status = $3,
       plan = $4,
       current_period_end = $5
     WHERE id = $1`,
    [
      opts.userId,
      opts.originalTransactionId ?? null,
      opts.active ? 'active' : 'inactive',
      opts.active ? 'solo' : null,
      opts.periodEnd ?? null,
    ],
  )
}

export async function userIdForOriginalTransaction(originalTransactionId: string): Promise<number | null> {
  const db = getPool()
  if (!db) return null
  const r = await db.query('SELECT id FROM rc_users WHERE apple_transaction_id = $1', [originalTransactionId])
  return r.rows[0]?.id ?? null
}
