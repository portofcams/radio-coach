'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function JoinSchool() {
  return (
    <Suspense fallback={null}>
      <JoinSchoolInner />
    </Suspense>
  )
}

function JoinSchoolInner() {
  const token = useSearchParams().get('token') ?? ''
  const [state, setState] = useState<'working' | 'done' | 'login' | 'error'>('working')
  const [school, setSchool] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/auth/me').then((r) => r.json()).catch(() => ({}))
      if (!me.user) { setState('login'); return }
      const res = await fetch('/api/school/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      const data = await res.json()
      if (res.ok) { setSchool(data.school); setState('done') }
      else { setMsg(data.error === 'already_claimed' ? 'This invite is already linked to another account.' : 'This invite link is invalid or expired.'); setState('error') }
    })()
  }, [token])

  return (
    <main className="max-w-md mx-auto px-6 py-20 text-center">
      {state === 'working' && <p className="text-gray-400">Joining your flight school...</p>}
      {state === 'login' && (
        <>
          <h1 className="text-xl font-semibold mb-2">Join your flight school</h1>
          <p className="text-gray-500 mb-6">Sign in or create a free account to join — you&apos;ll get full CFI Pro tools under the school&apos;s subscription.</p>
          <a href={`/login?redirect=${encodeURIComponent(`/school/join?token=${token}`)}`} className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in / sign up</a>
        </>
      )}
      {state === 'done' && (
        <>
          <h1 className="text-xl font-semibold mb-2">You&apos;re in{school ? ` — ${school}` : ''}</h1>
          <p className="text-gray-500 mb-6">You now have CFI Pro tools. Add your students and start assigning scenarios.</p>
          <a href="/cfi" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Go to your students</a>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-xl font-semibold mb-2">Couldn&apos;t join</h1>
          <p className="text-gray-500 mb-6">{msg}</p>
          <a href="/train" className="inline-block border border-gray-300 rounded-lg px-5 py-3 text-sm font-semibold hover:border-gray-500">Back to training</a>
        </>
      )}
    </main>
  )
}
