import type { Metadata } from 'next'
import { GUIDES } from '@/lib/guides'

export const metadata: Metadata = {
  title: 'ATC radio phraseology guides · Clearspar',
  description: 'Plain-English guides to aviation radio phraseology — initial call-ups, hold-short readbacks, CTAF self-announce, Class B entry, IFR clearances, and numbers.',
  alternates: { canonical: 'https://clearsparradio.binnacleai.com/guides' },
}

export default function GuidesIndex() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a href="/train" className="text-gray-400 hover:text-gray-600 text-sm">← training</a>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Radio phraseology guides</h1>
        <p className="text-gray-500 mb-6">The calls that trip up student pilots — explained simply, straight from the AIM.</p>
        <div className="space-y-2">
          {GUIDES.map((g) => (
            <a key={g.slug} href={`/guides/${g.slug}`} className="block border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors">
              <div className="font-medium text-gray-900">{g.title}</div>
              <div className="text-sm text-gray-500 mt-0.5">{g.description}</div>
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-6">Then put it into practice — <a href="/train" className="text-blue-600 hover:underline">graded radio scenarios →</a></p>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Study tools</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-4">
            <a href="/written" className="text-blue-600 hover:underline">Written test prep →</a>
            <a href="/flashcards" className="text-blue-600 hover:underline">FAR/AIM flashcards →</a>
            <a href="/acs" className="text-blue-600 hover:underline">Checkride tracker →</a>
            <a href="/brief" className="text-blue-600 hover:underline">Flight radio brief →</a>
            <a href="/oral" className="text-blue-600 hover:underline">Mock oral →</a>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="/blog" className="text-blue-600 hover:underline">Blog →</a>
            <a href="/compare" className="text-blue-600 hover:underline">How to practice ATC →</a>
            <a href="/confidence" className="text-blue-600 hover:underline">Free 7-day email course →</a>
            <a href="/airspace" className="text-blue-600 hover:underline">Airspace requirements →</a>
            <a href="/glossary" className="text-blue-600 hover:underline">Phraseology glossary →</a>
            <a href="/directory" className="text-blue-600 hover:underline">Flight-school directory →</a>
            <a href="/widgets" className="text-blue-600 hover:underline">Free widgets for schools →</a>
          </div>
        </div>
      </div>
    </main>
  )
}
