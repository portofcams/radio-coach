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
    // collapse compounds speech-to-text often splits, so voice readbacks aren't
    // dinged for a transcription quirk (e.g. "take off" → "takeoff").
    .replace(/\btake\s+off\b/g, 'takeoff')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => NUM_WORDS[w] ?? w)
    .filter((w) => w.length > 0)
}

function contentTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !FILLER.has(t))
}

// Does the readback's token multiset contain every token in `need`
// (duplicates must each be matched)?
function multisetContains(readbackTokens: string[], need: string[]): boolean {
  if (need.length === 0) return true
  const pool = [...readbackTokens]
  for (const tk of need) {
    const idx = pool.indexOf(tk)
    if (idx === -1) return false
    pool.splice(idx, 1)
  }
  return true
}

// An element is "present" if every one of its content tokens appears in the
// readback's token multiset.
function elementPresent(element: string, readbackTokens: string[]): boolean {
  return multisetContains(readbackTokens, contentTokens(normalize(element)))
}

// the abstract element "call sign" can't be token-matched — detect a real one
const PHONETIC_SET = new Set([
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
  'india', 'juliett', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar',
  'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey',
  'xray', 'x-ray', 'yankee', 'zulu', 'cessna', 'piper', 'cirrus',
])
function looksLikeCallSign(readback: string, tokens: string[]): boolean {
  if (tokens.some((t) => PHONETIC_SET.has(t))) return true
  // a registration-like token, e.g. n42tg / 4su
  return /\b[a-z]?\d{1,4}[a-z]{1,3}\b/i.test(readback)
}

// Some required elements are abstract placeholders ("aircraft type", "position",
// "altitude") rather than literal phrases — the textbook readback satisfies them
// with a concrete instance the literal token-matcher can't see. These detectors
// recognize a concrete instance, the same way `looksLikeCallSign` does for the
// abstract "call sign" element. They apply ONLY to the abstract forms below;
// elements that carry their own literal content still match verbatim.

const AIRCRAFT_MAKES = new Set([
  'cessna', 'piper', 'cirrus', 'beechcraft', 'beech', 'mooney', 'diamond',
  'boeing', 'airbus', 'bonanza', 'baron', 'cub',
])
const AIRCRAFT_MODELS = new Set([
  'skyhawk', 'skylane', 'stationair', 'archer', 'warrior', 'cherokee', 'arrow',
  'saratoga', 'malibu', 'seventy', 'eighty', 'ninety',
])
// "aircraft type" — a make word plus a model word, or the make stated twice
// (e.g. call sign + type both "Cessna …"); the bare call sign alone has neither.
function aircraftTypePresent(tokens: string[]): boolean {
  const makeCount = tokens.filter((t) => AIRCRAFT_MAKES.has(t)).length
  const hasModel = tokens.some((t) => AIRCRAFT_MODELS.has(t))
  return makeCount >= 1 && (makeCount >= 2 || hasModel)
}

const DIRECTIONS = new Set([
  'north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast',
  'southwest', 'northbound', 'southbound', 'eastbound', 'westbound', 'inbound',
  'outbound',
])
const FIELD_LOCATIONS = new Set([
  'ramp', 'terminal', 'gate', 'apron', 'hangar', 'fbo', 'parking', 'transient',
])
// "position" / "location" / "location on field" — an airborne fix ("five miles
// south of …") or a spot on the field (a ramp, terminal, gate, …).
function positionPresent(tokens: string[]): boolean {
  const hasMiles = tokens.includes('miles') || tokens.includes('mile')
  const hasDir = tokens.some((t) => DIRECTIONS.has(t))
  const hasField = tokens.some((t) => FIELD_LOCATIONS.has(t))
  return (hasMiles && hasDir) || (hasMiles && tokens.includes('of')) || hasField
}

// "altitude" — a spoken altitude ("four thousand five hundred", "six thousand
// feet", a flight level).
function altitudePresent(tokens: string[]): boolean {
  return (
    tokens.includes('thousand') ||
    tokens.includes('hundred') ||
    tokens.includes('feet') ||
    (tokens.includes('flight') && tokens.includes('level'))
  )
}

// Elements written as alternatives — "looking / negative contact", "VFR or IFR"
// — are satisfied by ANY one branch. The " or " split is tightly guarded so
// fixed phraseology like "at or below four thousand" is never broken apart.
function orAlternatives(element: string): string[] | null {
  if (element.includes('/')) {
    const parts = element.split('/').map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) return parts
  }
  if (/^[a-z]+\s+or\s+[a-z]+$/i.test(element.trim())) {
    return element.trim().split(/\s+or\s+/i)
  }
  return null
}

// True if the readback satisfies a single required element — literal phrase,
// categorical placeholder, or an alternatives ("A / B") element.
function elementSatisfied(
  element: string,
  readback: string,
  tokens: string[],
): boolean {
  const alts = orAlternatives(element)
  if (alts) return alts.some((a) => elementSatisfied(a, readback, tokens))

  if (/call\s?sign/i.test(element)) return looksLikeCallSign(readback, tokens)
  if (/aircraft\s*type/i.test(element)) return aircraftTypePresent(tokens)

  const e = element.trim().toLowerCase()
  if (e === 'position' || e === 'location' || e === 'location on field') {
    return positionPresent(tokens)
  }
  if (e === 'altitude') return altitudePresent(tokens)
  if (e === 'position and altitude') {
    return positionPresent(tokens) && altitudePresent(tokens)
  }

  // "altimeter two niner niner two" — pilots read back the digits only, dropping
  // the word "altimeter"; match the digits and ignore the keyword.
  if (/^altimeter\b/i.test(element)) {
    const need = contentTokens(normalize(element)).filter((t) => t !== 'altimeter')
    return multisetContains(tokens, need)
  }

  return elementPresent(element, tokens)
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
    ;(elementSatisfied(el, readback, rbTokens) ? hit : missed).push(el)
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
