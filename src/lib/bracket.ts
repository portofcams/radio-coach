// Weekly bracket (#91) -- a designated "scenario of the week" that resets on a
// fixed weekly cadence, ranked by best score among logged-in users. Fully
// deterministic: the same week index always resolves to the same scenario, so
// "last week's winner" can always be recomputed on demand from rc_grades --
// nothing new to persist, no cron needed to roll the week over.
import { scenarios } from './scenarios'

// A known Monday 00:00 UTC. Weeks are (now - anchor) / 7 days, not calendar
// ISO week numbers -- avoids ISO's year-boundary edge cases; this only needs
// a stable, unambiguous weekly bucket, never a displayed "week 32" label.
const WEEK_ANCHOR_MS = Date.UTC(2026, 0, 5)
const WEEK_MS = 7 * 86_400_000

export function weekIndexFor(d: Date): number {
  return Math.floor((d.getTime() - WEEK_ANCHOR_MS) / WEEK_MS)
}

export function weekBounds(idx: number): { start: Date; end: Date } {
  const start = new Date(WEEK_ANCHOR_MS + idx * WEEK_MS)
  const end = new Date(WEEK_ANCHOR_MS + (idx + 1) * WEEK_MS)
  return { start, end }
}

// Same pool the live 1v1 duel already uses -- fair, quick, unambiguous
// scoring (no curveball second exchange, no Pro gate, capped element count
// so no scenario is a runaway outlier to grind).
const BRACKET_POOL = scenarios.filter(
  (s) => s.tier !== 'pro' && s.category !== 'helicopter' && !s.curveball && !s.steppedOn && s.requiredElements.length <= 4,
)

export function bracketScenarioForWeek(idx: number) {
  const key = `bracket-week-${idx}`
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return BRACKET_POOL[h % BRACKET_POOL.length]
}
