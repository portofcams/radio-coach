// "7 days to radio confidence" — a 7-email drip course. Pure content + a composer.
const ADDRESS = '440 Lewers St, Suite 603, Honolulu HI 96815'

interface DripDay { subject: string; lead: string; body: string[] }

export const DRIP: DripDay[] = [
  {
    subject: 'Day 1: the words you actually need',
    lead: 'Welcome. Over the next 7 days you\'ll go from dreading the radio to making clean calls. Start here.',
    body: [
      'The radio is a small, precise language. Day one is the building blocks: the phonetic alphabet (Alpha, Bravo, Charlie…) and the numbers — say <strong>niner, fife, tree</strong> so 9, 5, and 3 are never confused on a noisy frequency.',
      'Read numbers digit by digit: 122.8 is "one two two point eight." Altitudes use thousands and hundreds: 4,500 is "four thousand five hundred."',
      'Today\'s rep: spell your tail number out loud, phonetically, five times. Tomorrow we build your first full call.',
    ],
  },
  {
    subject: 'Day 2: the four-part call-up',
    lead: 'Every first call to ATC follows the same order. Learn it and the nerves fade.',
    body: [
      'Who you\'re calling, who you are, where you are, what you want. Example: "Palmdale Tower, Cessna One Two Three Four Five, ten miles south, inbound landing with information Bravo."',
      'Listen to ATIS first and tell them you have it — "with information Bravo" — so they don\'t read the whole weather to you.',
      'Today\'s rep: write out your own inbound call to your home field and say it three times.',
    ],
  },
  {
    subject: 'Day 3: readbacks (the part that matters)',
    lead: 'Examiners aren\'t grading your voice — they grade whether you read back the safety-critical items.',
    body: [
      'Read back anything that changes where the airplane goes: hold-short instructions (verbatim, with the runway), runway assignments, altitudes, headings, frequencies, and squawk codes.',
      '"Roger" is not a readback — it only means you received the message. Say the words back, and end with your call sign.',
      'Today\'s rep: practice "Hold short of runway two six" → "Hold short of runway two six, Cessna One Two Three Four Five."',
    ],
  },
  {
    subject: 'Day 4: talking to a control tower',
    lead: 'At a towered field there\'s a script: ground, tower, and the readbacks.',
    body: [
      'Call Ground to taxi (read back the route and any hold-short), switch to Tower at the hold-short line ("ready for departure"), and read back your takeoff or landing clearance with the runway.',
      'Establish two-way contact before you enter Class D — if the tower answers with your call sign, you\'re cleared to enter.',
      'Today\'s rep: run the full ground-to-tower sequence for your home field out loud.',
    ],
  },
  {
    subject: 'Day 5: non-towered airports',
    lead: 'No controller, no clearances — you self-announce and see-and-avoid.',
    body: [
      'On the CTAF, bracket every call with the field name: "Lincoln traffic, Cessna One Two Three Four Five, left downwind runway one eight, Lincoln."',
      'Announce inbound, each pattern leg, and clear of the runway. Say intentions, not just position.',
      'Today\'s rep: say your pattern calls — downwind, base, final, clear of the runway.',
    ],
  },
  {
    subject: 'Day 6: flight following & handoffs',
    lead: 'Flight following is free, makes you safer, and is great radio practice.',
    body: [
      'Request it on initial contact with Approach/Center: type, position, altitude, and "request VFR flight following to…". Read back the squawk code they assign.',
      'On a handoff, read back the new frequency and your call sign, switch, and check on with your altitude.',
      'Today\'s rep: practice requesting flight following and reading back a squawk ("squawk zero two three four, Cessna One Two Three Four Five").',
    ],
  },
  {
    subject: 'Day 7: put it all together',
    lead: 'You\'ve got the pieces. Now make them automatic.',
    body: [
      'Knowledge becomes fluency through reps under a little pressure. The fastest way to get there is graded practice: hear a real call, read it back, and see exactly what you missed.',
      'That\'s what Clearspar Radio Trainer does — free to start, no flight sim, no mic required. Drill your home field, run a mock oral for the checkride, and watch your readiness score climb.',
      '<a href="APPURL/train" style="color:#2563eb">Start your first graded scenario →</a>',
    ],
  },
]

export function composeDrip(dayIndex: number, opts: { unsubUrl: string; appUrl: string }): { subject: string; html: string; text: string } | null {
  const d = DRIP[dayIndex]
  if (!d) return null
  const body = d.body.map((p) => p.replace(/APPURL/g, opts.appUrl))
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="background:#0b0f14;color:#fff;border-radius:12px 12px 0 0;padding:16px 20px;font-weight:600;letter-spacing:.08em">WILCO · RADIO CONFIDENCE</div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px 20px">
      <p style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:600">${d.subject.replace(/^Day \d+: /, '')}</p>
      <p style="margin:0 0 16px;color:#374151">${d.lead}</p>
      ${body.map((p) => `<p style="margin:0 0 14px;color:#374151;line-height:1.55">${p}</p>`).join('')}
    </div>
    <div style="text-align:center;color:#9ca3af;font-size:11px;padding:16px 8px;line-height:1.6">
      Clearspar Radio Trainer — aviation radio training<br>${ADDRESS}<br>
      <a href="${opts.unsubUrl}" style="color:#9ca3af">Unsubscribe</a>
    </div>
  </div></body></html>`
  const text = [d.subject, '', d.lead, '', ...body.map((p) => p.replace(/<[^>]+>/g, '')), '', `Clearspar Radio Trainer — ${ADDRESS}`, `Unsubscribe: ${opts.unsubUrl}`].join('\n')
  return { subject: d.subject, html, text }
}
