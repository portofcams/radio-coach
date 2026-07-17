'use client'

import { useEffect, useState } from 'react'

interface Stats {
  users: number; signups7: number; grades7: number; pageviews7: number; visitors7: number; paid: number
  platforms: { platform: string; visitors: number; views: number }[]
  topPaths: { path: string; views: number }[]
  daily: { d: string; visitors: number; views: number }[]
  referrals: { ref: string; hits: number }[]
  airportRequests: { id: number; ident: string; note: string | null; request_count: number; created_at: string; nowAvailable: boolean }[]
  blogCadence: {
    lastPostDate: string | null; daysSincePost: number | null; due: boolean
    postsLast30Days: number; postsPerWeekTarget: number
    nextTopics: { slug: string; title: string; description: string; outline: string[] }[]
  }
}

interface AffiliateRow {
  id: number; name: string; contactEmail: string | null; code: string; link: string
  revenueSharePct: number | null; signups: number; converted: number
}

export default function AdminPage() {
  const [key, setKey] = useState('')
  const [data, setData] = useState<Stats | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [affiliates, setAffiliates] = useState<AffiliateRow[] | null>(null)
  const [newAffName, setNewAffName] = useState('')
  const [newAffEmail, setNewAffEmail] = useState('')
  const [creatingAff, setCreatingAff] = useState(false)
  const [copiedAff, setCopiedAff] = useState<number | null>(null)

  async function load(k: string) {
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/admin/stats?key=' + encodeURIComponent(k))
      if (!r.ok) { setErr('Unauthorized — check the key.'); setData(null); return }
      try { localStorage.setItem('rc_admin_key', k) } catch {}
      setData(await r.json())
    } catch { setErr('Could not load.') } finally { setLoading(false) }
  }

  async function loadAffiliates(k: string) {
    try {
      const r = await fetch('/api/admin/affiliates?key=' + encodeURIComponent(k))
      if (r.ok) setAffiliates((await r.json()).affiliates)
    } catch { /* non-fatal -- the rest of the dashboard still works */ }
  }

  async function createAffiliate() {
    if (!newAffName.trim()) return
    setCreatingAff(true)
    try {
      await fetch('/api/admin/affiliates?key=' + encodeURIComponent(key), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAffName.trim(), contactEmail: newAffEmail.trim() }),
      })
      setNewAffName(''); setNewAffEmail('')
      await loadAffiliates(key)
    } finally { setCreatingAff(false) }
  }

  useEffect(() => {
    const k = new URLSearchParams(location.search).get('key') || (() => { try { return localStorage.getItem('rc_admin_key') || '' } catch { return '' } })()
    if (k) { setKey(k); load(k); loadAffiliates(k) }
  }, [])

  async function resolveAirportRequest(id: number, status: 'added' | 'declined') {
    await fetch(`/api/admin/airport-requests/${id}?key=${encodeURIComponent(key)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    }).catch(() => {})
    load(key)
  }

  const maxV = data ? Math.max(1, ...data.daily.map((d) => d.visitors)) : 1

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-1">Usage</h1>
        <p className="text-gray-500 text-sm mb-8">Last 7 days unless noted. App downloads + retention live in App Store Connect.</p>

        {!data && (
          <div className="flex items-center gap-2 mb-6">
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="admin key"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
            <button onClick={() => { load(key); loadAffiliates(key) }} disabled={loading || !key}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Loading…' : 'View'}
            </button>
          </div>
        )}
        {err && <p className="text-red-600 text-sm mb-6">{err}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Visitors', sub: '7d unique', v: data.visitors7 },
                { label: 'Pageviews', sub: '7d', v: data.pageviews7 },
                { label: 'Signups', sub: '7d', v: data.signups7 },
                { label: 'Scenarios graded', sub: '7d', v: data.grades7 },
                { label: 'Total accounts', sub: 'all time', v: data.users },
                { label: 'Paid subs', sub: 'active', v: data.paid },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-gray-200 p-4">
                  <div className="text-3xl font-semibold tracking-tight">{c.v.toLocaleString()}</div>
                  <div className="text-sm font-medium text-gray-700 mt-1">{c.label}</div>
                  <div className="text-xs text-gray-400">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-3">Platform · 7d</h2>
                {data.platforms.length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : data.platforms.map((p) => (
                  <div key={p.platform} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="font-medium capitalize">{p.platform}</span>
                    <span className="text-gray-500">{p.visitors.toLocaleString()} visitors · {p.views.toLocaleString()} views</span>
                  </div>
                ))}
                <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mt-6 mb-3">Top pages · 7d</h2>
                {data.topPaths.map((p) => (
                  <div key={p.path} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="font-mono text-xs text-gray-700 truncate max-w-[70%]">{p.path || '/'}</span>
                    <span className="text-gray-500">{p.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-3">Daily visitors · 14d</h2>
                {data.daily.length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : data.daily.map((d) => (
                  <div key={d.d} className="flex items-center gap-2 text-xs py-0.5">
                    <span className="w-14 text-gray-500 shrink-0">{d.d}</span>
                    <span className="h-3 rounded-sm bg-green-500" style={{ width: `${(d.visitors / maxV) * 100}%`, minWidth: d.visitors ? '4px' : '0' }} />
                    <span className="text-gray-600">{d.visitors}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mt-8 mb-3">Widget + directory referrals · 30d</h2>
            {data.referrals.length === 0 ? (
              <p className="text-gray-400 text-sm">No referral traffic yet — tags land when someone clicks through an embedded widget's "Powered by Clearspar" link or a directory listing's CTA.</p>
            ) : data.referrals.map((r) => (
              <div key={r.ref} className="flex justify-between text-sm py-1 border-b border-gray-100 max-w-md">
                <span className="font-mono text-xs text-gray-700">{r.ref}</span>
                <span className="text-gray-500">{r.hits.toLocaleString()}</span>
              </div>
            ))}

            <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mt-8 mb-3">Requested airports · open</h2>
            {data.airportRequests.length === 0 ? (
              <p className="text-gray-400 text-sm">No open requests — pilots see a &quot;Request&quot; link when their home field isn&apos;t found on Profile.</p>
            ) : (
              <div className="space-y-2">
                {data.airportRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-mono font-semibold">{r.ident}</span>
                      <span className="text-gray-500 ml-2">{r.request_count} pilot{r.request_count === 1 ? '' : 's'}</span>
                      {r.nowAvailable && <span className="ml-2 px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">now in dataset</span>}
                      {r.note && <div className="text-xs text-gray-400 truncate">{r.note}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => resolveAirportRequest(r.id, 'added')} className="text-xs text-green-700 hover:underline">Mark added</button>
                      <button onClick={() => resolveAirportRequest(r.id, 'declined')} className="text-xs text-gray-400 hover:underline">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mt-8 mb-3">
              Flight-school affiliates <span className="normal-case text-gray-300">(#95 — mechanism only, no revenue-share % set yet)</span>
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <input value={newAffName} onChange={(e) => setNewAffName(e.target.value)} placeholder="School name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56" />
              <input value={newAffEmail} onChange={(e) => setNewAffEmail(e.target.value)} placeholder="Contact email (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
              <button onClick={createAffiliate} disabled={creatingAff || !newAffName.trim()}
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {creatingAff ? 'Adding…' : 'Add school'}
              </button>
            </div>
            {!affiliates || affiliates.length === 0 ? (
              <p className="text-gray-400 text-sm mb-2">No affiliate partners yet — add one above to get a trackable signup link.</p>
            ) : (
              <div className="space-y-2 mb-2">
                {affiliates.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-semibold">{a.name}</span>
                        {a.contactEmail && <span className="text-gray-400 ml-2 text-xs">{a.contactEmail}</span>}
                      </div>
                      <div className="shrink-0 text-xs text-gray-500">
                        {a.signups} signup{a.signups === 1 ? '' : 's'} · {a.converted} paid
                        {a.revenueSharePct != null ? ` · ${a.revenueSharePct}% share` : ' · % TBD'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-xs font-mono text-gray-500 truncate">{a.link}</code>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(a.link); setCopiedAff(a.id); setTimeout(() => setCopiedAff((v) => (v === a.id ? null : v)), 1500) }}
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        {copiedAff === a.id ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-sm font-mono uppercase tracking-widest text-gray-400 mt-8 mb-3">Blog cadence · target {data.blogCadence.postsPerWeekTarget}/wk</h2>
            <div className="flex items-center gap-3 mb-4 text-sm">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${data.blogCadence.due ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                {data.blogCadence.due ? 'Due' : 'Not due yet'}
              </span>
              <span className="text-gray-500">
                {data.blogCadence.lastPostDate ? `Last post ${data.blogCadence.lastPostDate} (${data.blogCadence.daysSincePost}d ago)` : 'No posts yet'}
                {' · '}{data.blogCadence.postsLast30Days} in the last 30 days
              </span>
            </div>
            {data.blogCadence.nextTopics.length === 0 ? (
              <p className="text-gray-400 text-sm">No queued topics — add more to UPCOMING_TOPICS in src/lib/blog-cadence.ts.</p>
            ) : (
              <div className="space-y-3">
                {data.blogCadence.nextTopics.map((t, i) => (
                  <div key={t.slug} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">{i === 0 ? 'Next up' : `Queued #${i + 1}`}</div>
                    <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
                    <ul className="mt-2 space-y-0.5">
                      {t.outline.map((o) => <li key={o} className="text-xs text-gray-500">· {o}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
