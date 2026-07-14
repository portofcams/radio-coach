import Link from 'next/link'
import type { Metadata } from 'next'

// Public share landing for a user's readiness card. The OG image is personalized
// from the query params, so a shared link previews the actual score (the viral loop).
type SP = Promise<Record<string, string | string[] | undefined>>

function ogUrl(sp: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams()
  for (const k of ['score', 'passed', 'rate', 'label', 'cs', 'rank', 'stat', 'unit', 'scope']) {
    const v = sp[k]
    if (typeof v === 'string' && v) qs.set(k, v)
  }
  const q = qs.toString()
  return '/api/og' + (q ? '?' + q : '')
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams
  const score = typeof sp.score === 'string' ? sp.score : null
  const rank = typeof sp.rank === 'string' ? sp.rank : null
  const title = score ? `${score}% radio-ready on Clearspar` : rank ? `#${rank} on the Clearspar leaderboard` : 'Clearspar Radio Trainer'
  const img = ogUrl(sp)
  return {
    title,
    description: 'Free ATC readback training — AI grades every element against the FAA AIM.',
    openGraph: { title, images: [{ url: img, width: 1200, height: 630 }], type: 'website' },
    twitter: { card: 'summary_large_image', title, images: [img] },
  }
}

export default async function SharePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const score = typeof sp.score === 'string' ? sp.score : null
  const label = typeof sp.label === 'string' ? sp.label : null
  const rank = typeof sp.rank === 'string' ? sp.rank : null
  const stat = typeof sp.stat === 'string' ? sp.stat : null
  const unit = typeof sp.unit === 'string' ? sp.unit : null
  const scope = typeof sp.scope === 'string' ? sp.scope : 'Leaderboard'
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#06070a] text-white px-6 py-16">
      <div className="max-w-md text-center">
        <div className="text-xs font-mono tracking-[0.25em] text-[#36d6e6] mb-5">
          CLEARSPAR · {rank ? `${scope.toUpperCase()} LEADERBOARD` : 'RADIO READINESS'}
        </div>
        {score ? (
          <div className="text-8xl font-bold text-[#f5a623] leading-none mb-3">{score}%</div>
        ) : rank ? (
          <div className="text-8xl font-bold text-[#f5a623] leading-none mb-3">#{rank}</div>
        ) : null}
        <div className="text-lg text-gray-200 mb-2">{label || (stat ? `${stat}${unit ? ` ${unit}` : ''}` : 'Grade your ATC radio calls like a CFI.')}</div>
        <p className="text-sm text-gray-400 mb-9">Free aviation radio training — AI grades every element of your read-back. No mic, works offline.</p>
        <Link href="/" className="inline-block bg-[#f5a623] text-[#1a1205] font-semibold px-8 py-3.5 rounded-lg hover:bg-[#ffb73d] transition-colors">Try Clearspar free →</Link>
      </div>
    </main>
  )
}
