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
