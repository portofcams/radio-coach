'use client'

import { useState } from 'react'

export default function DripSignup() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    if (!email.includes('@')) return
    setState('sending')
    try {
      const r = await fetch('/api/drip/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setState(r.ok ? 'done' : 'error')
    } catch { setState('error') }
  }

  if (state === 'done') return (
    <div className="border border-green-300 bg-green-50 rounded-xl p-5 text-center">
      <p className="font-semibold text-green-800">You&apos;re in.</p>
      <p className="text-sm text-green-700 mt-1">Day 1 lands in your inbox soon. Check your spam folder once and mark it &ldquo;not spam.&rdquo;</p>
    </div>
  )

  return (
    <div className="flex gap-2">
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      <button onClick={submit} disabled={state === 'sending' || !email.includes('@')} className="bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
        {state === 'sending' ? '…' : 'Send me Day 1'}
      </button>
      {state === 'error' && <span className="text-xs text-red-600 self-center">Try again</span>}
    </div>
  )
}
