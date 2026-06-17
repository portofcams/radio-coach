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
import { completeLesson, syncProgress, type GsProgress } from '@/lib/gs-progress'
import { HeartIcon, FlameIcon, CheckIcon, SpeakerIcon } from '@/components/icons'

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
      const p = completeLesson(found.lesson.id, found.lesson.xp)
      setResult(p)
      // sync to server (logged-in) and reflect the merged streak
      syncProgress(p).then(setResult)
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
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center">
            <CheckIcon className="text-3xl" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Lesson complete!</h1>
          <div className="flex items-center justify-center gap-6 my-6">
            <div>
              <div className="text-2xl font-bold text-amber-500">+{found.lesson.xp}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">XP earned</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-orange-500">
                <FlameIcon className="text-2xl" /> {result?.streak ?? 1}
              </div>
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
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center">
            <HeartIcon className="text-3xl" />
          </div>
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
          <div className="flex items-center gap-1.5 text-sm font-semibold text-red-500 tabular-nums">
            <HeartIcon className="text-base" /> {hearts}
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
              <div className="font-semibold text-green-700 text-sm">Correct!</div>
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
  if (ex.type === 'mc' || ex.type === 'listen') return ex.choices[ex.answer]
  if (ex.type === 'spot') return ex.errorIndices.map((i) => ex.words[i]).join(' ')
  if (ex.type === 'match') return ''
  if (ex.type === 'type') return ex.correct
  return ex.answer.join(' ') // tokens, spell, order, scramble
}
function explainOf(ex: Exercise): string | undefined {
  return ex.explain
}

// ── audio: ElevenLabs via /api/tts, free browser-speech fallback ──────────────
async function speak(text: string) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('tts')
    const url = URL.createObjectURL(await res.blob())
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
  } catch {
    // offline / no credits → built-in speech synthesis (free)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.05
      window.speechSynthesis.speak(u)
    }
  }
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
  switch (exercise.type) {
    case 'mc':
      return <MultipleChoiceView exercise={exercise} locked={locked} onChange={onChange} />
    case 'listen':
      return <ListenView exercise={exercise} locked={locked} onChange={onChange} />
    case 'match':
      return <MatchView exercise={exercise} locked={locked} onChange={onChange} />
    case 'spot':
      return <SpotView exercise={exercise} locked={locked} onChange={onChange} />
    case 'order':
      return <OrderView exercise={exercise} locked={locked} onChange={onChange} />
    case 'scramble':
      return <ScrambleView exercise={exercise} locked={locked} onChange={onChange} />
    case 'type':
      return <TypeView exercise={exercise} locked={locked} onChange={onChange} />
    default:
      return <TokenView exercise={exercise} locked={locked} onChange={onChange} />
  }
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

// ── listen-and-select: ElevenLabs ATC voice, pick the right answer ────────────
function ListenView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'listen' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  const [sel, setSel] = useState<number | null>(null)

  // auto-play once when the exercise appears
  useEffect(() => {
    speak(exercise.audioText)
  }, [exercise.id])

  function pick(i: number) {
    if (locked) return
    setSel(i)
    onChange(true, i === exercise.answer)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-5">{exercise.prompt}</h2>
      <button
        onClick={() => speak(exercise.audioText)}
        className="flex items-center gap-3 w-full px-4 py-4 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors mb-6"
      >
        <SpeakerIcon className="text-2xl text-amber-700 shrink-0" />
        <span className="font-medium text-amber-800">Play transmission</span>
        <span className="ml-auto text-xs text-amber-600 font-mono">tap to replay</span>
      </button>
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

// ── match-the-pairs: tap a term, then its meaning ─────────────────────────────
function MatchView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'match' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  const rights = useMemo(
    () => seededShuffle(exercise.pairs.map((p, i) => ({ text: p.right, pair: i })), exercise.id),
    [exercise],
  )
  const [selLeft, setSelLeft] = useState<number | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)

  function tapLeft(i: number) {
    if (locked || matched.includes(i)) return
    setSelLeft(i)
    setWrong(null)
  }
  function tapRight(pair: number) {
    if (locked || matched.includes(pair) || selLeft === null) return
    if (selLeft === pair) {
      const next = [...matched, pair]
      setMatched(next)
      setSelLeft(null)
      if (next.length === exercise.pairs.length) onChange(true, true)
    } else {
      setWrong(pair)
      setSelLeft(null)
      setTimeout(() => setWrong((w) => (w === pair ? null : w)), 450)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">{exercise.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {exercise.pairs.map((p, i) => {
            const done = matched.includes(i)
            const active = selLeft === i
            return (
              <button
                key={i}
                onClick={() => tapLeft(i)}
                disabled={locked || done}
                className={`w-full px-3 py-3 rounded-xl border-2 text-sm text-left transition-colors ${
                  done
                    ? 'border-green-300 bg-green-50 text-green-400'
                    : active
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {p.left}
              </button>
            )
          })}
        </div>
        <div className="space-y-3">
          {rights.map(({ text, pair }) => {
            const done = matched.includes(pair)
            const flash = wrong === pair
            return (
              <button
                key={pair}
                onClick={() => tapRight(pair)}
                disabled={locked || done}
                className={`w-full px-3 py-3 rounded-xl border-2 text-sm text-left transition-colors ${
                  done
                    ? 'border-green-300 bg-green-50 text-green-400'
                    : flash
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── spot-the-error: tap the wrong / out-of-place word(s) ──────────────────────
function SpotView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'spot' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  const [sel, setSel] = useState<number[]>([])

  function toggle(i: number) {
    if (locked) return
    const next = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]
    setSel(next)
    const a = [...next].sort((x, y) => x - y).join(',')
    const b = [...exercise.errorIndices].sort((x, y) => x - y).join(',')
    onChange(next.length > 0, a === b)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">{exercise.prompt}</h2>
      <div className="flex flex-wrap gap-2">
        {exercise.words.map((w, i) => {
          const picked = sel.includes(i)
          const isError = exercise.errorIndices.includes(i)
          const showError = locked && isError
          const showMiss = locked && picked && !isError
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={locked}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                showError
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : showMiss
                    ? 'border-amber-300 bg-amber-50 text-amber-600 line-through'
                    : picked
                      ? 'border-gray-900 bg-gray-100'
                      : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {w}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── shared: tap phrase-chips into the correct order ───────────────────────────
function OrderChips({
  answer,
  seed,
  locked,
  onChange,
}: {
  answer: string[]
  seed: string
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  const pool = useMemo(
    () => seededShuffle(answer.map((phrase, i) => ({ phrase, key: i })), seed),
    [answer, seed],
  )
  const [placed, setPlaced] = useState<number[]>([])

  function fire(next: number[]) {
    const built = next.map((k) => pool[k].phrase)
    const correct = built.length === answer.length && built.every((w, i) => w === answer[i])
    onChange(next.length === answer.length, correct)
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
    <>
      <div className="min-h-[3.5rem] border-b-2 border-gray-200 mb-6 flex flex-wrap gap-2 pb-2">
        {placed.map((key, i) => (
          <button
            key={key}
            onClick={() => remove(key)}
            disabled={locked}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-gray-300 text-sm font-medium shadow-sm"
          >
            <span className="text-xs text-gray-400 font-mono">{i + 1}</span>
            {pool[key].phrase}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {pool.map(({ phrase, key }) => {
          const used = placed.includes(key)
          return (
            <button
              key={key}
              onClick={() => add(key)}
              disabled={locked || used}
              className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                used ? 'border-gray-100 bg-gray-50 text-gray-300' : 'border-gray-300 bg-white hover:border-gray-500'
              }`}
            >
              {phrase}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── order-the-sequence (e.g. CRAFT clearance order) ───────────────────────────
function OrderView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'order' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">{exercise.prompt}</h2>
      <OrderChips answer={exercise.answer} seed={exercise.id} locked={locked} onChange={onChange} />
    </div>
  )
}

// ── audio-scramble: hear it, then rebuild the word order ──────────────────────
function ScrambleView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'scramble' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  useEffect(() => {
    speak(exercise.audioText)
  }, [exercise.id])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-5">{exercise.prompt}</h2>
      <button
        onClick={() => speak(exercise.audioText)}
        className="flex items-center gap-3 w-full px-4 py-4 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors mb-6"
      >
        <SpeakerIcon className="text-2xl text-amber-700 shrink-0" />
        <span className="font-medium text-amber-800">Play transmission</span>
        <span className="ml-auto text-xs text-amber-600 font-mono">tap to replay</span>
      </button>
      <OrderChips answer={exercise.answer} seed={exercise.id} locked={locked} onChange={onChange} />
    </div>
  )
}

// ── type-the-readback (free text, deterministic match — no LLM) ───────────────
const TYPE_NUM: Record<string, string> = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', tree: '3', four: '4', fower: '4',
  five: '5', fife: '5', six: '6', seven: '7', eight: '8', ait: '8', nine: '9', niner: '9',
}
const TYPE_FILLER = new Set(['of', 'the', 'and', 'to', 'at', 'a', 'for', 'on'])
function typeNormalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"'’`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => TYPE_NUM[w] ?? w)
    .filter((w) => w.length > 0)
}
function phraseIn(phrase: string, tokens: string[]): boolean {
  const need = typeNormalize(phrase).filter((t) => !TYPE_FILLER.has(t))
  if (need.length === 0) return true
  const pool = [...tokens]
  for (const tk of need) {
    const idx = pool.indexOf(tk)
    if (idx === -1) return false
    pool.splice(idx, 1)
  }
  return true
}
function TypeView({
  exercise,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: 'type' }>
  locked: boolean
  onChange: (ready: boolean, correct: boolean) => void
}) {
  const [val, setVal] = useState('')

  function update(v: string) {
    setVal(v)
    const toks = typeNormalize(v)
    const allHit = exercise.accept.every((p) => phraseIn(p, toks))
    onChange(v.trim().length > 0, allHit)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-5">{exercise.prompt}</h2>
      <textarea
        value={val}
        onChange={(e) => !locked && update(e.target.value)}
        disabled={locked}
        rows={3}
        placeholder="Type your read-back…"
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 outline-none text-sm resize-none disabled:bg-gray-50"
      />
      <p className="text-xs text-gray-400 mt-2">Type it the way you would say it on the radio — numbers as words is fine.</p>
    </div>
  )
}
