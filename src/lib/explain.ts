// "Explain this readback" — a plain-English why for each required element.
// Pattern-matched (elements are scenario-specific phrases), with a safe fallback.
// Order matters: first matching rule wins, so the most specific go first.

const RULES: Array<{ re: RegExp; why: string }> = [
  { re: /call\s?sign/i, why: 'Ending with your call sign confirms ATC is talking to the right aircraft and that you are the one who copied the instruction.' },
  { re: /aircraft\s*type/i, why: 'Your aircraft type tells ATC your performance and wake category, which is how they sequence and separate you from other traffic.' },
  { re: /hold short/i, why: 'Hold-short is safety-critical. Reading it back verbatim — including the runway — is how you and the controller confirm you will not enter the runway. Runway incursions start here.' },
  { re: /say again|unable copy|how do you (hear|read)/i, why: 'When part of the transmission is stepped-on or unreadable, the correct move is to ask ATC to say it again — never read back a guess. A wrong readback the controller doesn\'t catch is far more dangerous than asking twice.' },
  { re: /line up and wait/i, why: 'You are entering the runway but not cleared to depart. Reading it back confirms you understand to hold in position and wait for the takeoff clearance.' },
  { re: /(mayday|pan-?pan|engine failure|rough running|souls|fuel|request priority|emergency)/i, why: 'In an emergency, reading back the key facts (problem, souls, fuel, intentions) gives ATC what they need to clear traffic and roll the equipment for you.' },
  { re: /cleared for (immediate )?takeoff/i, why: 'The takeoff clearance and runway must be read back so a wrong-runway departure is caught on the ground.' },
  { re: /cleared (to land|for the option|for touch|touch-and-go|touch.?and.?go)/i, why: 'Reading back the landing clearance with the runway catches a wrong-runway error before you commit to land.' },
  { re: /cleared.*(ils|visual|approach)|expect (vectors|ils)|visual approach/i, why: 'Reading back the approach clearance confirms which approach and runway you are flying — critical when several are in use.' },
  { re: /cleared (into|through) the (bravo|charlie|delta|class)/i, why: 'Entering Class B/C/D needs the right clearance or contact. Reading it back confirms you may enter and on what terms.' },
  { re: /(cleared to .*(airport|kona|hilo|kahului|maui)|as filed)/i, why: 'An IFR route clearance is read back so you and ATC agree on exactly where and how you are cleared before you launch.' },
  { re: /(void|efc|expect further clearance|clearance void)/i, why: 'The void / expect-further-clearance time is read back so you both agree on your release window and what to do if you lose comms.' },
  { re: /(cross|crossing) runway/i, why: 'A runway crossing is read back so both you and the controller agree you are crossing the right runway at the right point.' },
  { re: /go around|going around/i, why: 'Acknowledging the go-around confirms you are breaking off the landing — the controller needs to know you are climbing out, not landing.' },
  { re: /runway heading/i, why: 'Runway heading means fly the centerline heading and do not turn. Reading it back prevents an early, unexpected turn into traffic or terrain.' },
  { re: /heading|radial|three sixty|sidestep|own navigation/i, why: 'Reading back the assigned heading or turn catches a misheard course before you fly the wrong way.' },
  { re: /(climb|descend|maintain|thousand|altitude|at or (below|above)|hundred|block)/i, why: 'Altitudes are read back so an altitude bust — and a possible loss of separation — is caught before you climb or descend to the wrong level.' },
  { re: /altimeter|two niner (niner|eight|seven|six|fife)|three zero (zero|one)/i, why: 'The altimeter setting keeps your altitude accurate. Reading back the digits confirms you set the right pressure.' },
  { re: /squawk|ident/i, why: 'Reading back the squawk (or ident) confirms ATC can positively identify your target on radar — a wrong code means they are watching the wrong airplane.' },
  { re: /(frequency|contact .*\d|point (one|two|three|four|five|six|seven|eight|niner|zero))/i, why: 'Reading back a frequency confirms you will reach the next controller — a wrong digit leaves you talking to no one.' },
  { re: /special vfr/i, why: 'Special VFR is a specific clearance with cloud and visibility limits. Reading it back confirms you accept those limits and have the clearance.' },
  { re: /(clear of clouds|remain clear)/i, why: 'Confirms you will keep the cloud clearance the clearance requires — the whole basis for letting you operate in that weather.' },
  { re: /(hover taxi|air taxi)/i, why: 'Hover vs. air taxi sets your height and speed near the surface. Reading it back confirms which the controller expects.' },
  { re: /(taxi|via|left on|right on|run-up|pushback)/i, why: 'Reading back the taxi route confirms the path the controller intends, so you do not turn onto the wrong taxiway or an active runway.' },
  { re: /(departure approved|present position)/i, why: 'Confirms you may depart as cleared from where you are, rather than repositioning first.' },
  { re: /flight following/i, why: 'Confirms you have requested traffic advisories — once "radar contact," ATC will call traffic, but you are still responsible for see-and-avoid.' },
  { re: /(downwind|base leg|left base|final|upwind|crosswind|short approach|extending|closed traffic)/i, why: 'Reading back the pattern instruction confirms which leg and side the tower expects, keeping you sequenced with the other traffic.' },
  { re: /(speed|knots)/i, why: 'Reading back the assigned speed confirms the spacing the controller is building between you and other traffic.' },
  { re: /wake turbulence/i, why: 'Acknowledging the wake-turbulence caution confirms you will account for the spacing and timing behind a heavier aircraft.' },
  { re: /(traffic|in sight|negative contact|looking)/i, why: 'Acknowledging traffic tells the controller whether you see it — that decides who is responsible for separation.' },
  { re: /(information|atis)/i, why: 'Stating you have the current ATIS tells the controller you already have the weather and field information, so they do not have to read it to you.' },
  { re: /(position|location)/i, why: 'Your position tells the controller where you are so they can fit you into the traffic flow and point out conflicts.' },
  { re: /wilco|report/i, why: 'Acknowledging the request confirms you will do it and report back, so the controller is not left waiting.' },
  { re: /runway|helipad/i, why: 'The runway or pad must be read back so a wrong-runway error is caught before you taxi onto or line up for it.' },
]

const FALLBACK = 'Reading this element back lets the controller confirm you heard it correctly and catch a mistake before it becomes a problem.'

export function explainElement(element: string): string {
  for (const r of RULES) if (r.re.test(element)) return r.why
  return FALLBACK
}
