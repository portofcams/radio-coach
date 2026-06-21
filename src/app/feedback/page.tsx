'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KINDS = [
  { k: 'idea', label: 'Idea' },
  { k: 'bug', label: 'Bug' },
  { k: 'general', label: 'Other' },
]

export default function FeedbackPage() {
  const [kind, setKind] = useState('idea')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setLoggedIn(!!d.user)).catch(() => {})
  }, [])

  async function submit() {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message, email: email || undefined, url: typeof location !== 'undefined' ? location.href : '' }),
      })
      if (res.ok) setSent(true)
    } finally { setSending(false) }
  }

  if (sent) return (
    <main className="max-w-md mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold mb-2">Thank you</h1>
      <p className="text-gray-500 mb-6">Your feedback went straight to the team. It genuinely shapes what gets built next.</p>
      <Link href="/train" className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Back to training</Link>
    </main>
  )

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-12">
        <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Send feedback</h1>
        <p className="text-gray-500 mb-6">Found a bug, want a feature, or have a thought? Tell us — it&apos;s read.</p>

        <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
          {KINDS.map((o) => (
            <button key={o.k} onClick={() => setKind(o.k)} className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${kind === o.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{o.label}</button>
          ))}
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="What's on your mind?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        {!loggedIn && (
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional, for a reply)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        )}
        <button onClick={submit} disabled={sending || !message.trim()} className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
    </main>
  )
}
