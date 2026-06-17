import { toPhonetic } from './phonetic'

// ── Ground School: non-AI, deterministic Duolingo-style drills ──────────────
// Every exercise is checkable against a fixed answer key — zero LLM at runtime,
// $0 marginal cost, works offline. AI may author this bank offline, but nothing
// here calls an API.

export interface MultipleChoice {
  type: 'mc'
  id: string
  prompt: string
  choices: string[]
  /** index of the correct choice */
  answer: number
  explain?: string
}

export interface TapTokens {
  type: 'tokens'
  id: string
  prompt: string
  /** correct, ordered sequence of word tiles */
  answer: string[]
  /** extra wrong tiles mixed into the pool */
  distractors?: string[]
  explain?: string
}

export interface SpellCallsign {
  type: 'spell'
  id: string
  prompt: string
  /** the registration to spell, e.g. "N728KT" */
  callsign: string
  /** correct phonetic words in order (frozen for determinism) */
  answer: string[]
  explain?: string
}

export type Exercise = MultipleChoice | TapTokens | SpellCallsign

export interface GsLesson {
  id: string
  title: string
  /** XP awarded for a clean completion */
  xp: number
  exercises: Exercise[]
}

export interface GsUnit {
  id: string
  title: string
  subtitle: string
  icon: string
  /** tailwind accent classes for the unit header */
  color: string
  lessons: GsLesson[]
}

// helper: build a spell exercise straight from a registration
function spell(id: string, callsign: string, explain?: string): SpellCallsign {
  return {
    type: 'spell',
    id,
    prompt: 'Tap the phonetic words in order to spell this call sign.',
    callsign,
    answer: toPhonetic(callsign).split(' '),
    explain,
  }
}

export const units: GsUnit[] = [
  // ── UNIT 1 — PHONETIC ALPHABET ──────────────────────────────────────────
  {
    id: 'phonetics',
    title: 'Phonetic Alphabet',
    subtitle: 'The 26 letters every pilot must spell by ear',
    icon: '🔤',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    lessons: [
      {
        id: 'phon-1',
        title: 'Letters A–M',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'p1-1', prompt: 'What is the phonetic word for the letter C?', choices: ['Charlie', 'Carlo', 'Cobra', 'Coast'], answer: 0 },
          { type: 'mc', id: 'p1-2', prompt: 'What is the phonetic word for the letter G?', choices: ['Gulf', 'Golf', 'George', 'Gamma'], answer: 1, explain: 'It is "Golf" — not "Gulf". A common slip on the radio.' },
          { type: 'mc', id: 'p1-3', prompt: 'Which letter does "Juliett" stand for?', choices: ['G', 'I', 'J', 'Y'], answer: 2 },
          { type: 'mc', id: 'p1-4', prompt: 'What is the phonetic word for the letter K?', choices: ['Kite', 'King', 'Kilo', 'Knox'], answer: 2 },
          { type: 'tokens', id: 'p1-5', prompt: 'Spell "CAB" phonetically.', answer: ['Charlie', 'Alpha', 'Bravo'], distractors: ['Delta', 'Echo'] },
          { type: 'tokens', id: 'p1-6', prompt: 'Spell "FIG" phonetically.', answer: ['Foxtrot', 'India', 'Golf'], distractors: ['Hotel', 'Juliett'] },
        ],
      },
      {
        id: 'phon-2',
        title: 'Letters N–Z',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'p2-1', prompt: 'What is the phonetic word for the letter N?', choices: ['Nectar', 'Nimbus', 'November', 'Niner'], answer: 2, explain: '"Niner" is the number 9, not the letter N. N is "November".' },
          { type: 'mc', id: 'p2-2', prompt: 'What is the phonetic word for the letter R?', choices: ['Romeo', 'Robert', 'Rodeo', 'Ranger'], answer: 0 },
          { type: 'mc', id: 'p2-3', prompt: 'Which letter does "Whiskey" stand for?', choices: ['V', 'W', 'X', 'Y'], answer: 1 },
          { type: 'mc', id: 'p2-4', prompt: 'What is the phonetic word for the letter X?', choices: ['Xerox', 'Xenon', 'X-ray', 'Exit'], answer: 2 },
          { type: 'tokens', id: 'p2-5', prompt: 'Spell "TWA" phonetically.', answer: ['Tango', 'Whiskey', 'Alpha'], distractors: ['Victor', 'Uniform'] },
          { type: 'tokens', id: 'p2-6', prompt: 'Spell "ZQP" phonetically.', answer: ['Zulu', 'Quebec', 'Papa'], distractors: ['Yankee', 'Oscar'] },
        ],
      },
      {
        id: 'phon-3',
        title: 'Spell Your Call Sign',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'p3-1', prompt: 'In a call sign, how do you say the number 9?', choices: ['Nine', 'Niner', 'November', 'Negative'], answer: 1, explain: 'Always "niner" — it keeps 9 from being confused with the German "nein" or a garbled "five".' },
          spell('p3-2', 'N5SU', 'November Five Sierra Uniform. Letters get phonetics; numbers get their spoken name.'),
          spell('p3-3', 'N42TG'),
          spell('p3-4', 'N728KT'),
          spell('p3-5', 'N917AK', 'Note the 9 becomes "Niner".'),
        ],
      },
    ],
  },

  // ── UNIT 2 — AVIATION NUMBERS ───────────────────────────────────────────
  {
    id: 'numbers',
    title: 'Aviation Numbers',
    subtitle: 'Altitudes, headings, frequencies, and squawks — said the FAA way',
    icon: '🔢',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    lessons: [
      {
        id: 'num-1',
        title: 'How Numbers Are Spoken',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'n1-1', prompt: 'How is the number 9 spoken on the radio?', choices: ['Nine', 'Niner', 'Nina', 'Nankow'], answer: 1, explain: 'FAA standard is "niner" to avoid confusion with similar-sounding words.' },
          { type: 'mc', id: 'n1-2', prompt: 'In the frequency 121.9, how do you say the decimal point?', choices: ['decimal', 'point', 'dot', 'period'], answer: 1, explain: 'FAA phraseology uses "point": "one two one point niner".' },
          { type: 'mc', id: 'n1-3', prompt: 'Read back "altimeter 29.92".', choices: ['two niner niner two', 'twenty-nine ninety-two', 'two nine point niner two', 'twenty niner point niner two'], answer: 0, explain: 'Altimeter is read as four separate digits — no "point".' },
          { type: 'mc', id: 'n1-4', prompt: 'How is the frequency 124.7 spoken?', choices: ['one twenty-four point seven', 'twelve forty-seven', 'one two four point seven', 'one hundred twenty four seven'], answer: 2, explain: 'Each digit, then "point", then the digit after.' },
        ],
      },
      {
        id: 'num-2',
        title: 'Altitudes & Headings',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'n2-1', prompt: 'Read back the altitude 5,500.', choices: ['fifty-five hundred', 'five thousand five hundred', 'five five zero zero', 'five point five thousand'], answer: 1, explain: 'Below 18,000 ft: state the thousands and hundreds in full. Never "fifty-five hundred".' },
          { type: 'mc', id: 'n2-2', prompt: 'Read back the altitude 11,000.', choices: ['eleven thousand', 'one one thousand', 'eleven point zero', 'one ten hundred'], answer: 1, explain: 'State each digit of the thousands: "one one thousand".' },
          { type: 'mc', id: 'n2-3', prompt: 'Read back heading 070.', choices: ['heading seventy', 'heading seven', 'heading zero seven zero', 'heading oh seventy'], answer: 2, explain: 'Headings are always three digits, each spoken separately.' },
          { type: 'tokens', id: 'n2-4', prompt: 'Read back: "climb and maintain 8,500".', answer: ['climb', 'and', 'maintain', 'eight', 'thousand', 'five', 'hundred'], distractors: ['eighty-five', 'hundred'] },
          { type: 'tokens', id: 'n2-5', prompt: 'Read back: "fly heading 250".', answer: ['heading', 'two', 'five', 'zero'], distractors: ['two-fifty', 'degrees'] },
        ],
      },
      {
        id: 'num-3',
        title: 'Frequencies & Squawks',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'n3-1', prompt: 'Read back "squawk 4521".', choices: ['forty-five twenty-one', 'four thousand five twenty-one', 'four five two one', 'four-five-two-one thousand'], answer: 2, explain: 'Transponder codes are read digit by digit.' },
          { type: 'mc', id: 'n3-2', prompt: 'Read back "squawk 0342".', choices: ['three forty-two', 'zero three four two', 'oh three forty-two', 'zero thirty-four two'], answer: 1 },
          { type: 'tokens', id: 'n3-3', prompt: 'Read back: "contact tower 118.3".', answer: ['contact', 'tower', 'one', 'one', 'eight', 'point', 'three'], distractors: ['eighteen', 'one-eighteen'] },
          { type: 'tokens', id: 'n3-4', prompt: 'Read back: "squawk 7000".', answer: ['squawk', 'seven', 'zero', 'zero', 'zero'], distractors: ['seven-thousand', 'thousand'] },
          { type: 'tokens', id: 'n3-5', prompt: 'Read back: "departure frequency 125.65".', answer: ['departure', 'one', 'two', 'five', 'point', 'six', 'five'], distractors: ['one-twenty-five', 'sixty-five'] },
        ],
      },
    ],
  },
]

// ── lookups & ordering ──────────────────────────────────────────────────────

/** flat, ordered list of every lesson with its unit — drives unlock logic */
export const orderedLessons: { unit: GsUnit; lesson: GsLesson }[] = units.flatMap(
  (unit) => unit.lessons.map((lesson) => ({ unit, lesson })),
)

export function getLesson(id: string): { unit: GsUnit; lesson: GsLesson } | undefined {
  return orderedLessons.find((x) => x.lesson.id === id)
}

/** id of the lesson immediately before this one (null if first) */
export function previousLessonId(id: string): string | null {
  const i = orderedLessons.findIndex((x) => x.lesson.id === id)
  return i > 0 ? orderedLessons[i - 1].lesson.id : null
}

/** id of the next lesson (null if last) */
export function nextLessonId(id: string): string | null {
  const i = orderedLessons.findIndex((x) => x.lesson.id === id)
  return i >= 0 && i < orderedLessons.length - 1 ? orderedLessons[i + 1].lesson.id : null
}

// ── deterministic shuffle (SSR === CSR, no hydration mismatch) ───────────────

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** stable shuffle seeded by a string — same seed always yields the same order */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rng = mulberry32(hashStr(seed))
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
