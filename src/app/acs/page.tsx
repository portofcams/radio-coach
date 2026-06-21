'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ACS, ACS_TASK_COUNT } from '@/lib/acs'

const KEY = 'wilco_acs_v1'

export default function AcsPage() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(KEY) || '{}')) } catch { /* ignore */ }
    setReady(true)
  }, [])

  function toggle(id: string) {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const total = Object.values(done).filter(Boolean).length
  const pct = Math.round((100 * total) / ACS_TASK_COUNT)

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Checkride tracker (Private Pilot ACS)</h1>
        <p className="text-gray-500 mb-4">Tick off each Area of Operation task as your instructor signs you off. Saved on this device.</p>

        <div className="border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{total} / {ACS_TASK_COUNT} tasks</span>
            <span className={`text-sm font-bold ${ready && pct === 100 ? 'text-green-600' : 'text-gray-900'}`}>{ready ? pct : 0}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 transition-all" style={{ width: `${ready ? pct : 0}%` }} />
          </div>
        </div>

        <div className="space-y-6">
          {ACS.map((area) => {
            const adone = area.tasks.filter((t) => done[t.id]).length
            return (
              <div key={area.numeral}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-900">{area.numeral}. {area.title}</h2>
                  <span className="text-xs text-gray-400">{adone}/{area.tasks.length}</span>
                </div>
                <div className="space-y-1">
                  {area.tasks.map((t) => (
                    <label key={t.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={!!done[t.id]} onChange={() => toggle(t.id)} className="shrink-0" />
                      <span className="font-mono text-[11px] text-gray-400 w-10 shrink-0">{t.id}</span>
                      <span className={done[t.id] ? 'text-gray-400 line-through' : 'text-gray-700'}>{t.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
