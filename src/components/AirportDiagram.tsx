import type { AirportDiagram as Diagram } from '@/lib/types'

// A schematic (NOT-to-scale) taxi diagram. Two standard layouts; scenarios pass
// only the labels. Runways = gray strips, taxiways = tan lines, hold-short = the
// yellow marking, cleared route (revealed) = green glow.

const RUNWAY = '#33383f'
const CENTER = '#aab2bd'
const TAXI = '#b9933f'
const HOLD = '#e8b923'
const GREEN = '#34d399'

function RunwayLabel({ x, y, text, angle = 0 }: { x: number; y: number; text: string; angle?: number }) {
  return (
    <text
      x={x} y={y} transform={`rotate(${angle} ${x} ${y})`}
      textAnchor="middle" dominantBaseline="middle"
      fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#e5e7eb"
    >
      {text}
    </text>
  )
}

function Plane({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="#ffffff">
      <path d="M0 -7 L2 -1 L8 3 L8 5 L1 3 L1 7 L4 9 L4 10 L0 9 L-4 10 L-4 9 L-1 7 L-1 3 L-8 5 L-8 3 L-2 -1 Z" />
    </g>
  )
}

function TaxiHoldShort({ d, revealed }: { d: Diagram; revealed: boolean }) {
  const tx = 48 // taxiway x
  return (
    <>
      {/* destination runway (top, horizontal) */}
      <line x1="28" y1="30" x2="206" y2="30" stroke={RUNWAY} strokeWidth="15" />
      <line x1="34" y1="30" x2="200" y2="30" stroke={CENTER} strokeWidth="1" strokeDasharray="5 4" />
      <RunwayLabel x={196} y={30} text={d.destRunway ?? ''} />
      {revealed && (
        <rect x="27" y="22" width="180" height="16" fill="none" stroke={GREEN} strokeWidth="1.5" rx="2" opacity="0.9" />
      )}

      {/* hold-short runway (middle, horizontal) */}
      <line x1="14" y1="86" x2="208" y2="86" stroke={RUNWAY} strokeWidth="16" />
      <line x1="20" y1="86" x2="202" y2="86" stroke={CENTER} strokeWidth="1" strokeDasharray="5 4" />
      <RunwayLabel x={22} y={86} text={d.holdShortRunway ?? ''} angle={0} />
      <RunwayLabel x={200} y={86} text={d.holdShortRunway ?? ''} />

      {/* taxiway (vertical) */}
      <line x1={tx} y1="138" x2={tx} y2="30" stroke={RUNWAY} strokeWidth="9" strokeLinecap="round" />
      <line x1={tx} y1="138" x2={tx} y2="30" stroke={TAXI} strokeWidth="1.2" strokeDasharray="3 3" />
      {/* taxiway label badge */}
      <g>
        <rect x={tx + 6} y="112" width={d.taxiways.join('·').length * 5.4 + 8} height="12" rx="2" fill={TAXI} />
        <text x={tx + 10 + (d.taxiways.join('·').length * 5.4) / 2} y="118.5" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace" fontSize="7" fontWeight="bold" fill="#1a1205">
          {d.taxiways.join(' · ')}
        </text>
      </g>

      {/* hold-short marking (just below the middle runway) */}
      <g stroke={HOLD} strokeWidth="1.6">
        <line x1={tx - 7} y1="96" x2={tx + 7} y2="96" />
        <line x1={tx - 7} y1="98.5" x2={tx + 7} y2="98.5" />
        <line x1={tx - 7} y1="101" x2={tx + 7} y2="101" strokeDasharray="2 2" />
        <line x1={tx - 7} y1="103.5" x2={tx + 7} y2="103.5" strokeDasharray="2 2" />
      </g>

      {/* cleared route (revealed) */}
      {revealed && (
        <>
          {/* solid: start up to the hold-short */}
          <line x1={tx} y1="134" x2={tx} y2="100" stroke={GREEN} strokeWidth="3" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.8))' }} />
          {/* dashed: the rest of the clearance beyond the hold-short */}
          <line x1={tx} y1="96" x2={tx} y2="34" stroke={GREEN} strokeWidth="2" strokeDasharray="4 3" opacity="0.55" />
          <text x={tx + 12} y="100" fontFamily="monospace" fontSize="7" fontWeight="bold" fill={HOLD}>HOLD SHORT</text>
        </>
      )}

      <Plane x={tx} y={134} />
    </>
  )
}

function Crossing({ d, revealed }: { d: Diagram; revealed: boolean }) {
  const tx = 110
  return (
    <>
      {/* runway being crossed (horizontal) */}
      <line x1="14" y1="74" x2="208" y2="74" stroke={RUNWAY} strokeWidth="18" />
      <line x1="20" y1="74" x2="202" y2="74" stroke={CENTER} strokeWidth="1" strokeDasharray="6 4" />
      <RunwayLabel x={24} y={74} text={d.crossRunway ?? ''} />
      <RunwayLabel x={198} y={74} text={d.crossRunway ?? ''} />
      {revealed && (
        <rect x="13" y="65" width="196" height="18" fill="none" stroke={GREEN} strokeWidth="1.5" rx="2" opacity="0.8" />
      )}

      {/* taxiway crossing it */}
      <line x1={tx} y1="140" x2={tx} y2="10" stroke={RUNWAY} strokeWidth="9" strokeLinecap="round" />
      <line x1={tx} y1="140" x2={tx} y2="10" stroke={TAXI} strokeWidth="1.2" strokeDasharray="3 3" />
      <g>
        <rect x={tx + 6} y="116" width={d.taxiways.join('·').length * 5.4 + 8} height="12" rx="2" fill={TAXI} />
        <text x={tx + 10 + (d.taxiways.join('·').length * 5.4) / 2} y="122.5" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace" fontSize="7" fontWeight="bold" fill="#1a1205">
          {d.taxiways.join(' · ')}
        </text>
      </g>

      {revealed && (
        <line x1={tx} y1="134" x2={tx} y2="16" stroke={GREEN} strokeWidth="3" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.8))' }} />
      )}

      <Plane x={tx} y={134} />
    </>
  )
}

export default function AirportDiagram({ diagram, revealed }: { diagram: Diagram; revealed: boolean }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ background: '#0d0f12', borderColor: '#2a2f37' }}>
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b" style={{ borderColor: '#1c2128' }}>
        <span className="font-mono text-[10px] tracking-widest text-gray-500">AIRPORT DIAGRAM · {diagram.airport}</span>
        <span className="font-mono text-[10px]" style={{ color: revealed ? GREEN : '#4b5563' }}>
          {revealed ? 'CLEARED ROUTE' : 'NOT TO SCALE'}
        </span>
      </div>
      <svg viewBox="0 0 220 150" className="w-full" style={{ display: 'block' }}>
        {diagram.kind === 'crossing' ? <Crossing d={diagram} revealed={revealed} /> : <TaxiHoldShort d={diagram} revealed={revealed} />}
      </svg>
    </div>
  )
}
