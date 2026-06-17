export type Phase =
  | 'ground'
  | 'departure'
  | 'pattern'
  | 'enroute'
  | 'ifr'

export type Difficulty = 1 | 2 | 3

export interface Scenario {
  id: string
  title: string
  phase: Phase
  difficulty: Difficulty
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
