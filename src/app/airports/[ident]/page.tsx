import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lookupAirport } from '@/lib/airports'
import { runwayPhonetic } from '@/lib/homefield'

const FREQ_LABELS: Record<string, string> = {
  twr: 'Tower', gnd: 'Ground', cld: 'Clearance Delivery', atis: 'ATIS', ctaf: 'CTAF', unicom: 'UNICOM', appdep: 'Approach / Departure',
}

export async function generateMetadata({ params }: { params: Promise<{ ident: string }> }): Promise<Metadata> {
  const { ident } = await params
  const f = lookupAirport(ident)
  if (!f) return { title: 'Airport not found · Wilco' }
  const id = ident.toUpperCase()
  return {
    title: `${f.name} (${id}) radio frequencies & ATC practice · Wilco`,
    description: `Tower, ground, ATIS and clearance frequencies for ${f.name} (${id})${f.city ? ` in ${f.city}` : ''}, plus free radio-communication practice with instant grading.`,
    alternates: { canonical: `https://wilco.binnacleai.com/airports/${id}` },
  }
}

export default async function AirportPage({ params }: { params: Promise<{ ident: string }> }) {
  const { ident } = await params
  const f = lookupAirport(ident)
  if (!f) notFound()
  const id = ident.toUpperCase()
  const freqs = Object.entries(f.freqs).filter(([, v]) => v)

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/airports" className="text-gray-400 hover:text-gray-600 text-sm">← all airports</a>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Radio communications at {f.name}</h1>
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
