'use client'

import { useRouter } from 'next/navigation'

export default function PracticePage() {
  const router = useRouter()
  const go = () => router.push(`/train/gen-${Math.floor(Math.random() * 1_000_000_000)}`)
  return (
    <main className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="flex items-center gap-3 mb-6 justify-center">
        <h1 className="text-2xl font-semibold">Endless practice</h1>
      </div>
      <p className="text-gray-500 mb-8">
        A never-ending stream of fresh ATC calls — takeoffs, landings, pattern entries,
        frequency changes, squawks, and altitude assignments — generated on the fly.
      </p>
      <button onClick={go} className="bg-gray-900 text-white rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-gray-800">
        Start a random scenario
      </button>
      <p className="mt-6"><a href="/train" className="text-sm text-gray-400 hover:text-gray-600">← back to training</a></p>
    </main>
  )
}
