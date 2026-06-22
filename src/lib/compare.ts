// Comparison / high-intent SEO pages. Honest and factual about real products —
// position Wilco for what it is (free, graded phraseology practice), not by
// knocking competitors.
export interface ComparePage {
  slug: string
  title: string
  description: string
  lead: string
  sections: Array<{ h: string; p: string }>
}

export const COMPARE: ComparePage[] = [
  {
    slug: 'best-ways-to-practice-atc-radio-calls',
    title: 'The best ways to practice ATC radio calls (2026)',
    description: 'Listening to LiveATC, online ATC networks like PilotEdge, flashcards, or a graded practice app — the realistic options for getting comfortable on the radio, and when each helps.',
    lead: 'There is no single right way to get good on the radio — most pilots combine a few. Here is an honest look at the main options and what each is actually good for.',
    sections: [
      { h: 'Listen to real ATC (LiveATC)', p: 'Free streams of real tower and approach frequencies. Excellent for tuning your ear to the rhythm and speed of real comms. The limit: it is passive — you never practice speaking or get feedback.' },
      { h: 'Online ATC networks (PilotEdge, VATSIM)', p: 'Live human or networked controllers you talk to while flying a desktop flight simulator. The most immersive option, and great once you have a sim set up. The trade-offs: it requires a flight sim and (for PilotEdge) a subscription, and the pressure can be a lot for a brand-new student.' },
      { h: 'Flashcards & the AIM', p: 'Memorizing the phonetic alphabet, numbers, and the AIM Chapter 4 phraseology is the foundation. Necessary, but knowing the words is not the same as saying them under time pressure.' },
      { h: 'Graded practice (Wilco)', p: 'Hear a real ATC call, read it back by voice or text, and get graded element-by-element against the FAA standard — no flight sim, no mic required, free to start. It fills the gap between flashcards and the live networks: active speaking practice with instant, specific feedback.' },
      { h: 'A simple plan', p: 'Learn the phraseology (flashcards/AIM), build the ear (LiveATC), drill speaking and readbacks with feedback (Wilco), then put it together in a live environment (PilotEdge/VATSIM or your actual training flights).' },
    ],
  },
  {
    slug: 'free-way-to-practice-radio-calls',
    title: 'A free way to practice aviation radio calls',
    description: 'Most realistic radio practice needs a flight simulator or a subscription. Here is how to drill ATC readbacks for free, with instant grading and no mic.',
    lead: 'You do not need a flight sim or a paid network to start getting comfortable on the radio. You can drill the actual calls and readbacks for free.',
    sections: [
      { h: 'What "free" usually leaves out', p: 'Listening apps are free but passive. Full ATC networks are interactive but need a flight simulator and often a subscription. The missing free option is active speaking practice with feedback.' },
      { h: 'Free graded practice', p: 'Wilco\'s Ground School and five graded Live Comms scenarios a day are free. You hear a real call, read it back, and see exactly which required elements you hit or missed — towered, non-towered, IFR, even emergencies.' },
      { h: 'Practice your actual home field', p: 'Enter your airport and practice its real frequencies, runways, and taxi layout — so the calls you drill are the ones you will actually make.' },
      { h: 'When to upgrade', p: 'Free covers the fundamentals. Unlimited scenarios, all airport classes, and progress tracking are a low monthly cost when you want to push harder.' },
    ],
  },
  {
    slug: 'how-to-pass-the-radio-on-your-checkride',
    title: 'How to pass the radio portion of your checkride',
    description: 'Examiners are not grading your radio voice — they grade whether you read back the safety-critical items correctly. Here is exactly what they watch for and how to drill it.',
    lead: 'The radio rarely fails a checkride on its own, but sloppy readbacks erode an examiner\'s confidence fast. The good news: what they\'re checking is specific and drillable.',
    sections: [
      { h: 'Read back the safety-critical items', p: 'Hold-short instructions (verbatim, with the runway), runway assignments, and every clearance — altitude, heading, route, frequency, squawk. "Roger" is not a readback.' },
      { h: 'Sound standard, not fast', p: 'Use the phonetic alphabet, say niner/fife/tree, and keep calls in the who-who-where-what order. Standard phraseology beats a smooth-but-nonstandard delivery.' },
      { h: 'Know your home field cold', p: 'You should be able to make every call at your training airport without thinking — ground, tower or CTAF, pattern, and the readbacks.' },
      { h: 'Drill it with feedback', p: 'Practice graded scenarios until the readbacks are automatic, and run a mock oral on the communication and airspace questions. Wilco does both — free to start.' },
    ],
  },
  {
    slug: 'learn-aviation-radio-communications',
    title: 'How to learn aviation radio communications',
    description: 'A start-to-finish path for student pilots to get comfortable talking to ATC — phraseology, the four-part call, readbacks, towered vs non-towered, and how to practice.',
    lead: 'Talking to ATC feels like a foreign language at first because it is one — a small, precise one. Learn the structure and a few hundred reps later it becomes automatic.',
    sections: [
      { h: 'Start with the building blocks', p: 'The phonetic alphabet, numbers (niner, fife, tree), and the four-part initial call: who you\'re calling, who you are, where you are, what you want.' },
      { h: 'Learn the readbacks that matter', p: 'Hold-shorts, runway assignments, and clearances get read back. This is the safety core of radio work — and what examiners check.' },
      { h: 'Towered vs non-towered', p: 'At a towered field you get clearances; at a non-towered field you self-announce on the CTAF and see-and-avoid. The calls are different — learn both.' },
      { h: 'Put in the reps', p: 'Knowledge becomes fluency through repetition under a little pressure. Drill graded scenarios, practice your home field, and listen to real ATC to tune your ear.' },
    ],
  },
]

export function getCompare(slug: string): ComparePage | undefined {
  return COMPARE.find((c) => c.slug === slug)
}
