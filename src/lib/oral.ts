// Pre-checkride mock oral — communications/airspace questions an examiner asks.
// Self-graded: the examiner (TTS) asks, you answer aloud, then reveal the model
// answer + key points and rate yourself. (AI auto-grading is a future upgrade.)

export interface OralQuestion {
  id: string
  area: string
  question: string
  answer: string
  keyPoints: string[]
}

export const ORAL_QUESTIONS: OralQuestion[] = [
  {
    id: 'o-classb',
    area: 'Airspace',
    question: 'What do you need before entering Class Bravo airspace?',
    answer: 'A specific clearance — the controller must say "cleared into the Class Bravo." Two-way radio contact alone is not enough.',
    keyPoints: ['Explicit "cleared into the Bravo"', 'Mode C transponder', 'Two-way contact is not sufficient'],
  },
  {
    id: 'o-classc',
    area: 'Airspace',
    question: 'What is required to enter Class Charlie airspace?',
    answer: 'Two-way radio communication established — the controller must use your call sign. A transponder with Mode C is also required.',
    keyPoints: ['Two-way comm (they say your call sign)', 'Mode C transponder', 'No explicit "cleared in" needed'],
  },
  {
    id: 'o-classd',
    area: 'Airspace',
    question: 'How do you enter Class Delta airspace?',
    answer: 'Establish two-way radio communication with the tower before entering. If they respond with your call sign, you may enter; "stand by" alone is not two-way contact.',
    keyPoints: ['Two-way contact with tower', 'Call sign in their reply = cleared to enter', '"Stand by" ≠ contact established'],
  },
  {
    id: 'o-lightgun-land',
    area: 'Lost comms',
    question: 'You have a radio failure on final at a towered field. The tower shines a steady green light. What does it mean?',
    answer: 'Steady green = cleared to land.',
    keyPoints: ['Steady green = cleared to land', 'Flashing green = return for landing', 'Rock wings / flash lights to acknowledge'],
  },
  {
    id: 'o-lightgun-ground',
    area: 'Lost comms',
    question: 'On the ground, NORDO, the tower gives a flashing red light. What does it mean?',
    answer: 'Flashing red = taxi clear of the runway in use. (Steady red on the ground = stop.)',
    keyPoints: ['Flashing red (ground) = clear the runway', 'Steady red (ground) = stop', 'Steady green (ground) = cleared for takeoff'],
  },
  {
    id: 'o-lostcomms-squawk',
    area: 'Lost comms',
    question: 'What transponder code do you set if you lose radio communication?',
    answer: 'Squawk 7600. (7700 is emergency, 7500 is hijack.)',
    keyPoints: ['7600 = lost comms', '7700 = emergency', '7500 = hijack'],
  },
  {
    id: 'o-svfr',
    area: 'Weather / clearances',
    question: 'The Class Delta field reports a 900-foot ceiling. How can you legally land VFR?',
    answer: 'Request a Special VFR clearance. ATC can clear you to operate in the surface area clear of clouds with at least 1 statute mile visibility; you must ask for it.',
    keyPoints: ['Request Special VFR', 'Clear of clouds, ≥1 SM visibility', 'Must be requested and granted'],
  },
  {
    id: 'o-atis',
    area: 'Procedures',
    question: 'What is ATIS and when do you use it?',
    answer: 'Automatic Terminal Information Service — a recorded broadcast of weather and airport conditions, updated and labeled by letter. Listen before your initial call and tell ATC you have the current information ("with information Bravo").',
    keyPoints: ['Recorded weather + airport info', 'Identified by phonetic letter', 'State you have it on initial call'],
  },
  {
    id: 'o-readback',
    area: 'Phraseology',
    question: 'Which ATC instructions must you always read back?',
    answer: 'Runway hold-short instructions, runway assignments (cleared to land / takeoff / line up and wait), and any clearance — altitude, heading, route, frequency, squawk. Hold-shorts are read back verbatim with the runway.',
    keyPoints: ['Hold short (verbatim + runway)', 'Runway assignments', 'Clearances: altitude/heading/route/squawk'],
  },
  {
    id: 'o-roger-wilco',
    area: 'Phraseology',
    question: 'What is the difference between "roger" and "wilco"?',
    answer: '"Roger" means I received your transmission. "Wilco" means I received it, understand it, and will comply. Neither replaces a required readback.',
    keyPoints: ['Roger = received', 'Wilco = received + will comply', 'Neither substitutes for a readback'],
  },
  {
    id: 'o-initial-call',
    area: 'Phraseology',
    question: 'What are the four parts of an initial call-up to ATC?',
    answer: 'Who you are calling, who you are, where you are, and what you want. Example: "Palmdale Tower, Cessna One Two Three Four Five, ten miles south, inbound landing with information Bravo."',
    keyPoints: ['Who you call', 'Who you are', 'Where you are', 'What you want'],
  },
  {
    id: 'o-emergency',
    area: 'Emergencies',
    question: 'You have an engine failure. What do you say and squawk?',
    answer: 'Declare with "Mayday, Mayday, Mayday," state call sign, problem, intentions, position, and souls/fuel if able. Squawk 7700. Aviate, navigate, then communicate.',
    keyPoints: ['Mayday ×3', 'Squawk 7700', 'Aviate-navigate-communicate'],
  },
  {
    id: 'o-vfr-squawk',
    area: 'Procedures',
    question: 'What does "squawk VFR" mean?',
    answer: 'Set your transponder to code 1200, the standard VFR code.',
    keyPoints: ['1200 = VFR code', 'Set when not on a discrete code'],
  },
  {
    id: 'o-lineup-wait',
    area: 'Phraseology',
    question: 'What does "line up and wait" authorize you to do?',
    answer: 'Taxi onto the departure runway and hold in position. It is NOT a takeoff clearance — wait for "cleared for takeoff."',
    keyPoints: ['Taxi onto runway, hold', 'Not a takeoff clearance', 'Old term was "position and hold"'],
  },
  {
    id: 'o-ctaf',
    area: 'Procedures',
    question: 'How do you operate at a non-towered airport?',
    answer: 'Self-announce your position and intentions on the CTAF, bracketing with the airport name. There is no clearance — you see and avoid and announce each pattern leg.',
    keyPoints: ['Self-announce on CTAF', 'Bracket with field name', 'See and avoid; no clearances'],
  },
  {
    id: 'o-frequency-change',
    area: 'Procedures',
    question: 'A controller says "contact Norcal Approach one two zero point niner." What do you do?',
    answer: 'Read back the frequency and your call sign, switch over, and check on with who you are and your altitude.',
    keyPoints: ['Read back freq + call sign', 'Switch frequency', 'Check on with altitude'],
  },
]
