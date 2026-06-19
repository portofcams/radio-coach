export type Phase =
  | 'ground'
  | 'departure'
  | 'pattern'
  | 'enroute'
  | 'ifr'
  | 'emergency'

export type Difficulty = 1 | 2 | 3

export type Facility =
  | 'GROUND'
  | 'TOWER'
  | 'APPROACH'
  | 'DEPARTURE'
  | 'CENTER'
  | 'CLEARANCE'
  | 'UNICOM'
  | 'CTAF'

/**
 * A lightweight, NOT-to-scale schematic of the taxi clearance — a concept
 * diagram, not a real airport chart. Scenarios supply only the labels; the
 * <AirportDiagram> component draws a standard layout and highlights the route.
 */
export interface AirportDiagram {
  airport: string
  /** real FAA airport-diagram image (public domain); takes precedence over the schematic */
  chart?: string
  /** ownship position on the real chart — % of image width/height + heading in degrees */
  aircraft?: { x: number; y: number; heading: number }
  kind: 'taxi-hold-short' | 'crossing'
  /** taxiway(s) named in the clearance, e.g. ["Alpha"] or ["Echo", "Alpha"] */
  taxiways: string[]
  /** the runway you are cleared TO (taxi-hold-short) */
  destRunway?: string
  /** the runway you must hold short of (taxi-hold-short) */
  holdShortRunway?: string
  /** the runway being crossed (crossing) */
  crossRunway?: string
}

export interface Scenario {
  id: string
  title: string
  phase: Phase
  difficulty: Difficulty
  airport: string
  /** 'pro' scenarios are part of the advanced library — Solo Pilot only */
  tier?: 'pro'
  /** optional taxi-diagram schematic, shown on the training screen */
  diagram?: AirportDiagram
  /** COM frequency for this facility, e.g. "121.900" */
  frequency?: string
  /** The ATC facility type */
  facility?: Facility
  /** What the student needs to know about the situation before the transmission */
  setup: string
  /** Exactly what ATC says — what plays over ElevenLabs */
  atcTransmission: string
  /** Elements the readback MUST include (used by the grader) */
  requiredElements: string[]
  /** The textbook-correct full readback */
  correctReadback: string
  /** Common mistakes for this scenario — fed to grader for better feedback */
  commonMistakes: string[]
}

export interface GradeResult {
  score: number
  passFail: 'PASS' | 'PARTIAL' | 'FAIL'
  elements: {
    required: string[]
    hit: string[]
    missed: string[]
  }
  phraseologyIssues: string[]
  correctReadback: string
  feedback: string
}
