import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GUIDES, getGuide } from '@/lib/guides'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const g = getGuide(slug)
  if (!g) return { title: 'Guide not found · Wilco' }
  return {
    title: `${g.title} · Wilco`,
    description: g.description,
    alternates: { canonical: `https://wilco.binnacleai.com/guides/${g.slug}` },
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = getGuide(slug)
  if (!g) notFound()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: g.title,
    description: g.description,
    step: g.sections.map((s) => ({ '@type': 'HowToStep', name: s.h, text: s.p })),
  }
  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/guides" className="text-gray-400 hover:text-gray-600 text-sm">← all guides</a>
        <h1 className="text-2xl font-semibold mt-3 mb-2">{g.title}</h1>
        <p className="text-gray-500 mb-6">{g.description}</p>
        <div className="space-y-5">
          {g.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-base font-semibold text-gray-900 mb-1">{s.h}</h2>
              <p className="text-gray-700 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl p-5 mt-8 bg-gray-50 text-center">
          <p className="text-gray-700 mb-3">Practice this with instant grading — free, no mic required.</p>
          <a href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Start a scenario →</a>
        </div>
      </div>
    </main>
  )
}
