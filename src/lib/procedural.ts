import { toPhonetic } from './phonetic'
import { runwayPhonetic } from './homefield'
import type { Scenario, Facility } from './types'

/**
 * Endless practice: deterministically generate a Scenario from an integer seed
 * (id `gen-<seed>`). Pure templates + parameter pools — $0, no LLM. Client and
 * server generate the identical scenario from the same seed, so grading works
 * without persisting anything. Every template self-grades PASS on its readback.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIELDS = ['Springfield', 'Lincoln', 'Riverside', 'Madison', 'Clinton', 'Fairview', 'Georgetown', 'Salem', 'Auburn', 'Bristol']
const RUNWAYS = ['06', '24', '18', '36', '09', '27', '13', '31', '16L', '34R', '10', '28']
const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner']
const ALTS = ['three thousand', 'four thousand five hundred', 'five thousand five hundred', 'six thousand', 'eight thousand']

function freqPhonetic(rng: () => number): string {
  // 118.000–135.975 region, spoken
  const whole = 118 + Math.floor(rng() * 18)
  const dec = Math.floor(rng() * 40) * 25 // .000/.025/.../.975
  const s = `${whole}.${String(dec).padStart(3, '0')}`.replace(/0+$/, '').replace(/\.$/, '.0')
  return s.split('').map((c) => (c === '.' ? 'point' : DIGITS[parseInt(c)] ?? c)).join(' ')
}
function squawk(rng: () => number): string {
  return Array.from({ length: 4 }, () => DIGITS[Math.floor(rng() * 8)]).join(' ') // octal 0-7
}
function genCallsign(rng: () => number): string {
  const L = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  let cs = 'N' + (1 + Math.floor(rng() * 8)) + Math.floor(rng() * 10)
  cs += L[Math.floor(rng() * L.length)] + L[Math.floor(rng() * L.length)]
  return toPhonetic(cs)
}
const pick = <T>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)]

export function generateScenario(seed: number): Scenario {
  const rng = mulberry32(seed)
  const cs = genCallsign(rng)
  const field = pick(rng, FIELDS)
  const rwRaw = pick(rng, RUNWAYS)
  const rw = runwayPhonetic(rwRaw)
  const base = { id: `gen-${seed}`, phase: 'pattern' as const, difficulty: 2 as const, airport: '', commonMistakes: [] }
  const kind = Math.floor(rng() * 6)

  if (kind === 0) return {
    ...base, title: `${field} Tower — cleared for takeoff`, facility: 'TOWER' as Facility,
    setup: `Holding short of runway ${rwRaw} at ${field}, ready to go.`,
    atcTransmission: `${cs}, ${field} Tower, wind calm, runway ${rw}, cleared for takeoff.`,
    requiredElements: ['cleared for takeoff', `runway ${rw}`, 'call sign'],
    correctReadback: `Cleared for takeoff runway ${rw}, ${cs}.`,
  }
  if (kind === 1) return {
    ...base, title: `${field} Tower — cleared to land`, facility: 'TOWER' as Facility,
    setup: `On final for runway ${rwRaw} at ${field}.`,
    atcTransmission: `${cs}, ${field} Tower, runway ${rw}, cleared to land.`,
    requiredElements: ['cleared to land', `runway ${rw}`, 'call sign'],
    correctReadback: `Cleared to land runway ${rw}, ${cs}.`,
  }
  if (kind === 2) {
    const side = rng() < 0.5 ? 'left' : 'right'
    return {
      ...base, title: `${field} Tower — enter the pattern`, facility: 'TOWER' as Facility,
      setup: `Inbound to ${field}, just checked in with the tower.`,
      atcTransmission: `${cs}, ${field} Tower, enter ${side} downwind runway ${rw}.`,
      requiredElements: [`${side} downwind`, `runway ${rw}`, 'call sign'],
      correctReadback: `Enter ${side} downwind runway ${rw}, ${cs}.`,
    }
  }
  if (kind === 3) {
    const f = freqPhonetic(rng)
    return {
      ...base, title: `${field} Tower — frequency change`, facility: 'TOWER' as Facility,
      setup: `Departing ${field}, the tower hands you off.`,
      atcTransmission: `${cs}, ${field} Tower, contact Departure ${f}.`,
      requiredElements: ['contact departure', f, 'call sign'],
      correctReadback: `Contact Departure ${f}, ${cs}.`,
    }
  }
  if (kind === 4) {
    const sq = squawk(rng)
    return {
      ...base, title: `${field} Approach — squawk`, facility: 'APPROACH' as Facility,
      setup: `Radar contact with ${field} Approach.`,
      atcTransmission: `${cs}, ${field} Approach, squawk ${sq}.`,
      requiredElements: [`squawk ${sq}`, 'call sign'],
      correctReadback: `Squawk ${sq}, ${cs}.`,
    }
  }
  const alt = pick(rng, ALTS)
  return {
    ...base, title: `${field} Center — altitude`, facility: 'CENTER' as Facility,
    setup: `Enroute, working ${field} Center.`,
    atcTransmission: `${cs}, climb and maintain ${alt}.`,
    requiredElements: ['climb and maintain', 'altitude', 'call sign'],
    correctReadback: `Climb and maintain ${alt}, ${cs}.`,
  }
}
