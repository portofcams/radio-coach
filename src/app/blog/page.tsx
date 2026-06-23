import type { Metadata } from 'next'
import Link from 'next/link'
import { POSTS } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Clearspar blog — learn ATC radio communications',
  description: 'Plain-English articles on talking to ATC: first calls at towered fields, checkride readbacks, non-towered self-announce, flight following, and more.',
  alternates: { canonical: 'https://wilco.binnacleai.com/blog' },
}

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">The Clearspar blog</h1>
        <p className="text-gray-500 mb-8">Clear, FAA-accurate guides to talking on the radio.</p>
        <div className="space-y-5">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="block group">
              <div className="text-xs text-gray-400 font-mono">{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {p.readMins} min</div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.title}</div>
              <div className="text-sm text-gray-500 mt-0.5">{p.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
