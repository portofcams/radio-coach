'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PracticePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const go = () => router.push(`/train/scenario?id=gen-${Math.floor(Math.random() * 1_000_000_000)}`)
  const smart = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/adaptive/next')
      const d = await r.json()
      if (d.scenarioId) router.push(`/train/scenario?id=${d.scenarioId}`)
    } finally { setLoading(false) }
  }
  return (
    <main className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="flex items-center gap-3 mb-6 justify-center">
        <h1 className="text-2xl font-semibold">Practice</h1>
      </div>

      <div className="border border-amber-300 bg-amber-50 rounded-xl p-5 mb-4 text-left">
        <div className="font-semibold mb-1">Live duel <span className="font-mono text-[10px] font-bold tracking-widest text-amber-600 align-middle">NEW</span></div>
        <p className="text-gray-600 text-sm mb-4">Race another pilot on the same ATC call in real time — fastest clean readback wins.</p>
        <a href="/duel/live" className="block text-center w-full bg-amber-500 text-white rounded-lg px-6 py-3 text-sm font-semibold hover:bg-amber-600">Start a live duel</a>
      </div>

      <div className="border border-gray-200 rounded-xl p-5 mb-4 text-left">
        <div className="font-semibold mb-1">Smart practice</div>
        <p className="text-gray-500 text-sm mb-4">Adapts to your recent scores — steps up the difficulty as you pass and leans into the phases you&apos;ve been missing.</p>
        <button onClick={smart} disabled={loading} className="w-full bg-gray-900 text-white rounded-lg px-6 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
          {loading ? 'Picking…' : 'Start smart practice'}
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl p-5 mb-4 text-left">
        <div className="font-semibold mb-1">Weak-spot bootcamp</div>
        <p className="text-gray-500 text-sm mb-4">A focused plan built from the elements you&apos;ve been missing lately.</p>
        <a href="/bootcamp" className="block text-center w-full border border-gray-300 text-gray-800 rounded-lg px-6 py-3 text-sm font-medium hover:border-gray-500">Build my bootcamp</a>
      </div>

      <div className="border border-gray-200 rounded-xl p-5 text-left">
        <div className="font-semibold mb-1">Endless random</div>
        <p className="text-gray-500 text-sm mb-4">A never-ending stream of fresh, randomly generated ATC calls.</p>
        <button onClick={go} className="w-full border border-gray-300 text-gray-800 rounded-lg px-6 py-3 text-sm font-medium hover:border-gray-500">
          Start a random scenario
        </button>
      </div>

      <p className="mt-6"><a href="/train" className="text-sm text-gray-400 hover:text-gray-600">← back to training</a></p>
    </main>
  )
}
