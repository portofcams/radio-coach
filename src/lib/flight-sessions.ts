import { CATEGORIES, drillScenariosFor } from './weakspots'
import { getScenario } from './scenarios'
import type { Scenario } from './types'

export interface FlightSession {
  id: string
  title: string
  description: string
  airport: string                 // kept for back-compat (non-chain sessions, single-field checkrides)
  /** set only for a true cross-country chain -- departure/arrival ICAO pair.
   *  Enables the route chip + DEPARTURE/ENROUTE/ARRIVAL stage label in the
   *  player, and is checked by validateChainContinuity below. */
  route?: { departure: string; arrival: string }
  scenarioIds: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** optional oral-quiz preamble -- self-rated Q&A (same bank as /oral) run
   *  before the radio legs. Sessions that omit this skip straight to radio. */
  oralQuestionIds?: string[]
}

export const FLIGHT_SESSIONS: FlightSession[] = [
  {
    id: 'ppl-mock-dpe-full',
    title: 'Private Pilot Mock DPE — Oral + Full Flight',
    description: 'The full checkride experience in one continuous run: examiner questions first, then the whole flight\'s radio work — taxi to landing.',
    airport: 'KPHTO',
    difficulty: 'advanced',
    oralQuestionIds: ['o-atis', 'o-initial-call', 'o-readback', 'o-roger-wilco', 'o-classd', 'o-lineup-wait', 'o-frequency-change', 'o-lostcomms-squawk'],
    scenarioIds: [
      'atis-initial-call',
      'ground-taxi-hold-short',
      'hold-short-critical',
      'class-d-takeoff',
      'departure-turn-instruction',
      'vfr-flight-following-initial',
      'pattern-entry',
      'sequence-traffic-in-sight',
      'cleared-for-option',
    ],
  },
  {
    id: 'ppl-full-vfr-checkride',
    title: 'Private Pilot Checkride — Full VFR Flight',
    description: 'The whole flight, one continuous run: ATIS → taxi → hold short → takeoff → departure → flight following → pattern → sequence → land. Miss a hold-short and you fail, just like the real thing.',
    airport: 'KPHTO',
    difficulty: 'advanced',
    scenarioIds: [
      'atis-initial-call',
      'ground-taxi-hold-short',
      'hold-short-critical',
      'class-d-takeoff',
      'departure-turn-instruction',
      'vfr-flight-following-initial',
      'pattern-entry',
      'sequence-traffic-in-sight',
      'cleared-for-option',
    ],
  },
  {
    id: 'vfr-class-d-pattern',
    title: 'VFR Class D — Full Pattern',
    description: 'ATIS → Ground → Hold short → Takeoff → Pattern → Cleared option',
    airport: 'KPHTO',
    difficulty: 'beginner',
    scenarioIds: [
      'atis-initial-call',
      'ground-taxi-hold-short',
      'hold-short-critical',
      'class-d-takeoff',
      'pattern-entry',
      'cleared-for-option',
    ],
  },
  {
    id: 'cross-country-flight-following',
    title: 'Cross-Country: Paine Field to Seattle',
    description: 'Pushback → taxi & hold short → line up and wait → center handoff → Class Bravo clearance into Seattle → landing, with a go-around curveball on short final.',
    airport: 'KPAE',
    route: { departure: 'KPAE', arrival: 'KSEA' },
    difficulty: 'intermediate',
    scenarioIds: [
      'pushback-approved',
      'hold-short-critical',
      'line-up-wait',
      'center-frequency-change',
      'class-b-clearance',
      'curveball-go-around',
    ],
  },
  {
    id: 'hawaii-interisland-hilo-honolulu',
    title: 'Inter-Island: Hilo to Honolulu',
    description: 'Taxi & hold short → Class Delta takeoff → climb enroute → flight following into Oahu → cleared to land at Honolulu.',
    airport: 'PHTO',
    route: { departure: 'PHTO', arrival: 'PHNL' },
    difficulty: 'intermediate',
    scenarioIds: [
      'ground-taxi-hold-short',
      'class-d-takeoff',
      'climb-to-altitude',
      'vfr-flight-following-initial',
      'phnl-tower-landing-interisland',
    ],
  },
  {
    id: 'ifr-full-approach',
    title: 'IFR — Clearance to Approach',
    description: 'IFR clearance → Squawk → Departure → Approach clearance → Missed approach',
    airport: 'KSEA',
    difficulty: 'advanced',
    scenarioIds: [
      'ifr-clearance',
      'departure-squawk-heading',
      'ifr-approach-clearance',
      'ifr-missed-approach',
      'clearance-void-time',
    ],
  },
  {
    id: 'solo-student-first-flight',
    title: "Solo Student's First Solo",
    description: 'The classic solo sequence — ground taxi, runway entry, takeoff, pattern, landing',
    airport: 'KPHTO',
    difficulty: 'beginner',
    scenarioIds: [
      'atis-initial-call',
      'ground-taxi-hold-short',
      'engine-runup-area',
      'class-d-takeoff',
      'sequence-traffic-in-sight',
      'go-around',
    ],
  },
]

export function getSession(id: string): FlightSession | undefined {
  return FLIGHT_SESSIONS.find((s) => s.id === id)
}

/** Shared by validateChainContinuity and legStages -- length of the leading
 *  ground/departure run and the trailing pattern/ground (landing) run,
 *  neither overlapping the other. */
function chainLegBucket(phases: Array<Scenario['phase']>): { leadLen: number; trailLen: number } {
  let leadLen = 0
  while (leadLen < phases.length && (phases[leadLen] === 'ground' || phases[leadLen] === 'departure')) leadLen++
  let trailLen = 0
  while (trailLen < phases.length - leadLen && (phases[phases.length - 1 - trailLen] === 'pattern' || phases[phases.length - 1 - trailLen] === 'ground')) trailLen++
  return { leadLen, trailLen }
}

/** Per-leg DEPARTURE/ENROUTE/ARRIVAL stage label for the player's header --
 *  bucket by contiguous position (via chainLegBucket), not raw `.phase`,
 *  since 'pattern' phase is reused for both takeoff-pattern and landing-
 *  pattern legs. Returns null legs are indices that never resolved. */
export function legStages(scenarios: Array<Scenario | undefined>): Array<'DEPARTURE' | 'ENROUTE' | 'ARRIVAL' | null> {
  const phases = scenarios.map((s) => s?.phase)
  const { leadLen, trailLen } = chainLegBucket(phases as Array<Scenario['phase']>)
  return scenarios.map((s, i) => {
    if (!s) return null
    if (i < leadLen) return 'DEPARTURE'
    if (i >= scenarios.length - trailLen) return 'ARRIVAL'
    return 'ENROUTE'
  })
}

/**
 * Continuity check for a chain session (only meaningful when `route` is set)
 * -- this is what catches the exact class of bug that shipped in the old
 * cross-country-flight-following content (legs spanning two airports a
 * thousand miles apart, presented as one continuous flight). Enroute/IFR
 * legs are NOT required to match either endpoint's ICAO: procedural.ts's
 * CENTER-kind generator never speaks a facility name for enroute ATC, so
 * the airport tag on an enroute leg is bookkeeping only, not a geography
 * claim -- a naive "every leg matches an endpoint" check would incorrectly
 * reject perfectly good enroute content. Returns human-readable problems;
 * empty array = valid.
 */
export function validateChainContinuity(
  session: FlightSession,
  resolve: (id: string) => Scenario | undefined = getScenario,
): string[] {
  const problems: string[] = []
  if (!session.route) return problems
  const { departure, arrival } = session.route
  if (departure === arrival) problems.push(`route.departure and route.arrival are both ${departure}`)

  const legs = session.scenarioIds.map((id) => ({ id, scenario: resolve(id) }))
  const missing = legs.filter((l) => !l.scenario)
  for (const m of missing) problems.push(`scenario id "${m.id}" does not resolve`)
  if (missing.length) return problems // can't check phase/airport continuity on unresolved legs

  const resolved = legs.map((l) => l.scenario!)
  const { leadLen, trailLen } = chainLegBucket(resolved.map((s) => s.phase))

  for (let i = 0; i < leadLen; i++) {
    if (resolved[i].airport !== departure) {
      problems.push(`leg ${i + 1} (${resolved[i].id}) is ground/departure phase but airport is ${resolved[i].airport}, expected departure ${departure}`)
    }
  }
  for (let i = resolved.length - trailLen; i < resolved.length; i++) {
    if (resolved[i].airport !== arrival) {
      problems.push(`leg ${i + 1} (${resolved[i].id}) is pattern/ground phase but airport is ${resolved[i].airport}, expected arrival ${arrival}`)
    }
  }
  for (let i = leadLen; i < resolved.length - trailLen; i++) {
    if (resolved[i].phase !== 'enroute' && resolved[i].phase !== 'ifr') {
      problems.push(`leg ${i + 1} (${resolved[i].id}) is phase "${resolved[i].phase}" but sits between the departure and arrival legs -- expected enroute or ifr`)
    }
  }

  return problems
}

// Resolve a predefined checkride, OR a dynamic weak-spot drill (`drill-<category>`).
export function getSessionOrDrill(id: string): FlightSession | undefined {
  if (id.startsWith('drill-')) {
    const key = id.slice('drill-'.length)
    const cat = CATEGORIES.find((c) => c.key === key)
    const scenarioIds = drillScenariosFor(key)
    if (!cat || scenarioIds.length === 0) return undefined
    return {
      id,
      title: `${cat.label} — focused drill`,
      description: 'Targeted practice on your weakest area.',
      airport: '',
      difficulty: 'intermediate',
      scenarioIds,
    }
  }
  return getSession(id)
}
