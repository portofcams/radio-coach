import { toPhonetic } from './phonetic'
import type { Scenario } from './types'

/**
 * Every scenario is authored with one canned training callsign. When a pilot
 * saves their real N-number we swap it in everywhere it's spoken or shown, so
 * the ATC voice calls THEIR aircraft. Grading is unaffected: the rule grader
 * treats "call sign" as a generic element (any phonetic / N-number counts), so
 * the server keeps grading against the canonical scenario.
 */
const CANON_CALLSIGN = 'Cessna One Two Three Four Five'

/** Replace the canned training callsign in any spoken/displayed text. */
export function personalizeText(text: string, callsign?: string | null): string {
  if (!text || !callsign) return text
  const spoken = toPhonetic(callsign.trim().toUpperCase())
  if (!spoken) return text
  return text.split(CANON_CALLSIGN).join(spoken)
}

/** Personalize the fields a pilot actually hears/reads (transmission + readback). */
export function personalizeScenario(scenario: Scenario, callsign?: string | null): Scenario {
  if (!callsign) return scenario
  return {
    ...scenario,
    atcTransmission: personalizeText(scenario.atcTransmission, callsign),
    correctReadback: personalizeText(scenario.correctReadback, callsign),
  }
}
