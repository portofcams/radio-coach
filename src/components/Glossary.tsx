'use client'

import { useMemo, useState } from 'react'
import type { GlossaryTerm } from '@/lib/glossary'

export default function Glossary({ terms }: { terms: GlossaryTerm[] }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return terms
    return terms.filter((t) => t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s))
  }, [q, terms])

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search terms…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No terms match &ldquo;{q}&rdquo;.</p>
      ) : (
        <dl className="space-y-5">
          {filtered.map((t) => (
            <div key={t.slug} id={t.slug} className="scroll-mt-20">
              <dt className="font-semibold text-gray-900">{t.term}</dt>
              <dd className="text-gray-600 text-sm mt-0.5 leading-relaxed">{t.def}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
