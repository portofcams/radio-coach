'use client'

// StoreKit purchases via RevenueCat (Capacitor). No-op on web — the Stripe
// checkout flow in PaywallModal.tsx stays the purchase path there. This is
// what makes the iOS Pro upgrade guideline-3.1.1 compliant: the app sells its
// own subscription through Apple's IAP instead of only unlocking content
// bought elsewhere.
import { isNative } from './native'

// Configure these products/entitlement in the RevenueCat dashboard to mirror
// the Stripe "solo" plan (monthly + annual). Entitlement id must be "pro".
const REVENUECAT_ENTITLEMENT_ID = 'pro'

export interface IapPackage {
  identifier: string
  title: string
  priceString: string
  period: 'month' | 'year' | 'other'
}

let configured = false

async function ensureConfigured(appUserId?: string): Promise<boolean> {
  if (!isNative()) return false
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY
  if (!apiKey) return false
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    if (!configured) {
      await Purchases.configure({ apiKey, appUserID: appUserId })
      configured = true
    } else if (appUserId) {
      await Purchases.logIn({ appUserID: appUserId })
    }
    return true
  } catch {
    return false
  }
}

/** List purchasable packages from the current RevenueCat offering. */
export async function getIapPackages(appUserId?: string): Promise<IapPackage[]> {
  if (!(await ensureConfigured(appUserId))) return []
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const offerings = await Purchases.getOfferings()
    const pkgs = offerings.current?.availablePackages ?? []
    return pkgs.map((p) => ({
      identifier: p.identifier,
      title: p.product.title,
      priceString: p.product.priceString,
      period: p.packageType === 'MONTHLY' ? 'month' : p.packageType === 'ANNUAL' ? 'year' : 'other',
    }))
  } catch {
    return []
  }
}

/** Purchase a package by identifier, then push the resulting entitlement to
 * our server so access unlocks immediately (RevenueCat's webhook is the
 * durable source of truth but can lag a few seconds). */
export async function purchaseIapPackage(identifier: string, appUserId?: string): Promise<boolean> {
  if (!(await ensureConfigured(appUserId))) return false
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const offerings = await Purchases.getOfferings()
    const pkg = offerings.current?.availablePackages.find((p) => p.identifier === identifier)
    if (!pkg) return false
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    const active = !!customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
    if (active) await syncEntitlement(customerInfo)
    return active
  } catch {
    return false
  }
}

export async function restoreIapPurchases(appUserId?: string): Promise<boolean> {
  if (!(await ensureConfigured(appUserId))) return false
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const result = await Purchases.restorePurchases()
    const active = !!result.customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
    if (active) await syncEntitlement(result.customerInfo)
    return active
  } catch {
    return false
  }
}

async function syncEntitlement(customerInfo: { originalAppUserId: string }): Promise<void> {
  await fetch('/api/iap/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appUserId: customerInfo.originalAppUserId }),
  }).catch(() => {})
}
