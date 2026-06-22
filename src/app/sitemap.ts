import type { MetadataRoute } from 'next'
import { curatedAirports, usStatesWithFields } from '@/lib/airports'
import { GUIDES } from '@/lib/guides'
import { POSTS } from '@/lib/blog'
import { AIRSPACE } from '@/lib/airspace'
import { COMPARE } from '@/lib/compare'

const BASE = 'https://wilco.binnacleai.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const core = ['', '/train', '/practice', '/listen', '/oral', '/leaderboard', '/guides', '/glossary', '/blog', '/airspace', '/directory', '/written', '/flashcards', '/acs', '/brief', '/tools', '/metar', '/taf', '/notam', '/crosswind', '/density-altitude', '/e6b', '/compare', '/widgets', '/confidence', '/community', '/airports', '/ground-school', '/cheatsheet', '/learn']
    .map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 }))
  const guides = GUIDES.map((g) => ({ url: `${BASE}/guides/${g.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 }))
  const blog = POSTS.map((p) => ({ url: `${BASE}/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 }))
  const airspace = AIRSPACE.map((a) => ({ url: `${BASE}/airspace/${a.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 }))
  const compare = COMPARE.map((c) => ({ url: `${BASE}/compare/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 }))
  const states = usStatesWithFields().map((s) => ({ url: `${BASE}/airports/region/${s.code.toLowerCase()}`, changeFrequency: 'monthly' as const, priority: 0.5 }))
  const airports = curatedAirports(250).map((a) => ({ url: `${BASE}/airports/${a.ident}`, changeFrequency: 'monthly' as const, priority: 0.5 }))
  return [...core, ...guides, ...blog, ...airspace, ...compare, ...states, ...airports]
}
