// Example radio calls FOR operating at a single field (departing + arriving),
// built from the real towered status + frequencies. SERVER-ONLY (airport table).
import type { AirportData } from './realfield'

export interface CallBlock {
  phase: string
  facility: string
  freq?: string
  calls: string[]
}

const CS = 'Cessna One Two Three Four Five'

function rname(a: AirportData): string {
  return (a as { radioName?: string }).radioName || a.name
}
function rwy(a: AirportData): string {
  return a.runways[0]?.le || 'the active'
}

/** Departing + arriving call blocks for this field. */
export function airportCalls(a: AirportData): { departing: CallBlock[]; arriving: CallBlock[] } {
  const n = rname(a)
  const r = rwy(a)
  const departing: CallBlock[] = []
  const arriving: CallBlock[] = []

  if (a.towered) {
    if (a.freqs.atis) departing.push({ phase: 'Listen to ATIS', facility: 'ATIS', freq: a.freqs.atis, calls: [`Copy the weather and information letter before you call.`] })
    if (a.freqs.cld) departing.push({ phase: 'Clearance', facility: 'CLEARANCE', freq: a.freqs.cld, calls: [`${n} Clearance, ${CS}, VFR departure to the [direction], request frequencies.`] })
    if (a.freqs.gnd) departing.push({ phase: 'Taxi', facility: 'GROUND', freq: a.freqs.gnd, calls: [`${n} Ground, ${CS}, at the ramp, taxi for departure with information [X].`] })
    if (a.freqs.twr) departing.push({ phase: 'Takeoff', facility: 'TOWER', freq: a.freqs.twr, calls: [`${n} Tower, ${CS}, holding short runway ${r}, ready for departure.`, `Read back: "Cleared for takeoff runway ${r}, ${CS}."`] })

    if (a.freqs.atis) arriving.push({ phase: 'Listen to ATIS', facility: 'ATIS', freq: a.freqs.atis, calls: [`Get the current information letter before your inbound call.`] })
    if (a.freqs.appdep) arriving.push({ phase: 'Approach', facility: 'APPROACH', freq: a.freqs.appdep, calls: [`${n} Approach, ${CS}, [position], inbound landing, with information [X].`] })
    if (a.freqs.twr) arriving.push({ phase: 'Landing', facility: 'TOWER', freq: a.freqs.twr, calls: [`${n} Tower, ${CS}, [position], inbound.`, `Read back: "Cleared to land runway ${r}, ${CS}."`] })
    if (a.freqs.gnd) arriving.push({ phase: 'Taxi in', facility: 'GROUND', freq: a.freqs.gnd, calls: [`Clear of the runway: "${n} Ground, ${CS}, clear of ${r}, taxi to parking."`] })
  } else {
    const ctaf = a.freqs.ctaf || a.freqs.unicom || '122.900'
    departing.push({ phase: 'Taxi (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`${n} traffic, ${CS}, taxiing to runway ${r}, ${n}.`] })
    departing.push({ phase: 'Departing (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`${n} traffic, ${CS}, departing runway ${r}, departing the pattern to the [direction], ${n}.`] })
    arriving.push({ phase: 'Inbound (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`${n} traffic, ${CS}, one zero miles [direction], inbound landing, ${n}.`] })
    arriving.push({ phase: 'Pattern (CTAF)', facility: 'CTAF', freq: ctaf, calls: [`Each leg: "${n} traffic, ${CS}, [downwind/base/final] runway ${r}, ${n}."`, `Clear of runway: "${n} traffic, ${CS}, clear of runway ${r}, ${n}."`] })
  }
  return { departing, arriving }
}
