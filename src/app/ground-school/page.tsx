'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { units, previousLessonId, orderedLessons } from '@/lib/groundschool'
import { loadProgress, type GsProgress } from '@/lib/gs-progress'

export default function GroundSchoolPage() {
  const [progress, setProgress] = useState<GsProgress | null>(null)

  useEffect(() => {
    setProgress(loadProgress())
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
            <span title="Day streak" className="flex items-center gap-1 font-semibold text-orange-500">
              🔥 {progress?.streak ?? 0}
            </span>
            <span title="Total XP" className="flex items-center gap-1 font-semibold text-amber-600">
              ⭐ {progress?.xp ?? 0}
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
                <span className="text-base">{unit.icon}</span>
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
                      <span className="text-2xl">
                        {complete ? '✓' : unlocked ? unit.icon : '🔒'}
                      </span>
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
