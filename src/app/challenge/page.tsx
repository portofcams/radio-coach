import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'

function getDailyScenario() {
  const epoch = new Date('2026-01-01').getTime()
  const day = Math.floor((Date.now() - epoch) / 86400000)
  return scenarios[day % scenarios.length]
}

export default function ChallengePage() {
  const scenario = getDailyScenario()
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Pacific/Honolulu'
  })

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Daily Challenge</div>
          <h1 className="text-2xl font-bold text-gray-900">{today}</h1>
          <p className="text-gray-500 text-sm mt-1">One scenario. One shot. Your best readback.</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              scenario.difficulty === 1 ? 'bg-green-100 text-green-800' :
              scenario.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {['', 'Student', 'Intermediate', 'Advanced'][scenario.difficulty]}
            </span>
            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {scenario.airport}
            </span>
            <span className="text-xs text-gray-400 capitalize">{scenario.phase}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{scenario.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{scenario.setup}</p>
        </div>

        <Link
          href={`/train/${scenario.id}`}
          className="block w-full bg-gray-900 text-white text-center py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
        >
          Start today&apos;s challenge →
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          Resets at midnight · <Link href="/train" className="underline">All scenarios</Link>
        </p>
      </div>
    </main>
  )
}
