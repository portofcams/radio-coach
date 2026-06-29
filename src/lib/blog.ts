// Blog — longer-form, dated articles for the SEO + email funnel. Same shape as
// guides but with a date/author and a lead paragraph.
export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string // ISO
  author: string
  readMins: number
  lead: string
  sections: Array<{ h: string; p: string }>
}

export const POSTS: BlogPost[] = [
  {
    slug: 'airspace-entry-radio-calls',
    title: 'Class B, C, D, E, G: what you actually have to say to enter each',
    description: 'The radio call — or lack of one — you need to enter each class of US airspace. The exact words for Class B, the two-way rule for C and D, and what E and G require.',
    date: '2026-06-28',
    author: 'Clearspar',
    readMins: 6,
    lead: 'Airspace looks complicated on a sectional, but the radio side comes down to one question per class: do you need a clearance, just two-way contact, or nothing at all? Here is the answer, class by class, with the words.',
    sections: [
      { h: 'The one question that matters', p: 'For VFR, every class of airspace answers the same question — what do you need before you enter? Class B needs an explicit clearance. Class C and D need two-way radio contact established. Class E and G usually need nothing on the radio. Get that framework and the phraseology follows.' },
      { h: 'Class B — you need the magic words', p: 'Class B (the big metro airports) requires an explicit clearance to enter. You call approach with your position and request, and you may not enter until you hear the specific words: “Cleared into the Class Bravo.” “Radar contact” or “standby” is not a clearance. No clearance, no entry.' },
      { h: 'Class C — two-way contact is the key', p: 'Class C does not need a clearance — it needs two-way radio communication established. The trigger is ATC using your call sign. If you call “Approach, Cessna One Two Three Four Five” and they answer “Cessna One Two Three Four Five, standby,” you are cleared to enter — they used your call sign. If they say “aircraft calling, standby,” they have not, and you stay out.' },
      { h: 'Class D — same rule as C', p: 'Class D (a tower without radar service) works the same way: establish two-way communication with the tower before entering. They say your call sign, you are in. They say “aircraft calling Tower, standby,” you hold outside the Class D until they address you directly.' },
      { h: 'Class E — usually nothing for VFR', p: 'Class E is controlled airspace, but as a VFR pilot you generally need no clearance and no radio call to fly in it. (IFR is different — that needs a clearance.) This is most of the airspace you are in on a cross-country at altitude.' },
      { h: 'Class G — uncontrolled, talk to traffic', p: 'Class G is uncontrolled — there is no ATC to call. Near a non-towered airport you self-announce on the CTAF so other traffic knows where you are. There is no clearance to get; the radio work is position reports to the other pilots.' },
      { h: 'The mistake that gets people', p: 'The classic error is treating a generic “standby” as your green light, or entering Class C or D before the controller has actually said your call sign. Listen for your call sign — that, not “aircraft calling, standby,” is your clearance to enter C and D. For B, listen for “cleared into the Class Bravo,” nothing less.' },
      { h: 'Drill the calls', p: 'Airspace entry is pure pattern once you know the rule per class. Practice graded Class B, C, and D entries on Clearspar — free, and it flags when you would have entered without the right words.' },
    ],
  },
  {
    slug: 'copy-ifr-clearance-craft',
    title: 'How to copy an IFR clearance: the CRAFT method',
    description: 'Copy any IFR clearance without falling behind — what CRAFT stands for, the shorthand for each line, and exactly how to read it back.',
    date: '2026-06-28',
    author: 'Clearspar',
    readMins: 6,
    lead: 'The first time you copy an IFR clearance it feels like ATC is reading you a phone number in a language you don’t speak. CRAFT is the shorthand instrument pilots use to catch all of it, in order, every time — so you’re filling in a form, not improvising.',
    sections: [
      { h: 'What CRAFT stands for', p: 'Clearances always come in the same order: Cleared to, Route, Altitude, Frequency, Transponder. Because the order never changes, you can pre-draw five rows and fill them in as the controller talks. That structure is the whole trick — you are never wondering what comes next.' },
      { h: 'C — Cleared to', p: 'Your destination airport (or, sometimes, a closer clearance limit). Write the identifier. “Cleared to the Hilo airport” becomes a single line: PHTO.' },
      { h: 'R — Route', p: 'Usually “as filed” — just write AF and move on. If ATC amends it (“…via radar vectors Victor 12…”), copy the change exactly; that is the part that bites people, so slow down and get it verbatim.' },
      { h: 'A — Altitude', p: 'Almost always two parts: an initial altitude and an “expect” — “maintain three thousand, expect six thousand one zero minutes after departure.” Write both. Pilots routinely drop the “expect” and the time.' },
      { h: 'F — Frequency', p: 'The departure frequency you will contact after takeoff. Write the numbers; you will read them back and dial them in before you roll.' },
      { h: 'T — Transponder', p: 'Your squawk code, four digits. Set it as soon as you have read it back so you do not forget.' },
      { h: 'The shorthand in practice', p: 'Before you call clearance, draw the CRAFT grid on your kneeboard. Example fill: C: PHTO · R: AF · A: 3,000 / exp 6,000 / 10 min · F: 119.7 · T: 4271. Five lines, the whole clearance.' },
      { h: 'Reading it back', p: 'Read it back in the same order you copied it. The controller is listening for the altitude, frequency, and squawk especially — those are the ones they will correct you on. Same order every time means you never lose your place.' },
      { h: 'Drill it until it is automatic', p: 'Clearance copy is pure pattern recognition, and it is 100% drillable on the ground. Practice graded IFR clearances on Clearspar — free, and it flags exactly which line you dropped.' },
    ],
  },
  {
    slug: 'mayday-vs-pan-pan',
    title: 'Mayday vs Pan-Pan: emergency radio calls, exactly what to say',
    description: 'When to declare Mayday vs Pan-Pan, the exact call format, and what to say so ATC can help you fast.',
    date: '2026-06-28',
    author: 'Clearspar',
    readMins: 6,
    lead: 'Most pilots never make an emergency call — which is exactly why it is worth rehearsing the words now, calmly, so they are there when you need them. Mayday versus Pan-Pan, and the format for each, is simpler than it sounds.',
    sections: [
      { h: 'Mayday vs Pan-Pan', p: 'Mayday is distress: grave and imminent danger, you need help now. Pan-Pan (said “pan pan”) is urgency: you have a serious problem but it is not yet life-threatening. You say the word three times — “Mayday, Mayday, Mayday” — so there is no mistaking it through a noisy frequency.' },
      { h: 'When it is a Mayday', p: 'Engine failure, fire, smoke, structural problem, a medical emergency that threatens life, loss of control — anything where the outcome is in doubt. Do not talk yourself out of it; declaring gets you priority handling and every resource ATC has.' },
      { h: 'When it is a Pan-Pan', p: 'Unsure of your position, a rough-running engine that is still producing power, low fuel that is not critical yet, a sick passenger who is stable, a partial equipment failure. It tells ATC you may need help soon without triggering a full emergency response.' },
      { h: 'The call format', p: 'After the Mayday or Pan-Pan, give ATC what they need: who you are calling, who you are (call sign and type), where you are and your altitude, the nature of the problem, and your intentions. If there is time, add souls on board and fuel remaining.' },
      { h: 'A Mayday example', p: '“Mayday, Mayday, Mayday, Honolulu Approach, Cessna One Two Three Four Five, engine failure, eight miles south of the field at three thousand, gliding toward the airport, three souls on board, two hours fuel.”' },
      { h: 'A Pan-Pan example', p: '“Pan-Pan, Pan-Pan, Pan-Pan, Honolulu Approach, Cessna One Two Three Four Five, I am unsure of my position, last known fifteen miles west of the field at four thousand five hundred, request assistance.”' },
      { h: 'After the call', p: 'Aviate, navigate, communicate — in that order. Fly the airplane first. Squawk 7700 if you are not already on a discrete code; it lights you up on every controller’s scope. Then do what the controller asks, but remember you are pilot in command — you can deviate from any rule to handle the emergency.' },
      { h: 'Rehearse it before you need it', p: 'The words should be muscle memory, not something you invent under stress. Practice emergency calls calmly on Clearspar so they are automatic.' },
    ],
  },
  {
    slug: 'ground-tower-departure-every-call',
    title: 'What to say to Ground, Tower, and Departure — every call, in order',
    description: 'The complete towered-airport departure sequence — clearance delivery, ground, tower, and the departure handoff — with the exact words and readbacks for each frequency.',
    date: '2026-06-24',
    author: 'Clearspar',
    readMins: 7,
    lead: 'A departure from a towered airport is a relay race across three or four frequencies, and each one has a specific call. Once you know the order and the script for each handoff, the whole chain stops feeling like improvisation. Here is every call, start to wheels-up and beyond.',
    sections: [
      { h: '1. ATIS — copy it before you key up', p: 'Tune the ATIS first and write down the active runway, altimeter, and the information letter. You will quote it on your first call — "with information Charlie" — so the controller knows you already have the weather and does not have to read it to you. Skipping this is the fastest way to fall behind before you have said a word.' },
      { h: '2. Clearance Delivery — when the field has one', p: 'At busier Class C and B fields, get your clearance before you taxi. VFR it is short: "Clearance Delivery, Cessna One Two Three Four Five, VFR to the north, request departure." You will usually get a squawk code and sometimes a heading or altitude — read all of it back. IFR, tell them "ready to copy" and read back the full clearance: cleared-to, route, altitude, frequency, transponder. Smaller Class D fields skip this and you go straight to Ground.' },
      { h: '3. Ground — taxi to the runway', p: 'From the ramp: "Ground, Cessna One Two Three Four Five, at the south ramp, taxi for departure, with information Charlie." Read back the full taxi route and — verbatim, including the runway number — any hold-short instruction: "Taxi to runway two five via Alpha, hold short of runway one niner, Cessna One Two Three Four Five." The hold-short is the one item you never paraphrase.' },
      { h: '4. Tower — takeoff clearance', p: 'At the hold-short line, switch to Tower: "Tower, Cessna One Two Three Four Five, holding short runway two five, ready for departure." When the clearance comes, read it back with the runway: "Cleared for takeoff runway two five, Cessna One Two Three Four Five." If you are told to "line up and wait," read that back too — it is not a clearance to depart.' },
      { h: '5. Departure — the handoff after takeoff', p: 'Once airborne, Tower hands you off: "Contact Departure." Switch to the new frequency and check in with who you are and your altitude: "SoCal Departure, Cessna One Two Three Four Five, two thousand, climbing four thousand five hundred." Read back any heading or altitude they assign. If you asked for flight following, this is where the traffic advisories start.' },
      { h: 'The thread that ties it together', p: 'Every readback ends with your call sign, and anything that changes where the airplane goes — runway, hold-short, heading, altitude, frequency, squawk — gets said back in full. "Roger" is not a readback. If a transmission comes fast, "say again" is always the professional move. Run the chain a few times on the ground and it becomes a script you follow, not a test you fail.' },
    ],
  },
  {
    slug: 'stop-freezing-on-the-radio',
    title: 'Why student pilots freeze on the radio — and how to fix it',
    description: 'Blanking when ATC calls is the most common fear in primary training. Here is why your brain locks up, and the specific habits and drills that make radio calls automatic.',
    date: '2026-06-24',
    author: 'Clearspar',
    readMins: 6,
    lead: 'Almost every student pilot hits the same wall: ATC keys up, your mind goes blank, you read back something garbled, then spend the next two minutes replaying it instead of flying the airplane. It is not a talent problem — it is a working-memory problem, and it is fixable.',
    sections: [
      { h: 'Why your brain blanks', p: 'Early in training, flying the airplane already uses almost all of your attention. When a fast clearance arrives there is no spare working memory left to hold it, so it evaporates the instant the controller stops talking. This is task saturation, and it happens to every new pilot. The fix is not "try harder in the moment" — it is to make the radio cost less attention so there is room for it.' },
      { h: 'Pre-load the call before you key up', p: 'Most of the freeze comes from improvising. Instead, think the expected call before you transmit. Before calling ground, line up the things you will read back: taxi route, hold short, altimeter. Now you are confirming a script you already have rather than composing one under pressure. Pilots who pre-load almost never blank.' },
      { h: 'Learn the script — most calls are templates', p: 'ATC communication is far more scripted than it sounds. A ground call, a position report, a flight-following request each follows a fixed pattern: who you are calling, who you are, where and what, your request. Once the templates are memorized, a real transmission is just filling in the blanks — a fraction of the attention.' },
      { h: 'Drill readbacks until they are automatic', p: 'The call blanks because it is not yet automatic, and you cannot make it automatic by only practicing in the airplane, where reps are rare and expensive. The fix is reps on the ground: hear a clearance, read it back, see exactly which required elements you dropped, and repeat until the words come without thought. Ten minutes a day of graded readbacks beats a dozen flights of hoping it clicks.' },
      { h: 'In the moment: slow down and ask', p: 'When you do fall behind, the professional move is to ask. "Say again" — or "say again slower" — is normal; airline crews use it every day. Write the clearance down as you copy it. A two-second pause to get it right beats a confident readback of the wrong runway, and controllers would far rather repeat than untangle a mistake.' },
    ],
  },
  {
    slug: 'first-call-towered-airport',
    title: 'How to talk to ATC at a towered field for the first time',
    description: 'The exact calls — ground, tower, and the readbacks — for your first flight into a towered airport, with examples you can copy.',
    date: '2026-06-18',
    author: 'Clearspar',
    readMins: 6,
    lead: 'The radio is the part most student pilots dread, but a towered field follows a script. Learn the script and the nerves go away. Here is the whole sequence, in order, with example calls.',
    sections: [
      { h: 'Listen to ATIS first', p: 'Before you say a word, tune the ATIS and copy the weather, active runway, and the information letter. On your first call you tell the controller you have it: "with information Bravo." That tells them not to read it all to you.' },
      { h: 'Call Ground to taxi', p: 'From the ramp, call Ground: "Palmdale Ground, Cessna One Two Three Four Five, at the south ramp, taxi for departure, with information Bravo." Read back the taxi route and — verbatim — any hold-short: "Taxi to runway two five via Alpha, hold short of runway one niner, Cessna One Two Three Four Five."' },
      { h: 'Switch to Tower for takeoff', p: 'At the hold-short line, switch to Tower: "Palmdale Tower, Cessna One Two Three Four Five, holding short runway two five, ready for departure." When cleared, read it back with the runway: "Cleared for takeoff runway two five, Cessna One Two Three Four Five."' },
      { h: 'The golden rule of readbacks', p: 'Read back anything that affects where you go: runway assignments, hold-shorts, altitudes, headings, frequencies, and squawk codes. "Roger" is not a readback — say the words back.' },
      { h: 'When you fall behind', p: 'If a controller talks faster than you can copy, say "say again" and write it down. Everyone — including airline crews — asks for a repeat. It is far better than guessing.' },
    ],
  },
  {
    slug: 'readbacks-that-fail-checkrides',
    title: 'The readbacks that fail checkrides — and how to nail them',
    description: 'The handful of radio mistakes examiners watch for, and the exact phraseology that keeps you on the right side of them.',
    date: '2026-06-16',
    author: 'Clearspar',
    readMins: 5,
    lead: 'Examiners are not grading your radio voice — they are grading whether you read back the safety-critical items correctly. Miss one of these and it shows up in the debrief.',
    sections: [
      { h: 'Dropping the runway from a hold-short', p: 'Per AIM 4-3-18, a hold-short must be read back including the runway number. "Hold short of runway two six" → "Hold short of runway two six, Cessna One Two Three Four Five." Reading back the taxi route but skipping the hold-short is the classic miss.' },
      { h: 'Saying "roger" to a clearance', p: 'A landing or takeoff clearance, an altitude, a heading — all must be read back. "Roger" only means you received the transmission. If it changes where the airplane goes, say it back.' },
      { h: 'Garbling numbers', p: 'Read numbers digit by digit and use niner, fife, tree. "One two zero point niner" — not "one twenty point nine." Altitudes use thousands and hundreds: "four thousand five hundred."' },
      { h: 'Forgetting your call sign', p: 'Every readback ends with who you are. It closes the loop so the controller knows the right aircraft copied.' },
      { h: 'Not asking when unsure', p: 'If you do not understand an instruction, "say again" or "unable" are correct, professional answers. Acting on a clearance you did not understand is the real failure.' },
    ],
  },
  {
    slug: 'non-towered-radio-calls',
    title: 'Non-towered airport radio calls, explained',
    description: 'There is no controller at a non-towered field — you announce your own position on the CTAF. The standard self-announce calls, in order.',
    date: '2026-06-13',
    author: 'Clearspar',
    readMins: 5,
    lead: 'At a non-towered airport nobody clears you to do anything — you see, avoid, and announce. The calls follow a simple pattern, and bracketing them with the field name is what keeps everyone on the same page.',
    sections: [
      { h: 'The self-announce format', p: 'Airport name, who you are, where and what, airport name again (AIM 4-1-9): "Lincoln traffic, Skyhawk Four Five X-ray, left downwind runway one eight, Lincoln." Bracketing with the field name lets pilots scanning frequencies know which airport you mean.' },
      { h: 'Inbound', p: 'About ten miles out: "Lincoln traffic, Cessna One Two Three Four Five, one zero miles south, inbound landing, Lincoln." Then announce your pattern entry.' },
      { h: 'In the pattern', p: 'Announce each leg with intentions: entering downwind, turning base, turning final, and clear of the runway. Say what you are doing, not just where you are.' },
      { h: 'Departing', p: 'Before you taxi onto the runway: "Lincoln traffic, Cessna One Two Three Four Five, departing runway one eight, departing to the south, Lincoln."' },
      { h: 'No radio? Still legal — still see and avoid', p: 'Radios are recommended, not required, at most non-towered fields. Keep your eyes outside; the announcements supplement looking, they do not replace it.' },
    ],
  },
  {
    slug: 'request-flight-following',
    title: 'How to request VFR flight following (and why you should)',
    description: 'Flight following gives you traffic advisories and a controller watching your route. Exactly how to ask, what to read back, and how to end it.',
    date: '2026-06-10',
    author: 'Clearspar',
    readMins: 4,
    lead: 'Flight following is free, makes you a better-protected VFR pilot, and is great radio practice. Many students never ask for it simply because they are not sure how. Here is the whole exchange.',
    sections: [
      { h: 'Who to call', p: 'Call the Approach or Center facility for your area. Give type, position, altitude, and the request: "Norcal Approach, Cessna One Two Three Four Five, ten miles south of Livermore, four thousand five hundred, request VFR flight following to Salinas."' },
      { h: 'Set the squawk', p: 'ATC assigns a discrete code: "squawk zero two three four." Read it back, set it, and wait for "radar contact."' },
      { h: 'Working the traffic calls', p: 'You will get advisories by clock position, distance, and altitude. Reply "traffic in sight" or "looking, negative contact." You are still responsible for see-and-avoid — flight following helps, it does not replace your eyes.' },
      { h: 'Ending the service', p: 'ATC may say "radar service terminated, squawk VFR, frequency change approved," or you can cancel any time: "Cessna One Two Three Four Five, cancel flight following." Set 1200 and carry on.' },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
