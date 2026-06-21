// Airspace-class hubs — programmatic SEO for "how to talk to ATC in Class X".
// Radio-requirement focused, AIM-accurate, each links to practice.
export interface AirspaceClass {
  slug: string
  klass: string
  title: string
  oneLine: string
  requirement: string
  sections: Array<{ h: string; p: string }>
  guide?: string // related /guides slug
}

export const AIRSPACE: AirspaceClass[] = [
  {
    slug: 'class-b',
    klass: 'Class B',
    title: 'Flying into Class Bravo: the radio calls & what you need',
    oneLine: 'The busiest airports. You need an explicit clearance to enter.',
    requirement: 'Specific clearance — ATC must say "cleared into the Class Bravo."',
    guide: 'class-b-entry',
    sections: [
      { h: 'What you need to enter', p: 'A specific clearance, not just two-way contact. Until you hear "cleared into the Class Bravo," you stay out. You also need a Mode C transponder and, for the primary airport, a private certificate or student endorsement.' },
      { h: 'The call', p: 'Call the approach facility with type, position, altitude, and request: "Norcal Approach, Cessna One Two Three Four Five, two zero miles south, four thousand five hundred, request Bravo transition." Then wait for the clearance before entering.' },
      { h: 'Read it back', p: 'Read back the clearance and any altitude or heading restriction: "Cleared into the Class Bravo, maintain at or below three thousand five hundred, Cessna One Two Three Four Five."' },
      { h: 'If you are not cleared', p: 'If you only get "remain clear of the Bravo," you must stay out until cleared. Acknowledge it and hold outside the boundary.' },
    ],
  },
  {
    slug: 'class-c',
    klass: 'Class C',
    title: 'Class Charlie radio procedures: two-way contact to enter',
    oneLine: 'Moderately busy airports. Two-way radio contact gets you in.',
    requirement: 'Two-way radio communication established (the controller uses your call sign).',
    sections: [
      { h: 'What "two-way contact" means', p: 'You are cleared to enter once the controller answers with your call sign. "Cessna One Two Three Four Five, standby" counts as two-way contact — but a generic "aircraft calling, standby" does not. You also need a Mode C transponder.' },
      { h: 'The call', p: '"Socal Approach, Cessna One Two Three Four Five, one five miles north, three thousand five hundred, inbound for landing." When they reply using your call sign, you may enter.' },
      { h: 'No explicit clearance needed', p: 'Unlike Class B, you do not need the words "cleared to enter." Establishing two-way contact is the gate.' },
    ],
  },
  {
    slug: 'class-d',
    klass: 'Class D',
    title: 'Class Delta: how to talk to a control tower',
    oneLine: 'Towered airports. Establish two-way contact with the tower before entering.',
    requirement: 'Two-way radio communication with the tower before entering.',
    guide: 'initial-call-up',
    sections: [
      { h: 'Establish contact first', p: 'Call the tower before you enter the airspace (typically a 4-NM radius to 2,500 ft AGL). If the tower answers with your call sign, you are cleared to enter; "stand by" alone is not contact established.' },
      { h: 'The call', p: '"Palmdale Tower, Cessna One Two Three Four Five, one zero miles west, two thousand five hundred, inbound landing with information Bravo." Have the ATIS first.' },
      { h: 'Read back the pattern', p: 'Read back runway and pattern instructions: "Make left traffic runway two five, report midfield, Cessna One Two Three Four Five." And read back the landing clearance with the runway.' },
    ],
  },
  {
    slug: 'class-e',
    klass: 'Class E',
    title: 'Class Echo airspace: controlled, but no clearance to enter VFR',
    oneLine: 'Controlled airspace where no radio call is required for VFR.',
    requirement: 'None for VFR — but it is where IFR traffic operates, so use advisories.',
    sections: [
      { h: 'What it is', p: 'Class E is controlled airspace that is not B, C, or D. As a VFR pilot you do not need to talk to anyone to fly in it, but IFR traffic is being separated here, so flight following is smart.' },
      { h: 'Radio etiquette', p: 'There is no entry call, but requesting VFR flight following gets you traffic advisories in Class E and a controller watching your route.' },
      { h: 'Surface-area Class E', p: 'Some non-towered airports have Class E to the surface for instrument approaches. In low weather you may need a Special VFR clearance to operate there — and you must request it.' },
    ],
  },
  {
    slug: 'class-g',
    klass: 'Class G',
    title: 'Class Golf (uncontrolled): self-announce on the CTAF',
    oneLine: 'Uncontrolled airspace. No ATC — you see, avoid, and announce.',
    requirement: 'No ATC contact required. Self-announce on the CTAF at non-towered fields.',
    guide: 'ctaf-self-announce',
    sections: [
      { h: 'No one to call', p: 'Class G has no ATC service. At a non-towered airport you announce your position and intentions on the CTAF so other pilots can sequence around you.' },
      { h: 'The calls', p: 'Bracket each call with the field name: "Lincoln traffic, Cessna One Two Three Four Five, left downwind runway one eight, Lincoln." Announce inbound, each pattern leg, and clear of the runway.' },
      { h: 'See and avoid', p: 'Without a controller, separation is on you. The radio supplements looking outside — it does not replace it.' },
    ],
  },
]

export function getAirspace(slug: string): AirspaceClass | undefined {
  return AIRSPACE.find((a) => a.slug === slug)
}
