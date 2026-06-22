import type { Metadata } from 'next'
import Link from 'next/link'
import { GLOSSARY } from '@/lib/glossary'
import Glossary from '@/components/Glossary'

export const metadata: Metadata = {
  title: 'ATC phraseology glossary — plain-English radio terms · Wilco',
  description: 'What pilots actually mean by roger, wilco, hold short, line up and wait, squawk, CTAF, special VFR and more — a searchable plain-English glossary of ATC radio phraseology.',
  alternates: { canonical: 'https://wilco.binnacleai.com/glossary' },
}

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'ATC phraseology glossary',
    hasDefinedTerm: GLOSSARY.map((t) => ({ '@type': 'DefinedTerm', name: t.term, description: t.def })),
  }
  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/guides" className="text-gray-400 hover:text-gray-600 text-sm">← guides</Link>
          <h1 className="text-2xl font-semibold">ATC phraseology glossary</h1>
        </div>
        <p className="text-gray-500 mb-6">Plain-English definitions of the radio terms you&apos;ll hear from ATC. {GLOSSARY.length} terms — search or scroll.</p>
        <Glossary terms={GLOSSARY} />
        <p className="mt-10 text-sm text-gray-500">
          Ready to use them on the radio? <Link href="/train" className="text-blue-600 hover:underline">Practice graded scenarios →</Link>
        </p>
      </div>
    </main>
  )
}
