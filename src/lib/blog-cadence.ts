import { POSTS } from './blog'

// The 06-28 night push wrote 18 posts in one sitting (see wilco-backlog.md).
// That's a one-time content sprint, not a sustainable rate -- this paces any
// future posts at 2/week instead. It surfaces WHEN a post is due and WHAT
// topic is next; it does not write or publish anything. Outlines below are
// section-heading ideas only, deliberately not filled in with body prose --
// writing the post stays a manual, one-at-a-time step.
export const POSTS_PER_WEEK = 2
const CADENCE_DAYS = 7 / POSTS_PER_WEEK

export interface TopicOutline {
  slug: string
  title: string
  description: string
  outline: string[]
}

// Remove an entry once its post ships (i.e. once its slug exists in
// src/lib/blog.ts's POSTS) -- getCadenceStatus() also filters these
// defensively so a forgotten removal doesn't re-suggest a written topic.
export const UPCOMING_TOPICS: TopicOutline[] = [
  {
    slug: 'wake-turbulence-cautions',
    title: 'Wake turbulence cautions: what ATC tells you and how to respond',
    description: 'When ATC issues a wake turbulence caution, what it means, and how to adjust your pattern or approach in response.',
    outline: ['What triggers the caution (following a heavier aircraft)', 'The exact phrasing ATC uses', 'How to acknowledge it', 'Adjusting your touchdown point or spacing', 'It is advisory, not a clearance change — you still need to ask for anything you need'],
  },
  {
    slug: 'braking-action-reports',
    title: 'Braking action reports: giving one and understanding what you hear',
    description: 'The good/fair/poor/nil scale, how to give a PIREP on braking action, and how to read one back when ATC passes it to you.',
    outline: ['The braking-action scale and what each term means', 'When ATC solicits a report from you', 'How to phrase your own report', 'What changes when you hear "poor" or "nil" ahead of you'],
  },
  {
    slug: 'guard-frequency-121-5',
    title: '121.5: what guard frequency is actually for',
    description: 'What guard is, why your radio might be monitoring it, and the etiquette and calls that actually belong there.',
    outline: ['What "guard" means and who monitors it', 'ELT tones and what to do if you hear one', 'Calls that belong on guard vs calls that do not', 'Getting a relay if you lose contact with your working frequency'],
  },
  {
    slug: 'weather-deviation-request',
    title: 'Requesting a weather deviation from ATC',
    description: 'How to ask for a heading or route deviation around weather, on an IFR flight plan or under flight following.',
    outline: ['When to ask early vs late', 'The exact request phrasing', 'What ATC needs from you (direction, distance, when able direct)', 'Canceling the deviation and returning to course'],
  },
  {
    slug: 'practice-approach-request',
    title: 'Requesting a practice instrument approach (and the missed)',
    description: 'How to ask for a practice approach as a VFR or IFR pilot, full-stop vs touch-and-go, and the missed-approach call.',
    outline: ['The request: approach type, full-stop/touch-and-go/low approach', 'What ATC needs to sequence you', 'Flying and reporting the missed approach', 'Canceling IFR after the last approach, if applicable'],
  },
  {
    slug: 'runway-incursion-hold-position',
    title: '"Hold position": what it means and why you stop right now',
    description: 'A hold-position instruction is one of the few calls where hesitation is the wrong answer. What it means and how to comply.',
    outline: ['Why this instruction exists (incursion prevention)', 'The correct response (stop, then read back)', 'Common situations it comes up in', 'What to do if you are not sure you are clear of a hold line'],
  },
]

export interface CadenceStatus {
  lastPostDate: string | null
  daysSincePost: number | null
  due: boolean
  postsLast30Days: number
  postsPerWeekTarget: number
  nextTopics: TopicOutline[]
}

export function getCadenceStatus(): CadenceStatus {
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date))
  const lastPostDate = sorted[0]?.date ?? null
  const daysSincePost = lastPostDate ? (Date.now() - new Date(lastPostDate).getTime()) / 86_400_000 : null
  const cutoff = Date.now() - 30 * 86_400_000
  const postsLast30Days = sorted.filter((p) => new Date(p.date).getTime() >= cutoff).length
  const writtenSlugs = new Set(POSTS.map((p) => p.slug))
  return {
    lastPostDate,
    daysSincePost: daysSincePost === null ? null : Math.round(daysSincePost * 10) / 10,
    due: daysSincePost === null || daysSincePost >= CADENCE_DAYS,
    postsLast30Days,
    postsPerWeekTarget: POSTS_PER_WEEK,
    nextTopics: UPCOMING_TOPICS.filter((t) => !writtenSlugs.has(t.slug)).slice(0, 3),
  }
}
