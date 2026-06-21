// FAR/AIM flashcards — the facts student pilots must memorize. Front = prompt,
// back = answer. Used with a Leitner spaced-repetition deck on /flashcards.
export interface Flashcard {
  id: string
  category: string
  front: string
  back: string
}

export const FLASHCARDS: Flashcard[] = [
  { id: 'f1', category: 'Fuel', front: 'VFR fuel reserves — day and night?', back: 'Day: to the first point of intended landing + 30 min at cruise. Night: + 45 min. (FAR 91.151)' },
  { id: 'f2', category: 'Currency', front: 'Passenger-carrying currency requirement?', back: '3 takeoffs & landings in the preceding 90 days, same category/class (and type if required). Night adds 3 to a full stop. (FAR 61.57)' },
  { id: 'f3', category: 'Currency', front: 'Flight review interval?', back: 'A flight review every 24 calendar months: ≥1 hr ground + ≥1 hr flight with an instructor. (FAR 61.56)' },
  { id: 'f4', category: 'Documents', front: 'Documents required aboard the aircraft (ARROW)?', back: 'Airworthiness cert, Registration, Radio license (international), Operating limitations (POH/placards), Weight & balance.' },
  { id: 'f5', category: 'Documents', front: 'Pilot documents you must carry?', back: 'Pilot certificate, photo ID, and a valid medical certificate (or BasicMed). (FAR 61.3)' },
  { id: 'f6', category: 'Inspections', front: 'Required inspections (AV1ATE)?', back: 'Annual (12 cal months), VOR (30 days, IFR), 100-hr (if for hire), Altimeter/pitot-static (24 mo, IFR), Transponder (24 mo), ELT (12 mo / 1-hr or 50% battery).' },
  { id: 'f7', category: 'Equipment', front: 'Day VFR required equipment (ATOMATOFLAMES)?', back: 'Airspeed, Tachometer, Oil temp, Manifold pressure, Altimeter, Temp gauge, Oil pressure, Fuel gauge, Landing gear position, Anti-collision lights, Magnetic compass, ELT, Seatbelts.' },
  { id: 'f8', category: 'Equipment', front: 'Night VFR adds (FLAPS)?', back: 'Fuses (spare set), Landing light (if for hire), Anti-collision lights, Position lights, Source of electrical power.' },
  { id: 'f9', category: 'Weather', front: 'Class B VFR weather minimums?', back: '3 SM visibility and clear of clouds.' },
  { id: 'f10', category: 'Weather', front: 'Class C/D/E (below 10,000 MSL) VFR minimums?', back: '3 SM and 500 ft below / 1,000 ft above / 2,000 ft horizontal from clouds (3-152).' },
  { id: 'f11', category: 'Weather', front: 'Class G day, ≤1,200 AGL VFR minimums?', back: '1 SM and clear of clouds. (Night: 3 SM with 152 cloud clearances.)' },
  { id: 'f12', category: 'Weather', front: 'Above 10,000 MSL (and >1,200 AGL) VFR minimums?', back: '5 SM and 1,000 below / 1,000 above / 1 SM horizontal from clouds (5-111).' },
  { id: 'f13', category: 'Oxygen', front: 'Supplemental oxygen rules (FAR 91.211)?', back: 'Above 12,500–14,000 MSL cabin: crew uses O2 after 30 min. Above 14,000: crew at all times. Above 15,000: O2 offered to passengers.' },
  { id: 'f14', category: 'Airspace', front: 'Mode C transponder required where?', back: 'Class A/B/C; within the 30 NM Mode C veil of a Class B primary; above 10,000 MSL (except ≤2,500 AGL); above Class C. ADS-B Out in the same airspace.' },
  { id: 'f15', category: 'Airspace', front: 'What gets you into Class B vs Class C/D?', back: 'Class B: an explicit clearance ("cleared into the Bravo"). Class C/D: two-way radio contact established (controller uses your call sign).' },
  { id: 'f16', category: 'Altitudes', front: 'VFR cruising altitudes (above 3,000 AGL)?', back: 'Magnetic course 0–179°: odd thousands + 500 (e.g., 5,500). 180–359°: even thousands + 500 (e.g., 4,500). (FAR 91.159)' },
  { id: 'f17', category: 'Altitudes', front: 'Minimum safe altitudes (FAR 91.119)?', back: 'Anywhere: able to land without hazard. Congested: 1,000 ft above the highest obstacle within 2,000 ft. Other than congested: 500 ft AGL.' },
  { id: 'f18', category: 'Right of way', front: 'Right-of-way order when converging?', back: 'Distress > balloon > glider > airship > airplane/rotorcraft. When converging same category: the aircraft on the RIGHT has the right of way. (FAR 91.113)' },
  { id: 'f19', category: 'Right of way', front: 'Who yields: overtaking, head-on, landing?', back: 'Overtaking: pass on the right; the one being overtaken has right of way. Head-on: both turn right. Landing aircraft have the right of way over those in flight or on the surface.' },
  { id: 'f20', category: 'Transponder', front: 'Emergency squawk codes?', back: '7500 hijack, 7600 lost communications, 7700 emergency, 1200 VFR.' },
  { id: 'f21', category: 'Light guns', front: 'Light gun: steady green vs flashing green (in flight)?', back: 'Steady green = cleared to land. Flashing green = return for landing (clearance follows).' },
  { id: 'f22', category: 'Light guns', front: 'Light gun on the ground: steady/flashing red, flashing white?', back: 'Steady red = stop. Flashing red = taxi clear of the runway. Flashing white = return to starting point on the airport.' },
  { id: 'f23', category: 'Speed limits', front: 'VFR speed limits (FAR 91.117)?', back: 'Below 10,000 MSL: 250 KIAS. Below Class B / in a VFR corridor: 200 KIAS. Within 4 NM of a Class C/D primary at/below 2,500 AGL: 200 KIAS.' },
  { id: 'f24', category: 'Medical', front: 'Third-class medical validity?', back: 'Under 40 at exam: 60 calendar months. 40 or older: 24 calendar months. (BasicMed is an alternative for many flights.)' },
  { id: 'f25', category: 'Alcohol/drugs', front: 'Alcohol rule (FAR 91.17)?', back: '8 hours bottle-to-throttle, blood alcohol under 0.04%, and not under the influence. ("8 hours, 0.04, no influence.")' },
  { id: 'f26', category: 'Special VFR', front: 'Special VFR weather minimums?', back: 'Clear of clouds and at least 1 SM visibility, by ATC clearance, in surface-area controlled airspace. Must be requested; not allowed at some busy fields.' },
  { id: 'f27', category: 'Lights', front: 'When are position (nav) lights required?', back: 'Sunset to sunrise. Aircraft must also display an anti-collision (beacon/strobe) light system when operating (turn off if it impairs safety).' },
  { id: 'f28', category: 'Documents', front: 'How long after a position change must you notify the FAA of an address change?', back: 'Within 30 days of a permanent mailing-address change. (FAR 61.60)' },
]

export const FLASHCARD_CATEGORIES = Array.from(new Set(FLASHCARDS.map((f) => f.category)))
