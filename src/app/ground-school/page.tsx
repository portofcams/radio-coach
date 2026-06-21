'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { units, previousLessonId, orderedLessons } from '@/lib/groundschool'
import {
  loadProgress, syncProgress, effectiveHearts, msToNextHeart, countCrowns,
  MAX_HEARTS, DAILY_GOAL_XP, type GsProgress,
} from '@/lib/gs-progress'
import { FlameIcon, StarIcon, LockIcon, CheckIcon, HeartIcon, CrownIcon, SnowflakeIcon } from '@/components/icons'

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function GroundSchoolPage() {
  const [progress, setProgress] = useState<GsProgress | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const local = loadProgress()
    setProgress(local)
    // pull + merge server progress (logged-in users sync across devices)
    syncProgress(local).then(setProgress)
  }, [])

  // tick once a second so the heart-refill countdown stays live
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // first not-yet-completed lesson = the "current" node to highlight
  const currentId = progress
    ? orderedLessons.find(({ lesson }) => !progress.completed.includes(lesson.id))?.lesson.id ?? null
    : null

  const total = orderedLessons.length
  const [dl, setDl] = useState<'idle' | 'working' | 'done'>('idle')
  async function downloadOffline() {
    setDl('working')
    try {
      const urls = ['/ground-school', ...orderedLessons.map(({ lesson }) => `/ground-school/${lesson.id}`)]
      // Accept: text/html so the service worker's navigation branch caches them
      await Promise.all(urls.map((u) => fetch(u, { headers: { Accept: 'text/html' } }).catch(() => {})))
      setDl('done')
    } catch { setDl('idle') }
  }
  const done = progress?.completed.length ?? 0

  const hearts = progress ? effectiveHearts(progress) : MAX_HEARTS
  const heartWait = progress ? msToNextHeart(progress) : 0
  const crowns = progress ? countCrowns(progress) : 0
  const freezes = progress?.freezes ?? 0
  const dailyXp = progress?.dailyXp ?? 0
  const dailyPct = Math.min(100, (dailyXp / DAILY_GOAL_XP) * 100)
  const ringC = 2 * Math.PI * 15.5

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3 mb-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← back</Link>
          <button onClick={downloadOffline} disabled={dl === 'working'}
            className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-50">
            {dl === 'done' ? 'Available offline ✓' : dl === 'working' ? 'Downloading…' : 'Download for offline'}
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-2xl font-semibold">Ground School</h1>
          <div className="flex items-center gap-3 text-sm flex-wrap justify-end">
            <span title="Hearts" className={`flex items-center gap-1.5 font-semibold ${hearts > 0 ? 'text-red-500' : 'text-gray-300'}`}>
              <HeartIcon className="text-base" /> {hearts}
            </span>
            <span title="Day streak" className="flex items-center gap-1.5 font-semibold text-orange-500">
              <FlameIcon className="text-base" /> {progress?.streak ?? 0}
            </span>
            <span title="Total XP" className="flex items-center gap-1.5 font-semibold text-amber-600">
              <StarIcon className="text-base" /> {progress?.xp ?? 0}
            </span>
            <span title="Crowns (units mastered)" className="flex items-center gap-1.5 font-semibold text-yellow-500">
              <CrownIcon className="text-base" /> {crowns}
            </span>
            {freezes > 0 && (
              <span title="Streak freezes" className="flex items-center gap-1.5 font-semibold text-sky-400">
                <SnowflakeIcon className="text-base" /> {freezes}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Bite-sized radio drills — no mic required.{' '}
          {hearts < MAX_HEARTS && heartWait > 0 && (
            <span className="text-gray-400">Next heart in <span className="font-mono tabular-nums">{fmtCountdown(heartWait)}</span>. </span>
          )}
          {done}/{total} lessons complete.
        </p>

        {/* daily goal ring + overall progress */}
        <div className="flex items-center gap-4 mb-10">
          <div className="relative w-14 h-14 shrink-0" title="Daily goal">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - dailyPct / 100)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <StarIcon className={`text-base ${dailyPct >= 100 ? 'text-green-500' : 'text-gray-300'}`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">
                Daily goal · {Math.min(dailyXp, DAILY_GOAL_XP)}/{DAILY_GOAL_XP} XP {dailyPct >= 100 && '· done!'}
              </span>
              <span className="text-xs text-gray-400">{done}/{total} lessons</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
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
