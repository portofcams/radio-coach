/**
 * A single "how radio-ready am I?" score, derived from graded scenarios.
 * Deterministic + explainable: recent accuracy + overall pass rate + coverage
 * (how much of the library you've actually passed). $0 — pure arithmetic.
 */
export interface ReadinessInput {
  attempts: number
  passedCount: number
  distinctPassed: number
  recentAvg: number // avg score over the most recent attempts (0–100)
}
export interface Readiness {
  score: number
  level: 'not-ready' | 'almost' | 'ready'
  label: string
  factors: { recentAccuracy: number; passRate: number; coverage: number }
}

/** Distinct scenarios passed for "full coverage". */
export const READINESS_TARGET = 25

export function computeReadiness(input: ReadinessInput): Readiness {
  const { attempts, passedCount, distinctPassed, recentAvg } = input
  if (!attempts) {
    return {
      score: 0,
      level: 'not-ready',
      label: 'Just getting started',
      factors: { recentAccuracy: 0, passRate: 0, coverage: 0 },
    }
  }
  const recentAccuracy = Math.max(0, Math.min(100, Math.round(recentAvg)))
  const passRate = Math.round((passedCount / attempts) * 100)
  const coverage = Math.min(100, Math.round((distinctPassed / READINESS_TARGET) * 100))

  const score = Math.max(0, Math.min(100, Math.round(0.45 * recentAccuracy + 0.15 * passRate + 0.40 * coverage)))
  const level: Readiness['level'] = score >= 85 ? 'ready' : score >= 60 ? 'almost' : 'not-ready'
  const label = level === 'ready' ? 'Checkride ready' : level === 'almost' ? 'Almost checkride ready' : 'Keep practicing'

  return { score, level, label, factors: { recentAccuracy, passRate, coverage } }
}
