'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isNative } from '@/lib/native'

interface Member { id: number; status: string; role: string; email: string; joined: boolean; joinUrl: string | null; students: number }

export default function SchoolPage() {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'ok' | 'not-owner'>('loading')
  const [school, setSchool] = useState<{ id: number; name: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [listing, setListing] = useState({ public_listing: false, slug: '', city: '', region: '', website: '', blurb: '' })
  const [savedListing, setSavedListing] = useState(false)
  const [native, setNative] = useState(false)
  useEffect(() => { setNative(isNative()) }, [])

  async function load() {
    const res = await fetch('/api/school')
    if (res.status === 401) { router.push('/login'); return }
    if (res.status === 403) { setState('not-owner'); return }
    const d = await res.json()
    setSchool(d.school); setName(d.school?.name ?? ''); setMembers(d.members ?? []); setState('ok')
    const s = d.school ?? {}
    setListing({
      public_listing: !!s.public_listing, slug: s.slug ?? '',
      city: s.city ?? '', region: s.region ?? '', website: s.website ?? '', blurb: s.blurb ?? '',
    })
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  async function saveName() {
    await fetch('/api/school', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, ...listing }) })
  }
  async function saveListing() {
    setBusy(true); setSavedListing(false)
    try {
      const res = await fetch('/api/school', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, ...listing }) })
      const d = await res.json()
      if (d.slug) setListing((l) => ({ ...l, slug: d.slug }))
      setSavedListing(true); setTimeout(() => setSavedListing(false), 2000)
    } finally { setBusy(false) }
  }
  async function addInstructor() {
    if (!email.trim()) return
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/school/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const d = await res.json()
      if (!res.ok) { setErr(d.error === 'already_added' ? 'Already on your roster.' : 'Could not add — check the email.'); return }
      setEmail(''); setMembers(d.members ?? [])
    } finally { setBusy(false) }
  }
  async function remove(id: number) { await fetch(`/api/school/members/${id}`, { method: 'DELETE' }); load() }
  async function upgrade() {
    if (isNative()) return
    setBusy(true)
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'school' }) })
    const d = await res.json()
    if (d.url) window.location.href = d.url; else { setBusy(false); alert('Could not start checkout.') }
  }

  if (state === 'loading') return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (state === 'not-owner') return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Flight School</h1>
      <p className="text-gray-500 mb-2">One account for your whole school — add your instructors, each gets full CFI Pro tools for their students.</p>
      <p className="text-gray-400 text-sm mb-6">Unlimited instructors and students under one subscription.</p>
      {!native && (
        <button onClick={upgrade} disabled={busy} className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-60">
          {busy ? 'Starting…' : 'Start Flight School · $99/mo'}
        </button>
      )}
    </main>
  )

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
          <h1 className="text-xl font-semibold">Your flight school</h1>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">School name</div>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} onBlur={saveName}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <button onClick={saveName} className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-500">Save</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Set your school name + logo (for student reports) under Profile → Your school / branding.</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Add an instructor</div>
          <div className="flex gap-2">
            <input value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} onKeyDown={(e) => { if (e.key === 'Enter') addInstructor() }}
              placeholder="instructor@email.com" type="email"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <button onClick={addInstructor} disabled={busy} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">Add</button>
          </div>
          {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
          <p className="text-xs text-gray-400 mt-2">Each instructor gets full CFI Pro tools under your subscription — no separate payment.</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Public directory listing</div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={listing.public_listing} onChange={(e) => setListing((l) => ({ ...l, public_listing: e.target.checked }))} />
              List publicly
            </label>
          </div>
          <p className="text-xs text-gray-400 mb-3">Show your school on the <a href="/directory" className="text-blue-600 hover:underline">Clearspar directory</a> — a free SEO listing for prospective students.</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input value={listing.city} onChange={(e) => setListing((l) => ({ ...l, city: e.target.value.slice(0, 60) }))} placeholder="City" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <input value={listing.region} onChange={(e) => setListing((l) => ({ ...l, region: e.target.value.slice(0, 60) }))} placeholder="State / region" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <input value={listing.website} onChange={(e) => setListing((l) => ({ ...l, website: e.target.value.slice(0, 200) }))} placeholder="Website (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <textarea value={listing.blurb} onChange={(e) => setListing((l) => ({ ...l, blurb: e.target.value.slice(0, 280) }))} placeholder="Short description (what you teach, where)" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <div className="flex items-center gap-3">
            <button onClick={saveListing} disabled={busy} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">{busy ? 'Saving…' : 'Save listing'}</button>
            {savedListing && <span className="text-xs text-green-600">Saved</span>}
            {listing.public_listing && listing.slug && <a href={`/directory/${listing.slug}`} className="text-xs text-blue-600 hover:underline">View listing →</a>}
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Instructors ({members.length})</div>
        <div className="space-y-2">
          {members.length === 0 && <div className="text-sm text-gray-400">No instructors yet. Add one above.</div>}
          {members.map((m) => (
            <div key={m.id} className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.joined ? `${m.students} students` : <span className="text-amber-600">Invited — not joined yet</span>}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!m.joined && <button onClick={() => { navigator.clipboard?.writeText(m.joinUrl ?? ''); setCopied(m.id); setTimeout(() => setCopied(null), 2000) }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 hover:border-gray-500">{copied === m.id ? 'Copied!' : 'Copy invite'}</button>}
                <button onClick={() => remove(m.id)} className="text-gray-300 hover:text-red-500 text-sm" title="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
