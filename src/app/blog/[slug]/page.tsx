import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { POSTS, getPost } from '@/lib/blog'
import { breadcrumbLd } from '@/lib/seo'

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = getPost(slug)
  if (!p) return {}
  return {
    title: `${p.title} · Clearspar`,
    description: p.description,
    alternates: { canonical: `https://clearsparradio.binnacleai.com/blog/${slug}` },
    openGraph: {
      title: p.title,
      description: p.description,
      type: 'article',
      publishedTime: p.date,
      images: [{ url: `/api/og?title=${encodeURIComponent(p.title)}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: p.title, images: [`/api/og?title=${encodeURIComponent(p.title)}`] },
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getPost(slug)
  if (!p) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    author: { '@type': 'Organization', name: 'Clearspar' },
  }
  const breadcrumb = breadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: p.title, path: `/blog/${slug}` },
  ])
  const related = POSTS.filter((x) => x.slug !== slug).slice(0, 3)

  return (
    <main className="min-h-screen">
      <article className="max-w-2xl mx-auto px-6 py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        <Link href="/blog" className="text-gray-400 hover:text-gray-600 text-sm">← blog</Link>
        <div className="text-xs text-gray-400 font-mono mt-3">{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {p.readMins} min read</div>
        <h1 className="text-3xl font-semibold mt-1 mb-4 leading-tight">{p.title}</h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">{p.lead}</p>
        <div className="space-y-6">
          {p.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1.5">{s.h}</h2>
              <p className="text-gray-700 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 mb-3">Practice these calls with instant grading — free.</p>
          <Link href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Start training →</Link>
        </div>

        {related.length > 0 && (
          <nav className="mt-10 border-t border-gray-100 pt-6" aria-label="Related reading">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Related reading</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="text-blue-600 hover:underline text-sm">{r.title}</Link>
                </li>
              ))}
              <li>
                <Link href="/glossary" className="text-blue-600 hover:underline text-sm">Aviation radio phraseology glossary</Link>
              </li>
            </ul>
          </nav>
        )}
      </article>
    </main>
  )
}
