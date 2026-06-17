import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'

export default function Home() {
  const byPhase = {
    ground: scenarios.filter((s) => s.phase === 'ground').length,
    departure: scenarios.filter((s) => s.phase === 'departure').length,
    pattern: scenarios.filter((s) => s.phase === 'pattern').length,
    enroute: scenarios.filter((s) => s.phase === 'enroute').length,
    ifr: scenarios.filter((s) => s.phase === 'ifr').length,
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-block bg-gray-900 text-green-400 font-mono text-sm px-3 py-1 rounded mb-6">
            RADIO COACH
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Stop fumbling your radio calls.
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-2">
            Built by a student pilot who kept getting them wrong.
          </p>
          <p className="text-gray-500">
            ATC gives you an instruction. You type the readback. Claude grades it
            against FAA AIM standards — every missed element, every non-standard
            phrase, every hold short you forgot.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {Object.entries(byPhase).map(([phase, count]) => (
            <div key={phase} className="border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-semibold">{count}</div>
              <div className="text-sm text-gray-500 capitalize">{phase}</div>
            </div>
          ))}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-semibold">{scenarios.length}</div>
            <div className="text-sm text-gray-500">total</div>
          </div>
        </div>

        <Link
          href="/train"
          className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Start training
        </Link>

        <p className="mt-4 text-sm text-gray-400">
          Free during beta. No account required.
        </p>
      </div>
    </main>
  )
}
