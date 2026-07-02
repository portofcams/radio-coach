'use client'

import { useEffect, useState } from 'react'
import { getIapPackages, purchaseIapPackage, restoreIapPurchases, type IapPackage } from '@/lib/iap'

interface Props {
  userId?: number
  onPurchased: () => void
  compact?: boolean
}

// The only in-app purchase surface — native StoreKit 2. This is what
// makes the iOS Pro upgrade guideline-3.1.1 compliant (Stripe stays web-only).
export default function NativePurchaseButtons({ userId, onPurchased, compact }: Props) {
  const [packages, setPackages] = useState<IapPackage[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getIapPackages(userId ? String(userId) : undefined).then(setPackages)
  }, [userId])

  async function buy(identifier: string) {
    setBusy(identifier)
    setError(false)
    const ok = await purchaseIapPackage(identifier, userId ? String(userId) : undefined)
    setBusy(null)
    if (ok) onPurchased()
    else setError(true)
  }

  async function restore() {
    setBusy('restore')
    const ok = await restoreIapPurchases(userId ? String(userId) : undefined)
    setBusy(null)
    if (ok) onPurchased()
    else setError(true)
  }

  if (packages.length === 0) {
    return <p className={compact ? 'text-xs text-gray-400' : 'text-sm text-gray-500'}>Upgrade options are loading — if this persists, try again shortly.</p>
  }

  return (
    <div className="space-y-2">
      {packages.map((p) => (
        <button
          key={p.identifier}
          onClick={() => buy(p.identifier)}
          disabled={busy !== null}
          className="w-full bg-gray-900 text-white rounded-xl px-5 py-3.5 text-left hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold">Solo Pilot · {p.period === 'year' ? 'Annual' : 'Monthly'}</div>
            <div className="font-bold">{p.priceString}</div>
          </div>
          {busy === p.identifier && <div className="text-xs text-gray-400 mt-1">Purchasing…</div>}
        </button>
      ))}
      <button onClick={restore} disabled={busy !== null} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 disabled:opacity-60">
        {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
      </button>
      {error && <p className="text-center text-xs text-red-500">Purchase failed — please try again.</p>}
    </div>
  )
}
