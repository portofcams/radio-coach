export interface ModuleLesson {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string // tailwind bg class for card accent
  estimatedMinutes: number
  sections: Section[]
  practiceScenarioIds: string[]
}

export interface Section {
  type: 'rule' | 'example' | 'mistake' | 'tip'
  heading?: string
  body?: string
  atc?: string
  correct?: string
  wrong?: string[]
  penalty?: string
}

export const modules: ModuleLesson[] = [
  {
    id: 'ground-comms',
    title: 'Ground Communications',
    subtitle: 'Taxi clearances, hold shorts, progressive taxi',
    icon: 'GND',
    color: 'bg-yellow-50 border-yellow-200',
    estimatedMinutes: 8,
    practiceScenarioIds: ['ground-taxi-hold-short', 'runway-crossing', 'amended-taxi', 'engine-runup-area'],
    sections: [
      {
        type: 'rule',
        heading: 'The Golden Rule: Read Back EVERYTHING',
        body: 'ATC expects you to read back every taxi clearance, every hold-short instruction, every runway assignment. If you don\'t read it back, the controller doesn\'t know you got it. In busy Class D and C airspace, a missed readback can result in a runway incursion.',
      },
      {
        type: 'rule',
        heading: 'What Must Always Be Read Back',
        body: '1. Your call sign\n2. The runway assigned\n3. Every taxiway letter\n4. Every hold-short instruction — word for word\n5. Altimeter setting\n6. Any restriction ("remain this frequency", "contact tower")',
      },
      {
        type: 'example',
        heading: 'Taxi Clearance — Full Example',
        atc: 'Cessna 4 Sierra Uniform, Hilo Ground, taxi to runway 26 via Alpha, hold short of runway 21, altimeter 29.92.',
        correct: '4 Sierra Uniform, taxi to runway 26 via Alpha, hold short of runway 21, altimeter 29.92.',
      },
      {
        type: 'mistake',
        heading: 'Most Common Ground Mistakes',
        wrong: [
          '"Copy, 4SU" — Never say "copy". Read the clearance back.',
          '"Taxi to 26" — Missing taxiway, hold short, and altimeter.',
          '"Hold short of 21" — Missing "runway" before the designator.',
          '"29.92, 4 Sierra Uniform" — Altimeter must follow hold short, not precede the call sign.',
        ],
      },
      {
        type: 'tip',
        heading: 'Progressive Taxi',
        body: 'If ATC says "progressive taxi instructions will follow," they\'ll guide you turn by turn. Don\'t start moving until each instruction is given. Read back each leg individually: "Right on Bravo, 4 Sierra Uniform."',
      },
      {
        type: 'rule',
        heading: 'Hold Short: The Safety-Critical Call',
        body: 'Missing a hold-short instruction is an automatic FAIL on any checkride, and in real life it means a runway incursion. The phrase "hold short of runway XX" must appear verbatim in your readback. No exceptions.',
      },
      {
        type: 'example',
        heading: 'Runway Crossing',
        atc: 'Cessna 4 Sierra Uniform, cross runway 14 at Alpha.',
        correct: 'Cross runway 14 at Alpha, 4 Sierra Uniform.',
      },
    ],
  },
  {
    id: 'departure-takeoff',
    title: 'Departure & Takeoff',
    subtitle: 'Clearances, line-up-and-wait, squawk, initial departure contact',
    icon: 'DEP',
    color: 'bg-blue-50 border-blue-200',
    estimatedMinutes: 10,
    practiceScenarioIds: ['class-d-takeoff', 'line-up-wait', 'departure-squawk-heading', 'departure-turn-instruction', 'clearance-void-time'],
    sections: [
      {
        type: 'rule',
        heading: 'Tower vs. Ground — Know When You Switch',
        body: 'Ground controls you until you\'re cleared to cross or enter the runway. Then it\'s Tower. Listen for "contact tower on 118.3" or "switch to tower." Read back the frequency. Do NOT contact tower until instructed.',
      },
      {
        type: 'example',
        heading: 'Takeoff Clearance',
        atc: 'Cessna 4 Sierra Uniform, runway 26, cleared for takeoff, wind 250 at 8.',
        correct: 'Runway 26, cleared for takeoff, 4 Sierra Uniform.',
      },
      {
        type: 'rule',
        heading: 'Line-Up and Wait (LUAW)',
        body: '"Line up and wait" replaces the old "position and hold." It means taxi onto the runway and STOP. You are NOT cleared for takeoff. Wait for explicit takeoff clearance. Read back: "Line up and wait, runway XX, [call sign]."',
      },
      {
        type: 'example',
        heading: 'Line-Up and Wait',
        atc: 'Cessna 4 Sierra Uniform, runway 28 Left, line up and wait.',
        correct: 'Line up and wait, runway 28 Left, 4 Sierra Uniform.',
      },
      {
        type: 'mistake',
        heading: 'Departure Readback Errors',
        wrong: [
          'Omitting "runway XX" before "cleared for takeoff" — required in readback.',
          'Acknowledging with "Roger" only — not a valid clearance readback.',
          'Not reading back the squawk code digit by digit: say "four five two one," never "forty-five twenty-one."',
          'Missing the heading or altitude from a departure heading instruction.',
        ],
      },
      {
        type: 'example',
        heading: 'Departure with Squawk and Heading',
        atc: 'Cessna 4 Sierra Uniform, squawk 4521, fly heading 270, runway 28, cleared for takeoff.',
        correct: 'Squawk 4521, heading 270, runway 28, cleared for takeoff, 4 Sierra Uniform.',
      },
      {
        type: 'tip',
        heading: 'Clearance Void Time',
        body: 'At non-towered fields with approach control, you may get a clearance void time: "Clearance void if not off by 15 past. Time now 10 past." If you\'re not airborne by the void time, call back. Missing it starts a search-and-rescue clock.',
      },
    ],
  },
  {
    id: 'traffic-pattern',
    title: 'Traffic Pattern',
    subtitle: 'Pattern entry, sequencing, option clearances, go-arounds',
    icon: 'PAT',
    color: 'bg-green-50 border-green-200',
    estimatedMinutes: 9,
    practiceScenarioIds: ['pattern-entry', 'sequence-traffic-in-sight', 'go-around', 'cleared-for-option', 'traffic-not-in-sight'],
    sections: [
      {
        type: 'rule',
        heading: 'Pattern Entry at a Towered Airport',
        body: 'Don\'t just show up and fly the pattern. Call Tower inbound with your position and altitude: "[Airport] Tower, Cessna 4 Sierra Uniform, 5 miles northwest, 2,500, landing." Wait for pattern entry instructions. You\'ll get a runway and either a sequence or direct clearance.',
      },
      {
        type: 'example',
        heading: 'Entering Downwind',
        atc: 'Cessna 4 Sierra Uniform, enter right downwind runway 16, number 2, follow the Piper on base.',
        correct: 'Enter right downwind runway 16, number 2, traffic in sight, 4 Sierra Uniform.',
      },
      {
        type: 'rule',
        heading: '"Traffic in Sight" vs. "Looking for Traffic"',
        body: 'Say "traffic in sight" ONLY when you have visual contact with the aircraft you\'re sequenced behind. If you don\'t see it yet, say "looking for traffic." ATC will not sequence you behind traffic you can\'t see — they\'ll give you different instructions.',
      },
      {
        type: 'example',
        heading: 'Traffic Not in Sight',
        atc: 'Cessna 4 Sierra Uniform, traffic is a Cherokee on a 3-mile final, report traffic in sight.',
        correct: 'Looking for traffic, 4 Sierra Uniform.',
      },
      {
        type: 'example',
        heading: 'Cleared for the Option',
        atc: 'Cessna 4 Sierra Uniform, runway 28 Left, cleared for the option.',
        correct: 'Runway 28 Left, cleared for the option, 4 Sierra Uniform.',
      },
      {
        type: 'rule',
        heading: '"Cleared for the Option" Means All Five',
        body: 'Touch-and-go, stop-and-go, low approach, missed approach, or full stop — you choose. You don\'t need to tell Tower which one you\'re doing unless your intent changes after receiving the clearance.',
      },
      {
        type: 'example',
        heading: 'Go-Around',
        atc: 'Cessna 4 Sierra Uniform, go around.',
        correct: 'Going around, 4 Sierra Uniform.',
      },
      {
        type: 'tip',
        heading: 'Initiating Your Own Go-Around',
        body: 'You can initiate a go-around at any time without ATC permission. Click the mic AFTER you\'ve added power and are climbing: "4 Sierra Uniform, going around." Don\'t radio first — fly first.',
      },
    ],
  },
  {
    id: 'enroute-vfr',
    title: 'En Route & VFR Services',
    subtitle: 'Flight following, Class C & D entry, frequency changes, descent',
    icon: 'ENR',
    color: 'bg-purple-50 border-purple-200',
    estimatedMinutes: 10,
    practiceScenarioIds: ['vfr-flight-following-initial', 'flight-following-squawk', 'class-c-entry', 'class-d-takeoff', 'frequency-change', 'descent-and-maintain'],
    sections: [
      {
        type: 'rule',
        heading: 'Requesting Flight Following',
        body: 'Call Center or Approach with: position, altitude, aircraft type, destination, and the request. Pack it into one transmission so the controller doesn\'t have to ask follow-up questions. Example: "Seattle Center, Cessna 4 Sierra Uniform, 12 miles south of KPAE, 4,500, VFR to KBFI, request flight following."',
      },
      {
        type: 'example',
        heading: 'Flight Following Initial Call',
        atc: 'Cessna 4 Sierra Uniform, Seattle Center, squawk 0342, ident.',
        correct: 'Squawk 0342, 4 Sierra Uniform.',
      },
      {
        type: 'mistake',
        heading: 'Flight Following Mistakes',
        wrong: [
          'Not reading back the squawk code — always required.',
          'Saying "squawking 0342" instead of reading it back first, then squawking.',
          '"0342, wilco" — "wilco" doesn\'t confirm the squawk code.',
        ],
      },
      {
        type: 'rule',
        heading: 'Entering Class C Airspace',
        body: 'You must establish two-way communication BEFORE entering Class C. "Establish two-way" means ATC has called you by your call sign — an initial acknowledgment with just your call sign counts. If they say "standby," that counts. If they give no response at all, don\'t enter.',
      },
      {
        type: 'example',
        heading: 'Class C Entry',
        atc: 'Cessna 4 Sierra Uniform, Honolulu Approach, squawk 3341, report 5-mile final.',
        correct: 'Squawk 3341, will report 5-mile final, 4 Sierra Uniform.',
      },
      {
        type: 'example',
        heading: 'Frequency Change',
        atc: 'Cessna 4 Sierra Uniform, frequency change approved, good day.',
        correct: 'Frequency change approved, good day, 4 Sierra Uniform.',
      },
      {
        type: 'example',
        heading: 'Descent Instruction',
        atc: 'Cessna 4 Sierra Uniform, descend and maintain 3,500.',
        correct: 'Descend and maintain 3,500, 4 Sierra Uniform.',
      },
      {
        type: 'tip',
        heading: 'Altitude Format',
        body: 'Always say all digits: "three thousand five hundred," never "thirty-five hundred." This is an FAA AIM requirement, not a preference. On a checkride, "thirty-five hundred" is a phraseology error.',
      },
    ],
  },
  {
    id: 'ifr-clearances',
    title: 'IFR Clearances',
    subtitle: 'CRAFT format, departure instructions, approach, missed approach',
    icon: 'IFR',
    color: 'bg-gray-50 border-gray-300',
    estimatedMinutes: 12,
    practiceScenarioIds: ['ifr-clearance', 'departure-squawk-heading', 'ifr-approach-clearance', 'ifr-missed-approach'],
    sections: [
      {
        type: 'rule',
        heading: 'The CRAFT Memory Aid',
        body: 'IFR clearances follow CRAFT:\n• C — Cleared to (destination or fix)\n• R — Route\n• A — Altitude (initial, then expect)\n• F — Frequency (departure)\n• T — Transponder (squawk code)\n\nWrite it down as it comes in, in this order.',
      },
      {
        type: 'example',
        heading: 'Full IFR Clearance',
        atc: 'Cessna 4 Sierra Uniform, cleared to Boise Airport via the Seattle One departure, direct BTG, V23, direct. Climb and maintain 5,000, expect 11,000 ten minutes after departure. Departure frequency 125.65, squawk 4217.',
        correct: 'Cleared to Boise Airport via Seattle One departure, direct BTG, V23, direct. Climb and maintain 5,000, expect 11,000 ten minutes after departure. Departure 125.65, squawk 4217, 4 Sierra Uniform.',
      },
      {
        type: 'rule',
        heading: 'Read Back the Entire Clearance',
        body: 'IFR clearances must be read back completely. Every element — destination, route, altitude, expect altitude, frequency, squawk. If you miss a piece, ATC will correct you. If you read it all back correctly, you\'re cleared.',
      },
      {
        type: 'mistake',
        heading: 'IFR Readback Errors',
        wrong: [
          '"Copy, 4 Sierra Uniform" — not an IFR clearance readback.',
          'Omitting "expect 11,000 ten minutes after departure" — required.',
          'Saying the squawk as "forty-two seventeen" — must be digit-by-digit: "four two one seven."',
          'Missing the departure frequency — required readback.',
        ],
      },
      {
        type: 'example',
        heading: 'IFR Approach Clearance',
        atc: 'Cessna 4 Sierra Uniform, cleared ILS runway 16 Right approach, maintain 3,000 until established.',
        correct: 'Cleared ILS runway 16 Right approach, maintain 3,000 until established, 4 Sierra Uniform.',
      },
      {
        type: 'example',
        heading: 'Missed Approach',
        atc: 'Cessna 4 Sierra Uniform, execute missed approach, climb and maintain 3,000, turn right heading 180.',
        correct: 'Executing missed approach, climb and maintain 3,000, right heading 180, 4 Sierra Uniform.',
      },
      {
        type: 'tip',
        heading: 'Wake Turbulence Separation',
        body: 'After a heavy jet, ATC may say "caution, wake turbulence." You don\'t need to read back the caution, but you do need to read back any associated instructions. "Caution wake turbulence, wind 270 at 6" → read back the wind, acknowledge the caution: "Wind 270 at 6, wilco, 4 Sierra Uniform."',
      },
    ],
  },
  {
    id: 'phraseology-rules',
    title: 'Phraseology Rules',
    subtitle: 'What to say, what never to say, and why it matters',
    icon: 'PHR',
    color: 'bg-red-50 border-red-200',
    estimatedMinutes: 7,
    practiceScenarioIds: ['ground-taxi-hold-short', 'class-d-takeoff', 'ifr-clearance'],
    sections: [
      {
        type: 'rule',
        heading: 'Words That Are Never Standard',
        body: 'These phrases fail checkrides and confuse controllers. Never use them:\n• "Copy" / "Copy that" — says nothing about what you copied\n• "10-4" — CB radio slang\n• "Will do" — not a clearance readback\n• "For sure" — informal\n• "No problem" — informal\n• "Affirmative" where the element itself should be stated',
      },
      {
        type: 'mistake',
        heading: '"Roger" vs. "Wilco" vs. "Affirmative"',
        wrong: [
          '"Roger" = "I received your message." Does NOT mean you will comply.',
          '"Wilco" = "I will comply." Used for instructions, not clearances.',
          '"Affirmative" = "Yes." Only use when a yes/no answer is needed, not in place of reading back a clearance.',
          '"Roger that" — the "that" is informal. "Roger" is correct.',
        ],
        penalty: 'Using these wrong costs points but isn\'t an automatic fail unless it replaces a safety-critical readback.',
      },
      {
        type: 'rule',
        heading: 'Call Sign Every Time',
        body: 'Your call sign ends every transmission, or begins it. ATC uses it to confirm they\'re talking to you. On initial contact, state the full call sign: "Cessna 4 Sierra Uniform." After that, abbreviated is fine: "4 Sierra Uniform" or even "4SU" if ATC uses it first.',
      },
      {
        type: 'tip',
        heading: 'Pilot-Initiated Call Sign Abbreviation',
        body: 'You may NOT abbreviate your own call sign until ATC abbreviates it first. If ATC says "4SU, cleared for takeoff," you can respond "cleared for takeoff, 4SU." If they haven\'t abbreviated it, always use the full call sign.',
      },
      {
        type: 'rule',
        heading: 'Number Formats That Are Always Required',
        body: '• Altitude: all digits — "five thousand five hundred" not "fifty-five hundred"\n• Frequency: digit by digit — "one two four point seven five"\n• Squawk: digit by digit — "four five two one"\n• Runway: L/R/C when assigned — "two eight left" not "two eight"\n• Heading: three digits — "heading two seven zero"',
      },
      {
        type: 'mistake',
        heading: 'The "Readback Required" vs. "Acknowledgement Only" Rule',
        wrong: [
          'Traffic advisories — acknowledge only: "Traffic in sight, 4SU" or "Looking for traffic, 4SU."',
          'Taxi clearances — full readback required, including hold short.',
          'Takeoff/landing clearances — full readback required.',
          'Altimeter settings — required readback.',
          '"Wilco" alone is never sufficient for a clearance readback.',
        ],
      },
      {
        type: 'example',
        heading: 'The Perfect Transmission Template',
        atc: '[ATC facility says anything with an instruction]',
        correct: '[Instruction read back verbatim] + [your call sign at the end]',
      },
    ],
  },
]

export function getModule(id: string): ModuleLesson | undefined {
  return modules.find((m) => m.id === id)
}
