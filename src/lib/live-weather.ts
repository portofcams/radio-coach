import { runwayPhonetic } from './homefield'
import { pickActiveRunway } from './runway-select'
import { spokenWind, type DecodedMetar, type WindInfo } from './metar'
import {
  spokenCallsign, freqPhonetic, shortName, toDiagramRunways,
  type AirportData, type AirportRunway,
} from './realfield'
import type { Scenario } from './types'

const CALM: WindInfo = { calm: true, dirDeg: null, variable: false, speedKt: 0, gustKt: null, unit: 'KT' }

function activeEndCoords(pick: { runway: AirportRunway; end: 'le' | 'he' }) {
  return pick.end === 'le'
    ? { lat: pick.runway.leLat, lon: pick.runway.leLon, heading: pick.runway.leHdg ?? 0 }
    : { lat: pick.runway.heLat, lon: pick.runway.heLon, heading: pick.runway.heHdg ?? 0 }
}

/**
 * Live-weather variants of the home-field scenario set: same phraseology
 * templates as realfield.ts, but the active runway is picked from today's
 * actual wind (not always the .le end) and the ATC line speaks the real
 * reported wind instead of a hardcoded "wind calm". Wind is never a graded
 * element -- real FAA readback rules don't require it, matching every other
 * scenario in this app -- so only the runway substitution is grading-relevant,
 * and that already flows through the existing verbatim-token grading path.
 */
export function liveWeatherScenarios(field: AirportData, callsign: string | null | undefined, metar: DecodedMetar): Scenario[] {
  const wind = metar.windInfo ?? CALM
  const pick = pickActiveRunway(field.runways, wind.dirDeg, wind.speedKt)
  if (!pick) return []

  const name = field.radioName || shortName(field.name)
  const cs = spokenCallsign(callsign)
  const rwRaw = pick.ident
  const rw = runwayPhonetic(pick.ident)
  const windPhrase = spokenWind(wind)
  const diagramRunways = toDiagramRunways(field.runways)
  const threshold = activeEndCoords(pick)
  const baseDiagram = { name, runways: diagramRunways, taxiways: field.taxiways, activeEnd: rwRaw }
  const wxNote = ' (uses today\'s actual reported wind — not for real-world navigation)'

  if (field.towered && field.freqs.twr) {
    const twr = field.freqs.twr
    const list: Scenario[] = [
      {
        id: 'wx-takeoff', title: `${name} Tower — cleared for takeoff (live wx)`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `You're holding short of runway ${rwRaw} at ${name} (${field.icao}), the wind-favored runway for today's actual reported wind${wxNote}.`,
        atcTransmission: `${cs}, ${name} Tower, ${windPhrase}, runway ${rw}, cleared for takeoff.`,
        requiredElements: ['cleared for takeoff', `runway ${rw}`, 'call sign'],
        correctReadback: `Cleared for takeoff runway ${rw}, ${cs}.`,
        commonMistakes: ['Forgetting to read back the runway', 'Omitting your call sign'],
      },
      {
        id: 'wx-lineup-wait', title: `${name} Tower — line up and wait (live wx)`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `Holding short of runway ${rwRaw} at ${name}, today's wind-favored runway${wxNote}. Traffic is landing — the tower will have you line up and wait.`,
        atcTransmission: `${cs}, ${name} Tower, runway ${rw}, line up and wait.`,
        requiredElements: ['line up and wait', `runway ${rw}`, 'call sign'],
        correctReadback: `Line up and wait runway ${rw}, ${cs}.`,
        commonMistakes: ['Reading it back as a takeoff clearance', 'Dropping the runway'],
      },
      {
        id: 'wx-pattern', title: `${name} Tower — enter the pattern (live wx)`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: baseDiagram,
        setup: `Inbound to ${name}, you've just checked in with ${name} Tower ${twr}${wxNote}.`,
        atcTransmission: `${cs}, ${name} Tower, ${windPhrase}, enter left downwind runway ${rw}.`,
        requiredElements: ['left downwind', `runway ${rw}`, 'call sign'],
        correctReadback: `Enter left downwind runway ${rw}, ${cs}.`,
        commonMistakes: ['Reading back the wrong pattern leg', 'Omitting the runway'],
      },
      {
        id: 'wx-landing', title: `${name} Tower — cleared to land (live wx)`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `On short final for runway ${rwRaw} at ${name}, today's wind-favored runway${wxNote}.`,
        atcTransmission: `${cs}, ${name} Tower, ${windPhrase}, runway ${rw}, cleared to land.`,
        requiredElements: ['cleared to land', `runway ${rw}`, 'call sign'],
        correctReadback: `Cleared to land runway ${rw}, ${cs}.`,
        commonMistakes: ['Not reading back the landing clearance', 'Dropping the runway number'],
      },
      {
        id: 'wx-goaround', title: `${name} Tower — go around (live wx)`,
        phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'TOWER', frequency: twr,
        realField: { ...baseDiagram, ownship: threshold },
        setup: `On short final for runway ${rwRaw} at ${name} when an aircraft taxis onto the runway. Keep it short and fly.`,
        atcTransmission: `${cs}, ${name} Tower, go around, traffic on the runway, make left traffic.`,
        requiredElements: ['going around', 'call sign'],
        correctReadback: `Going around, ${cs}.`,
        commonMistakes: ['Continuing the approach', 'Long-winded readback — fly first, talk second'],
      },
    ]

    // Ground taxi + hold short, same guard as home-ground -- needs a real
    // ground freq and a different physical runway to hold short of.
    const holdShort = field.runways.find((r) => r !== pick.runway)
    if (field.freqs.gnd && holdShort) {
      const hsEnd = holdShort.leHdg != null ? holdShort.le : holdShort.he
      const hsRw = runwayPhonetic(hsEnd)
      list.push({
        id: 'wx-ground', title: `${name} Ground — taxi & hold short (live wx)`,
        phase: 'ground', difficulty: 2, airport: field.icao, facility: 'GROUND', frequency: field.freqs.gnd,
        realField: baseDiagram,
        setup: `Taxiing out at ${name} (${field.icao}) on Ground ${field.freqs.gnd} for today's wind-favored runway${wxNote}. Read back the full taxi instruction AND the hold-short — verbatim, including the runway number.`,
        atcTransmission: `${cs}, ${name} Ground, taxi to runway ${rw}, hold short of runway ${hsRw}.`,
        requiredElements: [`runway ${rw}`, `hold short runway ${hsRw}`, 'call sign'],
        correctReadback: `Taxi to runway ${rw}, hold short runway ${hsRw}, ${cs}.`,
        commonMistakes: ['Dropping the hold-short — the #1 readback DPEs fail you on', 'Saying "hold short" without the runway number', 'Forgetting your call sign'],
      })
    }

    return list
  }

  // Non-towered: CTAF self-announce at the wind-favored runway.
  const ctaf = field.freqs.ctaf || field.freqs.unicom || ''
  const ctafNote = ctaf ? ` on CTAF ${ctaf}` : ''
  return [
    {
      id: 'wx-ctaf-departure', title: `${name} CTAF — departing (live wx)`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: { ...baseDiagram, ownship: threshold },
      setup: `Non-towered ${name} (${field.icao}). You're ready to depart runway ${rwRaw}, today's wind-favored runway${wxNote}${ctafNote}. Make your self-announce call.`,
      atcTransmission: `${name} traffic, Skyhawk Four Five X-ray, ten miles south, inbound full stop, ${name}.`,
      requiredElements: ['departing', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, departing runway ${rw}, ${name}.`,
      commonMistakes: ['Forgetting to state the field name', 'Not announcing the runway'],
    },
    {
      id: 'wx-ctaf-inbound', title: `${name} CTAF — inbound (live wx)`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: baseDiagram,
      setup: `Ten miles out, inbound to non-towered ${name} (${field.icao})${ctafNote}. Today's actual wind favors runway ${rwRaw}${wxNote}. Make your inbound position call.`,
      atcTransmission: `${name} traffic, Cherokee Six Two Mike, left base runway ${rw}, ${name}.`,
      requiredElements: ['inbound', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, ten miles south, inbound landing runway ${rw}, ${name}.`,
      commonMistakes: ['Not stating your distance and direction', 'Omitting the field-name bookend'],
    },
    {
      id: 'wx-ctaf-downwind', title: `${name} CTAF — left downwind (live wx)`,
      phase: 'pattern', difficulty: 2, airport: field.icao, facility: 'CTAF', frequency: ctaf,
      realField: baseDiagram,
      setup: `Flying the pattern at non-towered ${name}, today's wind-favored runway ${rwRaw}${wxNote}. Announce your downwind${ctafNote}.`,
      atcTransmission: `${name} traffic, Cessna Eight Seven Bravo, turning base runway ${rw}, ${name}.`,
      requiredElements: ['left downwind', `runway ${rw}`, 'call sign'],
      correctReadback: `${name} traffic, ${cs}, left downwind runway ${rw}, ${name}.`,
      commonMistakes: ['Omitting the field name at the end', 'Vague position'],
    },
    {
      id: 'wx-ctaf-clear', title: `${name} CTAF — clear of the runway (live wx)`,
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

export function liveWeatherScenario(id: string, field: AirportData, callsign: string | null | undefined, metar: DecodedMetar): Scenario | null {
  return liveWeatherScenarios(field, callsign, metar).find((s) => s.id === id) ?? null
}

/** No-network listing for /train — generic titles only, so browsing the page
 *  never triggers a live METAR fetch. Only opening a specific scenario does. */
export function liveWeatherScenarioStubs(field: AirportData): Array<{ id: string; title: string; facility: string; frequency?: string }> {
  if (field.towered && field.freqs.twr) {
    const twr = field.freqs.twr
    const stubs = [
      { id: 'wx-takeoff', title: 'Tower — cleared for takeoff', facility: 'TOWER', frequency: twr },
      { id: 'wx-lineup-wait', title: 'Tower — line up and wait', facility: 'TOWER', frequency: twr },
      { id: 'wx-pattern', title: 'Tower — enter the pattern', facility: 'TOWER', frequency: twr },
      { id: 'wx-landing', title: 'Tower — cleared to land', facility: 'TOWER', frequency: twr },
      { id: 'wx-goaround', title: 'Tower — go around', facility: 'TOWER', frequency: twr },
    ]
    if (field.freqs.gnd && field.runways.length > 1) {
      stubs.push({ id: 'wx-ground', title: 'Ground — taxi & hold short', facility: 'GROUND', frequency: field.freqs.gnd })
    }
    return stubs
  }
  const ctaf = field.freqs.ctaf || field.freqs.unicom
  return [
    { id: 'wx-ctaf-departure', title: 'CTAF — departing', facility: 'CTAF', frequency: ctaf },
    { id: 'wx-ctaf-inbound', title: 'CTAF — inbound', facility: 'CTAF', frequency: ctaf },
    { id: 'wx-ctaf-downwind', title: 'CTAF — left downwind', facility: 'CTAF', frequency: ctaf },
    { id: 'wx-ctaf-clear', title: 'CTAF — clear of the runway', facility: 'CTAF', frequency: ctaf },
  ]
}
