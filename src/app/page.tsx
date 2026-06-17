import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'

export default function Home() {
  const total = scenarios.length
  const byPhase = {
    ground: scenarios.filter((s) => s.phase === 'ground').length,
    departure: scenarios.filter((s) => s.phase === 'departure').length,
    pattern: scenarios.filter((s) => s.phase === 'pattern').length,
    enroute: scenarios.filter((s) => s.phase === 'enroute').length,
    ifr: scenarios.filter((s) => s.phase === 'ifr').length,
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-sm font-semibold tracking-widest text-gray-900">
            RADIO COACH
          </span>
          <Link
            href="/train"
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Start training →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-mono px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Free during beta
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            Your radio calls,<br />
            <span className="text-gray-400">graded like a CFI.</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-xl">
            ATC gives the transmission. You read it back. AI grades every element against FAA AIM standards — missed hold shorts, wrong squawk, non-standard phrases, all of it.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/train"
              className="bg-gray-900 text-white px-8 py-3.5 rounded-lg font-medium text-base hover:bg-gray-800 transition-colors"
            >
              Try a scenario free
            </Link>
            <span className="text-sm text-gray-400">No account required</span>
          </div>
        </div>
      </section>

      {/* Radio mock */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gray-950 rounded-2xl p-6 sm:p-8 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-mono text-xs uppercase tracking-widest">
              ATC · Ground Control
            </span>
          </div>
          <p className="text-green-400 font-mono text-sm sm:text-base leading-relaxed mb-6">
            &ldquo;Cessna 4 Sierra Uniform, taxi to runway 28 Left via Bravo, hold short of runway 28 Right, altimeter 2 niner niner 2.&rdquo;
          </p>
          <div className="border border-gray-800 rounded-lg p-4 mb-4">
            <div className="text-gray-500 text-xs font-mono mb-2 uppercase tracking-widest">Your readback</div>
            <p className="text-white font-mono text-sm">
              &ldquo;Taxi to 28 Left via Bravo, 4 Sierra Uniform.&rdquo;
            </p>
          </div>
          {/* Grade result */}
          <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-3xl font-bold text-red-400">52</div>
                <div className="text-xs text-red-400 font-semibold">FAIL</div>
              </div>
              <p className="text-xs text-gray-400 max-w-xs text-right leading-relaxed">
                Missing hold short instruction — a safety-critical element. In Class D airspace this causes a runway incursion.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Runway 28 Left</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Taxiway Bravo</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Call sign</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-red-400">✗</span>
                <span className="text-red-300 font-semibold">Hold short runway 28 Right — MISSING</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-red-400">✗</span>
                <span className="text-red-300">Altimeter 2 niner niner 2 — not read back</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: '01',
                title: 'ATC transmits',
                body: 'A realistic clearance or instruction — taxi, takeoff, pattern entry, flight following, IFR clearance.',
              },
              {
                n: '02',
                title: 'You read it back',
                body: 'Type exactly what you\'d say on the radio. No hints, no word bank. Just you and the mic.',
              },
              {
                n: '03',
                title: 'Claude grades it',
                body: 'Every required element checked against FAA AIM Chapter 4. Missing a hold short? Automatic fail, every time.',
              },
            ].map((step) => (
              <div key={step.n}>
                <div className="text-gray-300 font-mono text-xs mb-3">{step.n}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What gets graded */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-4">What gets graded</h2>
          <p className="text-gray-500 mb-10 max-w-lg">
            The same things your CFI is watching for — and the same things that cause runway incursions when missed.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            {[
              'Hold short instructions (missing = instant fail)',
              'Call sign on every transmission',
              'All numbers read back verbatim',
              'Runway designators with L/R/C suffix',
              'Frequencies digit by digit',
              'Squawk codes digit by digit',
              'Altitude format (five thousand, not fifty hundred)',
              'Non-standard phrases ("copy that", "10-4", "will do")',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-lg px-4 py-3 border border-gray-200">
                <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenario library */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-2">{total} scenarios across every phase of flight</h2>
          <p className="text-gray-500 mb-10">From first radio call to IFR clearance delivery.</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-xl">
            {Object.entries(byPhase).map(([phase, count]) => (
              <div key={phase} className="border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-semibold">{count}</div>
                <div className="text-xs text-gray-400 capitalize mt-1">{phase}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Simple pricing</h2>
          <p className="text-gray-400 mb-12">Free while you&rsquo;re getting started. Upgrade when you want more.</p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl">
            {[
              {
                name: 'Free',
                price: '$0',
                sub: 'forever',
                features: ['5 scenarios/day', 'Ground & departure phases', 'Text readback only'],
                cta: 'Start free',
                href: '/train',
                highlight: false,
              },
              {
                name: 'Solo Pilot',
                price: '$15',
                sub: '/month',
                features: ['Unlimited scenarios', 'All airport classes', 'All phases of flight', 'Score history'],
                cta: 'Get Solo Pilot',
                href: '/train',
                highlight: true,
              },
              {
                name: 'CFI Pro',
                price: '$30',
                sub: '/month',
                features: ['Everything in Solo', 'Assign scenarios to students', 'Student grade reports', 'Custom scenario builder'],
                cta: 'Get CFI Pro',
                href: '/train',
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 ${
                  tier.highlight
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-900 text-white border border-gray-800'
                }`}
              >
                {tier.highlight && (
                  <div className="text-xs font-mono text-green-600 mb-3 uppercase tracking-widest">
                    Most popular
                  </div>
                )}
                <div className="text-sm font-medium mb-1 opacity-70">{tier.name}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-semibold">{tier.price}</span>
                  <span className="text-sm opacity-50">{tier.sub}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm flex items-center gap-2 opacity-80">
                      <span className={tier.highlight ? 'text-green-600' : 'text-green-400'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                    tier.highlight
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center border-t border-gray-100">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Ready to stop second-guessing your calls?
          </h2>
          <p className="text-gray-500 mb-8">
            Start with the scenario that scares you most. Hold short, runway crossing, first IFR clearance.
          </p>
          <Link
            href="/train"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-lg font-medium text-base hover:bg-gray-800 transition-colors"
          >
            Start training — it&rsquo;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono font-semibold tracking-widest">RADIO COACH</span>
          <span>Built for student pilots. Graded against FAA AIM Chapter 4.</span>
        </div>
      </footer>

    </main>
  )
}
