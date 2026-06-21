// Private Pilot — Airplane ACS (FAA-S-ACS-6) Areas of Operation and Tasks.
// Used by /acs as a checkride-prep tracker (tick off tasks as you're signed off).
export interface AcsArea {
  numeral: string
  title: string
  tasks: Array<{ id: string; title: string }>
}

export const ACS: AcsArea[] = [
  {
    numeral: 'I', title: 'Preflight Preparation', tasks: [
      { id: 'I-A', title: 'Pilot Qualifications' },
      { id: 'I-B', title: 'Airworthiness Requirements' },
      { id: 'I-C', title: 'Weather Information' },
      { id: 'I-D', title: 'Cross-Country Flight Planning' },
      { id: 'I-E', title: 'National Airspace System' },
      { id: 'I-F', title: 'Performance and Limitations' },
      { id: 'I-G', title: 'Operation of Systems' },
      { id: 'I-H', title: 'Human Factors' },
    ],
  },
  {
    numeral: 'II', title: 'Preflight Procedures', tasks: [
      { id: 'II-A', title: 'Preflight Assessment' },
      { id: 'II-B', title: 'Flight Deck Management' },
      { id: 'II-C', title: 'Engine Starting' },
      { id: 'II-D', title: 'Taxiing' },
      { id: 'II-E', title: 'Before Takeoff Check' },
    ],
  },
  {
    numeral: 'III', title: 'Airport Operations', tasks: [
      { id: 'III-A', title: 'Communications, Light Signals, and Runway Lighting' },
      { id: 'III-B', title: 'Traffic Patterns' },
    ],
  },
  {
    numeral: 'IV', title: 'Takeoffs, Landings, and Go-Arounds', tasks: [
      { id: 'IV-A', title: 'Normal Takeoff and Climb' },
      { id: 'IV-B', title: 'Normal Approach and Landing' },
      { id: 'IV-C', title: 'Soft-Field Takeoff and Climb' },
      { id: 'IV-D', title: 'Soft-Field Approach and Landing' },
      { id: 'IV-E', title: 'Short-Field Takeoff and Maximum Performance Climb' },
      { id: 'IV-F', title: 'Short-Field Approach and Landing' },
      { id: 'IV-G', title: 'Forward Slip to a Landing' },
      { id: 'IV-H', title: 'Go-Around / Rejected Landing' },
    ],
  },
  {
    numeral: 'V', title: 'Performance and Ground Reference Maneuvers', tasks: [
      { id: 'V-A', title: 'Steep Turns' },
      { id: 'V-B', title: 'Ground Reference Maneuvers' },
    ],
  },
  {
    numeral: 'VI', title: 'Navigation', tasks: [
      { id: 'VI-A', title: 'Pilotage and Dead Reckoning' },
      { id: 'VI-B', title: 'Navigation Systems and Radar Services' },
      { id: 'VI-C', title: 'Diversion' },
      { id: 'VI-D', title: 'Lost Procedures' },
    ],
  },
  {
    numeral: 'VII', title: 'Slow Flight and Stalls', tasks: [
      { id: 'VII-A', title: 'Maneuvering During Slow Flight' },
      { id: 'VII-B', title: 'Power-Off Stalls' },
      { id: 'VII-C', title: 'Power-On Stalls' },
      { id: 'VII-D', title: 'Spin Awareness' },
    ],
  },
  {
    numeral: 'VIII', title: 'Basic Instrument Maneuvers', tasks: [
      { id: 'VIII-A', title: 'Straight-and-Level Flight' },
      { id: 'VIII-B', title: 'Constant Airspeed Climbs' },
      { id: 'VIII-C', title: 'Constant Airspeed Descents' },
      { id: 'VIII-D', title: 'Turns to Headings' },
      { id: 'VIII-E', title: 'Recovery from Unusual Flight Attitudes' },
      { id: 'VIII-F', title: 'Radio Communications, Navigation, and ATC Services' },
    ],
  },
  {
    numeral: 'IX', title: 'Emergency Operations', tasks: [
      { id: 'IX-A', title: 'Emergency Descent' },
      { id: 'IX-B', title: 'Emergency Approach and Landing' },
      { id: 'IX-C', title: 'Systems and Equipment Malfunctions' },
      { id: 'IX-D', title: 'Emergency Equipment and Survival Gear' },
    ],
  },
  {
    numeral: 'X', title: 'Postflight Procedures', tasks: [
      { id: 'X-A', title: 'After Landing, Parking, and Securing' },
    ],
  },
]

export const ACS_TASK_COUNT = ACS.reduce((n, a) => n + a.tasks.length, 0)
