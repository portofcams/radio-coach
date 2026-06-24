// Phraseology glossary — plain-English definitions of the radio terms a student
// pilot hears. SEO + reference. Definitions are AIM-aligned (Chapter 4 / Pilot-
// Controller Glossary) but written for a beginner.

export interface GlossaryTerm {
  term: string
  slug: string
  def: string
}

const raw: Array<[string, string]> = [
  ['Acknowledge', 'Let ATC know you received and understood the message. A readback acknowledges; "roger" acknowledges receipt only.'],
  ['Affirmative', 'Yes. Say "affirmative," not "affirm-itive" with extra syllables, and never just "yeah."'],
  ['Air taxi', 'Helicopter movement above the surface (usually below 100 ft AGL) at speeds over about 20 knots — faster than a hover taxi.'],
  ['Altimeter setting', 'The local barometric pressure (e.g. "two niner niner two") you set so your altimeter reads true altitude. Read it back digit by digit.'],
  ['Approach', 'A radar facility (e.g. "Norcal Approach") that sequences and separates arriving and departing traffic near busier airports.'],
  ['ATIS', 'Automatic Terminal Information Service — a recorded loop of weather and airport info, labeled by letter ("information Bravo"). Listen before you call.'],
  ['Base leg', 'The pattern leg flown perpendicular to the runway, connecting downwind to final.'],
  ['Cleared for takeoff', 'Authorization to depart on the specified runway. Always read it back with the runway and your call sign.'],
  ['Cleared to land', 'Authorization to land on the specified runway. Read back the runway and your call sign.'],
  ['CTAF', 'Common Traffic Advisory Frequency — the shared frequency pilots self-announce on at non-towered airports.'],
  ['Class B', 'Airspace around the busiest airports. You need an explicit "cleared into the Class Bravo" before entering.'],
  ['Class C', 'Airspace around moderately busy airports. Two-way radio contact (they say your call sign) is required to enter.'],
  ['Class D', 'Airspace around a towered airport. Establish two-way radio contact with the tower before entering.'],
  ['Climb and maintain', 'Climb to and then level off at the assigned altitude. Read back the altitude.'],
  ['Clearance delivery', 'The ground position that issues IFR clearances (and some VFR departure instructions) before you taxi.'],
  ['CRAFT', 'A memory aid for an IFR clearance: Clearance limit, Route, Altitude, Frequency, Transponder.'],
  ['Discrete code', 'A unique four-digit transponder (squawk) code ATC assigns you, e.g. "squawk zero two three four."'],
  ['Downwind', 'The pattern leg flown parallel to the runway, opposite the landing direction.'],
  ['Expedite', 'Comply quickly. "Expedite your climb" means use a higher rate without delay.'],
  ['Final approach', 'The last pattern leg, aligned with the runway, just before landing.'],
  ['Go around', 'Abandon the landing and climb out. Fly the airplane first, then tell the tower or announce on CTAF.'],
  ['Ground', 'The controller who manages taxiing aircraft on the movement area (taxiways and inactive runways).'],
  ['Hold short', 'Stop before a runway or point and do not cross. Safety-critical — read it back verbatim, including the runway.'],
  ['Hover taxi', 'Helicopter movement near the surface (in ground effect, generally below 25 ft) at slow speed.'],
  ['Ident', 'Press the transponder IDENT button so your target flashes on the controller’s scope. "Squawk one two zero zero and ident."'],
  ['IFR', 'Instrument Flight Rules — flight conducted under ATC control by reference to instruments, used in clouds and low visibility.'],
  ['LAHSO', 'Land And Hold Short Operations — land and stop before an intersecting runway or point. Read back the hold-short.'],
  ['Line up and wait', 'Taxi onto the runway and wait in position for takeoff clearance. Not a clearance to take off.'],
  ['Maintain', 'Keep the assigned altitude, heading, or speed until told otherwise.'],
  ['Mayday', 'The spoken distress signal for a life-threatening emergency, said three times: "Mayday, Mayday, Mayday."'],
  ['Negative', 'No.'],
  ['Pan-pan', 'The urgency signal (said three times) for a serious situation that is not yet a distress — one notch below Mayday.'],
  ['Position and hold', 'Old phraseology for "line up and wait." Don’t use it; the current term is "line up and wait."'],
  ['Readback', 'Repeating an ATC instruction back so the controller can confirm you heard it correctly. Required for clearances, runway assignments, and hold-shorts.'],
  ['Roger', 'I received your last transmission. It does NOT mean yes, and it is not a substitute for a required readback.'],
  ['Runway heading', 'Fly the magnetic heading of the runway centerline — do not turn after takeoff until told.'],
  ['Say again', 'Repeat your last transmission. Use this instead of "what?" or "repeat" ("repeat" has a different meaning in some contexts).'],
  ['Special VFR', 'A clearance to operate VFR in controlled surface-area airspace when weather is below basic VFR — you must request it and remain clear of clouds.'],
  ['Squawk', 'Set this code on your transponder. "Squawk VFR" means set 1200.'],
  ['Standby', 'Wait — I’ll get back to you. Don’t keep transmitting.'],
  ['Tower', 'The controller responsible for the runways and the airport traffic pattern at a towered field.'],
  ['Traffic in sight', 'You see the traffic ATC pointed out. If you don’t, say "negative contact" or "looking."'],
  ['Unable', 'You cannot comply with an instruction. Say "unable" plainly and, if able, why.'],
  ['Wilco', '"Will comply." You received the message, understand it, and will do it. More than "roger."'],
]

export const GLOSSARY: GlossaryTerm[] = raw
  .map(([term, def]) => ({ term, def, slug: term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
  .sort((a, b) => a.term.localeCompare(b.term))
