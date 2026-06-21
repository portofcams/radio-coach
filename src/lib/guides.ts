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
]

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null
