'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toPhonetic } from '@/lib/phonetic'
import { endorsementLabel } from '@/lib/endorsements'
import type { Readiness } from '@/lib/readiness'

interface Me { email: string; callsign: string | null }
interface Stats { total: number; passRate: number; avgScore: number; byPhase: Array<{ phase: string; total: string; passed: string }>; topMistakes: Array<{ elem: string; cnt: string }> }
interface Coach { orgName: string | null; endorsements: string[] }
const PHASE: Record<string, string> = { ground: 'Ground', departure: 'Departure', pattern: 'Pattern', enroute: 'En route', ifr: 'IFR', emergency: 'Emergency', other: 'Other' }

export default function ReportPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [rd, setRd] = useState<Readiness | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/user/readiness').then((r) => r.json()),
      fetch('/api/user/stats').then((r) => r.json()),
      fetch('/api/user/coach').then((r) => r.json()),
    ]).then(([m, r, s, co]) => {
      if (!m.user) { router.push('/login'); return }
      setMe(m.user); if (r?.score != null) setRd(r); if (s && !s.error) setStats(s); if (co?.coach) setCoach(co.coach)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-16 text-gray-400">Loading...</div>
  if (!me || !rd || !stats) return null
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen bg-white">
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } @page { margin: 1.5cm; } }`}</style>
      <div className="max-w-2xl mx-auto px-8 py-10 text-gray-900">
        <div className="no-print flex items-center justify-between mb-6">
          <a href="/profile" className="text-gray-400 hover:text-gray-600 text-sm">← profile</a>
          <button onClick={() => window.print()} className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800">Print / Save as PDF</button>
        </div>

        <div className="border-b-2 border-gray-900 pb-4 mb-6 flex items-end justify-between">
          <div>
            <div className="font-mono font-bold tracking-widest text-sm">CLEARSPAR</div>
            <h1 className="text-2xl font-bold mt-1">Radio Proficiency Report</h1>
          </div>
          <div className="text-right text-sm text-gray-500">{today}</div>
        </div>

        <div className="mb-6 text-sm">
          <div><span className="text-gray-500">Pilot:</span> <span className="font-medium">{me.email}</span></div>
          {me.callsign && <div><span className="text-gray-500">Call sign:</span> <span className="font-mono">{me.callsign}</span> · {toPhonetic(me.callsign)}</div>}
          {coach?.orgName && <div><span className="text-gray-500">Instructor / school:</span> {coach.orgName}</div>}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Readiness', v: `${rd.score}` },
            { l: 'Scenarios', v: stats.total },
            { l: 'Pass rate', v: `${stats.passRate}%` },
            { l: 'Avg score', v: stats.avgScore },
          ].map((c) => (
            <div key={c.l} className="border border-gray-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{c.v}</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">{c.l}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mb-6">Overall standing: <strong>{rd.label}</strong>.</p>

        {coach && coach.endorsements.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Instructor endorsements</h2>
            <ul className="text-sm list-disc list-inside text-gray-800">
              {coach.endorsements.map((k) => <li key={k}>{endorsementLabel(k)}</li>)}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Performance by phase</h2>
          <table className="w-full text-sm">
            <tbody>
              {stats.byPhase.map((p) => {
                const pct = Math.round((parseInt(p.passed) / parseInt(p.total)) * 100)
                return (
                  <tr key={p.phase} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-700">{PHASE[p.phase] ?? p.phase}</td>
                    <td className="py-1.5 text-right text-gray-500">{p.passed}/{p.total} passed</td>
                    <td className="py-1.5 text-right font-mono w-16">{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {stats.topMistakes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Areas to review</h2>
            <ul className="text-sm text-gray-800">
              {stats.topMistakes.slice(0, 6).map((m, i) => <li key={i} className="flex justify-between border-b border-gray-100 py-1"><span>{m.elem}</span><span className="text-gray-400 font-mono">{m.cnt}× missed</span></li>)}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mt-8 border-t border-gray-200 pt-3">
          Generated by Clearspar Radio Trainer (wilco.binnacleai.com) on {today}. Scores reflect radio-communication readback practice and are not a certification.
        </p>
      </div>
    </main>
  )
}
