'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FLIGHT_SESSIONS } from '@/lib/flight-sessions'
import { isNative } from '@/lib/native'

export default function CheckridePage() {
  const [loaded, setLoaded] = useState(false)
  const [pro, setPro] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [native, setNative] = useState(false)

  useEffect(() => {
    setNative(isNative())
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { setLoggedIn(!!d.user); setPro(!!d.entitlement?.pro) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  async function upgrade() {
    if (isNative()) return
    if (!loggedIn) { window.location.href = '/login?mode=signup&redirect=/checkride'; return }
    setUpgrading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'solo' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setUpgrading(false)
    } catch { setUpgrading(false) }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold">Checkrides</h1>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-gray-900 text-white rounded px-1.5 py-0.5">Solo Pilot</span>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Fly a whole flight&rsquo;s radio work in one continuous, graded run — taxi to landing — and get a checkride-readiness verdict. Miss a hold-short and you fail, just like the real thing.
        </p>

        {loaded && !pro && !native && (
          <div className="border-2 border-gray-900 rounded-2xl p-5 mb-6 bg-gray-900 text-white">
            <div className="font-semibold mb-1">Checkride mode is a Solo Pilot feature</div>
            <p className="text-sm text-gray-300 mb-3">
              Free covers single scenarios + the whole Ground School. Go unlimited to fly full checkrides and see your readiness verdict.
            </p>
            <button onClick={upgrade} disabled={upgrading} className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {loggedIn ? 'Go Solo Pilot · $9/mo' : 'Sign up to unlock'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {FLIGHT_SESSIONS.map((s) => {
            const card = (
              <div className={`flex items-start gap-4 p-5 border border-gray-200 rounded-xl ${pro ? 'hover:border-gray-400 transition-colors' : 'opacity-75'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{s.title}</h2>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${s.difficulty === 'advanced' ? 'bg-red-100 text-red-700' : s.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{s.difficulty}</span>
                    {s.oralQuestionIds?.length ? (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Oral + Radio</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                  <div className="text-xs text-gray-400 mt-2 font-mono">
                    {s.oralQuestionIds?.length ? `${s.oralQuestionIds.length} oral + ` : ''}{s.scenarioIds.length} legs · {s.airport}
                  </div>
                </div>
              </div>
            )
            return pro ? (
              <Link key={s.id} href={`/session?id=${s.id}`} className="block">{card}</Link>
            ) : native ? (
              <div key={s.id} className="block w-full text-left">{card}</div>
            ) : (
              <button key={s.id} onClick={upgrade} className="block w-full text-left">{card}</button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
