// Achievement badges (#92) -- computed on the fly from grade history, same
// philosophy as weakspots/readiness: no new persistent "earned at time T"
// state, just a derived fact re-checked from rc_grades every time it's asked.
// Client-safe (no server deps) so both the API route and the profile page
// can import the same canonical definitions -- mirrors ENDORSEMENT_KINDS.
import { scenarios } from './scenarios'
import type { Scenario } from './types'

export interface BadgeDef {
  key: string
  label: string
  description: string
}

export const BADGES: BadgeDef[] = [
  { key: 'first-flight', label: 'First Flight', description: 'Passed your first scenario' },
  { key: 'textbook', label: 'Textbook', description: 'Scored a perfect 100' },
  { key: 'tower-talker', label: 'Tower Talker', description: 'Passed a towered-field (Tower) scenario' },
  { key: 'ground-control', label: 'Ground Control', description: 'Passed a Ground-control scenario' },
  { key: 'ifr-rated', label: 'IFR Rated', description: 'Passed an IFR scenario' },
  { key: 'emergency-ace', label: 'Emergency Ace', description: 'Passed every emergency scenario' },
  { key: 'islander', label: 'Islander', description: 'Passed a Hawaii regional scenario' },
  { key: 'bush-pilot', label: 'Bush Pilot', description: 'Passed an Alaska regional scenario' },
  { key: 'helicopter-qualified', label: 'Helicopter Qualified', description: 'Passed every helicopter scenario' },
  { key: 'frequent-flyer', label: 'Frequent Flyer', description: '25 scenarios graded' },
  { key: 'century-club', label: 'Century Club', description: '100 scenarios graded' },
]

const ALL_EMERGENCY = scenarios.filter((s) => s.phase === 'emergency')
const ALL_HELI = scenarios.filter((s) => s.category === 'helicopter')

export interface BadgeContext {
  /** Distinct scenarios the user has ever PASSED, resolved to full Scenario
   *  objects (an id that no longer resolves -- e.g. a removed scenario -- is
   *  simply dropped by the caller, not something this function needs to know). */
  passedScenarios: Scenario[]
  /** Total graded attempts ever (pass or fail) -- the volume/engagement badges. */
  attempts: number
  /** Has the user ever scored exactly 100 on any attempt. */
  perfectScore: boolean
}

export function computeEarnedBadges(ctx: BadgeContext): Set<string> {
  const passedIds = new Set(ctx.passedScenarios.map((s) => s.id))
  const earned = new Set<string>()
  if (ctx.passedScenarios.length > 0) earned.add('first-flight')
  if (ctx.perfectScore) earned.add('textbook')
  if (ctx.passedScenarios.some((s) => s.facility === 'TOWER')) earned.add('tower-talker')
  if (ctx.passedScenarios.some((s) => s.facility === 'GROUND')) earned.add('ground-control')
  if (ctx.passedScenarios.some((s) => s.phase === 'ifr')) earned.add('ifr-rated')
  if (ctx.passedScenarios.some((s) => s.pack === 'hawaii')) earned.add('islander')
  if (ctx.passedScenarios.some((s) => s.pack === 'alaska')) earned.add('bush-pilot')
  if (ALL_EMERGENCY.length > 0 && ALL_EMERGENCY.every((s) => passedIds.has(s.id))) earned.add('emergency-ace')
  if (ALL_HELI.length > 0 && ALL_HELI.every((s) => passedIds.has(s.id))) earned.add('helicopter-qualified')
  if (ctx.attempts >= 25) earned.add('frequent-flyer')
  if (ctx.attempts >= 100) earned.add('century-club')
  return earned
}
