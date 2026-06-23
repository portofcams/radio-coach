import { toPhonetic } from './phonetic'

// ── Ground School: non-AI, deterministic Duolingo-style drills ──────────────
// Every exercise is checkable against a fixed answer key — zero LLM at runtime,
// $0 marginal cost, works offline. AI may author this bank offline, but nothing
// here calls an API.

export interface MultipleChoice {
  type: 'mc'
  id: string
  prompt: string
  choices: string[]
  /** index of the correct choice */
  answer: number
  explain?: string
}

export interface TapTokens {
  type: 'tokens'
  id: string
  prompt: string
  /** correct, ordered sequence of word tiles */
  answer: string[]
  /** extra wrong tiles mixed into the pool */
  distractors?: string[]
  explain?: string
}

export interface SpellCallsign {
  type: 'spell'
  id: string
  prompt: string
  /** the registration to spell, e.g. "N728KT" */
  callsign: string
  /** correct phonetic words in order (frozen for determinism) */
  answer: string[]
  explain?: string
}

export interface ListenSelect {
  type: 'listen'
  id: string
  prompt: string
  /** what ATC speaks (ElevenLabs, with a free browser-speech fallback) */
  audioText: string
  choices: string[]
  /** index of the correct choice */
  answer: number
  explain?: string
}

export interface MatchPairs {
  type: 'match'
  id: string
  prompt: string
  pairs: { left: string; right: string }[]
  explain?: string
}

export interface SpotError {
  type: 'spot'
  id: string
  prompt: string
  /** the readback rendered as tappable word chips */
  words: string[]
  /** indices of the wrong / out-of-place word(s) */
  errorIndices: number[]
  explain?: string
}

export interface OrderSequence {
  type: 'order'
  id: string
  prompt: string
  /** the phrase chips in their correct order (all are used; no distractors) */
  answer: string[]
  explain?: string
}

export interface TypeReadback {
  type: 'type'
  id: string
  prompt: string
  /** content phrases that must appear in the typed answer (deterministic match) */
  accept: string[]
  /** the textbook-correct readback to reveal */
  correct: string
  explain?: string
}

export interface AudioScramble {
  type: 'scramble'
  id: string
  prompt: string
  /** what ATC speaks (ElevenLabs, free browser-speech fallback) */
  audioText: string
  /** correct word order to reconstruct */
  answer: string[]
  explain?: string
}

export type Exercise =
  | MultipleChoice
  | TapTokens
  | SpellCallsign
  | ListenSelect
  | MatchPairs
  | SpotError
  | OrderSequence
  | TypeReadback
  | AudioScramble

export interface GsLesson {
  id: string
  title: string
  /** XP awarded for a clean completion */
  xp: number
  exercises: Exercise[]
}

export interface GsUnit {
  id: string
  title: string
  subtitle: string
  icon: string
  /** tailwind accent classes for the unit header */
  color: string
  /** a live-comms scenario unlocked after the unit's lessons — the free AI-sim taste */
  checkpointScenarioId?: string
  lessons: GsLesson[]
}

// helper: build a spell exercise straight from a registration
function spell(id: string, callsign: string, explain?: string): SpellCallsign {
  return {
    type: 'spell',
    id,
    prompt: 'Tap the phonetic words in order to spell this call sign.',
    callsign,
    answer: toPhonetic(callsign).split(' '),
    explain,
  }
}

export const units: GsUnit[] = [
  // ── UNIT 1 — PHONETIC ALPHABET ──────────────────────────────────────────
  {
    id: 'phonetics',
    title: 'Phonetic Alphabet',
    subtitle: 'The 26 letters every pilot must spell by ear',
    icon: 'ABC',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    checkpointScenarioId: 'ground-taxi-hold-short',
    lessons: [
      {
        id: 'phon-1',
        title: 'Letters A–M',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'p1-1', prompt: 'What is the phonetic word for the letter C?', choices: ['Charlie', 'Carlo', 'Cobra', 'Coast'], answer: 0 },
          { type: 'mc', id: 'p1-2', prompt: 'What is the phonetic word for the letter G?', choices: ['Gulf', 'Golf', 'George', 'Gamma'], answer: 1, explain: 'It is "Golf" — not "Gulf". A common slip on the radio.' },
          { type: 'mc', id: 'p1-3', prompt: 'Which letter does "Juliett" stand for?', choices: ['G', 'I', 'J', 'Y'], answer: 2 },
          { type: 'mc', id: 'p1-4', prompt: 'What is the phonetic word for the letter K?', choices: ['Kite', 'King', 'Kilo', 'Knox'], answer: 2 },
          { type: 'tokens', id: 'p1-5', prompt: 'Spell "CAB" phonetically.', answer: ['Charlie', 'Alpha', 'Bravo'], distractors: ['Delta', 'Echo'] },
          { type: 'tokens', id: 'p1-6', prompt: 'Spell "FIG" phonetically.', answer: ['Foxtrot', 'India', 'Golf'], distractors: ['Hotel', 'Juliett'] },
        ],
      },
      {
        id: 'phon-2',
        title: 'Letters N–Z',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'p2-1', prompt: 'What is the phonetic word for the letter N?', choices: ['Nectar', 'Nimbus', 'November', 'Niner'], answer: 2, explain: '"Niner" is the number 9, not the letter N. N is "November".' },
          { type: 'mc', id: 'p2-2', prompt: 'What is the phonetic word for the letter R?', choices: ['Romeo', 'Robert', 'Rodeo', 'Ranger'], answer: 0 },
          { type: 'mc', id: 'p2-3', prompt: 'Which letter does "Whiskey" stand for?', choices: ['V', 'W', 'X', 'Y'], answer: 1 },
          { type: 'mc', id: 'p2-4', prompt: 'What is the phonetic word for the letter X?', choices: ['Xerox', 'Xenon', 'X-ray', 'Exit'], answer: 2 },
          { type: 'tokens', id: 'p2-5', prompt: 'Spell "TWA" phonetically.', answer: ['Tango', 'Whiskey', 'Alpha'], distractors: ['Victor', 'Uniform'] },
          { type: 'tokens', id: 'p2-6', prompt: 'Spell "ZQP" phonetically.', answer: ['Zulu', 'Quebec', 'Papa'], distractors: ['Yankee', 'Oscar'] },
        ],
      },
      {
        id: 'phon-3',
        title: 'Spell Your Call Sign',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'p3-1', prompt: 'In a call sign, how do you say the number 9?', choices: ['Nine', 'Niner', 'November', 'Negative'], answer: 1, explain: 'Always "niner" — it keeps 9 from being confused with the German "nein" or a garbled "five".' },
          spell('p3-2', 'N5SU', 'November Five Sierra Uniform. Letters get phonetics; numbers get their spoken name.'),
          spell('p3-3', 'N42TG'),
          spell('p3-4', 'N728KT'),
          spell('p3-5', 'N917AK', 'Note the 9 becomes "Niner".'),
        ],
      },
    ],
  },

  // ── UNIT 2 — AVIATION NUMBERS ───────────────────────────────────────────
  {
    id: 'numbers',
    title: 'Aviation Numbers',
    subtitle: 'Altitudes, headings, frequencies, and squawks — said the FAA way',
    icon: '123',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    checkpointScenarioId: 'class-d-takeoff',
    lessons: [
      {
        id: 'num-1',
        title: 'How Numbers Are Spoken',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'n1-1', prompt: 'How is the number 9 spoken on the radio?', choices: ['Nine', 'Niner', 'Nina', 'Nankow'], answer: 1, explain: 'FAA standard is "niner" to avoid confusion with similar-sounding words.' },
          { type: 'mc', id: 'n1-2', prompt: 'In the frequency 121.9, how do you say the decimal point?', choices: ['decimal', 'point', 'dot', 'period'], answer: 1, explain: 'FAA phraseology uses "point": "one two one point niner".' },
          { type: 'mc', id: 'n1-3', prompt: 'Read back "altimeter 29.92".', choices: ['two niner niner two', 'twenty-nine ninety-two', 'two nine point niner two', 'twenty niner point niner two'], answer: 0, explain: 'Altimeter is read as four separate digits — no "point".' },
          { type: 'mc', id: 'n1-4', prompt: 'How is the frequency 124.7 spoken?', choices: ['one twenty-four point seven', 'twelve forty-seven', 'one two four point seven', 'one hundred twenty four seven'], answer: 2, explain: 'Each digit, then "point", then the digit after.' },
        ],
      },
      {
        id: 'num-2',
        title: 'Altitudes & Headings',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'n2-1', prompt: 'Read back the altitude 5,500.', choices: ['fifty-five hundred', 'five thousand five hundred', 'five five zero zero', 'five point five thousand'], answer: 1, explain: 'Below 18,000 ft: state the thousands and hundreds in full. Never "fifty-five hundred".' },
          { type: 'mc', id: 'n2-2', prompt: 'Read back the altitude 11,000.', choices: ['eleven thousand', 'one one thousand', 'eleven point zero', 'one ten hundred'], answer: 1, explain: 'State each digit of the thousands: "one one thousand".' },
          { type: 'mc', id: 'n2-3', prompt: 'Read back heading 070.', choices: ['heading seventy', 'heading seven', 'heading zero seven zero', 'heading oh seventy'], answer: 2, explain: 'Headings are always three digits, each spoken separately.' },
          { type: 'tokens', id: 'n2-4', prompt: 'Read back: "climb and maintain 8,500".', answer: ['climb', 'and', 'maintain', 'eight', 'thousand', 'five', 'hundred'], distractors: ['eighty-five', 'hundred'] },
          { type: 'tokens', id: 'n2-5', prompt: 'Read back: "fly heading 250".', answer: ['heading', 'two', 'five', 'zero'], distractors: ['two-fifty', 'degrees'] },
        ],
      },
      {
        id: 'num-3',
        title: 'Frequencies & Squawks',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'n3-1', prompt: 'Read back "squawk 4521".', choices: ['forty-five twenty-one', 'four thousand five twenty-one', 'four five two one', 'four-five-two-one thousand'], answer: 2, explain: 'Transponder codes are read digit by digit.' },
          { type: 'mc', id: 'n3-2', prompt: 'Read back "squawk 0342".', choices: ['three forty-two', 'zero three four two', 'oh three forty-two', 'zero thirty-four two'], answer: 1 },
          { type: 'tokens', id: 'n3-3', prompt: 'Read back: "contact tower 118.3".', answer: ['contact', 'tower', 'one', 'one', 'eight', 'point', 'three'], distractors: ['eighteen', 'one-eighteen'] },
          { type: 'tokens', id: 'n3-4', prompt: 'Read back: "squawk 7000".', answer: ['squawk', 'seven', 'zero', 'zero', 'zero'], distractors: ['seven-thousand', 'thousand'] },
          { type: 'tokens', id: 'n3-5', prompt: 'Read back: "departure frequency 125.65".', answer: ['departure', 'one', 'two', 'five', 'point', 'six', 'five'], distractors: ['one-twenty-five', 'sixty-five'] },
        ],
      },
    ],
  },

  // ── UNIT 3 — GROUND & TAXI ──────────────────────────────────────────────
  {
    id: 'ground-taxi',
    title: 'Ground & Taxi',
    subtitle: 'Taxi clearances, hold shorts, and runway crossings',
    icon: 'GND',
    color: 'text-teal-700 bg-teal-50 border-teal-200',
    checkpointScenarioId: 'runway-crossing',
    lessons: [
      {
        id: 'grd-1',
        title: 'Taxi Clearances',
        xp: 10,
        exercises: [
          { type: 'listen', id: 'g1-1', prompt: 'Listen to Ground, then pick the runway you were cleared to.', audioText: 'Cessna four sierra uniform, Hilo Ground, taxi to runway two six via Alpha, hold short of runway two one.', choices: ['Runway 26', 'Runway 21', 'Runway 2', 'Runway 6'], answer: 0, explain: 'You taxi TO runway 26 — runway 21 is the hold-short, not your destination.' },
          { type: 'mc', id: 'g1-2', prompt: 'What must a taxi readback always include?', choices: ['Just "roger"', 'The runway, every taxiway, and every hold-short', 'Only the hold-short', 'Your aircraft type'], answer: 1 },
          { type: 'spot', id: 'g1-3', prompt: 'Tap the word that does not belong in this readback.', words: ['Copy,', 'taxi', 'to', 'runway', 'two', 'six,', 'four', 'sierra', 'uniform'], errorIndices: [0], explain: 'Never say "Copy" — read the clearance back instead.' },
          { type: 'tokens', id: 'g1-4', prompt: 'Read back: "taxi to runway 26 via Alpha, hold short of runway 21".', answer: ['runway', 'two', 'six', 'via', 'Alpha', 'hold', 'short', 'runway', 'two', 'one'], distractors: ['cleared', 'Bravo'] },
        ],
      },
      {
        id: 'grd-2',
        title: 'Hold Short & Crossings',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'g2-1', prompt: 'Why is a hold-short readback safety-critical?', choices: ['It is optional courtesy', 'It prevents runway incursions', 'It speeds up taxi', 'It tells ATC your fuel'], answer: 1, explain: 'A missed hold-short is the classic cause of a runway incursion — and an automatic checkride fail.' },
          { type: 'match', id: 'g2-2', prompt: 'Match each instruction to what it means.', pairs: [
            { left: 'Hold short of 21', right: 'Stop before runway 21, do not enter' },
            { left: 'Cross runway 14', right: 'Proceed across runway 14' },
            { left: 'Line up and wait', right: 'Enter the runway, hold for takeoff clearance' },
            { left: 'Taxi via Alpha', right: 'Use taxiway Alpha' },
          ] },
          { type: 'spot', id: 'g2-3', prompt: 'ATC said hold short of runway 21. Tap the wrong word.', words: ['hold', 'short', 'of', 'runway', 'two', 'five'], errorIndices: [5], explain: 'It was runway 21, not 25 — read back the exact runway number.' },
          { type: 'listen', id: 'g2-4', prompt: 'Listen, then pick the correct action.', audioText: 'Cessna four sierra uniform, cross runway one four at Alpha.', choices: ['Cross runway 14 at Alpha', 'Hold short of runway 14', 'Line up on runway 14', 'Taxi to runway 14'], answer: 0 },
        ],
      },
    ],
  },

  // ── UNIT 4 — TOWER ──────────────────────────────────────────────────────
  {
    id: 'tower',
    title: 'Tower',
    subtitle: 'Takeoff, landing, and line-up-and-wait clearances',
    icon: 'TWR',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    checkpointScenarioId: 'line-up-wait',
    lessons: [
      {
        id: 'twr-1',
        title: 'Takeoff & Landing',
        xp: 10,
        exercises: [
          { type: 'listen', id: 't1-1', prompt: 'Listen to Tower, then pick what you are cleared to do.', audioText: 'Cessna four sierra uniform, runway two six, cleared for takeoff, wind two five zero at eight.', choices: ['Cleared for takeoff, runway 26', 'Line up and wait', 'Cleared to land', 'Hold short of runway 26'], answer: 0 },
          { type: 'mc', id: 't1-2', prompt: 'What must your takeoff-clearance readback include?', choices: ['Just "roger"', 'The runway and "cleared for takeoff"', 'Only the wind', 'Just "wilco"'], answer: 1 },
          { type: 'tokens', id: 't1-3', prompt: 'Read back: "runway 26, cleared for takeoff".', answer: ['runway', 'two', 'six', 'cleared', 'for', 'takeoff'], distractors: ['landing', 'line', 'up'] },
          { type: 'spot', id: 't1-4', prompt: 'ATC said "cleared to land." Tap the wrong word.', words: ['runway', 'two', 'six,', 'cleared', 'to', 'depart'], errorIndices: [5], explain: 'It should be "land", not "depart". Read back the clearance you were actually given.' },
        ],
      },
      {
        id: 'twr-2',
        title: 'Line Up and Wait',
        xp: 10,
        exercises: [
          { type: 'mc', id: 't2-1', prompt: '"Line up and wait" means:', choices: ['You are cleared for takeoff', 'Taxi onto the runway and hold — NOT cleared for takeoff', 'Hold short of the runway', 'Exit the runway'], answer: 1, explain: 'It replaced "position and hold". You enter the runway and wait for a separate takeoff clearance.' },
          { type: 'match', id: 't2-2', prompt: 'Match each Tower call to its meaning.', pairs: [
            { left: 'Cleared for takeoff', right: 'You may depart' },
            { left: 'Line up and wait', right: 'Enter runway, hold for clearance' },
            { left: 'Hold short', right: 'Stop before the runway' },
            { left: 'Go around', right: 'Abort the landing, climb out' },
          ] },
          { type: 'listen', id: 't2-3', prompt: 'Listen, then pick the correct readback.', audioText: 'Cessna four sierra uniform, runway two eight left, line up and wait.', choices: ['Line up and wait, runway 28 left', 'Cleared for takeoff, runway 28 left', 'Cleared to land, runway 28 left', 'Cross runway 28 left'], answer: 0 },
        ],
      },
    ],
  },

  // ── UNIT 5 — TRAFFIC PATTERN ────────────────────────────────────────────
  {
    id: 'pattern',
    title: 'Traffic Pattern',
    subtitle: 'Pattern entry, sequencing, options, and go-arounds',
    icon: 'PAT',
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    checkpointScenarioId: 'pattern-entry',
    lessons: [
      {
        id: 'pat-1',
        title: 'Entry & Sequencing',
        xp: 10,
        exercises: [
          { type: 'listen', id: 'pa1-1', prompt: 'Listen to Tower, then pick your instruction.', audioText: 'Cessna four sierra uniform, enter right downwind runway one six, number two, follow the Piper on base.', choices: ['Enter right downwind, number 2', 'Enter left base', 'Cleared to land', 'Extend upwind'], answer: 0 },
          { type: 'mc', id: 'pa1-2', prompt: 'When do you say "traffic in sight"?', choices: ['Always, to be polite', 'Only when you actually see the aircraft', 'Whenever ATC mentions traffic', 'Never'], answer: 1, explain: 'ATC will not sequence you behind traffic you cannot see. If you do not see it, say "looking for traffic".' },
          { type: 'match', id: 'pa1-3', prompt: 'Match each phrase to its meaning.', pairs: [
            { left: 'Traffic in sight', right: 'You see the other aircraft' },
            { left: 'Looking for traffic', right: 'You do not see it yet' },
            { left: 'Number two', right: 'Second in the landing sequence' },
            { left: 'Extend downwind', right: 'Fly past the normal turn point' },
          ] },
          { type: 'spot', id: 'pa1-4', prompt: 'You do NOT see the traffic. Tap the wrong words in this readback.', words: ['enter', 'downwind,', 'traffic', 'in', 'sight'], errorIndices: [2, 3, 4], explain: 'If you do not have the traffic, say "looking for traffic" — never claim "traffic in sight".' },
        ],
      },
      {
        id: 'pat-2',
        title: 'Options & Go-Arounds',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'pa2-1', prompt: '"Cleared for the option" lets you:', choices: ['Only a full stop', 'Touch-and-go, stop-and-go, low approach, or full stop — your choice', 'Only a touch-and-go', 'Land on any runway'], answer: 1 },
          { type: 'listen', id: 'pa2-2', prompt: 'Listen, then pick the correct readback.', audioText: 'Cessna four sierra uniform, go around.', choices: ['Going around', 'Cleared to land', 'Cleared for the option', 'Line up and wait'], answer: 0 },
          { type: 'tokens', id: 'pa2-3', prompt: 'Read back: "runway 28 left, cleared for the option".', answer: ['runway', 'two', 'eight', 'left', 'cleared', 'for', 'the', 'option'], distractors: ['takeoff', 'landing'] },
        ],
      },
    ],
  },

  // ── UNIT 6 — EMERGENCIES ────────────────────────────────────────────────
  {
    id: 'emergencies',
    title: 'Emergencies',
    subtitle: 'Mayday vs pan-pan, and the emergency squawk codes',
    icon: 'EMG',
    color: 'text-red-700 bg-red-50 border-red-200',
    checkpointScenarioId: 'class-c-entry',
    lessons: [
      {
        id: 'emg-1',
        title: 'Declaring an Emergency',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'e1-1', prompt: 'Which word declares a distress (life-threatening) emergency?', choices: ['Mayday', 'Pan-pan', 'Help', 'Emergency'], answer: 0, explain: 'Spoken three times — "Mayday, Mayday, Mayday" — for grave and imminent danger.' },
          { type: 'mc', id: 'e1-2', prompt: 'What does "pan-pan" signal?', choices: ['Distress — grave danger', 'Urgency — a problem, but no immediate danger', 'A fuel request', 'Lost communications'], answer: 1 },
          { type: 'listen', id: 'e1-3', prompt: 'Listen, then classify the call.', audioText: 'Mayday, Mayday, Mayday, Cessna four sierra uniform, engine failure, ten miles north, two thousand feet.', choices: ['A distress (Mayday) call', 'A routine position report', 'A taxi clearance', 'A pan-pan urgency call'], answer: 0 },
          { type: 'match', id: 'e1-4', prompt: 'Match each term to its meaning.', pairs: [
            { left: 'Mayday', right: 'Distress — grave, imminent danger' },
            { left: 'Pan-pan', right: 'Urgency — a problem, no immediate danger' },
            { left: 'Squawk 7700', right: 'Emergency transponder code' },
            { left: 'Souls on board', right: 'Number of people aboard' },
          ] },
        ],
      },
      {
        id: 'emg-2',
        title: 'Emergency Squawk Codes',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'e2-1', prompt: 'Which squawk code means a general emergency?', choices: ['7700', '7600', '7500', '1200'], answer: 0 },
          { type: 'match', id: 'e2-2', prompt: 'Match each transponder code to its meaning.', pairs: [
            { left: '7500', right: 'Hijack' },
            { left: '7600', right: 'Lost communications' },
            { left: '7700', right: 'General emergency' },
            { left: '1200', right: 'VFR, no code assigned' },
          ] },
          { type: 'spot', id: 'e2-3', prompt: 'You have an engine emergency. Tap the wrong digit in this squawk.', words: ['squawk', 'seven', 'five', 'zero', 'zero'], errorIndices: [2], explain: '7500 means hijack. The general emergency code is 7700 — the digit should be "seven", not "five".' },
          { type: 'listen', id: 'e2-4', prompt: 'Listen, then pick the correct readback.', audioText: 'Cessna four sierra uniform, squawk seven seven zero zero and ident.', choices: ['Squawk 7700, ident', 'Squawk 7600', 'Squawk 1200', 'Cleared to land'], answer: 0 },
        ],
      },
    ],
  },

  // ── UNIT 7 — CLEARANCE & IFR COPY (CRAFT) ───────────────────────────────
  {
    id: 'clearance',
    title: 'Clearance & IFR Copy',
    subtitle: 'Copy a full IFR clearance the CRAFT way',
    icon: 'CLR',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    checkpointScenarioId: 'ifr-clearance',
    lessons: [
      {
        id: 'clr-1',
        title: 'The CRAFT Format',
        xp: 15,
        exercises: [
          { type: 'mc', id: 'c1-1', prompt: 'CRAFT stands for Cleared, Route, Altitude, Frequency, and what?', choices: ['Transponder (squawk)', 'Time', 'Traffic', 'Taxi'], answer: 0, explain: 'T is Transponder — the squawk code, always last.' },
          { type: 'match', id: 'c1-2', prompt: 'Match each CRAFT letter to its meaning.', pairs: [
            { left: 'C — Cleared to', right: 'Destination or clearance limit' },
            { left: 'R — Route', right: 'The airways and fixes to fly' },
            { left: 'A — Altitude', right: 'Initial, then expect' },
            { left: 'T — Transponder', right: 'The squawk code' },
          ] },
          { type: 'order', id: 'c1-3', prompt: 'Put this clearance read-back in CRAFT order.', answer: ['Cleared to Boise', 'via the Seattle One departure', 'climb and maintain five thousand', 'departure one two five point six five', 'squawk four two one seven'], explain: 'Cleared → Route → Altitude → Frequency → Transponder.' },
          { type: 'type', id: 'c1-4', prompt: 'Type your read-back of "squawk 4217".', accept: ['squawk', '4', '2', '1', '7'], correct: 'Squawk four two one seven', explain: 'Squawk codes are read digit by digit.' },
        ],
      },
      {
        id: 'clr-2',
        title: 'Copying a Clearance',
        xp: 15,
        exercises: [
          { type: 'scramble', id: 'c2-1', prompt: 'Listen, then rebuild the clearance in order.', audioText: 'Climb and maintain five thousand.', answer: ['climb', 'and', 'maintain', 'five', 'thousand'] },
          { type: 'type', id: 'c2-2', prompt: 'Type your read-back of "climb and maintain 5,000".', accept: ['climb', 'maintain', '5', 'thousand'], correct: 'Climb and maintain five thousand', explain: 'State the altitude in full: "five thousand".' },
          { type: 'mc', id: 'c2-3', prompt: 'A clearance says "expect 11,000 ten minutes after departure." Do you read it back?', choices: ['No, it is just information', 'Yes — the entire clearance is read back', 'Only the 11,000', 'Only on request'], answer: 1, explain: 'IFR clearances are read back completely, expect-altitude included.' },
          { type: 'listen', id: 'c2-4', prompt: 'Listen, then pick the correct read-back.', audioText: 'Cessna four sierra uniform, cleared ILS runway one six right approach, maintain three thousand until established.', choices: ['Cleared ILS 16R, maintain 3,000 until established', 'Cleared to land 16R', 'Cleared for the option', 'Squawk 7700'], answer: 0 },
        ],
      },
    ],
  },

  // ── UNIT 8 — AIRSPACE TRANSITIONS (CLASS B/C/D) ─────────────────────────
  {
    id: 'airspace',
    title: 'Airspace Transitions',
    subtitle: 'Getting into Class B, C, and D the right way',
    icon: 'BCD',
    color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    checkpointScenarioId: 'class-c-entry',
    lessons: [
      {
        id: 'air-1',
        title: 'Two-Way Comms',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'a1-1', prompt: 'Before entering Class C, you must have:', choices: ['Just be squawking a code', 'Two-way radio communication established', 'A filed flight plan', 'Ground control permission'], answer: 1 },
          { type: 'mc', id: 'a1-2', prompt: 'You have "established two-way" when ATC:', choices: ['Says your call sign back to you', 'Keys the mic once', 'Is on frequency at all', 'Squawks you a code'], answer: 0, explain: 'Even "Cessna 4SU, standby" counts — they used your call sign.' },
          { type: 'listen', id: 'a1-3', prompt: 'Listen, then pick the correct read-back.', audioText: 'Cessna four sierra uniform, Honolulu Approach, squawk three three four one, report five mile final.', choices: ['Squawk 3341, report 5-mile final', 'Cleared to land', 'Hold present position', 'Ident only'], answer: 0 },
          { type: 'type', id: 'a1-4', prompt: 'Type your read-back of "squawk 3341, report 5 mile final".', accept: ['squawk', '3', '3', '4', '1', 'report', '5', 'final'], correct: 'Squawk 3341, report 5-mile final' },
        ],
      },
      {
        id: 'air-2',
        title: 'Into the Bravo',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'a2-1', prompt: 'To enter Class B airspace you need:', choices: ['Just two-way comms', 'The explicit words "cleared into the Bravo"', 'A transponder only', 'Nothing special'], answer: 1, explain: 'Class B requires an explicit clearance — two-way comms is not enough.' },
          { type: 'match', id: 'a2-2', prompt: 'Match each class to its entry requirement.', pairs: [
            { left: 'Class B', right: 'Explicit "cleared into the Bravo"' },
            { left: 'Class C', right: 'Two-way comms established' },
            { left: 'Class D', right: 'Two-way comms established' },
            { left: 'Class E (VFR)', right: 'No comms required' },
          ] },
          { type: 'listen', id: 'a2-3', prompt: 'Listen, then pick the correct read-back.', audioText: 'Cessna four sierra uniform, cleared into the Class Bravo, maintain VFR at or below four thousand five hundred.', choices: ['Cleared into the Bravo, at or below 4,500', 'Cleared to land', 'Squawk VFR', 'Remain clear of the Bravo'], answer: 0 },
        ],
      },
    ],
  },

  // ── UNIT 9 — FLIGHT FOLLOWING ───────────────────────────────────────────
  {
    id: 'following',
    title: 'Flight Following',
    subtitle: 'Requesting and working VFR radar advisories',
    icon: 'FF',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    checkpointScenarioId: 'vfr-flight-following-initial',
    lessons: [
      {
        id: 'ff-1',
        title: 'Requesting Advisories',
        xp: 10,
        exercises: [
          { type: 'order', id: 'f1-1', prompt: 'Put a flight-following request in the right order.', answer: ['Seattle Center', 'Cessna four sierra uniform', 'one two miles south of Paine', 'four thousand five hundred', 'request flight following to Boise'], explain: 'Facility, who you are, where you are, your altitude, then the request.' },
          { type: 'mc', id: 'f1-2', prompt: 'VFR flight following gives you:', choices: ['Guaranteed separation from all traffic', 'Traffic advisories, workload permitting', 'A clearance to deviate from VFR', 'Priority over IFR traffic'], answer: 1 },
          { type: 'type', id: 'f1-3', prompt: 'Type your read-back of "squawk 0342, ident".', accept: ['squawk', '0', '3', '4', '2', 'ident'], correct: 'Squawk 0342, ident' },
          { type: 'listen', id: 'f1-4', prompt: 'Listen, then pick the correct read-back.', audioText: 'Cessna four sierra uniform, radar contact, altimeter two niner niner two.', choices: ['Roger, altimeter 29.92', 'Cleared to land', 'Squawk 7700', 'Negative contact'], answer: 0 },
        ],
      },
      {
        id: 'ff-2',
        title: 'Changes & Termination',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'f2-1', prompt: 'ATC says "frequency change approved." You:', choices: ['Must stay on this frequency', 'May switch frequencies', 'Squawk 1200 right away', 'Declare an emergency'], answer: 1 },
          { type: 'match', id: 'f2-2', prompt: 'Match each call to its meaning.', pairs: [
            { left: 'Radar contact', right: 'ATC sees you on radar' },
            { left: 'Radar service terminated', right: 'You are on your own now' },
            { left: 'Frequency change approved', right: 'You may leave this frequency' },
            { left: 'Squawk VFR', right: 'Set 1200' },
          ] },
          { type: 'listen', id: 'f2-3', prompt: 'Listen, then pick the correct read-back.', audioText: 'Cessna four sierra uniform, radar service terminated, squawk VFR, frequency change approved.', choices: ['Squawk VFR, frequency change approved', 'Cleared for the option', 'Ident', 'Maintain this heading'], answer: 0 },
        ],
      },
    ],
  },

  // ── UNIT 10 — PHRASEOLOGY: NEVER SAY ────────────────────────────────────
  {
    id: 'phraseology',
    title: 'Phraseology',
    subtitle: 'What to say, and what never to say',
    icon: 'PHR',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    checkpointScenarioId: 'ground-taxi-hold-short',
    lessons: [
      {
        id: 'phr-1',
        title: 'Words That Fail Checkrides',
        xp: 10,
        exercises: [
          { type: 'spot', id: 'r1-1', prompt: 'Tap the non-standard word.', words: ['Copy,', 'traffic', 'in', 'sight,', 'four', 'sierra', 'uniform'], errorIndices: [0], explain: 'Never "copy" — read the instruction back, or say "traffic in sight".' },
          { type: 'mc', id: 'r1-2', prompt: 'Which is NOT standard radio phraseology?', choices: ['Roger', 'Clearspar', '10-4', 'Affirmative'], answer: 2, explain: '"10-4" is CB slang and never used in aviation.' },
          { type: 'match', id: 'r1-3', prompt: 'Match each word to what it actually means.', pairs: [
            { left: 'Roger', right: 'I received your message' },
            { left: 'Clearspar', right: 'I will comply' },
            { left: 'Affirmative', right: 'Yes' },
            { left: 'Negative', right: 'No' },
          ] },
          { type: 'spot', id: 'r1-4', prompt: 'Tap the informal phrase.', words: ['Will', 'do,', 'four', 'sierra', 'uniform'], errorIndices: [0, 1], explain: '"Will do" is non-standard — use "wilco" for instructions.' },
        ],
      },
      {
        id: 'phr-2',
        title: 'Say It Right',
        xp: 10,
        exercises: [
          { type: 'mc', id: 'r2-1', prompt: '"Roger" means:', choices: ['Yes', 'I will comply', 'I received your message', 'Say again'], answer: 2, explain: 'Roger does NOT mean "yes" and does NOT mean you will comply.' },
          { type: 'mc', id: 'r2-2', prompt: 'When may you abbreviate your own call sign?', choices: ['Whenever you like', 'Only after ATC abbreviates it first', 'Never', 'On the initial call'], answer: 1 },
          { type: 'mc', id: 'r2-3', prompt: 'Which phrase replaced "position and hold"?', choices: ['Line up and wait', 'Hold short', 'Taxi into position', 'Cleared for takeoff'], answer: 0 },
          { type: 'type', id: 'r2-4', prompt: 'Type a correct read-back of "runway 26, cleared for takeoff".', accept: ['runway', '2', '6', 'cleared', 'takeoff'], correct: 'Runway 26, cleared for takeoff, 4 Sierra Uniform' },
        ],
      },
    ],
  },
]

// ── lookups & ordering ──────────────────────────────────────────────────────

/** flat, ordered list of every lesson with its unit — drives unlock logic */
export const orderedLessons: { unit: GsUnit; lesson: GsLesson }[] = units.flatMap(
  (unit) => unit.lessons.map((lesson) => ({ unit, lesson })),
)

export function getLesson(id: string): { unit: GsUnit; lesson: GsLesson } | undefined {
  return orderedLessons.find((x) => x.lesson.id === id)
}

/** id of the lesson immediately before this one (null if first) */
export function previousLessonId(id: string): string | null {
  const i = orderedLessons.findIndex((x) => x.lesson.id === id)
  return i > 0 ? orderedLessons[i - 1].lesson.id : null
}

/** id of the next lesson (null if last) */
export function nextLessonId(id: string): string | null {
  const i = orderedLessons.findIndex((x) => x.lesson.id === id)
  return i >= 0 && i < orderedLessons.length - 1 ? orderedLessons[i + 1].lesson.id : null
}

// ── deterministic shuffle (SSR === CSR, no hydration mismatch) ───────────────

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** stable shuffle seeded by a string — same seed always yields the same order */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rng = mulberry32(hashStr(seed))
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
