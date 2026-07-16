// Aviation-radio-English vocabulary scaffolding for Learner-paced mode. This is
// NOT scenario content and never changes phraseology or grading — it's a plain-
// English gloss layer over standard terms, matched generically against whatever
// text a scenario already has (atcTransmission + correctReadback), so it works
// on every scenario source with zero per-scenario authoring.
//
// Content accuracy matters here (this is a safety-phraseology teaching app) --
// verify against current FAA AIM / ICAO Doc 4444 wording before adding entries.

export interface EslTerm {
  term: string
  re: RegExp
  gloss: string
}

export const ESL_GLOSSARY: EslTerm[] = [
  { term: 'cleared', re: /\bcleared\b/i, gloss: '"Cleared" is a specific permission tied to the exact words that follow — e.g. "cleared to land" — not a general statement that the runway or airspace is empty.' },
  { term: 'hold short', re: /\bhold short\b/i, gloss: 'A fixed safety instruction: stop before that line and do not cross it. Always read the runway or taxiway number back verbatim.' },
  { term: 'line up and wait', re: /\bline up and wait\b/i, gloss: 'Taxi onto the runway centerline and stop — you are NOT cleared to take off yet. Both FAA and ICAO use this exact phrase (the FAA switched from the older "position and hold" in 2010 specifically to match the international standard and reduce confusion for non-native speakers) — so if your own training used different wording, this is the one to expect and read back in US airspace.' },
  { term: 'roger', re: /\broger\b/i, gloss: '"Roger" means only "I received and understood" — it does NOT mean "I agree" or "I will do it."' },
  { term: 'wilco', re: /\bwilco\b/i, gloss: 'Short for "will comply" — stronger than "roger": I received the instruction AND I will do it.' },
  { term: 'affirmative / negative', re: /\b(affirm|affirmative|negative)\b/i, gloss: 'The formal yes/no of standard phraseology — used instead of plain "yes"/"no" because they are harder to lose on a noisy frequency.' },
  { term: 'squawk', re: /\bsquawk\b/i, gloss: 'An instruction to set a specific 4-digit code on your transponder (the box that reports your identity/altitude to radar).' },
  { term: 'ident', re: /\bident\b/i, gloss: 'Short for "identify" — press the IDENT button so ATC\'s radar screen highlights your specific target.' },
  { term: 'say again', re: /\bsay again\b/i, gloss: 'The correct standard way to ask ATC to repeat a transmission — not "what," "come again," or "repeat."' },
  { term: 'standby', re: /\bstandby\b/i, gloss: '"Wait, I\'ll get back to you." Not a clearance and not permission to act — hold your current action.' },
  { term: 'readback', re: /\bread\s?back\b/i, gloss: 'Repeating a clearance or instruction back to ATC, word for word, so both sides confirm what was heard — the core skill this app trains.' },
  { term: 'taxi via', re: /\btaxi via\b/i, gloss: 'States the exact ground route (specific taxiway letters) ATC wants you to follow — not just "go to the runway."' },
  { term: 'maintain', re: /\bmaintain\b/i, gloss: 'A command to keep flying at exactly the stated altitude, heading, or speed — not a description or a suggestion.' },
  { term: 'expect', re: /\bexpect\b/i, gloss: 'A heads-up about what is likely coming ("expect vectors," "expect ILS runway two seven") — NOT yet a clearance; do not act on it until it is actually issued.' },
  { term: 'traffic in sight / negative contact', re: /\b(traffic in sight|negative contact|looking)\b/i, gloss: 'ATC is asking if you see another aircraft they called out. "Traffic in sight" means yes; "negative contact" or "looking" means not yet.' },
  { term: 'go around', re: /\bgo[- ]around\b/i, gloss: 'Abandon the landing, climb out, and come back around — read it back so ATC knows you are not on the runway.' },
  { term: 'niner / fife / tree / fower', re: /\b(niner|fife|tree|fower)\b/i, gloss: 'ICAO-standard number pronunciations, chosen because they sound distinct from other numbers across accents — not slang or a mistake.' },
  { term: 'back-taxi', re: /\bback[- ]?taxi\b/i, gloss: 'Taxiing against the normal direction on an active runway, always specifically authorized by ATC. Some pilots trained abroad know the British/ICAO term "backtrack" for the same maneuver.' },
  { term: 'with you', re: /\bwith you\b/i, gloss: 'A common, informal check-in phrase right after switching frequencies (e.g. "…with you at three thousand"). Not official phraseology, but you will hear it and can use it.' },
  { term: 'altimeter setting', re: /\baltimeter\b/i, gloss: 'The current local pressure setting for your altimeter, read one digit at a time. The US uses inches of mercury; many other countries use hectopascals — a real unit difference for pilots trained abroad, not just a language one.' },
  { term: 'flight following', re: /\bflight following\b/i, gloss: 'A free traffic-advisory service — ATC calls out nearby traffic, but you are still responsible for seeing and avoiding it yourself.' },
  { term: 'cleared for the option', re: /\bcleared for the option\b/i, gloss: '"The option" lets you decide at the last moment: full stop, touch-and-go, stop-and-go, or go-around — a US training-airport phrase with no exact equivalent in many countries\' programs.' },
]

const MAX_TERMS = 6

/** Every distinct glossary term matched in the given text, in ESL_GLOSSARY's
 *  own order, capped at MAX_TERMS. Multi-match, not first-match-wins --
 *  the use case is "list the unfamiliar words," not "explain one element." */
export function eslGlossFor(text: string): EslTerm[] {
  const hits: EslTerm[] = []
  for (const e of ESL_GLOSSARY) {
    if (hits.length >= MAX_TERMS) break
    if (e.re.test(text)) hits.push(e)
  }
  return hits
}
