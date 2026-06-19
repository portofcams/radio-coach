import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'
import { units } from '@/lib/groundschool'
import NavAuth from '@/components/NavAuth'
import LandingMiniDrill from '@/components/LandingMiniDrill'
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

  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-sm font-semibold tracking-widest text-gray-900">
            WILCO
          </span>
          <div className="flex items-center gap-5">
            <Link href="/ground-school" className="text-sm text-gray-500 hover:text-gray-900 font-medium">Ground School</Link>
            <Link href="/checkride" className="text-sm text-gray-500 hover:text-gray-900 font-medium">Checkrides</Link>
            <Link href="/cheatsheet" className="text-sm text-gray-500 hover:text-gray-900 font-medium">Cheat Sheet</Link>
            <Link href="/learn" className="text-sm text-gray-500 hover:text-gray-900 font-medium">Learn</Link>
            <NavAuth />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">

        {/* Airport scene background */}
        <svg
          viewBox="0 0 1400 620"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#f0f9ff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="runwayFade" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Sky tint */}
          <rect x="0" y="0" width="1400" height="620" fill="url(#skyGrad)" />

          {/* Ground / horizon */}
          <rect x="0" y="430" width="1400" height="190" fill="#f1f5f9" fillOpacity="0.25" />
          <line x1="0" y1="430" x2="1400" y2="430" stroke="#cbd5e1" strokeWidth="1" strokeOpacity="0.3" />

          {/* Runway — vanishing point at (1200, 390) toward the tower */}
          <path d="M 550 620 L 1200 390 L 1400 580 Z" fill="url(#runwayFade)" />
          <line x1="550" y1="620" x2="1200" y2="390" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.18" />
          <line x1="1400" y1="580" x2="1200" y2="390" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.18" />

          {/* Runway threshold stripes (near end, left side) */}
          <g fillOpacity="0.10" fill="#64748b">
            <rect x="580" y="600" width="38" height="13" rx="2" />
            <rect x="628" y="588" width="33" height="11" rx="2" />
            <rect x="672" y="576" width="28" height="10" rx="2" />
            <rect x="1345" y="575" width="35" height="12" rx="2" />
            <rect x="1310" y="565" width="30" height="10" rx="2" />
          </g>

          {/* Runway centerline dashes (converging toward tower) */}
          <g stroke="#94a3b8" strokeOpacity="0.11" strokeWidth="2">
            <line x1="1010" y1="620" x2="1030" y2="588" />
            <line x1="1042" y1="558" x2="1058" y2="528" />
            <line x1="1068" y1="502" x2="1082" y2="475" />
            <line x1="1090" y1="452" x2="1102" y2="429" />
            <line x1="1110" y1="410" x2="1118" y2="393" />
          </g>

          {/* ── CONTROL TOWER — far right ── */}
          <g fill="#334155" fillOpacity="0.08">
            {/* Base terminal building */}
            <rect x="1200" y="390" width="130" height="170" rx="3" />
            <rect x="1172" y="445" width="185" height="115" rx="3" />
            {/* Tower shaft */}
            <rect x="1242" y="185" width="38" height="210" rx="2" />
            {/* Observation cab — trapezoid */}
            <path d="M 1215 185 L 1228 148 L 1298 148 L 1310 185 Z" />
            {/* Cab roof overhang */}
            <rect x="1209" y="141" width="110" height="10" rx="2" />
          </g>

          {/* Tower cab windows */}
          <g fill="#bae6fd" fillOpacity="0.45">
            <rect x="1222" y="155" width="13" height="20" rx="1.5" />
            <rect x="1240" y="155" width="13" height="20" rx="1.5" />
            <rect x="1258" y="155" width="13" height="20" rx="1.5" />
            <rect x="1276" y="155" width="13" height="20" rx="1.5" />
            <rect x="1294" y="155" width="13" height="20" rx="1.5" />
          </g>

          {/* Tower antennas */}
          <g stroke="#334155" strokeOpacity="0.08">
            <line x1="1261" y1="141" x2="1261" y2="98" strokeWidth="3" />
            <line x1="1247" y1="106" x2="1275" y2="106" strokeWidth="1.5" />
            <line x1="1261" y1="98" x2="1253" y2="108" strokeWidth="1.5" />
            <line x1="1261" y1="98" x2="1269" y2="108" strokeWidth="1.5" />
            <line x1="1288" y1="141" x2="1288" y2="118" strokeWidth="2" />
            <line x1="1232" y1="141" x2="1232" y2="124" strokeWidth="2" />
          </g>
          <circle cx="1261" cy="95" r="6" fill="#334155" fillOpacity="0.08" />
          <circle cx="1261" cy="95" r="3" fill="#fef08a" fillOpacity="0.25" />

          {/* Animated airplane */}
          <style>{`
            @keyframes planefly {
              0%   { transform: translate(-320px, 588px) rotate(0deg);   opacity: 0; }
              4%   { opacity: 1; }
              12%  { transform: translate(60px,  572px) rotate(-2deg);  opacity: 1; }
              28%  { transform: translate(400px, 530px) rotate(-8deg); }
              48%  { transform: translate(740px, 450px) rotate(-16deg); }
              66%  { transform: translate(1010px,310px) rotate(-20deg); }
              84%  { transform: translate(1310px,165px) rotate(-22deg); }
              96%  { transform: translate(1620px, 40px) rotate(-20deg); opacity: 1; }
              100% { transform: translate(1750px,-20px) rotate(-18deg); opacity: 0; }
            }
            #plane-anim {
              animation: planefly 11s cubic-bezier(0.22, 0.1, 0.58, 1) infinite;
            }
          `}</style>

          {/* ── AIRPLANE — Cessna-style, takeoff attitude ── */}
          <g id="plane-anim" fill="#1e293b" fillOpacity="0.09">

            {/* Main fuselage */}
            <path d="
              M 162 0
              Q 146 -10 112 -16
              Q 62 -20 10 -18
              Q -60 -16 -116 -10
              Q -150 -6 -166 0
              Q -150 6 -116 10
              Q -60 16 10 18
              Q 62 20 112 16
              Q 146 10 162 0 Z
            " />

            {/* Nose cone */}
            <path d="M 160 -6 Q 182 -2 190 0 Q 182 2 160 6 Z" />

            {/* Cabin bump / windshield */}
            <path d="
              M 22 -18 Q 42 -30 82 -30 Q 116 -29 136 -16
              L 112 -16 Q 96 -26 76 -26 Q 46 -26 30 -18 Z
            " />

            {/* Wing (high wing, side view) */}
            <path d="M 42 -18 L 26 -90 L -18 -86 L -2 -18 Z" />

            {/* Wing strut */}
            <line x1="30" y1="16" x2="8" y2="-64" stroke="#1e293b" strokeOpacity="0.09" strokeWidth="5" />

            {/* Horizontal stabilizer */}
            <path d="M -146 -4 L -170 -32 L -180 -30 L -160 -4 Z" />
            <path d="M -146 4 L -170 32 L -180 30 L -160 4 Z" />

            {/* Vertical fin */}
            <path d="M -138 -8 Q -150 -28 -160 -58 L -146 -57 Q -136 -28 -124 -8 Z" />

            {/* Propeller arc */}
            <ellipse cx="192" cy="0" rx="5" ry="46" fillOpacity="0.3" />

            {/* Main gear (trailing, just airborne) */}
            <line x1="-4" y1="17" x2="-2" y2="38" stroke="#1e293b" strokeOpacity="0.07" strokeWidth="5" />
            <ellipse cx="-2" cy="41" rx="10" ry="7" fillOpacity="0.07" />
            <line x1="30" y1="17" x2="32" y2="38" stroke="#1e293b" strokeOpacity="0.07" strokeWidth="5" />
            <ellipse cx="32" cy="41" rx="10" ry="7" fillOpacity="0.07" />

            {/* Nose gear (retracting) */}
            <line x1="132" y1="12" x2="134" y2="27" stroke="#1e293b" strokeOpacity="0.06" strokeWidth="4" />
            <ellipse cx="134" cy="30" rx="7" ry="5" fillOpacity="0.06" />
          </g>

          {/* Prop wash streaks (trailing behind plane, left of center) */}
          <g stroke="#94a3b8" strokeOpacity="0.05" strokeWidth="1.5" fill="none">
            <path d="M 788 270 Q 740 265 670 267" />
            <path d="M 784 283 Q 730 279 655 281" />
            <path d="M 790 295 Q 738 292 662 295" />
          </g>

          {/* ── VOR COMPASS ROSE — upper left, very subtle ── */}
          <g transform="translate(110, 150)" opacity="0.08">
            {/* Outer ring */}
            <circle cx="0" cy="0" r="88" fill="none" stroke="#334155" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="72" fill="none" stroke="#334155" strokeWidth="0.75" />

            {/* Cardinal tick marks */}
            {Array.from({ length: 36 }, (_, i) => {
              const angle = i * 10
              const rad = (angle * Math.PI) / 180
              const isCardinal = angle % 90 === 0
              const isMajor = angle % 30 === 0
              const outer = 88
              const inner = isCardinal ? 72 : isMajor ? 78 : 83
              return (
                <line
                  key={i}
                  x1={Math.sin(rad) * inner}
                  y1={-Math.cos(rad) * inner}
                  x2={Math.sin(rad) * outer}
                  y2={-Math.cos(rad) * outer}
                  stroke="#334155"
                  strokeWidth={isCardinal ? 2 : isMajor ? 1.5 : 1}
                />
              )
            })}

            {/* N/S/E/W labels */}
            <text x="0" y="-60" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#334155">N</text>
            <text x="0" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#334155">S</text>
            <text x="62" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#334155">E</text>
            <text x="-62" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#334155">W</text>

            {/* TO/FROM arrow — pointing roughly NE (045°) */}
            <g transform="rotate(45)">
              <polygon points="0,-52 6,-38 -6,-38" fill="#334155" />
              <line x1="0" y1="-38" x2="0" y2="52" stroke="#334155" strokeWidth="1.5" />
              <polygon points="0,52 6,38 -6,38" fill="none" stroke="#334155" strokeWidth="1.5" />
            </g>

            {/* Center dot */}
            <circle cx="0" cy="0" r="4" fill="#334155" />

            {/* VOR identifier */}
            <text x="0" y="106" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#334155" letterSpacing="3">HTO</text>
          </g>

          {/* ── Frequency strip — bottom left corner ── */}
          <g transform="translate(26, 590)" opacity="0.09" fontFamily="monospace" fill="#1e293b">
            <rect x="0" y="-18" width="178" height="26" rx="3" fill="#1e293b" fillOpacity="0.15" />
            <text fontSize="11" letterSpacing="1" y="0">GND 121.700 · TWR 126.200</text>
          </g>

        </svg>

        {/* Hero content — sits above the SVG */}
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-mono px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Free during beta
            </div>
            <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              Your radio calls,<br />
              <span className="text-gray-400">graded like a CFI.</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              ATC gives the transmission. You read it back. AI grades every element against FAA AIM standards — missed hold shorts, wrong squawk, non-standard phrases, all of it.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/train"
                className="bg-gray-900 text-white px-8 py-3.5 rounded-lg font-medium text-base hover:bg-gray-800 transition-colors"
              >
                Try a scenario free
              </Link>
              <Link
                href="/ground-school"
                className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-medium text-base hover:border-gray-500 transition-colors"
              >
                Start Ground School
              </Link>
              <span className="text-sm text-gray-400 w-full sm:w-auto">No account · no mic · works offline</span>
            </div>
          </div>
        </div>
      </section>

      {/* Avionics Radio Stack Demo */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="max-w-2xl">

          {/* Radio Stack Panel */}
          <div className="rounded-xl overflow-hidden border border-amber-500/40 shadow-lg shadow-amber-900/10 mb-4" style={{ background: '#111214' }}>
            {/* Avionics header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded tracking-widest font-bold border text-amber-400 border-amber-700 bg-amber-950/60">
                  GROUND
                </span>
                <span className="font-mono text-lg tracking-wider leading-none tabular-nums" style={{ color: '#f5a623', textShadow: '0 0 8px rgba(245,166,35,0.5)' }}>
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
                  &ldquo;Cessna Four Sierra Uniform, Hilo Ground, taxi to runway two eight left via Bravo, hold short of runway two eight right, altimeter two niner niner two.&rdquo;
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
              &ldquo;Taxi to two eight left via Bravo, Four Sierra Uniform.&rdquo;
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
      <section className="relative overflow-hidden border-b border-gray-100 py-20 bg-gradient-to-b from-blue-50/40 via-white to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-mono font-bold px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
              New · Ground School
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Learn the radio like a game</h2>
            <p className="text-lg text-gray-500 leading-relaxed">
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
                <div className="text-xs text-gray-400 capitalize mt-1">{phase}</div>
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
            {[
              { q: 'Do I need a microphone?', a: 'Nope. Ground School is all taps and choices. In Live Comms you can type your read-back or use your mic — your call.' },
              { q: 'Is it actually free?', a: 'Yes. Ground School is free and works offline. Live Comms gives you 5 AI-graded scenarios a day free; unlimited is $15/mo.' },
              { q: 'Is the content FAA-accurate?', a: 'Every scenario and drill is built against the FAA Aeronautical Information Manual (AIM) Chapter 4 — the same standard your CFI and examiner use.' },
              { q: 'Will this help on my checkride?', a: 'That’s the point. Radio work trips up more student pilots than almost anything — hold-shorts, read-backs, and phraseology are exactly what gets drilled and graded here.' },
              { q: 'Does it really work offline?', a: 'Ground School drills run entirely on your device — perfect for the ramp, the run-up area, or a flight with no signal.' },
            ].map((item) => (
              <div key={item.q} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
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
                features: ['Full Ground School — all drills', 'Works offline · no mic', '5 AI-graded scenarios/day'],
                cta: 'Start free',
                href: '/ground-school',
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono font-semibold tracking-widest">WILCO<span className="text-gray-300 font-normal"> · by Clearspar</span></span>
          <span>Built for student pilots. Graded against FAA AIM Chapter 4.</span>
        </div>
      </footer>

    </main>
  )
}
