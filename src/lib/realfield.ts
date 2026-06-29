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
  /** the name ATC says on the radio, e.g. "Seattle", "Paine" (derived at build time) */
  radioName?: string
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

/** NATO word for a single-letter taxiway id (used only with REAL OSM taxiway refs). */
const NATO: Record<string, string> = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
  G: 'Golf', H: 'Hotel', J: 'Juliet', K: 'Kilo', L: 'Lima', M: 'Mike',
  N: 'November', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
  U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
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
  const name = field.radioName || shortName(field.name)
  const cs = spokenCallsign(callsign)
  const rwRaw = rwy.le
  const rw = runwayPhonetic(rwy.le)
  const diagramRunways = toDiagramRunways(field.runways)
  const threshold = { lat: rwy.leLat, lon: rwy.leLon, heading: rwy.leHdg ?? 0 }
  const baseDiagram = { name, runways: diagramRunways, taxiways: field.taxiways, activeEnd: rwy.le }

  if (field.towered && field.freqs.twr) {
    const twr = field.freqs.twr
    const list: Scenario[] = [
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

    // Clearance Delivery — uses the real departure frequency (read it back!) + a squawk.
    if (field.freqs.appdep) {
      const depSpoken = freqPhonetic(field.freqs.appdep)
      const squawk = 'zero two three four'
      const clncFreq = field.freqs.cld || field.freqs.gnd || twr
      list.push({
        id: 'home-clearance', title: `${name} Clearance — VFR departure`,
        phase: 'departure', difficulty: 3, airport: field.icao,
        facility: field.freqs.cld ? 'CLEARANCE' : 'GROUND', frequency: clncFreq,
        realField: baseDiagram,
        setup: `Picking up a VFR departure clearance at ${name} (${field.icao}) before taxi. Read back the departure frequency and squawk verbatim.`,
        atcTransmission: `${cs}, ${name} Clearance, on departure fly runway heading, maintain VFR at or below three thousand five hundred, departure frequency ${depSpoken}, squawk ${squawk}.`,
        requiredElements: ['runway heading', 'altitude', `departure ${depSpoken}`, `squawk ${squawk}`, 'call sign'],
        correctReadback: `Runway heading, maintain VFR at or below three thousand five hundred, departure ${depSpoken}, squawk ${squawk}, ${cs}.`,
        commonMistakes: ['Not reading back the squawk code', 'Garbling the departure frequency', 'Dropping the altitude restriction'],
      })
    }

    // ATIS — copy the current information letter + altimeter, then check in.
    if (field.freqs.atis) {
      list.push({
        id: 'home-atis', title: `${name} — check in with ATIS`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'APPROACH',
        frequency: field.freqs.appdep || twr,
        realField: baseDiagram,
        setup: `Inbound to ${name}. You've copied the ATIS on ${field.freqs.atis} — information Bravo. ${name} Approach confirms the altimeter.`,
        atcTransmission: `${cs}, ${name} Approach, ${name} altimeter three zero zero one, advise you have information Bravo.`,
        requiredElements: ['altimeter three zero zero one', 'information bravo', 'call sign'],
        correctReadback: `Altimeter three zero zero one, information Bravo, ${cs}.`,
        commonMistakes: ['Not reading back the altimeter', 'Forgetting the information code'],
      })
    }

    // Ground taxi + hold short — the most-failed readback. Built from real data: a
    // ground freq + a real second runway to hold short of. We name a taxiway ONLY
    // when real OSM data gives one (else omit it) — never invent a route.
    const holdShort = field.runways.find((r) => r.le !== rwy.le)
    if (field.freqs.gnd && holdShort) {
      const taxiRef = field.taxiways?.map((t) => t.ref).find((r): r is string => !!r && /^[A-Z]$/.test(r) && !!NATO[r])
      const via = taxiRef ? ` via ${NATO[taxiRef]}` : ''
      const hsRw = runwayPhonetic(holdShort.le)
      list.push({
        id: 'home-ground', title: `${name} Ground — taxi & hold short`,
        phase: 'ground', difficulty: 2, airport: field.icao, facility: 'GROUND', frequency: field.freqs.gnd,
        realField: baseDiagram,
        setup: `Taxiing out at ${name} (${field.icao}) on Ground ${field.freqs.gnd}. Read back the full taxi instruction AND the hold-short — verbatim, including the runway number.`,
        atcTransmission: `${cs}, ${name} Ground, taxi to runway ${rw}${via}, hold short of runway ${hsRw}.`,
        requiredElements: [`runway ${rw}`, ...(via ? [`via ${NATO[taxiRef!]}`] : []), `hold short runway ${hsRw}`, 'call sign'],
        correctReadback: `Taxi to runway ${rw}${via}, hold short runway ${hsRw}, ${cs}.`,
        commonMistakes: ['Dropping the hold-short — the #1 readback DPEs fail you on', 'Saying "hold short" without the runway number', 'Forgetting your call sign'],
      })
    }

    // Departure handoff — Tower sends you to Departure; check in, read back the climb.
    if (field.freqs.appdep) {
      list.push({
        id: 'home-departure', title: `${name} Departure — radar check-in`,
        phase: 'departure', difficulty: 2, airport: field.icao, facility: 'DEPARTURE', frequency: field.freqs.appdep,
        realField: baseDiagram,
        setup: `Just airborne off runway ${rwRaw} at ${name}; Tower says "contact Departure." You check in with your altitude and Departure assigns a climb.`,
        atcTransmission: `${cs}, ${name} Departure, radar contact, climb and maintain four thousand five hundred.`,
        requiredElements: ['climb and maintain', 'four thousand five hundred', 'call sign'],
        correctReadback: `Climb and maintain four thousand five hundred, ${cs}.`,
        commonMistakes: ['Not reading back the assigned altitude', 'Forgetting your call sign'],
      })
    }

    // Go-around — short, urgent, fly-first readback.
    list.push({
      id: 'home-goaround', title: `${name} Tower — go around`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
      realField: { ...baseDiagram, ownship: threshold },
      setup: `On short final for runway ${rwRaw} at ${name} when an aircraft taxis onto the runway. Keep it short and fly.`,
      atcTransmission: `${cs}, ${name} Tower, go around, traffic on the runway, make left traffic.`,
      requiredElements: ['going around', 'call sign'],
      correctReadback: `Going around, ${cs}.`,
      commonMistakes: ['Continuing the approach', 'Long-winded readback — fly first, talk second'],
    })

    return list
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
      id: 'home-ctaf-inbound', title: `${name} CTAF — inbound`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: baseDiagram,
      setup: `Ten miles out, inbound to non-towered ${name} (${field.icao})${ctafNote}. Make your inbound position call so the pattern knows you are coming.`,
      atcTransmission: `${name} traffic, Cherokee Six Two Mike, left base runway ${rw}, ${name}.`,
      requiredElements: ['inbound', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, ten miles south, inbound landing runway ${rw}, ${name}.`,
      commonMistakes: ['Not stating your distance and direction', 'Omitting the field-name bookend'],
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
