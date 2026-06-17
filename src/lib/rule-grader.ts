import type { GradeResult, Scenario } from './types'

// Deterministic, $0 readback grader — no LLM call. A heuristic, but solid enough
// for the free tier and the Ground School "live-comms taste". The AI grader stays
// available as an opt-in upgrade (GRADER_MODE=ai) for premium-grade nuance.

const NUM_WORDS: Record<string, string> = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', tree: '3', four: '4',
  fower: '4', five: '5', fife: '5', six: '6', seven: '7', eight: '8', ait: '8',
  nine: '9', niner: '9',
}

// filler words that don't carry meaning for element matching
const FILLER = new Set([
  'of', 'the', 'and', 'to', 'at', 'a', 'for', 'on', 'is', 'your', 'you',
  'will', 'please', 'we', 'are', 'be',
])

function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"'’`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => NUM_WORDS[w] ?? w)
    .filter((w) => w.length > 0)
}

function contentTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !FILLER.has(t))
}

// An element is "present" if every one of its content tokens appears in the
// readback's token multiset (duplicates must each be matched).
function elementPresent(element: string, readbackTokens: string[]): boolean {
  const need = contentTokens(normalize(element))
  if (need.length === 0) return true
  const pool = [...readbackTokens]
  for (const tk of need) {
    const idx = pool.indexOf(tk)
    if (idx === -1) return false
    pool.splice(idx, 1)
  }
  return true
}

const BAD_PHRASES: { re: RegExp; label: string }[] = [
  { re: /\bcopy(\s+that)?\b/, label: '"copy" is not a standard readback' },
  { re: /\b10[-\s]?4\b/, label: '"10-4" is CB slang — never in aviation' },
  { re: /\bwill\s+do\b/, label: '"will do" is non-standard' },
  { re: /\bfor\s+sure\b/, label: '"for sure" is informal' },
  { re: /\bno\s+problem\b/, label: '"no problem" is informal' },
  { re: /\broger\s+that\b/, label: '"roger that" — say "roger"' },
]

export function ruleGradeReadback(
  scenario: Scenario,
  readback: string,
  hintUsed?: boolean,
): GradeResult {
  const rbTokens = normalize(readback)
  const required = scenario.requiredElements
  const hit: string[] = []
  const missed: string[] = []
  for (const el of required) {
    ;(elementPresent(el, rbTokens) ? hit : missed).push(el)
  }

  const lower = ' ' + readback.toLowerCase() + ' '
  const phraseologyIssues = BAD_PHRASES.filter((p) => p.re.test(lower)).map((p) => p.label)

  // hold-short is safety-critical: if the textbook readback has it, it's required
  const requiresHoldShort = scenario.correctReadback.toLowerCase().includes('hold short')
  const holdShortViolation = requiresHoldShort && !readback.toLowerCase().includes('hold short')

  let score = 100
  const perMiss = required.length ? Math.round(60 / required.length) : 10
  score -= missed.length * Math.max(10, Math.min(20, perMiss))
  score -= phraseologyIssues.length * 8
  if (hintUsed) score -= 10
  if (holdShortViolation) score = Math.min(score, 40)
  score = Math.max(0, Math.min(100, score))

  let passFail: GradeResult['passFail']
  if (holdShortViolation || score < 70) passFail = 'FAIL'
  else if (score < 90) passFail = 'PARTIAL'
  else passFail = 'PASS'

  let feedback: string
  if (holdShortViolation) {
    feedback = 'You missed the hold-short instruction — safety-critical, and an automatic fail. Read it back verbatim.'
  } else if (missed.length === 0 && phraseologyIssues.length === 0) {
    feedback = 'Clean readback — every required element and standard phraseology. Nicely done.'
  } else if (missed.length > 0) {
    feedback = `Missing ${missed.length} required element${missed.length > 1 ? 's' : ''}. Read back every number and instruction verbatim.`
  } else {
    feedback = 'Watch the non-standard phrasing — keep it to standard phraseology.'
  }

  return {
    score,
    passFail,
    elements: { required, hit, missed },
    phraseologyIssues,
    correctReadback: scenario.correctReadback,
    feedback,
  }
}
