// Flight radio-brief generator. Given a departure + destination ICAO, builds the
// expected sequence of radio calls for the flight using the REAL field data
// (towered status + actual frequencies). SERVER-ONLY (imports the airport table).
import { lookupAirport } from './airports'
import type { AirportData } from './realfield'

export interface BriefStep {
  phase: string
  facility: string
  freq?: string
  calls: string[]
}
export interface Brief {
  ok: boolean
  error?: string
  dep?: { icao: string; name: string; towered: boolean }
  dest?: { icao: string; name: string; towered: boolean }
  callsign: string
  steps: BriefStep[]
}

function rname(a: AirportData): string {
  return (a as { radioName?: string }).radioName || a.name
}
function rwy(a: AirportData): string {
  return a.runways[0]?.le || 'the active'
}

export function generateBrief(depId: string, destId: string, callsignRaw?: string): Brief {
  const cs = (callsignRaw || '').trim() || 'Cessna One Two Three Four Five'
  const dep = lookupAirport(depId)
  const dest = lookupAirport(destId)
  if (!dep || !dest) {
    return { ok: false, error: !dep && !dest ? 'Both airports not found' : !dep ? `Departure ${depId} not found` : `Destination ${destId} not found`, callsign: cs, steps: [] }
  }

  const steps: BriefStep[] = []
  const dn = rname(dep), dr = rwy(dep)

  // --- Departure field ---
  if (dep.towered) {
    if (dep.freqs.atis) steps.push({ phase: 'Before taxi', facility: 'ATIS', freq: dep.freqs.atis, calls: [`Listen to ${dn} ATIS — copy the weather and the information letter (e.g. "information Bravo").`] })
    if (dep.freqs.cld) steps.push({ phase: 'Clearance', facility: 'CLEARANCE', freq: dep.freqs.cld, calls: [`${dn} Clearance, ${cs}, VFR to ${rname(dest)}, request departure.`] })
    if (dep.freqs.gnd) steps.push({ phase: 'Taxi', facility: 'GROUND', freq: dep.freqs.gnd, calls: [`${dn} Ground, ${cs}, at the ramp, taxi for departure, with information [X].`, `Read back the taxi route and any hold-short, e.g. "Taxi to runway ${dr} via Alpha, hold short runway XX, ${cs}."`] })
    if (dep.freqs.twr) steps.push({ phase: 'Takeoff', facility: 'TOWER', freq: dep.freqs.twr, calls: [`${dn} Tower, ${cs}, holding short runway ${dr}, ready for departure.`, `Read back the clearance: "Cleared for takeoff runway ${dr}, ${cs}."`] })
    if (dep.freqs.appdep) steps.push({ phase: 'After departure', facility: 'DEPARTURE', freq: dep.freqs.appdep, calls: [`If handed off: "${dn} Departure, ${cs}, [altitude]."`] })
  } else {
    const ctaf = dep.freqs.ctaf || dep.freqs.unicom || '122.900'
    steps.push({ phase: 'Taxi (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`${dn} traffic, ${cs}, taxiing to runway ${dr}, ${dn}.`] })
    steps.push({ phase: 'Departure (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`${dn} traffic, ${cs}, departing runway ${dr}, departing the pattern to the [direction], ${dn}.`] })
  }

  // --- En route ---
  steps.push({ phase: 'En route', facility: 'APPROACH', calls: [`Request VFR flight following from the appropriate Approach/Center facility for traffic advisories: "[Facility] Approach, ${cs}, [position], [altitude], request flight following to ${rname(dest)}."`] })

  // --- Destination field ---
  const en = rname(dest), er = rwy(dest)
  if (dest.towered) {
    if (dest.freqs.atis) steps.push({ phase: 'Arrival', facility: 'ATIS', freq: dest.freqs.atis, calls: [`Listen to ${en} ATIS before your inbound call — copy the information letter.`] })
    if (dest.freqs.appdep) steps.push({ phase: 'Approach', facility: 'APPROACH', freq: dest.freqs.appdep, calls: [`${en} Approach, ${cs}, [position], inbound for landing, with information [X].`] })
    if (dest.freqs.twr) steps.push({ phase: 'Landing', facility: 'TOWER', freq: dest.freqs.twr, calls: [`${en} Tower, ${cs}, [position], inbound.`, `Read back: "Cleared to land runway ${er}, ${cs}."`] })
    if (dest.freqs.gnd) steps.push({ phase: 'After landing', facility: 'GROUND', freq: dest.freqs.gnd, calls: [`Clear of the runway, switch to ${en} Ground ${dest.freqs.gnd} to taxi to parking.`] })
  } else {
    const ctaf = dest.freqs.ctaf || dest.freqs.unicom || '122.900'
    steps.push({ phase: 'Inbound (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`${en} traffic, ${cs}, one zero miles [direction], inbound landing, ${en}.`] })
    steps.push({ phase: 'Pattern (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`Announce each leg: "${en} traffic, ${cs}, [downwind/base/final] runway ${er}, ${en}."`, `Clear of the runway: "${en} traffic, ${cs}, clear of runway ${er}, ${en}."`] })
  }

  return {
    ok: true,
    dep: { icao: dep.icao, name: dn, towered: dep.towered },
    dest: { icao: dest.icao, name: en, towered: dest.towered },
    callsign: cs,
    steps,
  }
}
