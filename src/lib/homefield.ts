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
