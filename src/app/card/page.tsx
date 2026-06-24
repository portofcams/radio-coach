'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toPhonetic } from '@/lib/phonetic'
import type { Readiness } from '@/lib/readiness'
import { endorsementLabel } from '@/lib/endorsements'

interface Me { callsign: string | null; home?: { mode: 'real'; ident: string; field: { radioName?: string; name: string } } | { mode: 'manual'; name: string } | null }
interface Stats { total: number; passed: number; passRate: number; avgScore: number }
interface Coach { orgName: string | null; logoUrl: string | null; endorsements: string[] }

export default function ScoreCardPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [rd, setRd] = useState<Readiness | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/user/readiness').then((r) => r.json()),
      fetch('/api/user/stats').then((r) => r.json()),
      fetch('/api/user/coach').then((r) => r.json()),
    ]).then(([m, r, s, co]) => {
      if (!m.user) { router.push('/login'); return }
      setMe(m.user)
      if (r && typeof r.score === 'number') setRd(r)
      if (s && !s.error) setStats(s)
      if (co && co.coach) setCoach(co.coach)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (!me || !rd || !stats) return null

  const homeName = me.home?.mode === 'real' ? (me.home.field.radioName || me.home.field.name) : me.home?.mode === 'manual' ? me.home.name : null
  const col = rd.level === 'ready' ? '#16a34a' : rd.level === 'almost' ? '#d97706' : '#dc2626'
  const c = 2 * Math.PI * 52
  const shareText = `I'm ${rd.score}% radio-ready on Clearspar — ${rd.label}. ${stats.passed} scenarios passed, ${stats.passRate}% pass rate. Free aviation radio training → wilco.binnacleai.com`

  async function copyShare() {
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* */ }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* The card — screenshot this */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-[#0b0f14] text-white px-6 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-wide">CLEARSPAR</span>
          <span className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">Radio Readiness</span>
        </div>
        <div className="px-6 py-7 flex flex-col items-center text-center">
          <svg viewBox="0 0 130 130" className="w-36 h-36 -rotate-90">
            <circle cx="65" cy="65" r="52" fill="none" stroke="#f1f5f9" strokeWidth="11" />
            <circle cx="65" cy="65" r="52" fill="none" stroke={col} strokeWidth="11" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - rd.score / 100)} />
            <text x="65" y="65" dy="0.35em" textAnchor="middle" transform="rotate(90 65 65)" fontSize="34" fontWeight="800" fill="#0f172a">{rd.score}</text>
          </svg>
          <div className="mt-3 text-lg font-bold" style={{ color: col }}>{rd.label}</div>
          {me.callsign && (
            <div className="mt-1 text-sm text-gray-500">
              <span className="font-mono">{me.callsign}</span> · {toPhonetic(me.callsign)}
            </div>
          )}
          {homeName && <div className="text-xs text-gray-400 mt-0.5">Home field: {homeName}</div>}

          {coach && coach.endorsements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {coach.endorsements.map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">✓ {endorsementLabel(k)}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 w-full mt-6">
            {[
              { label: 'Scenarios', v: stats.total },
              { label: 'Pass rate', v: `${stats.passRate}%` },
              { label: 'Avg score', v: stats.avgScore },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-gray-50 border border-gray-100 py-3">
                <div className="text-xl font-bold text-gray-900">{s.v}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 text-center text-[11px] text-gray-400">
          {coach?.orgName ? <>Coached by {coach.orgName} · </> : null}Aviation radio training · wilco.binnacleai.com
        </div>
      </div>

      {/* Controls — not part of the card */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-xs text-gray-400 text-center max-w-xs">Screenshot the card to share, or copy the caption for r/flying, r/studentpilot, or your CFI.</p>
        <div className="flex gap-3">
          <button onClick={copyShare} className="text-sm bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors">
            {copied ? 'Copied!' : 'Copy share text'}
          </button>
          <a href="/profile" className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:border-gray-500 transition-colors">Back to profile</a>
        </div>
      </div>
    </main>
  )
}
