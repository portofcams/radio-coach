import Link from 'next/link'
import { modules } from '@/lib/modules'

export default function LearnPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← back</Link>
        </div>
        <h1 className="text-2xl font-semibold mb-1">Learn</h1>
        <p className="text-gray-500 text-sm mb-8">
          Structured lessons on FAA radio phraseology — then practice with graded scenarios.
        </p>

        <div className="space-y-3">
          {modules.map((mod, i) => (
            <Link
              key={mod.id}
              href={`/learn/${mod.id}`}
              className={`flex items-center gap-4 p-5 border rounded-xl hover:border-gray-400 transition-colors group ${mod.color}`}
            >
              <div className="shrink-0 font-mono text-xs font-bold tracking-widest text-gray-500 border border-gray-300 rounded-md px-2 py-1.5 bg-white/60">{mod.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400 font-mono">0{i + 1}</span>
                  <h2 className="font-semibold text-gray-900 group-hover:text-gray-900">{mod.title}</h2>
                </div>
                <p className="text-sm text-gray-500 truncate">{mod.subtitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-gray-400">{mod.estimatedMinutes} min</div>
                <div className="text-xs text-gray-400 mt-0.5">{mod.practiceScenarioIds.length} scenarios</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <div className="text-sm font-medium mb-1">New to radio calls?</div>
          <p className="text-sm text-gray-500">Start with <Link href="/learn/ground-comms" className="text-blue-600 hover:underline">Ground Communications</Link> — it covers the most common scenarios and the hold-short rule that fails more checkrides than anything else.</p>
        </div>
      </div>
    </main>
  )
}
