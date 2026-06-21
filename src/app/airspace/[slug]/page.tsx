import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AIRSPACE, getAirspace } from '@/lib/airspace'

export function generateStaticParams() {
  return AIRSPACE.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = getAirspace(slug)
  if (!a) return {}
  return {
    title: `${a.title} · Wilco`,
    description: `${a.oneLine} ${a.requirement}`,
    alternates: { canonical: `https://wilco.binnacleai.com/airspace/${slug}` },
  }
}

export default async function AirspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = getAirspace(slug)
  if (!a) notFound()

  return (
    <main className="min-h-screen">
      <article className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/airspace" className="text-gray-400 hover:text-gray-600 text-sm">← airspace</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-2 leading-tight">{a.title}</h1>
        <div className="border border-gray-200 rounded-lg px-4 py-3 mb-6 bg-gray-50">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">To enter</div>
          <div className="text-sm text-gray-800">{a.requirement}</div>
        </div>
        <div className="space-y-6">
          {a.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1.5">{s.h}</h2>
              <p className="text-gray-700 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 border-t border-gray-100 pt-6 flex flex-wrap items-center gap-4">
          <Link href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Practice these calls →</Link>
          {a.guide && <Link href={`/guides/${a.guide}`} className="text-sm text-blue-600 hover:underline">Related guide →</Link>}
        </div>
      </article>
    </main>
  )
}
