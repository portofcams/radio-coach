'use client'

import { useState } from 'react'
import Link from 'next/link'

// A tiny taste of Ground School — playable right on the landing page, no sign-up.
const QUESTIONS = [
  { q: 'What is the phonetic word for the letter R?', choices: ['Romeo', 'Robert', 'Rodeo', 'Ranger'], answer: 0, note: 'R is "Romeo". Used on every call sign read-back.' },
  { q: 'How do you say the number 9 on the radio?', choices: ['Nine', 'Niner', 'Nina', 'November'], answer: 1, note: 'Always "niner" — so it never gets heard as "five".' },
  { q: 'Read back the altitude 5,500.', choices: ['Fifty-five hundred', 'Five thousand five hundred', 'Five five zero zero'], answer: 1, note: 'Below 18,000 ft you state the thousands and hundreds in full.' },
  { q: 'Which squawk code means a general emergency?', choices: ['7600', '7500', '7700', '1200'], answer: 2, note: '7700 = emergency. 7600 = lost comms, 7500 = hijack.' },
]

export default function LandingMiniDrill() {
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const q = QUESTIONS[qi]
  const answered = picked !== null
  const correct = picked === q.answer

  function next() {
    setQi((i) => (i + 1) % QUESTIONS.length)
    setPicked(null)
  }

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-mono font-bold text-green-600 uppercase tracking-widest">▶ Try one right now</span>
        <span className="ml-auto text-xs text-gray-400 font-mono">no sign-up · {qi + 1}/{QUESTIONS.length}</span>
      </div>
      <h3 className="text-lg font-semibold mb-5">{q.q}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {q.choices.map((c, i) => {
          const showCorrect = answered && i === q.answer
          const showWrong = answered && i === picked && i !== q.answer
          return (
            <button
              key={i}
              onClick={() => !answered && setPicked(i)}
              disabled={answered}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                showCorrect
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : showWrong
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : answered
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-5">
          <div className={`text-sm font-semibold mb-1 ${correct ? 'text-green-600' : 'text-red-600'}`}>
            {correct ? '🎯 Nailed it!' : '😅 Not quite — the green one is right.'}
          </div>
          <p className="text-sm text-gray-500 mb-4">{q.note}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={next} className="text-sm font-medium text-gray-600 hover:text-gray-900 underline underline-offset-4">
              Try another →
            </button>
            <Link
              href="/ground-school"
              className="ml-auto bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Start Ground School free →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
