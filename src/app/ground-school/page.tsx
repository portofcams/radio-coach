'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { units, previousLessonId, orderedLessons } from '@/lib/groundschool'
import { loadProgress, syncProgress, type GsProgress } from '@/lib/gs-progress'
import { FlameIcon, StarIcon, LockIcon, CheckIcon } from '@/components/icons'

export default function GroundSchoolPage() {
  const [progress, setProgress] = useState<GsProgress | null>(null)

  useEffect(() => {
    const local = loadProgress()
    setProgress(local)
    // pull + merge server progress (logged-in users sync across devices)
    syncProgress(local).then(setProgress)
  }, [])

  // first not-yet-completed lesson = the "current" node to highlight
  const currentId = progress
    ? orderedLessons.find(({ lesson }) => !progress.completed.includes(lesson.id))?.lesson.id ?? null
    : null

  const total = orderedLessons.length
  const done = progress?.completed.length ?? 0

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← back</Link>
        </div>

        <div className="flex items-end justify-between mb-1">
          <h1 className="text-2xl font-semibold">Ground School</h1>
          <div className="flex items-center gap-4 text-sm">
            <span title="Day streak" className="flex items-center gap-1.5 font-semibold text-orange-500">
              <FlameIcon className="text-base" /> {progress?.streak ?? 0}
            </span>
            <span title="Total XP" className="flex items-center gap-1.5 font-semibold text-amber-600">
              <StarIcon className="text-base" /> {progress?.xp ?? 0}
            </span>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Bite-sized radio drills — no mic required. {done}/{total} lessons complete.
        </p>

        {/* progress bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-10">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-12">
          {units.map((unit) => (
            <section key={unit.id}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold mb-6 ${unit.color}`}>
                <span className="font-mono text-xs opacity-70">{unit.icon}</span>
                {unit.title}
              </div>
              <p className="text-xs text-gray-400 -mt-4 mb-6 ml-1">{unit.subtitle}</p>

              {/* the path */}
              <div className="flex flex-col items-center gap-3">
                {unit.lessons.map((lesson, idx) => {
                  const complete = progress?.completed.includes(lesson.id) ?? false
                  const unlocked =
                    !progress
                      ? idx === 0 && unit.id === units[0].id
                      : (() => {
                          const prev = previousLessonId(lesson.id)
                          return !prev || progress.completed.includes(prev)
                        })()
                  const isCurrent = lesson.id === currentId
                  // gentle left/right offset for the winding-path feel
                  const offset = idx % 2 === 0 ? '-translate-x-10' : 'translate-x-10'

                  const node = (
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 shrink-0 transition-transform ${
                        complete
                          ? 'bg-green-500 border-green-600 text-white'
                          : unlocked
                            ? `bg-white border-gray-900 text-gray-900 ${isCurrent ? 'ring-4 ring-green-200' : ''}`
                            : 'bg-gray-100 border-gray-200 text-gray-300'
                      } ${unlocked && !complete ? 'hover:scale-105' : ''}`}
                    >
                      {complete ? (
                        <CheckIcon className="text-3xl" />
                      ) : unlocked ? (
                        <span className="font-mono font-bold text-sm tracking-tight">{unit.icon}</span>
                      ) : (
                        <LockIcon className="text-xl" />
                      )}
                    </div>
                  )

                  return (
                    <div key={lesson.id} className={`flex flex-col items-center ${offset}`}>
                      {unlocked ? (
                        <Link href={`/ground-school/${lesson.id}`} aria-label={lesson.title}>
                          {node}
                        </Link>
                      ) : (
                        node
                      )}
                      <span
                        className={`mt-1.5 text-xs font-medium ${
                          unlocked ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      >
                        {lesson.title}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Unit checkpoint — a free live-comms taste, unlocked when the unit is done */}
              {unit.checkpointScenarioId && (() => {
                const unitDone = progress
                  ? unit.lessons.every((l) => progress.completed.includes(l.id))
                  : false
                return unitDone ? (
                  <Link
                    href={`/train/${unit.checkpointScenarioId}`}
                    className="mt-8 flex items-center gap-3 border-2 border-gray-900 bg-gray-900 text-white rounded-xl px-4 py-3.5 hover:bg-black transition-colors"
                  >
                    <span className="font-mono text-[10px] font-bold tracking-widest border border-gray-600 rounded px-1.5 py-0.5">LIVE</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">Live Comms checkpoint</div>
                      <div className="text-xs text-gray-400">Key the mic — your read-back, graded live</div>
                    </div>
                    <span className="ml-auto text-gray-400">→</span>
                  </Link>
                ) : (
                  <div className="mt-8 flex items-center gap-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl px-4 py-3.5">
                    <LockIcon className="text-base shrink-0" />
                    <div className="text-sm">Live Comms checkpoint — finish the unit to unlock</div>
                  </div>
                )
              })()}
            </section>
          ))}
        </div>

        <div className="mt-14 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <div className="text-sm font-medium mb-1">Ready to key the mic?</div>
          <p className="text-sm text-gray-500">
            Once the basics feel automatic, put them to work in a{' '}
            <Link href="/train" className="text-blue-600 hover:underline">live readback scenario</Link>{' '}
            — real ATC, graded by AI.
          </p>
        </div>
      </div>
    </main>
  )
}
