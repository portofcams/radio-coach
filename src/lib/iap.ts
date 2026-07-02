'use client'

// StoreKit 2 purchases via our own local Capacitor plugin (IAPPlugin.swift in
// the iOS project) — no third-party IAP service. No-op on web: the Stripe
// checkout flow in PaywallModal.tsx stays the purchase path there. This is
// what makes the iOS Pro upgrade guideline-3.1.1 compliant: the app sells its
// own subscription through Apple's IAP instead of only unlocking content
// bought elsewhere. Apple's signed transaction (JWS) is verified server-side
// by /api/iap/verify before anything unlocks.
import { registerPlugin } from '@capacitor/core'
import { isNative } from './native'

const IAP_PRODUCT_IDS = ['com.binnacleai.radiocoach.pro.monthly']

interface IAPNativePlugin {
  getProducts(options: { productIds: string[] }): Promise<{
    products: { id: string; displayName: string; displayPrice: string; period: string }[]
  }>
  purchase(options: { productId: string }): Promise<{ jws?: string; cancelled?: boolean; pending?: boolean }>
  restore(): Promise<{ jws?: string; none?: boolean }>
}

const IAP = registerPlugin<IAPNativePlugin>('IAP')

export interface IapPackage {
  identifier: string
  title: string
  priceString: string
  period: 'month' | 'year' | 'other'
}

/** List purchasable App Store products. Empty on web / on failure. */
export async function getIapPackages(_appUserId?: string): Promise<IapPackage[]> {
  if (!isNative()) return []
  try {
    const { products } = await IAP.getProducts({ productIds: IAP_PRODUCT_IDS })
    return products.map((p) => ({
      identifier: p.id,
      title: p.displayName,
      priceString: p.displayPrice,
      period: p.period === 'month' ? 'month' : p.period === 'year' ? 'year' : 'other',
    }))
  } catch {
    return []
  }
}

/** Purchase a product, then have the server verify Apple's signed transaction
 * so Pro unlocks for the signed-in account immediately. */
export async function purchaseIapPackage(identifier: string, _appUserId?: string): Promise<boolean> {
  if (!isNative()) return false
  try {
    const result = await IAP.purchase({ productId: identifier })
    if (!result.jws) return false
    return await verifyWithServer(result.jws)
  } catch {
    return false
  }
}

export async function restoreIapPurchases(_appUserId?: string): Promise<boolean> {
  if (!isNative()) return false
  try {
    const result = await IAP.restore()
    if (!result.jws) return false
    return await verifyWithServer(result.jws)
  } catch {
    return false
  }
}

async function verifyWithServer(jws: string): Promise<boolean> {
  try {
    const res = await fetch('/api/iap/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jws }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { pro?: boolean }
    return !!data.pro
  } catch {
    return false
  }
}
