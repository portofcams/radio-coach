'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { scenarios, getScenario, getCallOfTheDay } from '@/lib/scenarios'
import { FLIGHT_SESSIONS } from '@/lib/flight-sessions'
import { useEffect, useState } from 'react'
import type { Facility, Scenario } from '@/lib/types'
import { homeScenarios } from '@/lib/home-client'
import { liveWeatherScenarioStubs } from '@/lib/live-weather'

const PHASE_LABELS: Record<string, string> = {
  ground: 'Ground',
  departure: 'Departure',
  pattern: 'Pattern',
  enroute: 'En route',
  ifr: 'IFR',
  emergency: 'Emergencies & advanced',
}

const DIFF_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Student', color: 'bg-green-100 text-green-800' },
  2: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'Advanced', color: 'bg-red-100 text-red-800' },
}

const FACILITY_COLORS: Record<string, string> = {
  GROUND:    'text-amber-700 border-amber-300 bg-amber-50',
  TOWER:     'text-green-700 border-green-300 bg-green-50',
  APPROACH:  'text-sky-700 border-sky-300 bg-sky-50',
  DEPARTURE: 'text-violet-700 border-violet-300 bg-violet-50',
  CENTER:    'text-blue-700 border-blue-300 bg-blue-50',
  CLEARANCE: 'text-orange-700 border-orange-300 bg-orange-50',
  CTAF:      'text-cyan-700 border-cyan-300 bg-cyan-50',
  UNICOM:    'text-teal-700 border-teal-300 bg-teal-50',
}

interface CompletedMap {
  [scenarioId: string]: { passed: boolean; score: number }
}

export default function TrainPage() {
  const phases = ['ground', 'departure', 'pattern', 'enroute', 'ifr', 'emergency'] as const
  const router = useRouter()
  const [completed, setCompleted] = useState<CompletedMap>({})
  const [activeTab, setActiveTab] = useState<'scenarios' | 'sessions'>('scenarios')
  const [facilityFilter, setFacilityFilter] = useState<Facility | null>(null)
  const [diffFilter, setDiffFilter] = useState<1 | 2 | 3 | null>(null)
  const [heliOnly, setHeliOnly] = useState(false)
  const [packFilter, setPackFilter] = useState<'hawaii' | 'alaska' | null>(null)
  const [homeList, setHomeList] = useState<Scenario[]>([])
  const [wxList, setWxList] = useState<ReturnType<typeof liveWeatherScenarioStubs>>([])
  const [homeChecked, setHomeChecked] = useState(false)
  const [assignments, setAssignments] = useState<Array<{ scenario_id: string; done: boolean; due_at?: string | null }>>([])
  const [showFirstRunTip, setShowFirstRunTip] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('wilco_train_seen')) setShowFirstRunTip(true)
    } catch { /* localStorage unavailable (private mode) -- skip the tip, not worth failing over */ }
  }, [])

  // Optional ?pack=hawaii|alaska deep link (e.g. from marketing copy). Read
  // from window.location, not useSearchParams, to avoid a new Suspense
  // boundary -- same convention as the ?duel= param in train/scenario/page.tsx.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('pack')
    if (p === 'hawaii' || p === 'alaska') setPackFilter(p)
  }, [])

  const dismissFirstRunTip = () => {
    setShowFirstRunTip(false)
    try { localStorage.setItem('wilco_train_seen', '1') } catch { /* ignore */ }
  }

  useEffect(() => {
    // Load completion data from server (if logged in) or localStorage
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.home) setHomeList(homeScenarios(d.user.home, d.user.callsign))
        if (d.user?.home?.mode === 'real') setWxList(liveWeatherScenarioStubs(d.user.home.field))
        setHomeChecked(true)
        if (d.user) fetch('/api/user/assignments').then((r) => r.json()).then((a) => { if (Array.isArray(a.assignments)) setAssignments(a.assignments) }).catch(() => {})
        if (d.user) {
          return fetch('/api/user/stats')
            .then((r) => r.json())
            .then((stats) => {
              if (stats.recent) {
                const map: CompletedMap = {}
                stats.recent.forEach((g: { scenario_id: string; passed: boolean; score: number }) => {
                  if (!map[g.scenario_id] || g.score > map[g.scenario_id].score) {
                    map[g.scenario_id] = { passed: g.passed, score: g.score }
                  }
                })
                setCompleted(map)
              }
            })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm shrink-0">← back</Link>
              <h1 className="text-2xl font-semibold">Training</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/challenge" className="text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">Challenge →</Link>
              <button
                onClick={() => {
                  const pool = scenarios
                    .filter(s => !facilityFilter || s.facility === facilityFilter)
                    .filter(s => !diffFilter || s.difficulty === diffFilter)
                  if (!pool.length) return
                  const pick = pool[Math.floor(Math.random() * pool.length)]
                  router.push(`/train/scenario?id=${pick.id}`)
                }}
                className="text-sm font-mono font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-colors"
              >
                Random
              </button>
            </div>
          </div>
          <nav className="mt-3 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-3">
            {[
              { href: '/practice', label: 'Practice' },
              { href: '/listen', label: 'Listen' },
              { href: '/oral', label: 'Oral' },
              { href: '/community', label: 'Community' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/guides', label: 'Guides' },
              { href: '/glossary', label: 'Glossary' },
              { href: '/tools', label: 'Tools' },
              { href: '/learn', label: 'Learn' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {showFirstRunTip && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex-1 text-sm text-amber-900">
              <span className="font-medium">New here?</span> Filter by phase or level below, or just hit the{' '}
              <span className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">CALL OF THE DAY</span> card
              to jump straight into a scenario — no need to browse everything first.
            </div>
            <button
              onClick={dismissFirstRunTip}
              className="text-amber-500 hover:text-amber-700 text-sm shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex-1 text-sm py-2 rounded-md font-medium transition-colors ${activeTab === 'scenarios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Scenarios ({scenarios.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 text-sm py-2 rounded-md font-medium transition-colors ${activeTab === 'sessions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sessions ({FLIGHT_SESSIONS.length})
          </button>
        </div>

        {/* Filters — only show in scenarios tab */}
        {activeTab === 'scenarios' && (
          <div className="mb-6 space-y-2">
            {/* Facility filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setFacilityFilter(null); setHeliOnly(false); setPackFilter(null) }}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${!facilityFilter && !heliOnly && !packFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                All
              </button>
              {(['GROUND','TOWER','APPROACH','DEPARTURE','CENTER','CLEARANCE','CTAF'] as Facility[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setFacilityFilter(prev => prev === f ? null : f); setHeliOnly(false) }}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${facilityFilter === f ? FACILITY_COLORS[f] + ' font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={() => { setHeliOnly(v => !v); setFacilityFilter(null) }}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${heliOnly ? 'text-slate-700 border-slate-300 bg-slate-100 font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                HELI
              </button>
              <button
                onClick={() => { setPackFilter(p => p === 'hawaii' ? null : 'hawaii'); setHeliOnly(false) }}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${packFilter === 'hawaii' ? 'text-blue-700 border-blue-300 bg-blue-50 font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                HI
              </button>
              <button
                onClick={() => { setPackFilter(p => p === 'alaska' ? null : 'alaska'); setHeliOnly(false) }}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${packFilter === 'alaska' ? 'text-indigo-700 border-indigo-300 bg-indigo-50 font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                AK
              </button>
            </div>
            {/* Difficulty filter + active count */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setDiffFilter(null)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${!diffFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>All levels</button>
              {([1,2,3] as const).map(d => (
                <button key={d} onClick={() => setDiffFilter(prev => prev === d ? null : d)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${diffFilter === d ? DIFF_LABELS[d].color + ' font-bold border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                  {DIFF_LABELS[d].label}
                </button>
              ))}
              {(facilityFilter || diffFilter || packFilter) && (() => {
                const n = scenarios
                  .filter(s => !facilityFilter || s.facility === facilityFilter)
                  .filter(s => !diffFilter || s.difficulty === diffFilter)
                  .filter(s => !packFilter || s.pack === packFilter).length
                return (
                  <span className="ml-auto text-xs text-gray-400 font-mono">
                    {n} of {scenarios.length}
                    <button onClick={() => { setFacilityFilter(null); setDiffFilter(null); setPackFilter(null) }} className="ml-2 text-gray-400 hover:text-gray-700">✕</button>
                  </span>
                )
              })()}
            </div>
          </div>
        )}

        {/* Scenarios tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-8">
            {!facilityFilter && !diffFilter && !heliOnly && !packFilter && (() => {
              const c = getCallOfTheDay()
              const done = completed[c.id]
              return (
                <Link href={`/train/scenario?id=${c.id}`} className="block rounded-xl p-4 border border-amber-300 bg-amber-50 hover:border-amber-400 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-bold tracking-widest text-amber-600 mb-0.5">CALL OF THE DAY</div>
                      <div className="font-medium text-gray-900 truncate">{c.title}</div>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-amber-700">{done ? `done · ${done.score}` : 'Fly it →'}</span>
                  </div>
                </Link>
              )
            })()}
            {assignments.length > 0 && !facilityFilter && !diffFilter && !heliOnly && !packFilter && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Assigned by your CFI</h2>
                <div className="space-y-2">
                  {assignments.map((a) => {
                    const sc = getScenario(a.scenario_id)
                    let due: { text: string; cls: string } | null = null
                    if (a.due_at && !a.done) {
                      const d = Math.ceil((new Date(a.due_at).getTime() - Date.now()) / 86_400_000)
                      due = d < 0 ? { text: `${-d}d overdue`, cls: 'text-red-600' }
                        : d === 0 ? { text: 'due today', cls: 'text-red-500' }
                        : { text: `due in ${d}d`, cls: 'text-amber-600' }
                    }
                    return (
                      <Link key={a.scenario_id} href={`/train/scenario?id=${a.scenario_id}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-gray-900 truncate">{sc?.title ?? a.scenario_id.replace(/-/g, ' ')}</div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-violet-600 text-white leading-4 tracking-wide">ASSIGNED</span>
                              {due && <span className={`text-[11px] font-medium ${due.cls}`}>{due.text}</span>}
                            </div>
                          </div>
                          <span className={`shrink-0 text-xs font-medium ${a.done ? 'text-green-600' : 'text-amber-600'}`}>{a.done ? 'done ✓' : 'to do'}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
            {homeList.length > 0 && !facilityFilter && !diffFilter && !heliOnly && !packFilter && (
              <div id="home-field">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Your home field
                  </h2>
                  <Link href="/diagram" className="text-xs text-blue-600 hover:underline">Diagram drill →</Link>
                </div>
                <div className="space-y-2">
                  {homeList.map((s) => {
                    const c = completed[s.id]
                    return (
                      <Link key={s.id} href={`/train/scenario?id=${s.id}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-gray-900 truncate">{s.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-cyan-600 text-white leading-4 tracking-wide">HOME</span>
                              {s.pack === 'hawaii' && <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-blue-600 text-white leading-4 tracking-wide">HI</span>}
                              {s.pack === 'alaska' && <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-indigo-600 text-white leading-4 tracking-wide">AK</span>}
                              {s.frequency && <span className="font-mono text-xs text-gray-500">{s.frequency}</span>}
                            </div>
                          </div>
                          {c && <span className={`shrink-0 text-xs font-mono ${c.passed ? 'text-green-600' : 'text-red-500'}`}>{c.score}</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
            {wxList.length > 0 && !facilityFilter && !diffFilter && !heliOnly && !packFilter && (
              <div id="live-weather">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Today&apos;s actual weather
                </h2>
                <div className="space-y-2">
                  {wxList.map((s) => (
                    <Link key={s.id} href={`/train/scenario?id=${s.id}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                      <div className="min-w-0">
                        <div className="font-medium group-hover:text-gray-900 truncate">{s.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-sky-600 text-white leading-4 tracking-wide">LIVE WX</span>
                          {s.frequency && <span className="font-mono text-xs text-gray-500">{s.frequency}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Uses today&apos;s actual reported wind — resolved when you open the scenario.</p>
              </div>
            )}
            {homeChecked && homeList.length === 0 && !facilityFilter && !diffFilter && !heliOnly && !packFilter && (
              <div id="home-field" className="border border-dashed border-cyan-300 bg-cyan-50/40 rounded-xl px-4 py-4 mb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-widest text-cyan-700 mb-1">Practice at your home field</div>
                    <p className="text-sm text-gray-600">Set your home airport and get graded ground, tower, and departure calls using its real frequencies and runways.</p>
                  </div>
                  <Link href="/profile" className="shrink-0 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800 whitespace-nowrap">Set field →</Link>
                </div>
              </div>
            )}
            {(() => {
              const heli = scenarios
                .filter((s) => s.category === 'helicopter')
                .filter((s) => !facilityFilter || s.facility === facilityFilter)
                .filter((s) => !diffFilter || s.difficulty === diffFilter)
                .filter((s) => !packFilter || s.pack === packFilter)
              if (!heli.length) return null
              return (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Helicopter operations</h2>
                  <div className="space-y-2">
                    {heli.map((s) => {
                      const c = completed[s.id]
                      return (
                        <Link key={s.id} href={`/train/scenario?id=${s.id}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium group-hover:text-gray-900 truncate">{s.title}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-slate-700 text-white leading-4 tracking-wide">HELI</span>
                                {s.airport && <span className="font-mono text-xs text-blue-600">{s.airport}</span>}
                                {s.frequency && <span className="font-mono text-xs text-gray-400">{s.frequency}</span>}
                              </div>
                            </div>
                            {c && <span className={`shrink-0 text-xs font-mono ${c.passed ? 'text-green-600' : 'text-red-500'}`}>{c.score}</span>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            {(() => {
              const atc = scenarios
                .filter((s) => s.atcMode)
                .filter((s) => !facilityFilter || s.facility === facilityFilter)
                .filter((s) => !diffFilter || s.difficulty === diffFilter)
                .filter((s) => !packFilter || s.pack === packFilter)
              if (!atc.length) return null
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">ATC / controller practice</h2>
                    <span className="text-xs text-gray-400">Play the controller, not the pilot</span>
                  </div>
                  <div className="space-y-2">
                    {atc.map((s) => (
                      <Link key={`atc-${s.id}`} href={`/train/scenario?id=${s.id}&role=atc`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-gray-900 truncate">{s.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-blue-600 text-white leading-4 tracking-wide">ATC</span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-gray-900 text-white leading-4 tracking-wide">PRO</span>
                              {s.airport && <span className="font-mono text-xs text-blue-600">{s.airport}</span>}
                              {s.facility && <span className="font-mono text-xs text-gray-400">{s.facility}</span>}
                              {s.frequency && <span className="font-mono text-xs text-gray-400">{s.frequency}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}
            {!heliOnly && phases.map((phase) => {
              const phaseScenarios = scenarios
                .filter((s) => s.phase === phase)
                .filter((s) => s.category !== 'helicopter')
                .filter((s) => !facilityFilter || s.facility === facilityFilter)
                .filter((s) => !diffFilter || s.difficulty === diffFilter)
                .filter((s) => !packFilter || s.pack === packFilter)
              if (!phaseScenarios.length) return null
              return (
                <div key={phase}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    {PHASE_LABELS[phase]}
                  </h2>
                  <div className="space-y-2">
                    {phaseScenarios.map((s) => {
                      const diff = DIFF_LABELS[s.difficulty]
                      const c = completed[s.id]
                      return (
                        <Link
                          key={s.id}
                          href={`/train/scenario?id=${s.id}`}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Completion marker */}
                            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${c ? (c.passed ? 'bg-green-500 text-white' : 'bg-yellow-400 text-white') : 'border-2 border-gray-200'}`}>
                              {c ? (c.passed ? '✓' : '~') : ''}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium group-hover:text-gray-900 truncate">{s.title}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {s.tier === 'pro' && (
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-gray-900 text-white leading-4 tracking-wide">PRO</span>
                                )}
                                {s.pack === 'hawaii' && <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-blue-600 text-white leading-4 tracking-wide">HI</span>}
                                {s.pack === 'alaska' && <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-indigo-600 text-white leading-4 tracking-wide">AK</span>}
                                {s.airport && <span className="font-mono text-xs text-blue-600">{s.airport}</span>}
                                {s.facility && (
                                  <span className={`font-mono text-xs px-1.5 py-0 rounded border leading-4 ${
                                    s.facility === 'GROUND'    ? 'text-amber-700 border-amber-200 bg-amber-50' :
                                    s.facility === 'TOWER'     ? 'text-green-700 border-green-200 bg-green-50' :
                                    s.facility === 'APPROACH'  ? 'text-sky-700 border-sky-200 bg-sky-50' :
                                    s.facility === 'DEPARTURE' ? 'text-violet-700 border-violet-200 bg-violet-50' :
                                    s.facility === 'CENTER'    ? 'text-blue-700 border-blue-200 bg-blue-50' :
                                    s.facility === 'CLEARANCE' ? 'text-orange-700 border-orange-200 bg-orange-50' :
                                    s.facility === 'CTAF'      ? 'text-cyan-700 border-cyan-200 bg-cyan-50' :
                                    'text-gray-600 border-gray-200'
                                  }`}>{s.facility}</span>
                                )}
                                {s.frequency && (
                                  <span className="font-mono text-xs text-gray-400">{s.frequency}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            {c && (
                              <span className={`text-xs font-mono ${c.passed ? 'text-green-600' : 'text-yellow-600'}`}>{c.score}</span>
                            )}
                            <span className={`text-xs font-medium px-2 py-1 rounded ${diff.color}`}>
                              {diff.label}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {FLIGHT_SESSIONS.map((session) => (
              <Link
                key={session.id}
                href={`/session?id=${session.id}`}
                className="block p-5 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold group-hover:text-gray-900">{session.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{session.description}</div>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${session.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : session.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {session.difficulty}
                    </span>
                    <div className="text-xs text-gray-400 mt-1 font-mono">{session.airport}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {session.scenarioIds.length} scenarios in sequence
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
