import { toPhonetic } from './phonetic'
import { runwayPhonetic } from './homefield'
import type { Scenario, RealFieldRunway, Taxiway } from './types'

/**
 * Generate accurate scenarios for a pilot's REAL home field, using real
 * frequencies + real runway geometry from OurAirports (public domain). Towered
 * fields → tower readback scenarios; non-towered → CTAF self-announce. Runway
 * layout + ownship come straight from real coordinates, so nothing is fabricated.
 * (No taxiway-level routing — OurAirports has no taxiway data — so we avoid taxi
 * clearances rather than invent taxiway names.)
 */
export interface AirportRunway {
  le: string
  he: string
  leLat: number
  leLon: number
  heLat: number
  heLon: number
  leHdg: number | null
  heHdg: number | null
  length: number | null
  surface: string
}
export interface AirportFreqs {
  twr?: string
  gnd?: string
  cld?: string
  atis?: string
  ctaf?: string
  unicom?: string
  appdep?: string
}
export interface AirportData {
  icao: string
  name: string
  region: string
  country: string
  city: string
  lat: number | null
  lon: number | null
  elev: number | null
  towered: boolean
  freqs: AirportFreqs
  runways: AirportRunway[]
  /** real taxiway geometry (OpenStreetMap), attached server-side when available */
  taxiways?: Taxiway[]
}

function spokenCallsign(callsign?: string | null): string {
  const cs = callsign?.trim().toUpperCase()
  return cs ? toPhonetic(cs) : 'Cessna One Two Three Four Five'
}

/** Speak a frequency: "118.6" → "one one eight point six". */
function freqPhonetic(freq?: string): string {
  if (!freq) return ''
  const DIGIT: Record<string, string> = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'niner',
  }
  return freq.split('').map((c) => (c === '.' ? 'point' : DIGIT[c] ?? c)).filter(Boolean).join(' ')
}

/** Short, friendly tower/field name for radio use (drop "International Airport" etc.). */
function shortName(name: string): string {
  return name
    .replace(/\b(International|Regional|Municipal|Memorial|Field|Airport|Airpark)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || name
}

/** Pick the primary (longest hard-surfaced) runway and its low end as "active". */
function primaryRunway(rwys: AirportRunway[]): AirportRunway | null {
  if (!rwys.length) return null
  const sorted = [...rwys].sort((a, b) => (b.length ?? 0) - (a.length ?? 0))
  return sorted[0]
}

function toDiagramRunways(rwys: AirportRunway[]): RealFieldRunway[] {
  return rwys.map((r) => ({ le: r.le, he: r.he, leLat: r.leLat, leLon: r.leLon, heLat: r.heLat, heLon: r.heLon }))
}

/** Build the home-field scenario set for a real airport. ids are `home-<key>`. */
export function realFieldScenarios(field: AirportData, callsign?: string | null): Scenario[] {
  const rwy = primaryRunway(field.runways)
  if (!rwy) return []
  const name = shortName(field.name)
  const cs = spokenCallsign(callsign)
  const rwRaw = rwy.le
  const rw = runwayPhonetic(rwy.le)
  const diagramRunways = toDiagramRunways(field.runways)
  const threshold = { lat: rwy.leLat, lon: rwy.leLon, heading: rwy.leHdg ?? 0 }
  const baseDiagram = { name, runways: diagramRunways, taxiways: field.taxiways, activeEnd: rwy.le }

  if (field.towered && field.freqs.twr) {
    const twr = field.freqs.twr
    return [
      {
        id: 'home-takeoff', title: `${name} Tower — cleared for takeoff`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `You're holding short of runway ${rwRaw} at ${name} (${field.icao}), ready to depart on ${name} Tower ${twr}.`,
        atcTransmission: `${cs}, ${name} Tower, wind calm, runway ${rw}, cleared for takeoff.`,
        requiredElements: ['cleared for takeoff', `runway ${rw}`, 'call sign'],
        correctReadback: `Cleared for takeoff runway ${rw}, ${cs}.`,
        commonMistakes: ['Forgetting to read back the runway', 'Omitting your call sign'],
      },
      {
        id: 'home-lineup-wait', title: `${name} Tower — line up and wait`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `Holding short of runway ${rwRaw} at ${name}, traffic is landing — the tower will have you line up and wait.`,
        atcTransmission: `${cs}, ${name} Tower, runway ${rw}, line up and wait.`,
        requiredElements: ['line up and wait', `runway ${rw}`, 'call sign'],
        correctReadback: `Line up and wait runway ${rw}, ${cs}.`,
        commonMistakes: ['Reading it back as a takeoff clearance', 'Dropping the runway'],
      },
      {
        id: 'home-pattern', title: `${name} Tower — enter the pattern`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: baseDiagram,
        setup: `Inbound to ${name}, you've just checked in with ${name} Tower ${twr}.`,
        atcTransmission: `${cs}, ${name} Tower, enter left downwind runway ${rw}.`,
        requiredElements: ['left downwind', `runway ${rw}`, 'call sign'],
        correctReadback: `Enter left downwind runway ${rw}, ${cs}.`,
        commonMistakes: ['Reading back the wrong pattern leg', 'Omitting the runway'],
      },
      {
        id: 'home-landing', title: `${name} Tower — cleared to land`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `On short final for runway ${rwRaw} at ${name}.`,
        atcTransmission: `${cs}, ${name} Tower, runway ${rw}, cleared to land.`,
        requiredElements: ['cleared to land', `runway ${rw}`, 'call sign'],
        correctReadback: `Cleared to land runway ${rw}, ${cs}.`,
        commonMistakes: ['Not reading back the landing clearance', 'Dropping the runway number'],
      },
    ]
  }

  // Non-towered: CTAF self-announce. The "transmission" is other traffic on the
  // frequency; the pilot makes their own position call (graded on its elements).
  const ctaf = field.freqs.ctaf || field.freqs.unicom || ''
  const ctafNote = ctaf ? ` on CTAF ${ctaf}` : ''
  return [
    {
      id: 'home-ctaf-departure', title: `${name} CTAF — departing`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: { ...baseDiagram, ownship: threshold },
      setup: `Non-towered ${name} (${field.icao}). You're ready to depart runway ${rwRaw}${ctafNote}. Make your self-announce call.`,
      atcTransmission: `${name} traffic, Skyhawk Four Five X-ray, ten miles south, inbound full stop, ${name}.`,
      requiredElements: ['departing', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, departing runway ${rw}, ${name}.`,
      commonMistakes: ['Forgetting to state the field name', 'Not announcing the runway'],
    },
    {
      id: 'home-ctaf-downwind', title: `${name} CTAF — left downwind`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: baseDiagram,
      setup: `Flying the pattern at non-towered ${name}. Announce your downwind${ctafNote}.`,
      atcTransmission: `${name} traffic, Cessna Eight Seven Bravo, turning base runway ${rw}, ${name}.`,
      requiredElements: ['left downwind', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, left downwind runway ${rw}, ${name}.`,
      commonMistakes: ['Omitting the field name at the end', 'Vague position'],
    },
    {
      id: 'home-ctaf-clear', title: `${name} CTAF — clear of the runway`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: { ...baseDiagram, ownship: threshold },
      setup: `You've just landed and exited runway ${rwRaw} at ${name}. Announce clear${ctafNote}.`,
      atcTransmission: `${name} traffic, Bonanza Three Two Quebec, entering left downwind runway ${rw}, ${name}.`,
      requiredElements: ['clear of', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, clear of runway ${rw}, ${name}.`,
      commonMistakes: ['Not reporting clear so others know the runway is free', 'Omitting call sign'],
    },
  ]
}

export function realFieldScenario(id: string, field: AirportData, callsign?: string | null): Scenario | null {
  return realFieldScenarios(field, callsign).find((s) => s.id === id) ?? null
}
