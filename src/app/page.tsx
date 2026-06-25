import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'
import { units } from '@/lib/groundschool'
import NavAuth from '@/components/NavAuth'
import LandingMiniDrill from '@/components/LandingMiniDrill'
import NativeHide from '@/components/NativeHide'
import { FlameIcon, StarIcon, HeartIcon, LockIcon } from '@/components/icons'

export default function Home() {
  const total = scenarios.length
  const byPhase = {
    ground: scenarios.filter((s) => s.phase === 'ground').length,
    departure: scenarios.filter((s) => s.phase === 'departure').length,
    pattern: scenarios.filter((s) => s.phase === 'pattern').length,
    enroute: scenarios.filter((s) => s.phase === 'enroute').length,
    ifr: scenarios.filter((s) => s.phase === 'ifr').length,
    emergency: scenarios.filter((s) => s.phase === 'emergency').length,
  }
  const gsLessons = units.reduce((n, u) => n + u.lessons.length, 0)

  const FAQ = [
    { q: 'Do I need a microphone?', a: 'Nope. Ground School is all taps and choices. In Live Comms you can type your read-back or use your mic — your call.' },
    { q: 'Is it actually free?', a: 'Yes — Ground School is completely free and works offline. Live Comms gives you 2 AI-graded scenarios a day free; go unlimited for $9/mo.' },
    { q: 'Is the content FAA-accurate?', a: 'Every scenario and drill is built against the FAA Aeronautical Information Manual (AIM) Chapter 4 — the same standard your CFI and examiner use.' },
    { q: 'Will this help on my checkride?', a: 'That’s the point. Radio work trips up more student pilots than almost anything — hold-shorts, read-backs, and phraseology are exactly what gets drilled and graded here.' },
    { q: 'Does it really work offline?', a: 'Ground School drills run entirely on your device — perfect for the ramp, the run-up area, or a flight with no signal.' },
  ]

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://wilco.binnacleai.com/#org',
        name: 'Clearspar',
        url: 'https://wilco.binnacleai.com',
        logo: 'https://wilco.binnacleai.com/icon-192.png',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://wilco.binnacleai.com/#website',
        url: 'https://wilco.binnacleai.com',
        name: 'Clearspar Radio Trainer',
        publisher: { '@id': 'https://wilco.binnacleai.com/#org' },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Clearspar Radio Trainer',
        operatingSystem: 'iOS, Web',
        applicationCategory: 'EducationalApplication',
        description:
          'Aviation radio (ATC) training. Free Ground School drills plus live, AI-graded ATC read-backs against the FAA Aeronautical Information Manual.',
        url: 'https://wilco.binnacleai.com',
        offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '9', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      {/* ── Nav + Hero — G1000 glass-cockpit panel ── */}
      <style>{`
        .gc{position:relative;overflow:hidden;background:#06070a}
        .gc-pfd{position:absolute;inset:0;width:100%;height:100%;z-index:0}
        .gc-att{animation:gc-roll 11s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        @keyframes gc-roll{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(-5.4deg)}}
        .gc-scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(100deg,rgba(4,5,8,.98) 0%,rgba(4,5,8,.95) 33%,rgba(4,5,8,.77) 51%,rgba(4,5,8,.36) 68%,rgba(4,5,8,0) 85%)}
        .gc-word{font-family:var(--font-mono,monospace);font-size:13px;letter-spacing:.22em;font-weight:600;color:#eef3f8;text-shadow:0 1px 6px rgba(0,0,0,.7)}
        .gc-strip{position:relative;z-index:20;background:rgba(6,8,12,.82);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06)}
        .gc-strip-in{display:flex;align-items:center;gap:10px;font-family:var(--font-mono,monospace);font-size:11px;padding:5px 0;color:#9aa6b2}
        .gc-strip i{font-style:normal;color:#727b88;margin-right:3px}
        .gc-strip small{color:#727b88}
        .gc-grn{color:#19e07a}
        .gc-tx{text-shadow:0 0 8px rgba(25,224,122,.5)}
        .gc-cy{color:#36d6e6}
        .gc-wht{color:#b7c0cc}
        .gc-sep{color:#3a414b}
        .gc-arr{font-style:normal;color:#5a626c}
        .gc-mic{display:inline-flex;align-items:flex-end;gap:1.5px;height:11px}
        .gc-mic span{width:3px;background:#19e07a;border-radius:1px;animation:gc-eq 1s ease-in-out infinite}
        .gc-mic span:nth-child(1){height:40%;animation-delay:0s}
        .gc-mic span:nth-child(2){height:70%;animation-delay:.18s}
        .gc-mic span:nth-child(3){height:100%;animation-delay:.36s}
        .gc-mic span:nth-child(4){height:55%;animation-delay:.54s}
        @keyframes gc-eq{0%,100%{transform:scaleY(.4);opacity:.6}50%{transform:scaleY(1);opacity:1}}
        .gc-keys{position:relative;z-index:20;display:flex;gap:1px;background:#0c0d10;border-top:1px solid rgba(255,255,255,.1)}
        .gc-keys span{flex:1;text-align:center;font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:.1em;color:#828b98;padding:11px 0;background:#16181d}
        .gc-key-on{color:#19e07a;background:#11271c}
        .gc-amber{color:#f5a623;text-shadow:0 0 20px rgba(245,166,35,.45)}
        @media (prefers-reduced-motion:reduce){.gc-att,.gc-mic span{animation:none}}
        @media (max-width:640px){.gc-hidesm{display:none}.gc-scrim{background:linear-gradient(180deg,rgba(4,5,8,.58) 0%,rgba(4,5,8,.8) 48%,rgba(4,5,8,.92) 100%)}}
      `}</style>

      <section className="gc">

        {/* PFD background */}
        <svg className="gc-pfd" viewBox="0 0 680 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3f97d6" /><stop offset="1" stopColor="#1d6cae" /></linearGradient>
            <linearGradient id="gcGnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#714f2d" /><stop offset="1" stopColor="#43301d" /></linearGradient>
          </defs>

          <g className="gc-att">
            <rect x="-260" y="-280" width="1240" height="1040" fill="none" />
            <rect x="-260" y="-280" width="1240" height="520" fill="url(#gcSky)" />
            <rect x="-260" y="240" width="1240" height="520" fill="url(#gcGnd)" />
            <line x1="-260" y1="240" x2="980" y2="240" stroke="#f2f6fa" strokeWidth="2" />
            <g stroke="#f2f6fa" strokeOpacity=".92" strokeWidth="1.6" fontFamily="monospace" fontSize="11" fill="#f2f6fa">
              <line x1="322" y1="184" x2="398" y2="184" /><text x="306" y="188">10</text><text x="402" y="188">10</text>
              <line x1="338" y1="212" x2="382" y2="212" />
              <line x1="338" y1="268" x2="382" y2="268" />
              <line x1="322" y1="296" x2="398" y2="296" /><text x="306" y="300">10</text><text x="402" y="300">10</text>
            </g>
            <path d="M207.6 152 A176 176 0 0 1 512.4 152" fill="none" stroke="#f2f6fa" strokeOpacity=".85" strokeWidth="2" />
            <g fill="#f2f6fa">
              <path d="M360 76 L353 60 L367 60 Z" />
              <path d="M449 90 L455 76 L442 80 Z" /><path d="M271 90 L289 80 L276 76 Z" />
              <circle cx="513" cy="152" r="3" /><circle cx="207" cy="152" r="3" />
            </g>
            <g stroke="#f2f6fa" strokeWidth="1.4" strokeOpacity=".8">
              <line x1="392" y1="67" x2="390" y2="76" /><line x1="328" y1="67" x2="330" y2="76" />
              <line x1="421" y1="75" x2="417" y2="83" /><line x1="299" y1="75" x2="303" y2="83" />
              <line x1="485" y1="116" x2="478" y2="122" /><line x1="235" y1="116" x2="242" y2="122" />
            </g>
          </g>

          {/* Roll pointer + slip/skid (fixed) */}
          <path d="M360 84 L351 98 L369 98 Z" fill="#f2f6fa" />
          <path d="M351 100 L369 100 L366 107 L354 107 Z" fill="none" stroke="#f2f6fa" strokeWidth="1.3" />

          {/* Aircraft reference symbol */}
          <g fill="#ffcc00" stroke="#241a04" strokeWidth="0.6">
            <rect x="300" y="238" width="44" height="5" /><rect x="300" y="238" width="5" height="15" />
            <rect x="376" y="238" width="44" height="5" /><rect x="415" y="238" width="5" height="15" />
          </g>
          <rect x="351" y="233" width="18" height="13" fill="none" stroke="#ffcc00" strokeWidth="3" />
          <circle cx="360" cy="240" r="1.8" fill="#ffcc00" />

          {/* Airspeed tape */}
          <g fontFamily="monospace">
            <rect x="0" y="0" width="70" height="500" fill="#0d1016" fillOpacity=".8" />
            <line x1="70" y1="0" x2="70" y2="500" stroke="#3f4a55" />
            <rect x="64" y="175" width="6" height="156" fill="#19e07a" />
            <rect x="64" y="136" width="6" height="39" fill="#f5c518" />
            <rect x="64" y="97" width="6" height="39" fill="#e2433f" />
            <rect x="64" y="331" width="6" height="34" fill="#f2f6fa" />
            <g fill="#f2f6fa" fontSize="13" textAnchor="end">
              <text x="48" y="101">160</text><text x="48" y="127">150</text><text x="48" y="153">140</text>
              <text x="48" y="179">130</text><text x="48" y="205">120</text><text x="48" y="231">110</text>
              <text x="48" y="257">100</text><text x="48" y="283">90</text><text x="48" y="309">80</text>
            </g>
            <g stroke="#9aa6b2" strokeWidth="1"><line x1="54" y1="97" x2="62" y2="97" /><line x1="54" y1="123" x2="62" y2="123" /><line x1="54" y1="149" x2="62" y2="149" /><line x1="54" y1="201" x2="62" y2="201" /><line x1="54" y1="227" x2="62" y2="227" /><line x1="54" y1="253" x2="62" y2="253" /><line x1="54" y1="279" x2="62" y2="279" /><line x1="54" y1="305" x2="62" y2="305" /></g>
            <path d="M68 240 L62 240 L62 215" fill="none" stroke="#ff3ad0" strokeWidth="2" />
            <path d="M2 222 L62 222 L70 240 L62 258 L2 258 Z" fill="#05070b" stroke="#f2f6fa" strokeWidth="1.2" />
            <text x="44" y="247" fill="#f2f6fa" fontSize="19" textAnchor="end" id="gc-ias">105</text>
            <path d="M66 123 L74 117 L74 129 Z" fill="#36d6e6" />
          </g>

          {/* Altitude tape + VSI */}
          <g fontFamily="monospace">
            <rect x="610" y="0" width="70" height="500" fill="#0d1016" fillOpacity=".8" />
            <line x1="610" y1="0" x2="610" y2="500" stroke="#3f4a55" />
            <rect x="590" y="64" width="20" height="372" fill="#0d1016" fillOpacity=".7" />
            <line x1="590" y1="240" x2="610" y2="240" stroke="#f2f6fa" strokeOpacity=".7" />
            <g stroke="#9aa6b2" strokeWidth="1"><line x1="596" y1="170" x2="610" y2="170" /><line x1="600" y1="205" x2="610" y2="205" /><line x1="596" y1="310" x2="610" y2="310" /><line x1="600" y1="275" x2="610" y2="275" /></g>
            <text x="592" y="78" fill="#9aa6b2" fontSize="10">VS</text>
            <path d="M610 222 L598 218 L598 226 Z" fill="#19e07a" /><text x="600" y="214" fill="#19e07a" fontSize="10" id="gc-vsi">+300</text>
            <g fill="#f2f6fa" fontSize="13" textAnchor="start">
              <text x="624" y="114">6000</text><text x="624" y="140">5900</text><text x="624" y="166">5800</text>
              <text x="624" y="192">5700</text><text x="624" y="218">5600</text>
              <text x="624" y="270">5400</text><text x="624" y="296">5300</text><text x="624" y="322">5200</text>
            </g>
            <rect x="614" y="6" width="62" height="24" fill="#06222a" stroke="#36d6e6" /><text x="645" y="23" fill="#36d6e6" fontSize="14" textAnchor="middle">5,800</text>
            <path d="M610 158 L620 154 L620 166 L610 162 Z" fill="#36d6e6" />
            <path d="M676 222 L616 222 L610 240 L616 258 L676 258 Z" fill="#05070b" stroke="#f2f6fa" strokeWidth="1.2" />
            <text x="622" y="247" fill="#f2f6fa" fontSize="16" id="gc-alt">5,500</text>
            <text x="618" y="480" fill="#36d6e6" fontSize="12">29.92IN</text>
          </g>

          {/* Partial HSI */}
          <g fontFamily="monospace">
            <path d="M210 430 A165 165 0 0 1 510 430" fill="none" stroke="#cdd6df" strokeWidth="1.4" strokeOpacity=".8" />
            <g stroke="#cdd6df" strokeWidth="1.2" strokeOpacity=".7"><line x1="360" y1="365" x2="360" y2="377" /><line x1="305" y1="372" x2="308" y2="384" /><line x1="415" y1="372" x2="412" y2="384" /><line x1="258" y1="392" x2="264" y2="402" /><line x1="462" y1="392" x2="456" y2="402" /></g>
            <g fill="#f2f6fa" fontSize="12" textAnchor="middle"><text x="360" y="392">36</text><text x="300" y="398">33</text><text x="420" y="398">3</text></g>
            <path d="M360 363 L354 351 L366 351 Z" fill="#f2f6fa" />
            <path d="M360 365 L360 430" stroke="#ff3ad0" strokeWidth="2.5" /><path d="M360 365 L353 378 L367 378 Z" fill="#ff3ad0" />
            <rect x="340" y="372" width="13" height="9" fill="#36d6e6" opacity=".9" />
            <text x="232" y="372" fill="#36d6e6" fontSize="12">HDG 010</text>
            <text x="438" y="372" fill="#ff3ad0" fontSize="12">CRS 358</text>
            <text x="232" y="404" fill="#36d6e6" fontSize="11">↙ 270° 9KT</text>
          </g>
        </svg>

        <div className="gc-scrim" />

        {/* Nav */}
        <nav className="relative z-20 border-b border-white/10 bg-[#06070a]/45">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="gc-word">CLEARSPAR</span>
            <div className="flex items-center gap-5">
              <Link href="/ground-school" className="text-sm text-gray-300 hover:text-white font-medium gc-hidesm">Ground School</Link>
              <Link href="/checkride" className="text-sm text-gray-300 hover:text-white font-medium gc-hidesm">Checkrides</Link>
              <Link href="/cheatsheet" className="text-sm text-gray-300 hover:text-white font-medium gc-hidesm">Cheat Sheet</Link>
              <Link href="/learn" className="text-sm text-gray-300 hover:text-white font-medium gc-hidesm">Learn</Link>
              <NavAuth dark />
            </div>
          </div>
        </nav>

        {/* Avionics data strip */}
        <div className="gc-strip">
          <div className="max-w-5xl mx-auto px-6">
            <div className="gc-strip-in">
              <span><i>NAV1</i> <b className="gc-grn">113.90</b> <em className="gc-arr">⇄</em> <b className="gc-wht">110.50</b></span>
              <span className="gc-sep gc-hidesm">|</span>
              <span className="gc-hidesm"><i>COM1</i> <b className="gc-grn gc-tx">121.700</b> <em className="gc-arr">⇄</em> <b className="gc-cy">118.300</b></span>
              <span className="gc-mic gc-hidesm" aria-hidden="true"><span /><span /><span /><span /></span>
              <span className="ml-auto gc-hidesm"><i>XPDR</i> <b className="gc-cy">1200</b> <small>ALT</small> <em className="gc-sep">{' '}|{' '}</em> <i>OAT</i> <b className="gc-cy">24°C</b></span>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 pt-16 pb-40 sm:pb-44">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-300 text-xs font-mono px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Free to start
            </div>
            <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 text-white" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.85)' }}>
              Your radio calls,<br />
              <span className="gc-amber">graded like a CFI.</span>
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed mb-8 max-w-lg" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.85)' }}>
              ATC gives the transmission. You read it back. AI grades every element against FAA AIM standards — missed hold shorts, wrong squawk, non-standard phrases, all of it.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/train"
                className="bg-[#f5a623] text-[#1a1205] px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-[#ffb73d] transition-colors"
              >
                Try a scenario free
              </Link>
              <Link
                href="/ground-school"
                className="border border-white/30 text-gray-100 px-8 py-3.5 rounded-lg font-medium text-base hover:border-white/60 transition-colors bg-black/30"
              >
                Start Ground School
              </Link>
              <span className="text-sm text-gray-400 w-full sm:w-auto">No account · no mic · works offline</span>
            </div>
          </div>
        </div>

        {/* Softkey bezel */}
        <div className="gc-keys" aria-hidden="true">
          <span className="gc-key-on">PFD</span><span>MAP</span><span>TRAFFIC</span><span className="gc-key-on">COM</span><span>XPDR</span><span>NRST</span>
        </div>

        {/* Live drift — airspeed wobble + gentle climb with matching VSI. Tuned freqs stay fixed. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var ias=105,alt=5500,vsi=300;var I=document.getElementById('gc-ias'),A=document.getElementById('gc-alt'),V=document.getElementById('gc-vsi');if(!I||!A||!V)return;setInterval(function(){vsi+=Math.random()*100-50;alt+=vsi/60*1.6;if(alt>5556)vsi=-Math.abs(vsi)-40;if(alt<5462)vsi=Math.abs(vsi)+40;if(vsi>560)vsi=560;if(vsi<-260)vsi=-260;if(alt>5560)alt=5560;if(alt<5458)alt=5458;ias+=Math.random()*2.4-1.2;if(ias>110)ias=110;if(ias<100)ias=100;I.textContent=Math.round(ias);A.textContent=Math.round(alt).toLocaleString('en-US');var v=Math.round(vsi/10)*10;V.textContent=(v>=0?'+':'')+v;},1600);})();`,
          }}
        />
      </section>

      {/* Avionics Radio Stack Demo */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-2xl">

          {/* Radio Stack Panel */}
          <div className="rounded-xl overflow-hidden border border-green-500/40 shadow-lg shadow-green-900/10 mb-4" style={{ background: '#111214' }}>
            {/* Avionics header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded tracking-widest font-bold border text-green-400 border-green-700 bg-green-950/60">
                  GROUND
                </span>
                <span className="font-mono text-lg tracking-wider leading-none tabular-nums" style={{ color: '#19e07a', textShadow: '0 0 8px rgba(25,224,122,0.55)' }}>
                  121.700
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-0.5 h-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-1 rounded-sm bg-green-400" style={{ height: `${i * 25}%` }} />
                  ))}
                </div>
                <span className="font-mono text-xs tracking-widest font-bold text-green-400">RX</span>
              </div>
            </div>
            {/* Transmission */}
            <div className="px-4 py-4">
              <div className="flex items-start gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <p className="text-green-400 font-mono text-sm sm:text-base leading-relaxed">
                  &ldquo;Cessna One Two Three Four Five, Hilo Ground, taxi to runway two eight left via Bravo, hold short of runway two eight right, altimeter two niner niner two.&rdquo;
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-gray-700 font-mono">PHTO · GND</span>
              <span className="text-xs text-amber-600 font-mono tracking-wider">▶ REPLAY</span>
            </div>
          </div>

          {/* Readback input */}
          <div className="border border-gray-800 rounded-xl p-4 mb-4" style={{ background: '#111214' }}>
            <div className="text-gray-500 text-xs font-mono mb-2 uppercase tracking-widest">Your readback</div>
            <p className="text-white font-mono text-sm">
              &ldquo;Taxi to two eight left via Bravo, One Two Three Four Five.&rdquo;
            </p>
          </div>

          {/* Grade result */}
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-3xl font-bold text-red-400">52</div>
                <div className="text-xs text-red-400 font-semibold tracking-widest">FAIL</div>
              </div>
              <p className="text-xs text-gray-400 max-w-xs text-right leading-relaxed">
                Missing hold short — a safety-critical element. Causes runway incursion in Class D.
              </p>
            </div>
            <div className="space-y-1.5">
              {[
                { hit: true, text: 'Runway two eight left' },
                { hit: true, text: 'Taxiway Bravo' },
                { hit: true, text: 'Call sign' },
                { hit: false, text: 'Hold short runway two eight right — MISSING' },
                { hit: false, text: 'Altimeter two niner niner two — not read back' },
              ].map((el) => (
                <div key={el.text} className="flex items-center gap-2 text-xs font-mono">
                  <span className={el.hit ? 'text-green-400' : 'text-red-400'}>{el.hit ? '✓' : '✗'}</span>
                  <span className={el.hit ? 'text-gray-300' : 'text-red-300 font-semibold'}>{el.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Squawk display teaser */}
          <div className="mt-4 flex items-center gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-mono uppercase tracking-widest">SQUAWK</span>
              <span className="font-mono text-base tracking-widest tabular-nums" style={{ color: '#f5a623', textShadow: '0 0 6px rgba(245,166,35,0.4)' }}>1200</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-mono uppercase tracking-widest">MODE</span>
              <span className="font-mono text-xs text-green-500 tracking-widest">C</span>
            </div>
            <div className="ml-auto text-xs text-gray-700 font-mono">VFR · KPHTO · RWY 28L</div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { n: total, label: 'AI-graded scenarios', sub: 'every phase of flight' },
              { n: gsLessons, label: 'drill lessons', sub: 'phonetics → emergencies' },
              { n: 7, label: 'ATC facilities', sub: 'ground to center' },
              { n: '$0', label: 'to start', sub: 'no card, no mic' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{s.n}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ground School showcase */}
      <section className="relative overflow-hidden border-b border-gray-100 py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-mono font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
              New · Ground School
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Learn the radio like a game</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Bite-sized drills that make the basics automatic — phonetics, numbers, hold-shorts, emergencies. Build a streak, earn XP, lose a heart when you slip. No mic, no AI, <span className="font-medium text-gray-700">works offline</span>.
            </p>
          </div>

          {/* Playable taste */}
          <div className="max-w-2xl mx-auto mb-16">
            <LandingMiniDrill />
          </div>

          {/* Exercise types */}
          <h3 className="text-center text-sm font-mono uppercase tracking-widest text-gray-400 mb-6">Six ways to drill</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-16">
            {[
              { tag: 'MC', name: 'Multiple choice', ex: '"Phonetic for R?" → Romeo' },
              { tag: 'SEQ', name: 'Tap-the-tokens', ex: 'Build the read-back in order' },
              { tag: 'C/S', name: 'Spell your call sign', ex: 'N42TG → November Four Two…' },
              { tag: 'RX', name: 'Listen & select', ex: 'Hear ATC, pick the answer' },
              { tag: 'PAIR', name: 'Match the pairs', ex: '7700 ↔ general emergency' },
              { tag: 'ERR', name: 'Spot the error', ex: 'Tap the wrong word' },
            ].map((c) => (
              <div key={c.name} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="inline-block font-mono text-[10px] font-bold tracking-widest text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 mb-2">{c.tag}</div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.ex}</div>
              </div>
            ))}
          </div>

          {/* The path */}
          <h3 className="text-center text-sm font-mono uppercase tracking-widest text-gray-400 mb-6">
            The path · {units.length} units, {gsLessons} lessons
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-2.5 mb-12">
            {units.map((u, i) => (
              <span key={u.id} className="inline-flex items-center gap-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${u.color}`}>
                  <span>{u.icon}</span>{u.title}
                </span>
                {i < units.length - 1 && <span className="text-gray-300">→</span>}
              </span>
            ))}
          </div>

          {/* Game mechanics + CTA */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1.5"><FlameIcon className="text-base text-orange-500" /> <span className="font-medium text-gray-700">Daily streaks</span></span>
            <span className="flex items-center gap-1.5"><StarIcon className="text-base text-amber-500" /> <span className="font-medium text-gray-700">Earn XP</span></span>
            <span className="flex items-center gap-1.5"><HeartIcon className="text-base text-red-500" /> <span className="font-medium text-gray-700">5 hearts per lesson</span></span>
            <span className="flex items-center gap-1.5"><LockIcon className="text-base text-gray-400" /> <span className="font-medium text-gray-700">Unlock as you go</span></span>
          </div>
          <div className="text-center">
            <Link href="/ground-school" className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-lg font-semibold transition-colors">
              Start Ground School — it&rsquo;s free
            </Link>
          </div>
        </div>
      </section>

      {/* How it works (AI grader) */}
      <section className="border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
            Live Comms · AI-graded
          </div>
          <h2 className="text-2xl font-semibold mb-3">Then key the mic for real</h2>
          <p className="text-gray-500 mb-12 max-w-lg">When the basics are automatic, step up to the live sim — real ATC, and Claude grades every element of your read-back.</p>
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-2xl">
            {Object.entries(byPhase).map(([phase, count]) => (
              <div key={phase} className="border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-semibold">{count}</div>
                <div className="text-xs text-gray-400 capitalize mt-1">{phase === 'ifr' ? 'IFR' : phase}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-10">Questions, answered</h2>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — hidden in the native app (App Store 3.1.1: no non-IAP purchase UI) */}
      <NativeHide>
      <section className="bg-gray-950 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white mb-2">Simple pricing</h2>
          <p className="text-gray-400 mb-2">Free while you&rsquo;re getting started. Upgrade when you want more.</p>
          <p className="text-gray-500 text-sm mb-12">Save two months with annual billing — Solo $90/yr, CFI Pro $300/yr, Flight School $990/yr.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
            {[
              {
                name: 'Free',
                price: '$0',
                sub: 'forever',
                features: ['Full Ground School — all drills', 'Works offline · no mic', '2 AI-graded scenarios/day'],
                cta: 'Start free',
                href: '/ground-school',
                highlight: false,
              },
              {
                name: 'Solo Pilot',
                price: '$9',
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
              {
                name: 'Flight School',
                price: '$99',
                sub: '/month',
                features: ['Everything in CFI Pro', 'Multiple instructors, one account', 'Pooled students across CFIs', 'Public school directory listing'],
                cta: 'Get Flight School',
                href: '/school',
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
      </NativeHide>

      {/* Final CTA */}
      <section className="py-24 text-center border-t border-gray-100">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Ready to stop second-guessing your calls?
          </h2>
          <p className="text-gray-500 mb-8">
            Warm up with a few drills, then key the mic for the scenario that scares you most — hold short, runway crossing, first IFR clearance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/ground-school"
              className="inline-block bg-green-500 text-white px-9 py-4 rounded-lg font-semibold text-base hover:bg-green-600 transition-colors"
            >
              Start Ground School — free
            </Link>
            <Link
              href="/train"
              className="inline-block bg-gray-900 text-white px-9 py-4 rounded-lg font-medium text-base hover:bg-gray-800 transition-colors"
            >
              Try a live scenario
            </Link>
          </div>
        </div>
      </section>

      {/* Footer is rendered site-wide via SiteFooter in layout.tsx */}

    </main>
  )
}
