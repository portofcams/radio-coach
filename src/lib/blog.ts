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
