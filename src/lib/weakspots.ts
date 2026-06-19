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
 * From a user's graded scenarios, compute how often they miss each category
 * (misses ÷ opportunities). Needs ≥3 opportunities to count, ranked worst-first.
 */
export function computeWeakspots(
  grades: { scenario_id: string; missed_elements: string[] }[],
): WeakSpot[] {
  const opp: Record<string, number> = {}
  const miss: Record<string, number> = {}
  for (const g of grades) {
    const sc = getScenario(g.scenario_id)
    if (!sc) continue
    for (const c of catsOf(sc.requiredElements)) opp[c] = (opp[c] ?? 0) + 1
    for (const c of catsOf(g.missed_elements ?? [])) miss[c] = (miss[c] ?? 0) + 1
  }
  return CATEGORIES.map((c) => {
    const o = opp[c.key] ?? 0
    const m = miss[c.key] ?? 0
    return { key: c.key, label: c.label, tip: c.tip, opportunities: o, misses: m, rate: o ? m / o : 0 }
  })
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
