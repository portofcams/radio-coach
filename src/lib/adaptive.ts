import type { Pool } from 'pg'
import { scenarios } from './scenarios'
import { getEntitlement } from './entitlement'

// Pick the next scenario adaptively: target a difficulty from the pilot's recent
// scores (ramp up as they pass, down as they struggle) and prefer phases where
// they've been missing lately. Helicopter track + Pro-gated scenarios excluded
// for free users so adaptive never dead-ends at a paywall.
export async function chooseAdaptive(
  db: Pool,
  userId: number,
): Promise<{ scenarioId: string; level: number; reason: string }> {
  const ent = await getEntitlement(userId)
  const pool = scenarios.filter((s) => s.category !== 'helicopter' && (ent.pro || s.tier !== 'pro'))

  const g = await db.query(
    'SELECT scenario_id, passed, score FROM rc_grades WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
    [userId],
  )
  const rows = g.rows as Array<{ scenario_id: string; passed: boolean; score: number }>
  const recent = rows.slice(0, 12)
  const avg = recent.length ? Math.round(recent.reduce((a, r) => a + (r.score || 0), 0) / recent.length) : 0
  const level = !recent.length ? 1 : avg >= 85 ? 3 : avg >= 68 ? 2 : 1

  const recentPassed = new Set(rows.filter((r) => r.passed).slice(0, 15).map((r) => r.scenario_id))
  const missByPhase: Record<string, number> = {}
  for (const r of rows) {
    if (r.passed) continue
    const sc = scenarios.find((s) => s.id === r.scenario_id)
    if (sc) missByPhase[sc.phase] = (missByPhase[sc.phase] || 0) + 1
  }

  let candidates = pool.filter((s) => s.difficulty === level && !recentPassed.has(s.id))
  if (!candidates.length) candidates = pool.filter((s) => s.difficulty === level)
  if (!candidates.length) candidates = pool.filter((s) => !recentPassed.has(s.id))
  if (!candidates.length) candidates = pool

  // Prefer the weakest recent phase.
  const weight = (s: { phase: string }) => missByPhase[s.phase] || 0
  const topWeak = Math.max(0, ...candidates.map(weight))
  const best = topWeak > 0 ? candidates.filter((c) => weight(c) === topWeak) : candidates
  const pick = best[Math.floor(Math.random() * best.length)]

  const reason = !recent.length
    ? 'Starting at student level'
    : `Tuned to your recent ${avg}% — ${level === 3 ? 'advanced' : level === 2 ? 'intermediate' : 'student'} level`
  return { scenarioId: pick.id, level, reason }
}

/** Anonymous fallback: a random student-level, non-Pro scenario. */
export function randomStarter(): string {
  const pool = scenarios.filter((s) => s.category !== 'helicopter' && s.tier !== 'pro' && s.difficulty === 1)
  return pool[Math.floor(Math.random() * pool.length)].id
}
