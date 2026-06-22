import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupAirport } from '@/lib/airports'
import { runwayPhonetic } from '@/lib/homefield'
import { airportCalls, type CallBlock } from '@/lib/airportcalls'

const FREQ_LABELS: Record<string, string> = {
  twr: 'Tower', gnd: 'Ground', cld: 'Clearance Delivery', atis: 'ATIS', ctaf: 'CTAF', unicom: 'UNICOM', appdep: 'Approach / Departure',
}

const FAC_CLS: Record<string, string> = {
  GROUND: 'text-amber-700 border-amber-200 bg-amber-50', TOWER: 'text-green-700 border-green-200 bg-green-50',
  APPROACH: 'text-sky-700 border-sky-200 bg-sky-50', CLEARANCE: 'text-orange-700 border-orange-200 bg-orange-50',
  CTAF: 'text-cyan-700 border-cyan-200 bg-cyan-50', ATIS: 'text-gray-600 border-gray-200 bg-gray-50',
}

function CallList({ blocks }: { blocks: CallBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{b.phase}</span>
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${FAC_CLS[b.facility] ?? 'text-gray-600 border-gray-200'}`}>{b.facility}</span>
            {b.freq && <span className="font-mono text-xs text-gray-400">{b.freq}</span>}
          </div>
          <ul className="space-y-1 pl-0.5">{b.calls.map((c, j) => <li key={j} className="text-sm text-gray-700 leading-relaxed">{c}</li>)}</ul>
        </div>
      ))}
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ ident: string }> }): Promise<Metadata> {
  const { ident } = await params
  const f = lookupAirport(ident)
  if (!f) return { title: 'Airport not found · Wilco' }
  const id = ident.toUpperCase()
  return {
    title: `Radio calls at ${f.name} (${id}) — frequencies & what to say · Wilco`,
    description: `How to talk to ATC at ${f.name} (${id})${f.city ? ` in ${f.city}` : ''}: the exact ${f.towered ? 'ground, tower and approach' : 'CTAF self-announce'} calls, real frequencies, and free graded practice.`,
    alternates: { canonical: `https://wilco.binnacleai.com/airports/${id}` },
  }
}

export default async function AirportPage({ params }: { params: Promise<{ ident: string }> }) {
  const { ident } = await params
  const f = lookupAirport(ident)
  if (!f) notFound()
  const id = ident.toUpperCase()
  const freqs = Object.entries(f.freqs).filter(([, v]) => v)
  const calls = airportCalls(f)

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ...freqs.map(([k, v]) => ({
        '@type': 'Question',
        name: `What is the ${FREQ_LABELS[k] ?? k.toUpperCase()} frequency at ${f.name} (${id})?`,
        acceptedAnswer: { '@type': 'Answer', text: `${FREQ_LABELS[k] ?? k.toUpperCase()} at ${f.name} (${id}) is ${v} MHz.` },
      })),
      {
        '@type': 'Question',
        name: `Is ${f.name} (${id}) a towered airport?`,
        acceptedAnswer: { '@type': 'Answer', text: f.towered ? `Yes — ${f.name} has an operating control tower. Establish two-way contact before entering the Class D airspace.` : `No — ${f.name} is non-towered. Self-announce your position and intentions on the CTAF.` },
      },
    ],
  }

  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/airports" className="text-gray-400 hover:text-gray-600 text-sm">← all airports</a>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Radio calls at {f.name}</h1>
        <p className="text-gray-500 mb-6">
          <span className="font-mono">{id}</span>{f.city ? ` · ${f.city}` : ''}{f.region ? `, ${f.region.replace('US-', '')}` : ''} · {f.towered ? 'Towered' : 'Non-towered (CTAF)'}
        </p>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Frequencies</h2>
          <div className="space-y-1.5">
            {freqs.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{FREQ_LABELS[k] ?? k.toUpperCase()}</span>
                <span className="font-mono text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Runways</h2>
          <div className="flex flex-wrap gap-2">
            {f.runways.map((r) => (
              <span key={`${r.le}/${r.he}`} className="text-sm font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1">{r.le}/{r.he}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">e.g. runway {f.runways[0]?.le} is &ldquo;runway {runwayPhonetic(f.runways[0]?.le ?? '')}&rdquo; on the radio.</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">What to say at {f.name}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Departing</div>
              <CallList blocks={calls.departing} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Arriving</div>
              <CallList blocks={calls.arriving} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4">Example phraseology with this field&apos;s real frequencies. Replace the call sign and information letter with your own.</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50 text-center">
          <p className="text-gray-700 mb-3">Practice {f.towered ? 'tower and ground' : 'CTAF self-announce'} calls at {f.name} with real frequencies — and get graded instantly.</p>
          <a href="/login?redirect=/profile" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Set {id} as your home field →</a>
          <p className="text-xs text-gray-400 mt-2">Free to start. No mic required.</p>
        </div>

        <p className="text-sm text-gray-500">
          New to ATC radio? Start with our <a href="/guides" className="text-blue-600 hover:underline">phraseology guides</a> or jump into <a href="/train" className="text-blue-600 hover:underline">training scenarios</a>.
        </p>

        <p className="text-[11px] text-gray-400 mt-6">Frequency and runway data from public sources (OurAirports). Always verify against current charts — not for navigation.</p>
      </div>
    </main>
  )
}
