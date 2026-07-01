'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function JoinCfi() {
  return (
    <Suspense fallback={null}>
      <JoinCfiInner />
    </Suspense>
  )
}

function JoinCfiInner() {
  const token = useSearchParams().get('token') ?? ''
  const [state, setState] = useState<'working' | 'done' | 'login' | 'error'>('working')
  const [cfiEmail, setCfiEmail] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me').then((r) => r.json()).catch(() => ({}))
      if (!me.user) { setState('login'); return }
      const res = await fetch('/api/cfi/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (res.ok) { setCfiEmail(data.cfiEmail); setState('done') }
      else {
        setMsg(data.error === 'already_claimed' ? 'This invite is already linked to another account.' : data.error === 'cannot_join_own' ? "That's your own invite link." : 'This invite link is invalid or expired.')
        setState('error')
      }
    })()
  }, [token])

  return (
    <main className="max-w-md mx-auto px-6 py-20 text-center">
      {state === 'working' && <p className="text-gray-400">Connecting you to your instructor...</p>}
      {state === 'login' && (
        <>
          <h1 className="text-xl font-semibold mb-2">Connect with your instructor</h1>
          <p className="text-gray-500 mb-6">Sign in or create a free account to link up — then your CFI can assign scenarios and see your progress.</p>
          <a href={`/login?redirect=${encodeURIComponent(`/cfi/join?token=${token}`)}`} className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in / sign up</a>
        </>
      )}
      {state === 'done' && (
        <>
          <h1 className="text-xl font-semibold mb-2">You&apos;re connected{cfiEmail ? ` to ${cfiEmail}` : ''}</h1>
          <p className="text-gray-500 mb-6">Your instructor can now assign you scenarios and see your progress. Assigned work shows up on your training page.</p>
          <a href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Go to training</a>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-xl font-semibold mb-2">Couldn&apos;t connect</h1>
          <p className="text-gray-500 mb-6">{msg}</p>
          <a href="/train" className="inline-block border border-gray-300 rounded-lg px-5 py-3 text-sm font-semibold hover:border-gray-500">Back to training</a>
        </>
      )}
    </main>
  )
}
