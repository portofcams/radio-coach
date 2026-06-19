import { CATEGORIES, drillScenariosFor } from './weakspots'

export interface FlightSession {
  id: string
  title: string
  description: string
  airport: string
  scenarioIds: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const FLIGHT_SESSIONS: FlightSession[] = [
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
    title: 'Cross-Country with Flight Following',
    description: 'Departure → VFR flight following → Frequency change → Class C entry → Descent',
    airport: 'KPAE',
    difficulty: 'intermediate',
    scenarioIds: [
      'class-d-takeoff',
      'vfr-flight-following-initial',
      'flight-following-squawk',
      'frequency-change',
      'class-c-entry',
      'descent-and-maintain',
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
