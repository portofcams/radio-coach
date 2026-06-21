// Listening-comprehension drill: hear a fast ATC call through radio noise,
// type back what was said. Pure ear-training — graded on word accuracy.

export interface ListenCall {
  id: string
  text: string
  context: string
}

export const LISTEN_CALLS: ListenCall[] = [
  { id: 'l1', context: 'Ground', text: 'Cessna Three Four Five, taxi to runway two seven via Alpha, hold short of runway three three.' },
  { id: 'l2', context: 'Tower', text: 'Skyhawk Two One Tango, runway one six left, cleared for takeoff, fly runway heading.' },
  { id: 'l3', context: 'Approach', text: 'Bonanza Five Sierra, radar contact, descend and maintain four thousand five hundred, fly heading zero niner zero.' },
  { id: 'l4', context: 'Tower', text: 'Archer Niner Mike, traffic two o\'clock, three miles, opposite direction, a Cessna at three thousand.' },
  { id: 'l5', context: 'Center', text: 'November Four Five X-ray, contact Seattle Center one three two point four five.' },
  { id: 'l6', context: 'Clearance', text: 'Cessna Three Four Five, cleared to the Reno airport via radar vectors, climb and maintain six thousand, squawk four two one seven.' },
  { id: 'l7', context: 'Tower', text: 'Cherokee Eight Bravo, make right traffic, runway three four, report midfield downwind.' },
  { id: 'l8', context: 'Approach', text: 'Mooney Four Charlie, you are cleared for the ILS runway one six right approach, maintain two thousand until established.' },
  { id: 'l9', context: 'Ground', text: 'Skylane Seven Quebec, give way to the company Boeing on your left, then continue taxi via Bravo.' },
  { id: 'l10', context: 'Tower', text: 'Cessna Three Four Five, line up and wait runway two seven, traffic landing runway three three.' },
  { id: 'l11', context: 'Approach', text: 'Bonanza Five Sierra, reduce speed to one one zero knots, expect the visual approach runway two five.' },
  { id: 'l12', context: 'Center', text: 'Citation Two Two Lima, cross the COSTR intersection at or above one one thousand, mach point seven four.' },
  { id: 'l13', context: 'Tower', text: 'Archer Niner Mike, wind two seven zero at one five, gust two two, runway two seven, cleared to land.' },
  { id: 'l14', context: 'Departure', text: 'Cessna Three Four Five, radar contact, turn left heading one eight zero, resume own navigation.' },
  { id: 'l15', context: 'Ground', text: 'Piper Six Tango, taxi to the ramp via Charlie and Delta, monitor ground point niner.' },
  { id: 'l16', context: 'Tower', text: 'Skyhawk Two One Tango, go around, traffic on the runway, climb and maintain three thousand, fly runway heading.' },
]

export function pickListenCall(seed: number): ListenCall {
  return LISTEN_CALLS[Math.abs(seed) % LISTEN_CALLS.length]
}

/** Word-level accuracy: multiset overlap of normalized words. */
export function scoreListening(said: string, target: string): { pct: number; targetWords: number; matched: number } {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const t = norm(target)
  const pool = norm(said)
  let matched = 0
  for (const w of t) {
    const i = pool.indexOf(w)
    if (i >= 0) { matched++; pool.splice(i, 1) }
  }
  const pct = t.length ? Math.round((100 * matched) / t.length) : 0
  return { pct, targetWords: t.length, matched }
}
