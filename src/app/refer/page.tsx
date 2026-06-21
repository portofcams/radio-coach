'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RefData { link: string; code: string; referred: number; converted: number; compProUntil: string | null }

export default function ReferPage() {
  const router = useRouter()
  const [data, setData] = useState<RefData | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'anon'>('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then((r) => { if (r.status === 401) { setState('anon'); return null } return r.json() })
      .then((d) => { if (d?.link) { setData(d); setState('ok') } })
      .catch(() => setState('anon'))
  }, [])

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>
  if (state === 'anon') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Give a month, get a month</h1>
      <p className="text-gray-500 mb-6">Sign in to get your referral link. Friends who join get a free month of Pro — and so do you when they upgrade.</p>
      <button onClick={() => router.push('/login')} className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in</button>
    </main>
  )

  const monthsLeft = data?.compProUntil ? Math.max(0, Math.ceil((new Date(data.compProUntil).getTime() - Date.now()) / 86_400_000)) : 0

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-12">
        <Link href="/profile" className="text-gray-400 hover:text-gray-600 text-sm">← profile</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Give a month, get a month</h1>
        <p className="text-gray-500 mb-6">Share your link. Anyone who signs up gets a <strong>free month of Pro</strong>. When they upgrade to a paid plan, <strong>you</strong> get a free month too.</p>

        <div className="border border-gray-200 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Your referral link</div>
          <div className="flex gap-2">
            <input readOnly value={data?.link ?? ''} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50" />
            <button
              onClick={() => { if (data?.link) { navigator.clipboard?.writeText(data.link); setCopied(true); setTimeout(() => setCopied(false), 1500) } }}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data?.referred ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">signed up</div>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{data?.converted ?? 0}</div>
            <div className="text-xs text-gray-400 mt-1">upgraded</div>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{monthsLeft}</div>
            <div className="text-xs text-gray-400 mt-1">comp days left</div>
          </div>
        </div>

        <p className="text-xs text-gray-400">Comp time stacks on top of any paid plan and is applied automatically — no codes to enter.</p>
      </div>
    </main>
  )
}
