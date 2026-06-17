'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getLesson,
  nextLessonId,
  seededShuffle,
  type Exercise,
} from '@/lib/groundschool'
import { PHONETIC_WORDS } from '@/lib/phonetic'
import { completeLesson, type GsProgress } from '@/lib/gs-progress'

type Status = 'answering' | 'right' | 'wrong' | 'done' | 'failed'
const MAX_HEARTS = 5

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const found = getLesson(lessonId)

  const [idx, setIdx] = useState(0)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [status, setStatus] = useState<Status>('answering')
  const [ans, setAns] = useState<{ ready: boolean; correct: boolean }>({ ready: false, correct: false })
  const [result, setResult] = useState<GsProgress | null>(null)

  const exercises = found?.lesson.exercises ?? []
  const ex = exercises[idx]
  const nextId = found ? nextLessonId(found.lesson.id) : null

  // award XP exactly once when the lesson is finished
  useEffect(() => {
    if (status === 'done' && found && !result) {
      setResult(completeLesson(found.lesson.id, found.lesson.xp))
    }
  }, [status, found, result])

  if (!found) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Lesson not found.</p>
          <Link href="/ground-school" className="text-blue-600 hover:underline">← Back to Ground School</Link>
        </div>
      </main>
    )
  }

  function check() {
    if (!ans.ready) return
    if (ans.correct) {
      setStatus('right')
    } else {
      setHearts((h) => h - 1)
      setStatus('wrong')
    }
  }

  function advance() {
    if (hearts <= 0) {
      setStatus('failed')
      return
    }
    if (idx < exercises.length - 1) {
      setIdx((i) => i + 1)
      setAns({ ready: false, correct: false })
      setStatus('answering')
    } else {
      setStatus('done')
    }
  }

  function retry() {
    setIdx(0)
    setHearts(MAX_HEARTS)
    setAns({ ready: false, correct: false })
    setResult(null)
    setStatus('answering')
  }

  // ── completion screen ─────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-semibold mb-2">Lesson complete!</h1>
          <div className="flex items-center justify-center gap-6 my-6">
            <div>
              <div className="text-2xl font-bold text-amber-500">+{found.lesson.xp}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">XP earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">🔥 {result?.streak ?? 1}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Day streak</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {nextId ? (
              <Link href={`/ground-school/${nextId}`} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors">
                Next lesson →
              </Link>
            ) : null}
            <Link href="/ground-school" className="text-gray-500 hover:text-gray-800 py-2 text-sm">
              Back to the path
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── out of hearts ─────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-2xl font-semibold mb-2">Out of hearts</h1>
          <p className="text-gray-500 mb-6">No worries — repetition is how radio work gets automatic. Run it back.</p>
          <div className="flex flex-col gap-2">
            <button onClick={retry} className="bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors">
              Try again
            </button>
            <Link href="/ground-school" className="text-gray-500 hover:text-gray-800 py-2 text-sm">
              Back to the path
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── exercise screen ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-8">
        {/* header: quit · progress · hearts */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ground-school" className="text-gray-300 hover:text-gray-500 text-xl leading-none">✕</Link>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(idx / exercises.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-0.5 text-sm font-semibold text-red-500 tabular-nums">
            ❤️ {hearts}
          </div>
        </div>

        <ExerciseView
          key={ex.id}
          exercise={ex}
          locked={status !== 'answering'}
          onChange={(ready, correct) => setAns({ ready, correct })}
        />

        {/* feedback + actions */}
        <div className="mt-8">
          {status === 'wrong' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
              <div className="font-semibold text-red-700 text-sm mb-1">Not quite.</div>
              <div className="text-sm text-red-700">
                Correct: <span className="font-mono font-semibold">{correctText(ex)}</span>
              </div>
              {explainOf(ex) && <div className="text-sm text-red-600/80 mt-1">{explainOf(ex)}</div>}
            </div>
          )}
          {status === 'right' && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-4">
              <div className="font-semibold text-green-700 text-sm">Correct! 🎯</div>
              {explainOf(ex) && <div className="text-sm text-green-700/80 mt-1">{explainOf(ex)}</div>}
            </div>
          )}

          {status === 'answering' ? (
            <button
              onClick={check}
              disabled={!ans.ready}
              className={`w-full font-semibold py-3.5 rounded-xl transition-colors ${
                ans.ready ? 'bg-gray-900 hover:bg-black text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              Check
            </button>
          ) : (
            <button
              onClick={advance}
              className={`w-full font-semibold py-3.5 rounded-xl text-white transition-colors ${
                status === 'right' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

// ── helpers for feedback text ─────────────────────────────────────────────────
function correctText(ex: Exercise): string {
  if (ex.type === 'mc') return ex.choices[ex.answer]
  return ex.answer.join(' ')
}
function explainOf(ex: Exercise): string | undefined {
  return ex.explain
}

// ── the exercise renderer (resets per exercise via key) ───────────────────────
function ExerciseView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Exercise
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  if (exercise.type === 'mc') {
    return <MultipleChoiceView exercise={exercise} locked={locked} onChange={onChange} />
  }
  return <TokenView exercise={exercise} locked={locked} onChange={onChange} />
}

function MultipleChoiceView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'mc' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  const [sel, setSel] = useState<number | null>(null)

  function pick(i: number) {
    if (locked) return
    setSel(i)
    onChange(true, i === exercise.answer)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">{exercise.prompt}</h2>
      <div className="space-y-3">
        {exercise.choices.map((c, i) => {
          const isSel = sel === i
          const showCorrect = locked && i === exercise.answer
          const showWrong = locked && isSel && i !== exercise.answer
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={locked}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-colors ${
                showCorrect
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : showWrong
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : isSel
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TokenView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'tokens' | 'spell' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  // pool = correct words + distractors, shuffled deterministically by id
  const pool = useMemo(() => {
    let words: string[]
    if (exercise.type === 'tokens') {
      words = [...exercise.answer, ...(exercise.distractors ?? [])]
    } else {
      // spell: distractors are other phonetic words not already in the answer
      const extras = seededShuffle(
        PHONETIC_WORDS.filter((w) => !exercise.answer.includes(w)),
        exercise.id,
      ).slice(0, 3)
      words = [...exercise.answer, ...extras]
    }
    return seededShuffle(words, exercise.id).map((word, i) => ({ word, key: i }))
  }, [exercise])

  // placed = ordered list of pool keys the user has tapped
  const [placed, setPlaced] = useState<number[]>([])

  function fire(next: number[]) {
    const built = next.map((k) => pool[k].word)
    const correct =
      built.length === exercise.answer.length && built.every((w, i) => w === exercise.answer[i])
    onChange(next.length === exercise.answer.length, correct)
  }

  function add(key: number) {
    if (locked || placed.includes(key)) return
    const next = [...placed, key]
    setPlaced(next)
    fire(next)
  }
  function remove(key: number) {
    if (locked) return
    const next = placed.filter((k) => k !== key)
    setPlaced(next)
    fire(next)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{exercise.prompt}</h2>
      {exercise.type === 'spell' && (
        <div className="font-mono text-2xl tracking-widest text-gray-900 mb-6">{exercise.callsign}</div>
      )}

      {/* answer line */}
      <div className="min-h-[3.5rem] border-b-2 border-gray-200 mb-6 flex flex-wrap gap-2 pb-2">
        {placed.map((key) => (
          <button
            key={key}
            onClick={() => remove(key)}
            disabled={locked}
            className="px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm font-medium shadow-sm"
          >
            {pool[key].word}
          </button>
        ))}
      </div>

      {/* word bank */}
      <div className="flex flex-wrap gap-2">
        {pool.map(({ word, key }) => {
          const used = placed.includes(key)
          return (
            <button
              key={key}
              onClick={() => add(key)}
              disabled={locked || used}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                used
                  ? 'border-gray-100 bg-gray-50 text-gray-300'
                  : 'border-gray-300 bg-white hover:border-gray-500'
              }`}
            >
              {word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
