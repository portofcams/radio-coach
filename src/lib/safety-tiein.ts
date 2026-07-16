import type { GradeResult } from './types'

// "Why this matters" — a one-line, real-world FAA-safety tie-in shown after
// grading a hold-short, runway-crossing, or emergency-stop readback. Static,
// general FAA safety framing only — never a fabricated specific incident or
// an unverifiable numeric claim. Pattern-matched against the already-graded
// GradeResult, same convention as explain.ts/weakspots.ts/rule-grader.ts's
// hold-short check — so this covers every scenario resolver and both
// curveball exchanges with zero new plumbing (the server already swaps
// correctReadback/requiredElements to the curveball's amendment before
// grading).

const HOLD_SHORT_RE = /hold short/i
const RUNWAY_CROSSING_RE = /\bcross(?:ing)?\s+runway\b/i

const HOLD_SHORT_TIEIN =
  'The FAA treats runway incursions as one of its top safety priorities nationwide, and a missed or misread hold-short instruction is consistently the leading cause — exactly what this readback is built to catch.'

const RUNWAY_CROSSING_TIEIN =
  'The FAA treats runway incursions as one of its top safety priorities nationwide, and an unclear runway-crossing readback is one of the most common ways one starts — exactly what this readback is built to catch.'

const STOP_INSTRUCTION_TIEIN =
  'An immediate "stop" instruction from ATC is a last-resort call to prevent a runway incursion already in progress — the FAA treats a fast, correct response here as one of the most safety-critical moments in ground operations.'

export function safetyTieInFor(
  result: Pick<GradeResult, 'correctReadback' | 'elements'>,
): string | null {
  const readback = result.correctReadback.toLowerCase()
  if (HOLD_SHORT_RE.test(readback)) return HOLD_SHORT_TIEIN
  if (RUNWAY_CROSSING_RE.test(readback)) return RUNWAY_CROSSING_TIEIN
  if (result.elements.required.some((e) => e.toLowerCase() === 'stopping')) return STOP_INSTRUCTION_TIEIN
  return null
}
