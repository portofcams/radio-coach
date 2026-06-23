import type { Metadata } from 'next'
import Link from 'next/link'
import { COMPARE } from '@/lib/compare'

export const metadata: Metadata = {
  title: 'How to practice ATC radio — guides & comparisons · Clearspar',
  description: 'Honest guides to learning aviation radio communications: the best ways to practice, free options, and how to pass the radio on your checkride.',
  alternates: { canonical: 'https://wilco.binnacleai.com/compare' },
}

export default function CompareIndex() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-6">Learning ATC radio — guides &amp; comparisons</h1>
        <div className="space-y-3">
          {COMPARE.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="block border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors group">
              <div className="font-medium group-hover:text-blue-600 transition-colors">{c.title}</div>
              <div className="text-sm text-gray-500 mt-0.5">{c.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
