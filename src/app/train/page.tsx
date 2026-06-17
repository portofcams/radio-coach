'use client'

import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'
import { FLIGHT_SESSIONS } from '@/lib/flight-sessions'
import { useEffect, useState } from 'react'

const PHASE_LABELS: Record<string, string> = {
  ground: 'Ground',
  departure: 'Departure',
  pattern: 'Pattern',
  enroute: 'En route',
  ifr: 'IFR',
}

const DIFF_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Student', color: 'bg-green-100 text-green-800' },
  2: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'Advanced', color: 'bg-red-100 text-red-800' },
}

interface CompletedMap {
  [scenarioId: string]: { passed: boolean; score: number }
}

export default function TrainPage() {
  const phases = ['ground', 'departure', 'pattern', 'enroute', 'ifr'] as const
  const [completed, setCompleted] = useState<CompletedMap>({})
  const [activeTab, setActiveTab] = useState<'scenarios' | 'sessions'>('scenarios')

  useEffect(() => {
    // Load completion data from server (if logged in) or localStorage
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
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
          <div className="flex items-center gap-4">
            <Link href="/learn" className="text-sm text-gray-500 hover:text-gray-900 font-medium">📖 Learn</Link>
            <Link href="/challenge" className="text-sm text-blue-600 hover:underline font-medium">
              ⚡ Today&apos;s challenge →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-lg p-1">
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
            Full flight sessions ({FLIGHT_SESSIONS.length})
          </button>
        </div>

        {/* Scenarios tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-8">
            {phases.map((phase) => {
              const phaseScenarios = scenarios.filter((s) => s.phase === phase)
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
                              <div className="text-sm text-gray-500 mt-0.5 truncate">
                                {s.airport && <span className="font-mono text-xs text-blue-600 mr-1">{s.airport}</span>}
                                {s.setup.split('.')[0]}.
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
