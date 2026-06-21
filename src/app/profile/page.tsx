'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toPhonetic } from '@/lib/phonetic'

interface Stats {
  total: number
  passed: number
  passRate: number
  avgScore: number
  byPhase: Array<{ phase: string; total: string; passed: string; avg_score: string }>
  topMistakes: Array<{ elem: string; cnt: string }>
  recent: Array<{ scenario_id: string; score: number; passed: boolean; hint_used: boolean; created_at: string }>
}

import type { HomeProfile } from '@/lib/home-client'
import type { Readiness } from '@/lib/readiness'
import { endorsementLabel } from '@/lib/endorsements'
interface User {
  id: number
  email: string
  callsign: string | null
  home?: HomeProfile | null
  cfiOrgName?: string | null
  cfiLogoUrl?: string | null
}
interface FieldSummary { icao: string; name: string; city: string; towered: boolean; freqs: Record<string, string>; runways: string[] }
interface Coach { orgName: string | null; logoUrl: string | null; cfiEmail: string; endorsements: string[]; comments: Array<{ body: string; scenario_id?: string | null; created_at: string }> }

const PHASE_LABELS: Record<string, string> = {
  ground: 'Ground', departure: 'Departure', pattern: 'Pattern', enroute: 'En route', ifr: 'IFR', emergency: 'Emergency',
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [callsign, setCallsign] = useState('')
  const [saving, setSaving] = useState(false)
  const [ent, setEnt] = useState<{ pro: boolean; plan: string | null; periodEnd: string | null } | null>(null)
  const [billing, setBilling] = useState(false)
  const [weakspots, setWeakspots] = useState<Array<{ key: string; label: string; tip: string; rate: number; misses: number; opportunities: number; drill: string[] }>>([])
  const [ident, setIdent] = useState('')
  const [lookup, setLookup] = useState<FieldSummary | null>(null)
  const [lookupErr, setLookupErr] = useState('')
  const [looking, setLooking] = useState(false)
  const [manual, setManual] = useState({ name: '', tower: '', runway: '' })
  const [showManual, setShowManual] = useState(false)
  const [savingHome, setSavingHome] = useState(false)
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const [coach, setCoach] = useState<Coach | null>(null)
  const [branding, setBranding] = useState({ orgName: '', logoUrl: '' })
  const [savingBranding, setSavingBranding] = useState(false)
  const [referral, setReferral] = useState<{ link: string; referrals: number } | null>(null)
  const [refCopied, setRefCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/user/stats').then((r) => r.json()),
      fetch('/api/user/weakspots').then((r) => r.json()),
      fetch('/api/user/readiness').then((r) => r.json()),
      fetch('/api/user/coach').then((r) => r.json()),
    ])
      .then(([me, s, w, rd, co]) => {
        if (!me.user) { router.push('/login'); return }
        setUser(me.user)
        setCallsign(me.user.callsign ?? '')
        if (me.user.home?.mode === 'real') setIdent(me.user.home.ident)
        else if (me.user.home?.mode === 'manual') { setManual(me.user.home); setShowManual(true) }
        setBranding({ orgName: me.user.cfiOrgName ?? '', logoUrl: me.user.cfiLogoUrl ?? '' })
        setEnt(me.entitlement ?? null)
        if (!s.error) setStats(s)
        if (Array.isArray(w.weakspots)) setWeakspots(w.weakspots)
        if (rd && !rd.error && typeof rd.score === 'number') setReadiness(rd)
        if (co && co.coach) setCoach(co.coach)
        fetch('/api/user/referral').then((r) => r.json()).then((rf) => { if (rf && rf.link) setReferral(rf) }).catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [router])

  async function lookupField() {
    if (!ident.trim()) return
    setLooking(true); setLookupErr(''); setLookup(null)
    try {
      const res = await fetch(`/api/airports?ident=${encodeURIComponent(ident.trim().toUpperCase())}`)
      if (res.ok) { setLookup((await res.json()).field) }
      else { setLookupErr(`No field "${ident.trim().toUpperCase()}" found. Try the ICAO ident, or enter it manually.`) }
    } finally { setLooking(false) }
  }

  async function saveBranding() {
    setSavingBranding(true)
    try {
      const res = await fetch('/api/user/cfi-branding', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branding),
      })
      const data = await res.json()
      setBranding({ orgName: data.cfiOrgName ?? '', logoUrl: data.cfiLogoUrl ?? '' })
      setUser((u) => u ? { ...u, cfiOrgName: data.cfiOrgName, cfiLogoUrl: data.cfiLogoUrl } : u)
    } finally { setSavingBranding(false) }
  }

  async function saveHome(body: object) {
    setSavingHome(true)
    try {
      const res = await fetch('/api/user/homefield', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      setUser((u) => u ? { ...u, home: data.home } : u)
    } finally { setSavingHome(false) }
  }

  async function saveCallsign() {
    setSaving(true)
    try {
      const res = await fetch('/api/user/callsign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callsign }),
      })
      const data = await res.json()
      setUser((u) => u ? { ...u, callsign: data.callsign } : u)
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  async function billingAction(endpoint: string, body?: object) {
    setBilling(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { alert('Could not open billing — please try again.'); setBilling(false) }
    } catch { setBilling(false) }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (!user) return null

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/feedback" className="text-sm text-gray-400 hover:text-gray-600">Feedback</a>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </div>
        </div>

        {/* Email */}
        <div className="text-sm text-gray-500 mb-6">{user.email}</div>

        {/* Subscription */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Plan</div>
              {ent?.pro ? (
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">{ent.plan === 'school' ? 'Flight School' : ent.plan === 'cfi' ? 'CFI Pro' : 'Solo Pilot'}</span>
                  <span className="text-green-600"> · active</span>
                  {ent.periodEnd && <span className="text-gray-400"> · renews {new Date(ent.periodEnd).toLocaleDateString()}</span>}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Free — 5 Live Comms scenarios a day</div>
              )}
            </div>
            {ent?.pro ? (
              <button onClick={() => billingAction('/api/portal')} disabled={billing}
                className="shrink-0 text-sm border border-gray-300 rounded-lg px-4 py-2 hover:border-gray-500 transition-colors disabled:opacity-60">
                Manage
              </button>
            ) : (
              <div className="shrink-0 text-right">
                <button onClick={() => billingAction('/api/checkout', { plan: 'solo' })} disabled={billing}
                  className="text-sm bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-60">
                  Go unlimited · $15/mo
                </button>
                <button onClick={() => billingAction('/api/checkout', { plan: 'solo', interval: 'year' })} disabled={billing}
                  className="block ml-auto mt-1 text-xs text-blue-600 hover:underline disabled:opacity-60">
                  or $150/yr — 2 months free
                </button>
              </div>
            )}
          </div>
          {ent?.plan === 'cfi' && (
            <div className="mt-3 flex items-center gap-4">
              <a href="/cfi" className="text-sm text-blue-600 hover:underline">Manage your students →</a>
              <a href="/school" className="text-xs text-gray-400 hover:text-gray-600">Run a flight school?</a>
            </div>
          )}
          {ent?.plan === 'school' && (
            <div className="mt-3 flex items-center gap-4">
              <a href="/school" className="text-sm text-blue-600 hover:underline">Manage your flight school →</a>
              <a href="/cfi" className="text-xs text-gray-400 hover:text-gray-600">Your students</a>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <a href="/refer" className="text-sm text-blue-600 hover:underline">Refer a friend — give a month, get a month →</a>
          </div>
        </div>

        {/* From your instructor (student side) */}
        {coach && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              {coach.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={coach.logoUrl} alt="" className="w-8 h-8 rounded object-contain bg-gray-50" />
                : null}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Your instructor</div>
                <div className="text-sm font-medium text-gray-900">{coach.orgName || coach.cfiEmail}</div>
              </div>
            </div>
            {coach.endorsements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {coach.endorsements.map((k) => (
                  <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800">✓ {endorsementLabel(k)}</span>
                ))}
              </div>
            )}
            {coach.comments.length > 0 && (
              <div className="space-y-2">
                {coach.comments.slice(0, 5).map((c, i) => (
                  <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                    {c.scenario_id && <span className="text-[10px] font-mono text-blue-600 block mb-0.5">on {c.scenario_id.replace(/-/g, ' ')}</span>}
                    {c.body}
                    <span className="block text-[10px] text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* School / co-branding (CFI side) */}
        {ent?.plan === 'cfi' && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Your school / branding</div>
            <p className="text-xs text-gray-400 mb-3">Shown to your students on their profile and score card.</p>
            <div className="space-y-2">
              <input value={branding.orgName} onChange={(e) => setBranding((b) => ({ ...b, orgName: e.target.value.slice(0, 60) }))}
                placeholder="School / flight-club name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              <input value={branding.logoUrl} onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value.slice(0, 300) }))}
                placeholder="Logo image URL (https://…)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <button onClick={saveBranding} disabled={savingBranding} className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">
              {savingBranding ? 'Saving...' : 'Save branding'}
            </button>
          </div>
        )}

        {/* Checkride-readiness score */}
        {readiness && readiness.factors && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-5">
              {(() => {
                const c = 2 * Math.PI * 34
                const col = readiness.level === 'ready' ? '#16a34a' : readiness.level === 'almost' ? '#d97706' : '#dc2626'
                return (
                  <svg viewBox="0 0 80 80" className="w-20 h-20 shrink-0 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={c} strokeDashoffset={c * (1 - readiness.score / 100)} />
                    <text x="40" y="40" dy="0.35em" textAnchor="middle" className="rotate-90" transform="rotate(90 40 40)"
                      fontSize="20" fontWeight="700" fill="#0f172a">{readiness.score}</text>
                  </svg>
                )
              })()}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Radio readiness</div>
                <div className="text-lg font-semibold text-gray-900">{readiness.label}</div>
                <div className="mt-2 space-y-1.5">
                  {[
                    { label: 'Recent accuracy', v: readiness.factors.recentAccuracy },
                    { label: 'Pass rate', v: readiness.factors.passRate },
                    { label: 'Library coverage', v: readiness.factors.coverage },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28 shrink-0">{f.label}</span>
                      <span className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <span className="block h-full bg-gray-400 rounded-full" style={{ width: `${f.v}%` }} />
                      </span>
                      <span className="text-xs font-mono text-gray-400 w-8 text-right">{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <a href="/progress" className="text-sm text-blue-600 hover:underline">Full progress →</a>
              <div className="flex items-center gap-3">
                <a href="/checkride" className="text-xs text-gray-400 hover:text-gray-600">Checkride</a>
                <a href="/card" className="text-xs text-gray-400 hover:text-gray-600">Share card</a>
                <a href="/report" className="text-xs text-gray-400 hover:text-gray-600">Print report</a>
              </div>
            </div>
          </div>
        )}

        {/* Weak spots — adaptive, mined from graded scenarios */}
        {weakspots.length > 0 && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Your weak spots</div>
            <div className="space-y-4">
              {weakspots.map((w) => (
                <div key={w.key} className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{w.label}</span>
                      <span className={`text-xs font-mono font-bold ${w.rate >= 0.5 ? 'text-red-600' : w.rate >= 0.25 ? 'text-amber-600' : 'text-gray-500'}`}>{Math.round(w.rate * 100)}% missed</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{w.tip}</div>
                    <div className="mt-1.5 h-1.5 w-40 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.round(w.rate * 100)}%` }} />
                    </div>
                  </div>
                  <a href={`/session/drill-${w.key}`} className="shrink-0 text-sm bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">Drill</a>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Ranked from your graded scenarios. Targeted drills are a Solo Pilot feature.</p>
          </div>
        )}

        {/* Callsign */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Your aircraft callsign</div>
          <div className="flex gap-2">
            <input
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="N12345"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
            />
            <button
              onClick={saveCallsign}
              disabled={saving}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {callsign && (
            <div className="mt-2 text-xs text-gray-400">
              Phonetic: <span className="text-gray-600">{toPhonetic(callsign)}</span>
            </div>
          )}
        </div>

        {/* Home field — real FAA frequencies + runways for your airport */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Your home field</div>
          <p className="text-xs text-gray-400 mb-3">Enter your field&apos;s ICAO ident — we pull the real frequencies, runways, and layout to build scenarios at your airport.</p>

          {user?.home?.mode === 'real' && (
            <div className="mb-3 text-sm text-gray-700">
              Current: <span className="font-medium">{user.home.field.name}</span>{' '}
              <span className="font-mono text-xs text-gray-500">({user.home.ident})</span>{' '}
              <a href="/train#home-field" className="text-blue-600 hover:underline text-xs ml-1">View scenarios →</a>
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={ident}
              onChange={(e) => { setIdent(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)); setLookup(null); setLookupErr('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') lookupField() }}
              placeholder="ICAO ident (e.g. KPAE, PHTO, EIDW)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button onClick={lookupField} disabled={looking || !ident.trim()}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-500 disabled:opacity-40">
              {looking ? '...' : 'Look up'}
            </button>
          </div>

          {lookupErr && <p className="text-xs text-red-600 mt-2">{lookupErr}</p>}

          {lookup && (
            <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="text-sm font-medium text-gray-900">{lookup.name} <span className="font-mono text-xs text-gray-500">{lookup.icao}</span></div>
              <div className="text-xs text-gray-500 mt-1">
                {lookup.towered ? 'Towered' : 'Non-towered (CTAF)'} · Runways {lookup.runways.join(', ')}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 font-mono">
                {Object.entries(lookup.freqs).map(([k, v]) => `${k.toUpperCase()} ${v}`).join('  ·  ')}
              </div>
              <button onClick={() => saveHome({ ident: lookup.icao })} disabled={savingHome}
                className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">
                {savingHome ? 'Saving...' : `Use ${lookup.icao} as my home field`}
              </button>
            </div>
          )}

          {/* Manual fallback for unlisted fields */}
          <button onClick={() => setShowManual((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600 mt-3 block">
            {showManual ? 'Hide manual entry' : 'Field not listed? Enter it manually'}
          </button>
          {showManual && (
            <div className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input value={manual.name} onChange={(e) => setManual((h) => ({ ...h, name: e.target.value.slice(0, 40) }))}
                  placeholder="Field name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <input value={manual.tower} onChange={(e) => setManual((h) => ({ ...h, tower: e.target.value.replace(/[^0-9.]/g, '').slice(0, 12) }))}
                  placeholder="Tower freq" className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <input value={manual.runway} onChange={(e) => setManual((h) => ({ ...h, runway: e.target.value.toUpperCase().replace(/[^0-9LRC]/g, '').slice(0, 6) }))}
                  placeholder="Runway (24)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <button onClick={() => saveHome(manual)} disabled={savingHome || !(manual.name && manual.tower && manual.runway)}
                className="mt-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40">
                {savingHome ? 'Saving...' : 'Save manual field'}
              </button>
            </div>
          )}
        </div>

        {/* Invite a friend */}
        {referral && (
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Invite a friend</div>
                <p className="text-xs text-gray-500">They get a 7-day Solo trial; you earn 7 free days per friend who joins.{referral.referrals > 0 ? ` ${referral.referrals} joined so far.` : ''}</p>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(referral.link); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000) }}
                className="shrink-0 text-sm bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-800">{refCopied ? 'Copied!' : 'Copy link'}</button>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && stats.total > 0 ? (
          <>
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Scenarios', value: stats.total },
                { label: 'Pass rate', value: `${stats.passRate}%` },
                { label: 'Avg score', value: stats.avgScore },
              ].map((s) => (
                <div key={s.label} className="border border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* By phase */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">By phase</div>
              <div className="space-y-2">
                {stats.byPhase.map((p) => {
                  const pct = Math.round((parseInt(p.passed) / parseInt(p.total)) * 100)
                  return (
                    <div key={p.phase} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600 shrink-0">{PHASE_LABELS[p.phase] ?? p.phase}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-gray-400 shrink-0 w-20 text-right">{pct}% · {p.total} done</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mistake library */}
            {stats.topMistakes.length > 0 && (
              <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5 mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-yellow-700 mb-3">Your most-missed elements</div>
                <div className="space-y-2">
                  {stats.topMistakes.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-yellow-900">{m.elem}</span>
                      <span className="text-xs text-yellow-600 font-mono">{m.cnt}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent history */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Recent history</div>
              <div className="space-y-2">
                {stats.recent.map((g, i) => (
                  <a key={i} href={`/train/${g.scenario_id}`} className="flex items-center justify-between py-1 hover:text-gray-900 group">
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                      {g.scenario_id.replace(/-/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {g.hint_used && <span className="text-xs text-gray-300">hint</span>}
                      <span className={`text-xs font-mono ${g.passed ? 'text-green-600' : 'text-red-500'}`}>{g.score}</span>
                      <span className={g.passed ? 'text-green-500' : 'text-red-400'}>{g.passed ? '✓' : '✗'}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="text-sm">No scenarios graded yet.</div>
            <a href="/train" className="text-blue-600 text-sm hover:underline mt-1 block">Start training →</a>
          </div>
        )}
      </div>
    </main>
  )
}
