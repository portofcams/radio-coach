import Link from 'next/link'

export const metadata = {
  title: 'Radio Cheat Sheet — Clearspar',
  description: 'The aviation radio formulas — read-backs, numbers, initial calls, airport signs — referenced to the FAA AIM. Print it, screenshot it, learn it.',
}

function FAA({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 whitespace-nowrap">{children}</span>
}

function Card({ kicker, title, faa, children }: { kicker: string; title: string; faa: string; children: React.ReactNode }) {
  return (
    <section className="border border-gray-200 rounded-2xl p-6 bg-white">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-1">{kicker}</div>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <FAA>{faa}</FAA>
      </div>
      {children}
    </section>
  )
}

export default function CheatSheet() {
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← back</Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Radio Cheat Sheet</h1>
        <p className="text-gray-500 mb-10">
          The formulas that make radio work automatic — every one referenced to the FAA. Screenshot it, print it, learn it.
        </p>

        <div className="space-y-5">
          {/* THE READ-BACK FORMULA — hero */}
          <section className="border-2 border-gray-900 rounded-2xl p-6 bg-gray-900 text-white">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-2">The formula</div>
            <h2 className="text-2xl font-semibold mb-4">The Read-Back</h2>
            <div className="font-mono text-base sm:text-lg bg-black/40 rounded-xl p-4 mb-4 leading-relaxed">
              <span className="text-green-400">[ instruction + every number, verbatim ]</span>
              <span className="text-gray-500"> + </span>
              <span className="text-amber-400">[ your call sign ]</span>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Read it back — don&rsquo;t just say &ldquo;roger.&rdquo; If you don&rsquo;t read it back, the controller doesn&rsquo;t know you got it right.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-green-400 font-medium mb-1">Always read back</div>
                <ul className="text-gray-300 space-y-1">
                  <li>· Hold-short instructions (verbatim)</li>
                  <li>· Runway assignments — taxi, takeoff, land</li>
                  <li>· Altitude, heading, airspeed, route</li>
                  <li>· Frequency changes &amp; transponder codes</li>
                  <li>· Altimeter settings</li>
                </ul>
              </div>
              <div>
                <div className="text-gray-400 font-medium mb-1">Acknowledge only</div>
                <ul className="text-gray-300 space-y-1">
                  <li>· Traffic advisories (&ldquo;traffic in sight&rdquo;)</li>
                  <li>· Wind, weather, general info</li>
                </ul>
                <div className="mt-3 text-amber-300/90 text-xs">
                  Miss a hold-short and it&rsquo;s an automatic checkride fail — and a real runway incursion.
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end"><FAA>FAA AIM 4-3-18 · 4-4-7</FAA></div>
          </section>

          {/* NUMBERS */}
          <Card kicker="The formula" title="Saying Numbers" faa="FAA AIM 4-2-3 · 4-2-9">
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Altitude', 'All digits in full', '5,500 → “five thousand five hundred”'],
                    ['Altitude ≥ 10,000', 'Each thousands digit', '11,000 → “one one thousand”'],
                    ['Frequency', 'Each digit + “point”', '118.3 → “one one eight point three”'],
                    ['Squawk', 'Digit by digit', '4521 → “four five two one”'],
                    ['Runway', 'Each digit + L/R/C', '28L → “two eight left”'],
                    ['Heading', 'Three digits', '070 → “zero seven zero”'],
                  ].map(([k, rule, ex]) => (
                    <tr key={k}>
                      <td className="px-3 py-2.5 font-medium text-gray-900 align-top w-32">{k}</td>
                      <td className="px-3 py-2.5 text-gray-500 align-top">{rule}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700 align-top">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Pronounce <span className="font-mono">3 = “tree”, 5 = “fife”, 9 = “niner”</span> — and never &ldquo;fifty-five hundred&rdquo; or &ldquo;forty-five twenty-one.&rdquo;
            </p>
          </Card>

          {/* INITIAL CALL */}
          <Card kicker="The formula" title="The Initial Call" faa="FAA AIM 4-2-1 · 4-2-3">
            <div className="font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 leading-relaxed">
              <span className="text-blue-600">Who you&rsquo;re calling</span> · <span className="text-gray-900">who you are</span> · <span className="text-amber-600">where you are</span> · <span className="text-green-600">what you want</span>
            </div>
            <p className="text-sm text-gray-700 font-mono">&ldquo;Hilo Ground, Cessna One Two Three Four Five, GA ramp, ready to taxi.&rdquo;</p>
            <p className="text-sm text-gray-500 mt-2">Pack it into one transmission so the controller doesn&rsquo;t have to ask follow-ups. Wait for a reply before continuing.</p>
          </Card>

          {/* AIRPORT DIAGRAM */}
          <Card kicker="Reading the chart" title="Airport Signs &amp; Markings" faa="FAA AIM 2-3 · AC 150/5340-18">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 font-mono text-[11px] font-bold text-white bg-red-600 rounded px-2 py-1">16R</span>
                <div><span className="font-medium">Red = mandatory.</span> <span className="text-gray-500">A red runway-holding sign means STOP — do not cross onto that runway without a clearance. The hold-short line on the pavement is two solid + two dashed yellow lines; stay on the solid side.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 font-mono text-[11px] font-bold text-black bg-yellow-400 border border-black rounded px-2 py-1">A</span>
                <div><span className="font-medium">Yellow = location.</span> <span className="text-gray-500">A yellow sign with a black border tells you the taxiway you are <em>on</em>. Yellow direction signs (black text) point to taxiways ahead.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 font-mono text-[11px] text-gray-500 border border-dashed border-gray-400 rounded px-2 py-1">∙∙∙</span>
                <div><span className="font-medium">Movement area boundary.</span> <span className="text-gray-500">A solid + dashed yellow line marks where the tower-controlled movement area begins. Don&rsquo;t cross it without ground/tower.</span></div>
              </div>
              <p className="text-gray-500">On the diagram, find your position, the assigned taxiways, and the hold-short line <em>before</em> you start rolling — then read the route back.</p>
            </div>
          </Card>

          {/* NEVER SAY */}
          <Card kicker="Phraseology" title="Standard Words — and What Never to Say" faa="FAA P/CG · AIM 4-2-3">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900 mb-1.5">Say</div>
                <ul className="space-y-1 text-gray-600">
                  <li><span className="font-mono text-gray-900">Roger</span> — I received your message</li>
                  <li><span className="font-mono text-gray-900">Clearspar</span> — I will comply</li>
                  <li><span className="font-mono text-gray-900">Affirmative / Negative</span> — yes / no</li>
                  <li><span className="font-mono text-gray-900">Say again</span> — repeat your last</li>
                  <li><span className="font-mono text-gray-900">Unable</span> — I can&rsquo;t do that</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1.5">Never say</div>
                <ul className="space-y-1 text-gray-600">
                  <li><span className="font-mono line-through text-red-500">copy / copy that</span> — read it back</li>
                  <li><span className="font-mono line-through text-red-500">10-4</span> — CB slang</li>
                  <li><span className="font-mono line-through text-red-500">will do / for sure</span> — say &ldquo;wilco&rdquo;</li>
                  <li><span className="font-mono line-through text-red-500">roger that</span> — just &ldquo;roger&rdquo;</li>
                </ul>
                <p className="text-xs text-gray-400 mt-2">&ldquo;Roger&rdquo; ≠ &ldquo;yes&rdquo; and ≠ &ldquo;I&rsquo;ll comply.&rdquo;</p>
              </div>
            </div>
          </Card>
        </div>

        {/* sources + CTA */}
        <div className="mt-8 border border-gray-200 rounded-xl p-5 bg-gray-50">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">FAA sources</div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Aeronautical Information Manual (AIM) Ch. 2 &amp; 4 · Pilot/Controller Glossary · Advisory Circulars 90-66, 91-73, 150/5340-18.
            Public-domain FAA publications — verify against the current edition; not for navigation.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/ground-school" className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors">
            Now drill it — Ground School
          </Link>
        </div>
      </div>
    </main>
  )
}
