import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'

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

export default function TrainPage() {
  const phases = ['ground', 'departure', 'pattern', 'enroute', 'ifr'] as const

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← back
          </Link>
          <h1 className="text-2xl font-semibold">Choose a scenario</h1>
        </div>

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
                    return (
                      <Link
                        key={s.id}
                        href={`/train/${s.id}`}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors group"
                      >
                        <div>
                          <div className="font-medium group-hover:text-gray-900">
                            {s.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {s.setup.split('.')[0]}.
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded shrink-0 ml-4 ${diff.color}`}
                        >
                          {diff.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
