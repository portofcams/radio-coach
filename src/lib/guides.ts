// Phraseology guides — accurate, AIM-referenced content for SEO + learning.
export interface Guide {
  slug: string
  title: string
  description: string
  sections: Array<{ h: string; p: string }>
}

export const GUIDES: Guide[] = [
  {
    slug: 'initial-call-up',
    title: 'Your first radio call: who, who, where, what',
    description: 'The four-part structure of an initial radio call to ATC — who you\'re calling, who you are, where you are, and what you want.',
    sections: [
      { h: 'The formula', p: 'Every initial call-up follows the same order: who you\'re calling, who you are, where you are, and what you want. Example: "Palmdale Tower, Cessna One Two Three Four Five, ten miles south, inbound landing with information Bravo."' },
      { h: 'Who you\'re calling', p: 'State the facility name and type first — "Palmdale Tower", "Norcal Approach", "Hilo Ground". This wakes up the right controller.' },
      { h: 'Who you are', p: 'Your full call sign on first contact, e.g. "Cessna One Two Three Four Five". After the controller uses an abbreviated form, you may use it too.' },
      { h: 'Where and what', p: 'Position/altitude and your request, kept short. ATC is busy — say only what they need to act.' },
    ],
  },
  {
    slug: 'hold-short-readbacks',
    title: 'How to read back a hold-short instruction',
    description: 'Hold-short instructions are safety-critical and must be read back verbatim, including the runway. Here\'s exactly how.',
    sections: [
      { h: 'Always read it back — with the runway', p: 'Per AIM 4-3-18, any runway hold-short instruction must be read back, including the runway number. "Hold short of runway two six" → "Hold short of runway two six, Cessna One Two Three Four Five."' },
      { h: 'Why it matters', p: 'Runway incursions are among the most serious GA errors. Reading the hold-short back verbatim confirms you and the controller share the same plan.' },
      { h: 'Common mistake', p: 'Reading back the taxi route but dropping the hold-short, or saying "roger" instead of repeating it. Neither is acceptable — say the words.' },
    ],
  },
  {
    slug: 'ctaf-self-announce',
    title: 'CTAF self-announce calls at non-towered airports',
    description: 'At non-towered fields you announce your own position on the CTAF. The standard format and example calls.',
    sections: [
      { h: 'The format', p: 'Airport name, who you are, where/what, airport name again (AIM 4-1-9). "Lincoln traffic, Skyhawk Four Five X-ray, left downwind runway one eight, Lincoln."' },
      { h: 'Bracket with the field name', p: 'Start and end with the airport name so pilots tuning across frequencies know which field you mean.' },
      { h: 'Key calls', p: 'Departing, entering downwind, turning base/final, and clear of the runway. Announce intentions, not just position.' },
    ],
  },
  {
    slug: 'class-b-entry',
    title: 'Getting cleared into Class B airspace',
    description: 'You may not enter Class B without an explicit clearance. What to listen for and read back.',
    sections: [
      { h: 'You need the words "cleared into the Bravo"', p: 'A frequency change or radar contact is NOT a clearance. You must hear "cleared into the Class Bravo" (or "cleared into the Bravo").' },
      { h: 'Read it back', p: 'Read back the clearance plus any altitude or heading: "Cleared into the Bravo, maintain at or below four thousand five hundred, Cessna One Two Three Four Five."' },
      { h: 'If in doubt, stay out', p: 'Without the explicit clearance, remain clear of the Class B shelf. Ask the controller to confirm if unsure.' },
    ],
  },
  {
    slug: 'ifr-clearance-craft',
    title: 'Copying an IFR clearance with CRAFT',
    description: 'IFR clearances follow a fixed order — Clearance limit, Route, Altitude, Frequency, Transponder. Use CRAFT to copy and read back.',
    sections: [
      { h: 'C-R-A-F-T', p: 'Clearance limit (usually your destination), Route, Altitude (initial and expected), departure Frequency, and Transponder (squawk). They always come in that order.' },
      { h: 'Read it back in order', p: 'Read the whole thing back in CRAFT order so the controller can confirm nothing was missed — especially the squawk and the frequency.' },
      { h: 'Tip', p: 'Pre-print a CRAFT box on your kneeboard. Copying into fixed slots is far easier than free-form.' },
    ],
  },
  {
    slug: 'numbers-and-phonetics',
    title: 'Aviation numbers and the phonetic alphabet',
    description: 'How to say numbers and letters on the radio — niner, fife, tree — and the NATO phonetic alphabet.',
    sections: [
      { h: 'Say each digit', p: 'Read numbers digit by digit: 122.8 is "one two two point eight". Altitudes use thousands/hundreds: 4,500 is "four thousand five hundred".' },
      { h: 'Niner, fife, tree', p: 'To avoid confusion on a noisy frequency: 9 = "niner", 5 = "fife", 3 = "tree". These are standard ICAO pronunciations.' },
      { h: 'Phonetic alphabet', p: 'Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliett, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu.' },
    ],
  },
  {
    slug: 'flight-following',
    title: 'How to request VFR flight following',
    description: 'Flight following gives you traffic advisories and a controller watching your tail on a VFR flight. How to ask for it and what to read back.',
    sections: [
      { h: 'Who to call', p: 'Call the appropriate Approach or Center facility for your area (look it up on a chart or get a handoff from tower). On initial call, give your call sign, type, position, altitude, and that you are requesting flight following — e.g. "Norcal Approach, Cessna One Two Three Four Five, ten miles south of Livermore, four thousand five hundred, request VFR flight following to Salinas."' },
      { h: 'The squawk', p: 'ATC assigns a discrete transponder code: "Cessna One Two Three Four Five, squawk zero two three four." Read it back and set it: "Squawk zero two three four, Cessna One Two Three Four Five." Then expect "radar contact."' },
      { h: 'Traffic calls', p: 'You\'ll get advisories by clock position, distance, and altitude: "traffic, two o\'clock, three miles, opposite direction, altitude indicates four thousand five hundred." Reply "traffic in sight" or "looking, negative contact."' },
      { h: 'Leaving the service', p: 'ATC ends it with "radar service terminated, squawk VFR, frequency change approved." Set 1200 and you\'re on your own again. You can also cancel anytime: "Cessna One Two Three Four Five, cancel flight following."' },
    ],
  },
  {
    slug: 'position-reports',
    title: 'Position reports in the traffic pattern and en route',
    description: 'What to say and when — pattern legs at a non-towered field, and en route position reports when asked.',
    sections: [
      { h: 'Pattern legs', p: 'At a non-towered field, announce each leg with intentions: "Lincoln traffic, Skyhawk Four Five X-ray, midfield left downwind runway one eight, touch and go, Lincoln." Then base, final, and clear of the runway.' },
      { h: 'Inbound', p: 'About ten miles out, announce position and intentions: "Lincoln traffic, Cessna One Two Three Four Five, one zero miles south, inbound landing, Lincoln." Bracket with the field name so others know which airport you mean.' },
      { h: 'En route, when asked', p: 'If a controller asks "say position," give it relative to a known fix or the field: "Cessna One Two Three Four Five, two zero miles northeast of the VOR, six thousand five hundred."' },
    ],
  },
  {
    slug: 'frequency-changes',
    title: 'Frequency changes and handoffs',
    description: 'How handoffs work, what to read back, and the right way to check onto a new frequency.',
    sections: [
      { h: 'The handoff', p: 'A controller passes you to the next sector: "Cessna One Two Three Four Five, contact Norcal Approach one two zero point niner." Read back the frequency and your call sign: "Norcal Approach one two zero point niner, Cessna One Two Three Four Five."' },
      { h: 'Checking on', p: 'On the new frequency, give who you are and your altitude (and that you\'re level or climbing/descending): "Norcal Approach, Cessna One Two Three Four Five, level six thousand five hundred." Keep it short.' },
      { h: 'Frequency change approved', p: 'At a non-towered destination or leaving flight following, you may hear "frequency change approved" — acknowledge and switch to CTAF. You can also request it: "Cessna One Two Three Four Five, request frequency change."' },
    ],
  },
  {
    slug: 'light-gun-signals',
    title: 'Light-gun signals: flying NORDO at a towered field',
    description: 'If your radio fails at a towered airport, the tower controls you with a light gun. What each color and steady/flashing signal means.',
    sections: [
      { h: 'When you\'d use them', p: 'A complete radio failure (NORDO) at a towered field. Squawk 7600, watch the tower for light signals, and rock your wings (in flight) or move ailerons/rudder (on the ground) to acknowledge. AIM 4-3-13 has the full table.' },
      { h: 'In flight', p: 'Steady green = cleared to land. Flashing green = return for landing (a landing clearance will follow). Steady red = give way to other aircraft and continue circling. Flashing red = airport unsafe, do not land. Flashing white is not used in flight. Alternating red and green = general warning, exercise extreme caution.' },
      { h: 'On the ground', p: 'Steady green = cleared for takeoff. Flashing green = cleared to taxi. Steady red = stop. Flashing red = taxi clear of the runway in use. Flashing white = return to your starting point on the airport. Alternating red and green = exercise extreme caution.' },
      { h: 'Acknowledging', p: 'Day: move the ailerons or rudder, or rock the wings. Night: flash your landing or navigation lights. There\'s no radio read-back — the acknowledgment is the maneuver.' },
    ],
  },
  {
    slug: 'go-around-and-missed-approach',
    title: 'Go-around and missed approach calls',
    description: 'What to say when you break off a landing — VFR go-around in the pattern and the IFR missed approach.',
    sections: [
      { h: 'VFR go-around', p: 'If you abandon the landing, fly the airplane first, then tell the tower: "Cessna One Two Three Four Five, going around." Expect pattern instructions: "make left traffic, runway two seven" — read it back.' },
      { h: 'Non-towered', p: 'Announce on the CTAF so traffic on base/final knows: "Lincoln traffic, Cessna One Two Three Four Five, going around, runway one eight, Lincoln." Sidestep to the upwind side to keep departing traffic in sight.' },
      { h: 'IFR missed approach', p: 'Fly the published missed unless told otherwise, and report: "Cessna One Two Three Four Five, missed approach." ATC will issue a climb and heading or a hold — read back the altitude and the instruction.' },
    ],
  },
]

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null
