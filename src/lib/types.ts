export type Phase =
  | 'ground'
  | 'departure'
  | 'pattern'
  | 'enroute'
  | 'ifr'
  | 'emergency'

export type Difficulty = 1 | 2 | 3

export type Role = 'pilot' | 'atc'

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

/**
 * A real-geometry airport diagram drawn from OurAirports/FAA runway endpoint
 * coordinates (public domain). Unlike AirportDiagram (schematic or raster), the
 * runway layout here is true-to-life and the ownship sits at a real threshold —
 * correct by construction, no eyeballing.
 */
export interface RealFieldRunway {
  le: string
  he: string
  leLat: number
  leLon: number
  heLat: number
  heLon: number
}
/** A real taxiway polyline from OpenStreetMap (ref = taxiway letter, e.g. "A"). */
export interface Taxiway {
  ref: string | null
  points: Array<{ lat: number; lon: number }>
}
export interface RealFieldDiagram {
  name: string
  runways: RealFieldRunway[]
  /** real taxiway geometry (OpenStreetMap), drawn beneath the runways */
  taxiways?: Taxiway[]
  /** ownship at a real coordinate (e.g. a runway threshold) + true heading */
  ownship?: { lat: number; lon: number; heading: number }
  /** runway end to highlight, e.g. "27" */
  activeEnd?: string
}

export interface Scenario {
  id: string
  title: string
  phase: Phase
  difficulty: Difficulty
  airport: string
  /** 'pro' scenarios are part of the advanced library — Solo Pilot only */
  tier?: 'pro'
  /** optional track grouping, e.g. the helicopter phraseology set */
  category?: 'helicopter'
  /** optional regional-flavor content tag (marketing/browse grouping). Unlike
   * `category`, a `pack` scenario is NOT excluded from the adaptive picker,
   * duel pool, or Call of the Day — it's ordinary phraseology at a real
   * regional field, not a different aircraft class, so it belongs in the
   * general pool. */
  pack?: 'hawaii' | 'alaska'
  /** optional second exchange: ATC throws an amendment after the first readback */
  curveball?: {
    setup?: string
    atcTransmission: string
    requiredElements: string[]
    correctReadback: string
  }
  /** optional role-reversal content: play the CONTROLLER, not the pilot. Pro-only.
   *  requiredElements/correctInstruction are freshly authored, NOT derived from
   *  the pilot-side fields above -- a controller's correct transmission often
   *  carries more (traffic advisories, sequencing, wind) than a pilot's readback
   *  ever echoes back, so there is no valid mechanical transform from one to the
   *  other. /api/grade/route.ts swaps these into a synthetic scenario object
   *  (same trick already used for `curveball`) before calling the unmodified
   *  gradeReadback() -- the deterministic grader has no direction-specific code. */
  atcMode?: {
    /** the OTHER pilot's initiating call -- played via TTS same as atcTransmission,
     *  but must bypass personalizeText() (a fixed, distinct, scenario-authored
     *  call sign -- the student is the controller in this mode, not that aircraft). */
    pilotCall: string
    /** optional situational framing shown instead of `setup` */
    setup?: string
    requiredElements: string[]
    correctInstruction: string
    commonMistakes?: string[]
  }
  /** Marks the INITIAL exchange as a stepped-on/blocked transmission — a second
   * station keys up over ATC. The FX layer (radio-fx.ts) applies a deterministic
   * mute + party-line overlay regardless of the user's comms-FX preference, and
   * the grader (rule-grader.ts) requires the readback to ask for a repeat rather
   * than a normal readback, as a safety-critical override (same severity tier as
   * hold-short). Pairs naturally with `curveball`: ATC's clean repeat becomes the
   * curveball leg — /api/grade/route.ts strips this flag when resolving that leg
   * so the repeat is graded normally, as an ordinary full readback. */
  steppedOn?: true
  /** optional taxi-diagram schematic, shown on the training screen */
  diagram?: AirportDiagram
  /** optional real-geometry field diagram (drawn from real runway coordinates) */
  realField?: RealFieldDiagram
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
  /** Set only when timing-pressure mode was on and dead air before key-up cost points. */
  paceNote?: string
  /** Proactive, single-line "what would a CFI say" tip — synthesized by
   *  cfiTip() (lib/explain.ts) from elements/phraseologyIssues/scenario.
   *  Populated by BOTH graders (rule and AI), so it's always present. */
  cfiTip: string
  /**
   * Delivery/fluency coaching — optional. Populated only by the AI grader
   * (GRADER_MODE=ai + a funded ANTHROPIC_API_KEY); the $0 rule grader never
   * sets this, so it is absent by default in every environment today.
   * Deliberately does NOT feed into score/passFail — phraseology accuracy
   * and delivery fluency are two separate dimensions, so a nervous-but-
   * correct readback still PASSes. Treat a malformed/missing shape as
   * absent, never assume it's well-formed (it comes from an LLM).
   */
  deliveryNotes?: {
    fillerCount: number
    fillerWords: string[]
    hesitationNote?: string
  }
}
