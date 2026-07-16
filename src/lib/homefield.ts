import { toPhonetic } from './phonetic'
import type { Scenario } from './types'

/**
 * "Home field" personalization (lean / $0 version). The pilot enters their home
 * field's name, tower frequency, and primary runway; we generate accurate
 * listen→readback TOWER pattern scenarios from that — no taxiway/chart guessing,
 * so nothing is fabricated. (The full real-FAA version with taxiways + chart for
 * an arbitrary field is a future build on free FAA NASR data + the d-TPP pipeline.)
 */
export interface HomeField {
  name: string
  tower: string
  runway: string
  /** false = non-towered (CTAF self-announce scenarios). Undefined/true = towered
   *  (unchanged default) -- existing manual-mode rows have no value for this yet. */
  towered?: boolean
}

const DIGITS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'niner',
}
const SUFFIX: Record<string, string> = { L: 'left', R: 'right', C: 'center' }

/** "24" → "two four", "16L" → "one six left", "9" → "niner". */
export function runwayPhonetic(runway: string): string {
  const raw = (runway ?? '').toUpperCase().replace(/[^0-9LRC]/g, '')
  const m = raw.match(/^(\d{1,2})([LRC])?$/)
  if (!m) return runway
  const num = m[1].split('').map((d) => DIGITS[d]).join(' ')
  return m[2] ? `${num} ${SUFFIX[m[2]]}` : num
}

export function homeFieldConfigured(h?: Partial<HomeField> | null): h is HomeField {
  return !!(h && h.name?.trim() && h.tower?.trim() && h.runway?.trim())
}

function spokenCallsign(callsign?: string | null): string {
  const cs = callsign?.trim().toUpperCase()
  return cs ? toPhonetic(cs) : 'Cessna One Two Three Four Five'
}

/** Build the home-field tower-pattern scenario set, with the pilot's callsign baked in. */
export function homeFieldScenarios(h: HomeField, callsign?: string | null): Scenario[] {
  const name = h.name.trim()
  const freq = h.tower.trim()
  const rwRaw = h.runway.trim().toUpperCase()
  const rw = runwayPhonetic(rwRaw)
  const cs = spokenCallsign(callsign)

  if (h.towered === false) {
    const ctafBase = {
      phase: 'pattern' as const,
      airport: '',
      facility: 'CTAF' as const,
      frequency: freq,
      difficulty: 2 as const,
    }
    return [
      {
        ...ctafBase,
        id: 'home-ctaf-departure',
        title: `${name} CTAF — departing`,
        setup: `Non-towered ${name}. Ready to depart runway ${rwRaw} on CTAF ${freq}. Make your self-announce call.`,
        atcTransmission: `${name} traffic, Skyhawk Four Five X-ray, ten miles south, inbound full stop, ${name}.`,
        requiredElements: ['departing', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, departing runway ${rw}, ${name}.`,
        commonMistakes: ['Forgetting to state the field name', 'Not announcing the runway'],
      },
      {
        ...ctafBase,
        id: 'home-ctaf-inbound',
        title: `${name} CTAF — inbound`,
        setup: `Ten miles out from non-towered ${name}, CTAF ${freq}. Make your inbound self-announce.`,
        atcTransmission: `${name} traffic, Cherokee Six Two Mike, left base runway ${rw}, ${name}.`,
        requiredElements: ['inbound', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, ten miles south, inbound landing runway ${rw}, ${name}.`,
        commonMistakes: ['Not stating your distance and direction', 'Omitting the field-name bookend'],
      },
      {
        ...ctafBase,
        id: 'home-ctaf-downwind',
        title: `${name} CTAF — left downwind`,
        setup: `Flying the pattern at non-towered ${name}. Announce your downwind on CTAF ${freq}.`,
        atcTransmission: `${name} traffic, Cessna Eight Seven Bravo, turning base runway ${rw}, ${name}.`,
        requiredElements: ['left downwind', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, left downwind runway ${rw}, ${name}.`,
        commonMistakes: ['Omitting the field name at the end', 'Vague position'],
      },
      {
        ...ctafBase,
        id: 'home-ctaf-clear',
        title: `${name} CTAF — clear of the runway`,
        setup: `You've just landed and exited runway ${rwRaw} at ${name}. Announce clear on CTAF ${freq}.`,
        atcTransmission: `${name} traffic, Bonanza Three Two Quebec, entering left downwind runway ${rw}, ${name}.`,
        requiredElements: ['clear of', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, clear of runway ${rw}, ${name}.`,
        commonMistakes: ['Not reporting clear so others know the runway is free', 'Omitting call sign'],
      },
      {
        ...ctafBase,
        id: 'home-ctaf-entry',
        title: `${name} CTAF — entering the pattern`,
        setup: `Approaching non-towered ${name}, CTAF ${freq}. You're planning to enter on the 45 for left downwind. Announce your entry so traffic already in the pattern knows you're joining.`,
        atcTransmission: `${name} traffic, Cirrus Nine Four Delta, left downwind runway ${rw}, ${name}.`,
        requiredElements: ['entering', 'left downwind', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, entering left downwind, runway ${rw}, ${name}.`,
        commonMistakes: [
          "Joining the pattern without an entry call — traffic already downwind has no idea you're there",
          'Dropping the word "entering," so it sounds like you have been in the pattern all along',
        ],
      },
      {
        ...ctafBase,
        id: 'home-ctaf-sequence',
        title: `${name} CTAF — sequencing behind traffic`,
        setup: `Inbound to non-towered ${name}, CTAF ${freq}. Another aircraft just called left base ahead of you for the same runway. Acknowledge it and sequence yourself in behind.`,
        atcTransmission: `${name} traffic, Cherokee Six Two Mike, left base runway ${rw}, ${name}.`,
        requiredElements: ['traffic in sight/number two', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, traffic in sight, number two, landing runway ${rw}, ${name}.`,
        commonMistakes: [
          'Not acknowledging the traffic ahead of you',
          'Cutting in front of an aircraft already established on the same runway',
        ],
      },
      {
        ...ctafBase,
        id: 'home-ctaf-nordo',
        title: `${name} CTAF — non-radio traffic in the pattern`,
        setup: `Inbound to non-towered ${name}, CTAF ${freq}. Another pilot just advised a glider is working the pattern with no radio — you may not hear it, and it won't hear you. Make a full, unambiguous self-announce and keep looking outside.`,
        atcTransmission: `${name} traffic, be advised, glider in the pattern, no radio, ${name}.`,
        requiredElements: ['position and altitude', 'inbound', `runway ${rw}`, 'call sign'],
        correctReadback: `${name} traffic, ${cs}, five miles south, one thousand five hundred, inbound landing runway ${rw}, ${name}.`,
        commonMistakes: [
          'Assuming a quiet frequency means the pattern is clear',
          'Skipping altitude — non-radio traffic still needs vertical separation from you',
        ],
      },
    ]
  }

  const base = {
    phase: 'pattern' as const,
    airport: '',
    facility: 'TOWER' as const,
    frequency: freq,
    difficulty: 2 as const,
  }

  return [
    {
      ...base,
      id: 'home-takeoff',
      title: `${name} Tower — cleared for takeoff`,
      setup: `You're holding short of runway ${rwRaw} at ${name}, run-up complete and ready to go. ${name} Tower is about to clear you.`,
      atcTransmission: `${cs}, ${name} Tower, wind calm, runway ${rw}, cleared for takeoff.`,
      requiredElements: ['cleared for takeoff', `runway ${rw}`, 'call sign'],
      correctReadback: `Cleared for takeoff runway ${rw}, ${cs}.`,
      commonMistakes: ['Forgetting to read back the runway', 'Omitting your call sign'],
    },
    {
      ...base,
      id: 'home-landing',
      title: `${name} Tower — cleared to land`,
      setup: `You're on the ${name} Tower frequency, established on final for runway ${rwRaw}.`,
      atcTransmission: `${cs}, ${name} Tower, runway ${rw}, cleared to land.`,
      requiredElements: ['cleared to land', `runway ${rw}`, 'call sign'],
      correctReadback: `Cleared to land runway ${rw}, ${cs}.`,
      commonMistakes: ['Not reading back the landing clearance', 'Dropping the runway number'],
    },
    {
      ...base,
      id: 'home-downwind',
      title: `${name} Tower — enter the pattern`,
      setup: `You're inbound to ${name} and just made your initial call to the tower.`,
      atcTransmission: `${cs}, ${name} Tower, enter left downwind runway ${rw}.`,
      requiredElements: ['left downwind', `runway ${rw}`, 'call sign'],
      correctReadback: `Enter left downwind runway ${rw}, ${cs}.`,
      commonMistakes: ['Reading back the wrong pattern leg', 'Omitting the runway'],
    },
    {
      ...base,
      id: 'home-extend-downwind',
      title: `${name} Tower — extend downwind`,
      setup: `You're on left downwind at ${name}, number two for the runway behind traffic on final.`,
      atcTransmission: `${cs}, ${name} Tower, number two for the runway, extend downwind, I'll call your base.`,
      requiredElements: ['extend downwind', 'call sign'],
      correctReadback: `Extend downwind, ${cs}.`,
      commonMistakes: ['Turning base anyway', 'Forgetting your call sign'],
    },
    {
      ...base,
      id: 'home-base',
      title: `${name} Tower — enter base, cleared to land`,
      setup: `You've been extending downwind at ${name}. The tower now turns you in.`,
      atcTransmission: `${cs}, ${name} Tower, enter left base runway ${rw}, cleared to land.`,
      requiredElements: ['left base', `runway ${rw}`, 'cleared to land', 'call sign'],
      correctReadback: `Enter left base runway ${rw}, cleared to land, ${cs}.`,
      commonMistakes: ['Missing the landing clearance buried in the call', 'Dropping the runway'],
    },
    {
      ...base,
      id: 'home-go-around',
      title: `${name} Tower — go around`,
      setup: `You're on short final at ${name} when an aircraft taxis onto the runway.`,
      atcTransmission: `${cs}, ${name} Tower, go around, traffic on the runway, make left traffic.`,
      requiredElements: ['going around', 'call sign'],
      correctReadback: `Going around, ${cs}.`,
      commonMistakes: ['Continuing the approach', 'Long-winded readback — keep it short and fly'],
    },
  ]
}

/** Resolve a single home-* scenario id. */
export function homeFieldScenario(id: string, h: HomeField, callsign?: string | null): Scenario | null {
  return homeFieldScenarios(h, callsign).find((s) => s.id === id) ?? null
}
