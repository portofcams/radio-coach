'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { scenarios, getScenario } from '@/lib/scenarios'
import { FLIGHT_SESSIONS } from '@/lib/flight-sessions'
import { useEffect, useState } from 'react'
import type { Facility, Scenario } from '@/lib/types'
import { homeScenarios } from '@/lib/home-client'

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
  const [homeList, setHomeList] = useState<Scenario[]>([])
  const [assignments, setAssignments] = useState<Array<{ scenario_id: string; done: boolean }>>([])

  useEffect(() => {
    // Load completion data from server (if logged in) or localStorage
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.home) setHomeList(homeScenarios(d.user.home, d.user.callsign))
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← back</Link>
            <h1 className="text-2xl font-semibold">Training</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/learn" className="text-sm text-gray-500 hover:text-gray-900 font-medium">Learn</Link>
            <Link href="/challenge" className="text-sm text-blue-600 hover:underline font-medium">
              Challenge →
            </Link>
            <button
              onClick={() => {
                const pool = scenarios
                  .filter(s => !facilityFilter || s.facility === facilityFilter)
                  .filter(s => !diffFilter || s.difficulty === diffFilter)
                if (!pool.length) return
                const pick = pool[Math.floor(Math.random() * pool.length)]
                router.push(`/train/${pick.id}`)
              }}
              className="text-sm font-mono font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-colors"
            >
              Random
            </button>
          </div>
        </div>

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
                onClick={() => setFacilityFilter(null)}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${!facilityFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                All
              </button>
              {(['GROUND','TOWER','APPROACH','DEPARTURE','CENTER','CLEARANCE','CTAF'] as Facility[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFacilityFilter(prev => prev === f ? null : f)}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${facilityFilter === f ? FACILITY_COLORS[f] + ' font-bold' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {/* Difficulty filter + active count */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setDiffFilter(null)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${!diffFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>All levels</button>
              {([1,2,3] as const).map(d => (
                <button key={d} onClick={() => setDiffFilter(prev => prev === d ? null : d)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${diffFilter === d ? DIFF_LABELS[d].color + ' font-bold border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                  {DIFF_LABELS[d].label}
                </button>
              ))}
              {(facilityFilter || diffFilter) && (() => {
                const n = scenarios
                  .filter(s => !facilityFilter || s.facility === facilityFilter)
                  .filter(s => !diffFilter || s.difficulty === diffFilter).length
                return (
                  <span className="ml-auto text-xs text-gray-400 font-mono">
                    {n} of {scenarios.length}
                    <button onClick={() => { setFacilityFilter(null); setDiffFilter(null) }} className="ml-2 text-gray-400 hover:text-gray-700">✕</button>
                  </span>
                )
              })()}
            </div>
          </div>
        )}

        {/* Scenarios tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-8">
            {assignments.length > 0 && !facilityFilter && !diffFilter && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Assigned by your CFI</h2>
                <div className="space-y-2">
                  {assignments.map((a) => {
                    const sc = getScenario(a.scenario_id)
                    return (
                      <Link key={a.scenario_id} href={`/train/${a.scenario_id}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-gray-900 truncate">{sc?.title ?? a.scenario_id.replace(/-/g, ' ')}</div>
                            <div className="mt-0.5"><span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-violet-600 text-white leading-4 tracking-wide">ASSIGNED</span></div>
                          </div>
                          <span className={`shrink-0 text-xs font-medium ${a.done ? 'text-green-600' : 'text-amber-600'}`}>{a.done ? 'done ✓' : 'to do'}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
            {homeList.length > 0 && !facilityFilter && !diffFilter && (
              <div id="home-field">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Your home field
                </h2>
                <div className="space-y-2">
                  {homeList.map((s) => {
                    const c = completed[s.id]
                    return (
                      <Link key={s.id} href={`/train/${s.id}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium group-hover:text-gray-900 truncate">{s.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-cyan-600 text-white leading-4 tracking-wide">HOME</span>
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
            {phases.map((phase) => {
              const phaseScenarios = scenarios
                .filter((s) => s.phase === phase)
                .filter((s) => !facilityFilter || s.facility === facilityFilter)
                .filter((s) => !diffFilter || s.difficulty === diffFilter)
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
                          href={`/train/${s.id}`}
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
                href={`/session/${session.id}`}
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
