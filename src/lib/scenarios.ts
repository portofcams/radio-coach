import type { Scenario } from './types'

export const scenarios: Scenario[] = [
  {
    id: 'ground-taxi-hold-short',
    title: 'Ground taxi with hold short',
    phase: 'ground',
    difficulty: 1,
    airport: 'PHTO',
    setup:
      "You're at Hilo Airport (PHTO), parked on the GA ramp. You've called ground and are ready to taxi. Listen carefully — there's a hold short buried in the instruction.",
    atcTransmission:
      'Cessna One Two Three Four Five, Hilo Ground, taxi to runway three via taxiway Alpha, hold short of runway two six.',
    requiredElements: [
      'call sign',
      'taxi to runway three',
      'via Alpha',
      'hold short runway two six',
    ],
    correctReadback:
      'Taxi runway three via Alpha, hold short runway two six, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Omitting the hold short instruction entirely',
      'Saying "hold short of two six" without the runway word',
      'Forgetting call sign',
    ],
  },
  {
    id: 'runway-crossing',
    title: 'Runway crossing clearance',
    phase: 'ground',
    difficulty: 1,
    airport: 'PHTO',
    setup:
      "You're taxiing and ground has just cleared you to cross an active runway. This is a safety-critical readback — every element is required.",
    atcTransmission:
      'Cessna One Two Three Four Five, cross runway two two left at Alpha, contact tower one one eight point three when clear.',
    requiredElements: [
      'call sign',
      'cross runway two two left',
      'at Alpha',
      'one one eight point three',
    ],
    correctReadback:
      'Cross runway two two left at Alpha, one one eight point three, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "two two" instead of "two two left" — runway designators matter',
      'Skipping the taxiway intersection',
      'Missing the tower frequency',
    ],
  },
  {
    id: 'amended-taxi',
    title: 'Amended taxi instruction',
    phase: 'ground',
    difficulty: 2,
    airport: 'KPAE',
    setup:
      "You're already taxiing when ground calls with a change. Amended clearances are easy to mess up — your brain is still on the old route.",
    atcTransmission:
      'Cessna One Two Three Four Five, amended clearance — turn left on Bravo, hold short of runway eight left.',
    requiredElements: [
      'call sign',
      'left on Bravo',
      'hold short runway eight left',
    ],
    correctReadback:
      'Left on Bravo, hold short runway eight left, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Repeating the original taxi clearance instead of the amendment',
      'Missing the hold short point',
      'Not acknowledging it is an amended clearance',
    ],
  },
  {
    id: 'engine-runup-area',
    title: 'Taxi to run-up area',
    phase: 'ground',
    difficulty: 1,
    airport: 'KPAE',
    setup:
      "You're departing IFR and need to copy your clearance and do a run-up. Ground has sent you to the run-up area adjacent to the hold short.",
    atcTransmission:
      'Cessna One Two Three Four Five, taxi to runway two eight right run-up area via Foxtrot, hold short of runway two eight right.',
    requiredElements: [
      'call sign',
      'run-up area runway two eight right',
      'via Foxtrot',
      'hold short runway two eight right',
    ],
    correctReadback:
      'Run-up area runway two eight right via Foxtrot, hold short runway two eight right, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Missing the hold short — the run-up area is not a clearance to enter the runway',
      'Omitting the taxiway routing',
      'Saying "taxi to run-up" without the runway designation',
    ],
  },
  {
    id: 'atis-initial-call',
    title: 'Copying ATIS — initial ground call',
    phase: 'ground',
    difficulty: 2,
    airport: 'PHOG',
    setup:
      "You've tuned the ATIS and copied Information Bravo. Now you're calling ground to request taxi. This is an initial call, not a readback — but it must include the information identifier.",
    atcTransmission:
      'Cessna One Two Three Four Five, Kahului Ground, go ahead.',
    requiredElements: [
      'aircraft type',
      'location on field',
      'VFR intentions',
      'information Bravo',
    ],
    correctReadback:
      'Kahului Ground, Cessna One Two Three Four Five, Cessna One Seventy Two, west ramp, VFR to Hilo, with information Bravo.',
    commonMistakes: [
      'Forgetting to state "information Bravo" — ground will ask you to copy ATIS again',
      'Skipping your location on the field',
      'Not stating your destination or intentions',
    ],
  },
  {
    id: 'hold-short-critical',
    title: 'Hold short — runway incursion scenario',
    phase: 'ground',
    difficulty: 3,
    airport: 'KPAE',
    setup:
      "This one has got pilots killed. Ground has cleared you to taxi to the runway — but included a hold short at an intersection along the way. Miss it and you could roll onto an active runway.",
    atcTransmission:
      'Cessna One Two Three Four Five, taxi to runway two eight via Echo and Alpha, hold short of runway two eight at Alpha.',
    requiredElements: [
      'call sign',
      'taxi runway two eight',
      'via Echo and Alpha',
      'hold short runway two eight at Alpha',
    ],
    correctReadback:
      'Taxi runway two eight via Echo and Alpha, hold short runway two eight at Alpha, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Missing the hold short — automatic fail, this is a runway incursion',
      'Saying "hold short of two eight" without "at Alpha" — the intersection matters',
      'Confusing Echo and Alpha order',
    ],
  },
  {
    id: 'class-d-takeoff',
    title: 'Class D takeoff clearance',
    phase: 'departure',
    difficulty: 1,
    airport: 'PHTO',
    setup:
      "You're holding short of runway 3 at a Class D airport. Tower has just cleared you. Read back everything that matters for safety.",
    atcTransmission:
      'Cessna One Two Three Four Five, runway three, wind zero three zero at one two, cleared for takeoff.',
    requiredElements: ['call sign', 'runway three', 'cleared for takeoff'],
    correctReadback:
      'Runway three, cleared for takeoff, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Reading back the wind — not required, wastes time on freq',
      'Saying "roger, cleared for takeoff" — "roger" adds nothing',
      'Forgetting runway number',
    ],
  },
  {
    id: 'line-up-wait',
    title: 'Line up and wait',
    phase: 'departure',
    difficulty: 1,
    airport: 'KPAE',
    setup:
      "Tower isn't ready to clear you for takeoff yet — there's traffic on final. They've told you to position on the runway and wait. This is a critical readback: do NOT say cleared for takeoff.",
    atcTransmission:
      'Cessna One Two Three Four Five, runway two two left, line up and wait.',
    requiredElements: ['call sign', 'runway two two left', 'line up and wait'],
    correctReadback:
      'Runway two two left, line up and wait, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "cleared for takeoff" — you are NOT cleared for takeoff yet',
      'Saying "position and hold" — that phrase was retired in 2010, use "line up and wait"',
      'Missing the runway designator',
    ],
  },
  {
    id: 'departure-squawk-heading',
    title: 'Departure with squawk, heading, and altitude',
    phase: 'departure',
    difficulty: 2,
    airport: 'KSEA',
    setup:
      "You've just lifted off from a Class C airport and approach has given you post-departure instructions. Four elements — get them all.",
    atcTransmission:
      'Cessna One Two Three Four Five, after departure fly heading one eight zero, climb and maintain three thousand, squawk four five two one.',
    requiredElements: [
      'call sign',
      'heading one eight zero',
      'three thousand',
      'squawk four five two one',
    ],
    correctReadback:
      'Heading one eight zero, climb and maintain three thousand, squawk four five two one, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "thirty-five hundred" for altitudes — always full words: "three thousand five hundred"',
      'Missing the squawk code',
      'Reversing squawk digits',
    ],
  },
  {
    id: 'departure-turn-instruction',
    title: 'After-departure turn instruction',
    phase: 'departure',
    difficulty: 2,
    airport: 'KSEA',
    setup:
      "You're airborne and tower has given you a specific departure turn to avoid conflicting traffic. The turn and altitude are both required in your readback.",
    atcTransmission:
      'Cessna One Two Three Four Five, turn left heading two seven zero, maintain at or below two thousand until clear of the Class Charlie.',
    requiredElements: [
      'call sign',
      'left heading two seven zero',
      'at or below two thousand',
    ],
    correctReadback:
      'Left heading two seven zero, at or below two thousand, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Forgetting "at or below" — "maintain two thousand" is a different clearance',
      'Saying "heading two seventy" — say each digit: "two seven zero"',
      'Missing the turn direction',
    ],
  },
  {
    id: 'wake-turbulence',
    title: 'Wake turbulence caution before takeoff',
    phase: 'departure',
    difficulty: 2,
    airport: 'KSEA',
    setup:
      "Tower has given you takeoff clearance but included a wake turbulence caution. You must acknowledge the caution explicitly — silence isn't a readback.",
    atcTransmission:
      'Cessna One Two Three Four Five, runway eight right, caution wake turbulence, Boeing Seven Six Seven departed runway eight left two minutes ago, cleared for takeoff.',
    requiredElements: [
      'call sign',
      'acknowledge wake turbulence',
      'runway eight right',
      'cleared for takeoff',
    ],
    correctReadback:
      'Caution wake turbulence noted, runway eight right, cleared for takeoff, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Omitting the wake turbulence acknowledgment — safety item',
      'Just saying "cleared for takeoff" without the caution acknowledgment',
      'Saying "will avoid wake turbulence" — unnecessary, just acknowledge',
    ],
  },
  {
    id: 'pattern-entry',
    title: 'Pattern entry instruction',
    phase: 'pattern',
    difficulty: 1,
    airport: 'KPAE',
    setup:
      "You're inbound VFR and tower has given you your pattern entry. Read back the leg, runway, and the reporting point.",
    atcTransmission:
      'Cessna One Two Three Four Five, enter left downwind runway two two, report midfield.',
    requiredElements: [
      'call sign',
      'left downwind',
      'runway two two',
      'report midfield',
    ],
    correctReadback:
      'Left downwind runway two two, will report midfield, Cessna One Two Three Four Five.',
    commonMistakes: [
      "Saying 'entering downwind' — you haven't entered it yet, say 'left downwind'",
      'Missing the reporting point',
      'Not including runway number',
    ],
  },
  {
    id: 'sequence-traffic-in-sight',
    title: 'Sequence with traffic in sight',
    phase: 'pattern',
    difficulty: 2,
    airport: 'KPAE',
    setup:
      "You're in the pattern and tower has sequenced you behind another aircraft. You need to confirm you have the traffic visually.",
    atcTransmission:
      'Cessna One Two Three Four Five, number two traffic, follow the Piper Cherokee on left base, report turning final.',
    requiredElements: [
      'call sign',
      'traffic in sight',
      'report turning final',
    ],
    correctReadback:
      'Traffic in sight, will report turning final, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "I see them" — not standard, say "traffic in sight"',
      'Forgetting to include the reporting point',
      'Saying "roger" and moving on without acknowledging traffic',
    ],
  },
  {
    id: 'go-around',
    title: 'Immediate go-around',
    phase: 'pattern',
    difficulty: 2,
    airport: 'KPAE',
    setup:
      "You're on short final and tower has called an immediate go-around. This is urgent — your readback needs to be immediate and crisp. Fly the airplane first, talk second.",
    atcTransmission:
      'Cessna One Two Three Four Five, go around, traffic on the runway, fly runway heading, maintain two thousand.',
    requiredElements: [
      'call sign',
      'going around',
      'runway heading',
      'two thousand',
    ],
    correctReadback:
      'Going around, runway heading, two thousand, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Long readback while still on approach — aviate first, brief is better',
      'Missing the altitude',
      'Saying "roger" instead of "going around" — confirm the action',
    ],
  },
  {
    id: 'cleared-for-option',
    title: 'Cleared for the option',
    phase: 'pattern',
    difficulty: 2,
    airport: 'KPAE',
    setup:
      "Tower has cleared you for the option — you can land, touch-and-go, stop-and-go, or go around. This is common during training. Read back the clearance and runway.",
    atcTransmission:
      'Cessna One Two Three Four Five, runway two eight left, cleared for the option, make right traffic.',
    requiredElements: [
      'call sign',
      'runway two eight left',
      'cleared for the option',
      'right traffic',
    ],
    correctReadback:
      'Runway two eight left, cleared for the option, right traffic, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "cleared to land" — you were cleared for the option, not specifically to land',
      'Missing the traffic direction — right traffic vs left traffic matters',
      'Forgetting the runway number',
    ],
  },
  {
    id: 'traffic-not-in-sight',
    title: 'Traffic advisory — not in sight',
    phase: 'enroute',
    difficulty: 1,
    airport: 'PHKO',
    setup:
      "Approach has called traffic for you. You've looked but can't find it. Your response tells the controller whether to keep issuing advisories.",
    atcTransmission:
      "Cessna One Two Three Four Five, traffic one o'clock, two miles, northbound, two thousand five hundred, a Cessna One Seventy Two.",
    requiredElements: ['call sign', 'looking / negative contact'],
    correctReadback:
      'Looking, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "no traffic" — the correct phrase is "looking" or "negative contact"',
      'Not responding at all — always acknowledge traffic calls',
      "Saying 'I don't see it' — non-standard",
    ],
  },
  {
    id: 'flight-following-squawk',
    title: 'VFR flight following — squawk and ident',
    phase: 'enroute',
    difficulty: 1,
    airport: 'PHKO',
    setup:
      "You've requested VFR flight following and approach has assigned you a squawk. Set it and read it back.",
    atcTransmission:
      'Cessna One Two Three Four Five, squawk four seven one five, ident.',
    requiredElements: ['call sign', 'squawking four seven one five', 'ident'],
    correctReadback:
      'Squawking four seven one five, ident, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "four seven fifteen" — say each digit: "four seven one five"',
      'Forgetting to actually push the ident button',
      'Missing the call sign',
    ],
  },
  {
    id: 'vfr-flight-following-initial',
    title: 'Requesting VFR flight following',
    phase: 'enroute',
    difficulty: 2,
    airport: 'PHNL',
    setup:
      "You want to pick up VFR flight following for your cross-country. Your initial call to approach must include your position, altitude, destination, and request — all in one transmission.",
    atcTransmission:
      'Cessna One Two Three Four Five, Honolulu Approach, go ahead.',
    requiredElements: [
      'call sign',
      'aircraft type',
      'position',
      'altitude',
      'destination',
      'request VFR flight following',
    ],
    correctReadback:
      'Honolulu Approach, Cessna One Two Three Four Five, Cessna One Seventy Two, five miles south of Kalaeloa, four thousand five hundred, VFR to Hilo, request VFR flight following.',
    commonMistakes: [
      'Skipping position — approach needs to know where to look for you on radar',
      'Forgetting aircraft type — helps controllers identify your radar target',
      'Not stating destination — they need to know who to hand you off to',
    ],
  },
  {
    id: 'class-c-entry',
    title: 'Class C airspace — initial contact',
    phase: 'enroute',
    difficulty: 2,
    airport: 'PHNL',
    setup:
      "You're inbound to a Class C airport and have copied ATIS Information Charlie. You need to establish two-way radio contact before entering the 10nm veil. Your call must include specific elements.",
    atcTransmission:
      'Cessna One Two Three Four Five, Honolulu Approach, radar contact, altimeter two niner niner two, expect runway two six left.',
    requiredElements: [
      'call sign',
      'altimeter two niner niner two',
      'runway two six left',
    ],
    correctReadback:
      'Two niner niner two, runway two six left, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Reading back "altimeter" — just the four digits',
      'Saying "twenty-nine ninety-two" — always "two niner niner two"',
      'Missing the runway assignment',
    ],
  },
  {
    id: 'frequency-change',
    title: 'Frequency change approved',
    phase: 'enroute',
    difficulty: 1,
    airport: 'KPAE',
    setup:
      "You're in uncontrolled airspace and approach has released you. This is one of the simplest transmissions — but students get it wrong by overthinking it.",
    atcTransmission:
      'Cessna One Two Three Four Five, frequency change approved, good day.',
    requiredElements: ['call sign', 'good day'],
    correctReadback: 'Good day, Cessna One Two Three Four Five.',
    commonMistakes: [
      "Saying 'switching to CTAF' — ATC doesn't need to know",
      'Long-winded "thank you for your services, switching to one two two point eight" — one phrase',
      'Saying "roger" and nothing else — always close with call sign',
    ],
  },
  {
    id: 'descent-and-maintain',
    title: 'Descent clearance — enroute',
    phase: 'enroute',
    difficulty: 2,
    airport: 'KPAE',
    setup:
      "You're cruising at eight thousand on flight following and approach has started bringing you down for the arrival sequence. Altitude is the critical element — say it back exactly.",
    atcTransmission:
      'Cessna One Two Three Four Five, descend and maintain four thousand five hundred, altimeter two niner eight seven.',
    requiredElements: [
      'call sign',
      'descend and maintain four thousand five hundred',
      'two niner eight seven',
    ],
    correctReadback:
      'Descend and maintain four thousand five hundred, two niner eight seven, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "forty-five hundred" — always say "four thousand five hundred"',
      'Missing the altimeter setting',
      'Saying "descending to four five" — say the full altitude',
    ],
  },
  {
    id: 'ctaf-position-report',
    title: 'CTAF position announcement — uncontrolled airport',
    phase: 'enroute',
    difficulty: 1,
    airport: 'PHDH',
    setup:
      "You're approaching an uncontrolled airport. There's no tower — you make self-announce position calls on CTAF. This isn't a readback scenario, it's a transmission drill. State all required elements.",
    atcTransmission:
      '(No ATC — you are making a self-announce call at Dillingham Airport, PHDH, on CTAF 122.8. You are 5 miles to the east at 1,500 feet, inbound for runway 8.)',
    requiredElements: [
      'airport name',
      'call sign',
      'position and altitude',
      'intentions',
      'airport name again',
    ],
    correctReadback:
      'Dillingham traffic, Cessna One Two Three Four Five, five miles east, one thousand five hundred, inbound runway eight, Dillingham.',
    commonMistakes: [
      'Calling "any traffic in the area" — say the airport name instead',
      'Skipping altitude — other traffic needs to know vertical separation',
      'Forgetting the second airport name at the end — required for CTAF calls',
    ],
  },
  {
    id: 'ifr-clearance',
    title: 'IFR departure clearance (CRAFT)',
    phase: 'ifr',
    difficulty: 3,
    airport: 'PHKO',
    setup:
      "You're IFR, on the ground, calling clearance delivery. They're about to read you your full departure clearance. Use CRAFT: Clearance limit, Route, Altitude, Frequency, Transponder. Write it down — then read it back verbatim.",
    atcTransmission:
      'Cessna One Two Three Four Five is cleared to Kona Airport as filed, climb and maintain eight thousand, expect one zero thousand in one zero minutes after departure. Departure frequency one two four point zero, squawk two seven three one.',
    requiredElements: [
      'call sign',
      'cleared to Kona Airport as filed',
      'eight thousand',
      'expect one zero thousand in one zero minutes',
      'one two four point zero',
      'squawk two seven three one',
    ],
    correctReadback:
      'Cleared to Kona Airport as filed, climb and maintain eight thousand, expect one zero thousand in one zero minutes after departure, departure one two four point zero, squawk two seven three one, Cessna One Two Three Four Five.',
    commonMistakes: [
      "Skipping the 'expect' altitude — it's required even though you won't see it until en route",
      'Saying "one twenty four point zero" — say each digit: "one two four point zero"',
      'Reading back in the wrong order — follow CRAFT sequence',
      'Forgetting "as filed" for the route',
    ],
  },
  {
    id: 'ifr-approach-clearance',
    title: 'ILS approach clearance',
    phase: 'ifr',
    difficulty: 3,
    airport: 'KSEA',
    setup:
      "You're in IMC on an IFR flight plan. Approach has vectored you to the final approach course and is about to clear you for the ILS. Every element must be read back.",
    atcTransmission:
      'Cessna One Two Three Four Five, three miles from FLUKE, cleared ILS runway two eight left approach, cross FLUKE at or above two thousand two hundred, contact tower one one eight point three at the outer marker.',
    requiredElements: [
      'call sign',
      'cleared ILS runway two eight left approach',
      'cross FLUKE at or above two thousand two hundred',
      'tower one one eight point three at outer marker',
    ],
    correctReadback:
      'Cleared ILS runway two eight left approach, cross FLUKE at or above two thousand two hundred, tower one one eight point three at the outer marker, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Saying "cleared for ILS" without the full runway designation',
      'Missing the crossing restriction at the fix — altitude constraints are required readback',
      'Forgetting the tower frequency handoff',
      'Saying "two twenty-two hundred" instead of "two thousand two hundred"',
    ],
  },
  {
    id: 'ifr-missed-approach',
    title: 'Missed approach instructions',
    phase: 'ifr',
    difficulty: 3,
    airport: 'KSEA',
    setup:
      "You broke out below minimums but the runway environment isn't in sight. You're going missed. ATC has new instructions that differ from the published missed approach — read them back exactly.",
    atcTransmission:
      'Cessna One Two Three Four Five, fly heading two seven zero, climb and maintain four thousand, expect vectors for the ILS runway two eight left.',
    requiredElements: [
      'call sign',
      'heading two seven zero',
      'four thousand',
      'expect vectors ILS runway two eight left',
    ],
    correctReadback:
      'Heading two seven zero, climb and maintain four thousand, expect vectors ILS runway two eight left, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Following the published missed approach instead — ATC instructions take priority',
      'Missing the heading — critical for separation from other traffic',
      'Forgetting to say "climb and maintain" — just "four thousand" is ambiguous',
    ],
  },
  {
    id: 'clearance-void-time',
    title: 'IFR clearance with void time (non-radar)',
    phase: 'ifr',
    difficulty: 3,
    airport: 'PHTO',
    setup:
      "You're departing a remote non-radar airport IFR. Clearance delivery has given you a void time — if you're not airborne by that time, the clearance is cancelled. The void time is as critical as any element in the clearance.",
    atcTransmission:
      'Cessna One Two Three Four Five is cleared to Hilo Airport as filed, climb and maintain six thousand, departure frequency one two zero point five, squawk three three four one. Clearance void if not airborne by zero one three zero Zulu. If not airborne by zero one three zero, advise Honolulu Center intentions no later than zero one four five Zulu.',
    requiredElements: [
      'call sign',
      'cleared to Hilo as filed',
      'six thousand',
      'one two zero point five',
      'squawk three three four one',
      'void time zero one three zero Zulu',
      'advise intentions by zero one four five Zulu if not airborne',
    ],
    correctReadback:
      'Cleared to Hilo Airport as filed, climb and maintain six thousand, one two zero point five, squawk three three four one, clearance void zero one three zero Zulu, will advise by zero one four five if not airborne, Cessna One Two Three Four Five.',
    commonMistakes: [
      'Missing the void time — if you depart after the void, you have no clearance and no separation',
      'Forgetting the "advise intentions" time — required readback element',
      'Not reading back the squawk',
    ],
  },
]

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id)
}

export function getScenariosByPhase(phase: Scenario['phase']): Scenario[] {
  return scenarios.filter((s) => s.phase === phase)
}
