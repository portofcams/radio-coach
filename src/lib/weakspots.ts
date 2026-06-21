import { scenarios, getScenario } from './scenarios'

// Categories of radio elements, in priority order (first match wins, so
// "hold short runway 26" counts as a hold-short, not a runway).
export interface Category {
  key: string
  label: string
  match: RegExp
  /** short coaching line shown with the weak spot */
  tip: string
}

export const CATEGORIES: Category[] = [
  { key: 'hold-short', label: 'Hold-short instructions', match: /hold short/i, tip: 'A missed hold-short is the #1 cause of a runway incursion — read it back verbatim, every time.' },
  { key: 'frequency', label: 'Frequencies', match: /\bpoint\b|frequency|contact (tower|ground|departure|center|approach)/i, tip: 'Say each digit, then "point": "one one eight point three".' },
  { key: 'squawk', label: 'Squawk codes', match: /squawk/i, tip: 'Read transponder codes digit by digit — "four five two one", never "forty-five twenty-one".' },
  { key: 'altitude', label: 'Altitudes', match: /thousand|hundred/i, tip: 'State altitudes in full — "five thousand five hundred", not "fifty-five hundred".' },
  { key: 'runway', label: 'Runway assignments', match: /runway|cross runway/i, tip: 'Read the runway with its L/R/C designator, and the word "runway".' },
  { key: 'callsign', label: 'Call sign', match: /call ?sign/i, tip: 'Close every transmission with your call sign.' },
  { key: 'heading', label: 'Headings', match: /heading/i, tip: 'Headings are three digits, each spoken separately — "heading zero seven zero".' },
]

function catOf(el: string): string | null {
  for (const c of CATEGORIES) if (c.match.test(el)) return c.key
  return null
}
function catsOf(elements: string[]): Set<string> {
  const out = new Set<string>()
  for (const el of elements) {
    const k = catOf(el)
    if (k) out.add(k)
  }
  return out
}

export interface WeakSpot {
  key: string
  label: string
  tip: string
  opportunities: number
  misses: number
  rate: number // 0..1
}

/**
 * From a user's graded scenarios (NEWEST FIRST), compute how often they miss
 * each category — spaced-repetition style: recent attempts count more (weight
 * decays with age). Needs ≥3 real opportunities to count; ranked by the
 * recency-weighted miss rate, worst-first.
 */
const DECAY = 0.95 // ~13-grade half-life

export function computeWeakspots(
  grades: { scenario_id: string; missed_elements: string[] }[],
): WeakSpot[] {
  const wOpp: Record<string, number> = {} // recency-weighted
  const wMiss: Record<string, number> = {}
  const rawOpp: Record<string, number> = {} // unweighted count (for the ≥3 gate)
  const rawMiss: Record<string, number> = {}
  grades.forEach((g, i) => {
    const sc = getScenario(g.scenario_id)
    if (!sc) return
    const w = Math.pow(DECAY, i)
    for (const c of catsOf(sc.requiredElements)) { wOpp[c] = (wOpp[c] ?? 0) + w; rawOpp[c] = (rawOpp[c] ?? 0) + 1 }
    for (const c of catsOf(g.missed_elements ?? [])) { wMiss[c] = (wMiss[c] ?? 0) + w; rawMiss[c] = (rawMiss[c] ?? 0) + 1 }
  })
  return CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    tip: c.tip,
    opportunities: rawOpp[c.key] ?? 0,
    misses: rawMiss[c.key] ?? 0,
    rate: wOpp[c.key] ? (wMiss[c.key] ?? 0) / wOpp[c.key] : 0, // recency-weighted rate
  }))
    .filter((w) => w.opportunities >= 3 && w.misses > 0)
    .sort((a, b) => b.rate - a.rate)
}

/** Scenario IDs that exercise a category — the targeted drill set. */
export function drillScenariosFor(key: string, limit = 6): string[] {
  const cat = CATEGORIES.find((c) => c.key === key)
  if (!cat) return []
  return scenarios
    .filter((s) => s.requiredElements.some((e) => cat.match.test(e)))
    .slice(0, limit)
    .map((s) => s.id)
}
