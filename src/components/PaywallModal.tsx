'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  freeUsed: number
  freeLimit: number
  isLoggedIn?: boolean
  reason?: 'daily' | 'pro'
}

export default function PaywallModal({ onClose, freeUsed, freeLimit, isLoggedIn = false, reason = 'daily' }: Props) {
  const [loading, setLoading] = useState<'solo' | 'cfi' | null>(null)

  async function checkout(plan: 'solo' | 'cfi') {
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Could not start checkout — please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          {reason === 'pro' ? (
            <>
              <h2 className="text-xl font-bold text-gray-900">This is an advanced scenario</h2>
              <p className="text-gray-500 text-sm mt-1">
                Emergencies, IFR clearances, and Class B transitions are part of Solo Pilot.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900">You&apos;ve used your free scenarios today</h2>
              <p className="text-gray-500 text-sm mt-1">
                {freeUsed}/{freeLimit} free readbacks used today. Resets at midnight.
              </p>
            </>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full bg-gray-900 text-white rounded-xl px-5 py-4 text-center font-semibold hover:bg-gray-800 transition-colors"
            >
              Sign up free to keep going
            </a>
            <p className="text-center text-sm text-gray-500">
              A free account gives you 5 scenarios a day, synced across devices. Upgrade to unlimited anytime.
            </p>
          </div>
        ) : (
        <div className="space-y-3">
          {/* Solo Pilot */}
          <button
            onClick={() => checkout('solo')}
            disabled={loading !== null}
            className="w-full bg-gray-900 text-white rounded-xl px-5 py-4 text-left hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Solo Pilot</div>
                <div className="text-sm text-gray-300">Unlimited scenarios · All airport classes</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-lg">$15</div>
                <div className="text-xs text-gray-400">/month</div>
              </div>
            </div>
            {loading === 'solo' && (
              <div className="text-xs text-gray-400 mt-1">Connecting to checkout...</div>
            )}
          </button>

          {/* CFI Pro */}
          <button
            onClick={() => checkout('cfi')}
            disabled={loading !== null}
            className="w-full border border-gray-200 rounded-xl px-5 py-4 text-left hover:border-gray-400 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">CFI Pro</div>
                <div className="text-sm text-gray-500">Student tracking · Assign scenarios</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-lg text-gray-900">$30</div>
                <div className="text-xs text-gray-500">/month</div>
              </div>
            </div>
            {loading === 'cfi' && (
              <div className="text-xs text-gray-400 mt-1">Connecting to checkout...</div>
            )}
          </button>
        </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-5">
          {isLoggedIn ? 'Cancel anytime · Secure checkout via Stripe' : 'No card needed to sign up'}
        </p>
      </div>
    </div>
  )
}
