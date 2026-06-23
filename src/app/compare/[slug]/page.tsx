import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPARE, getCompare } from '@/lib/compare'

export function generateStaticParams() {
  return COMPARE.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = getCompare(slug)
  if (!c) return {}
  return {
    title: `${c.title} · Clearspar`,
    description: c.description,
    alternates: { canonical: `https://wilco.binnacleai.com/compare/${slug}` },
  }
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getCompare(slug)
  if (!c) notFound()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.description,
    author: { '@type': 'Organization', name: 'Clearspar' },
  }
  return (
    <main className="min-h-screen">
      <article className="max-w-2xl mx-auto px-6 py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Link href="/compare" className="text-gray-400 hover:text-gray-600 text-sm">← guides</Link>
        <h1 className="text-3xl font-semibold mt-3 mb-4 leading-tight">{c.title}</h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">{c.lead}</p>
        <div className="space-y-6">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1.5">{s.h}</h2>
              <p className="text-gray-700 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 mb-3">Try graded radio practice free — no flight sim, no mic required.</p>
          <Link href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Start training →</Link>
        </div>
      </article>
    </main>
  )
}
