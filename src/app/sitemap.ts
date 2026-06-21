import type { MetadataRoute } from 'next'
import { curatedAirports, usStatesWithFields } from '@/lib/airports'
import { GUIDES } from '@/lib/guides'

const BASE = 'https://wilco.binnacleai.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const core = ['', '/train', '/practice', '/listen', '/leaderboard', '/guides', '/glossary', '/airports', '/ground-school', '/cheatsheet', '/learn']
    .map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 }))
  const guides = GUIDES.map((g) => ({ url: `${BASE}/guides/${g.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 }))
  const states = usStatesWithFields().map((s) => ({ url: `${BASE}/airports/region/${s.code.toLowerCase()}`, changeFrequency: 'monthly' as const, priority: 0.5 }))
  const airports = curatedAirports(250).map((a) => ({ url: `${BASE}/airports/${a.ident}`, changeFrequency: 'monthly' as const, priority: 0.5 }))
  return [...core, ...guides, ...states, ...airports]
}
