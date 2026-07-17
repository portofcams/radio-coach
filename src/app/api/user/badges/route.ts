import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getScenario } from '@/lib/scenarios'
import { BADGES, computeEarnedBadges } from '@/lib/badges'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ badges: BADGES.map((b) => ({ ...b, earned: false })) })
  const db = getPool()
  if (!db) return NextResponse.json({ badges: BADGES.map((b) => ({ ...b, earned: false })) })

  const r = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM rc_grades WHERE user_id=$1 AND role='pilot') AS attempts,
       (SELECT EXISTS(SELECT 1 FROM rc_grades WHERE user_id=$1 AND score=100 AND role='pilot')) AS perfect,
       (SELECT ARRAY_AGG(DISTINCT scenario_id) FROM rc_grades WHERE user_id=$1 AND passed AND role='pilot') AS passed_ids`,
    [user.userId],
  )
  const row = r.rows[0]
  // Dynamic ids (home-*/custom-*/community-*/wx-*/gen-*) aren't in the static
  // library -- getScenario() correctly returns undefined for them, and badges
  // are scoped to the static library's own facility/phase/pack/category tags,
  // so those ids are silently dropped here, not an error.
  const passedScenarios = ((row.passed_ids as string[] | null) ?? [])
    .map((id) => getScenario(id))
    .filter((s): s is NonNullable<typeof s> => !!s)

  const earned = computeEarnedBadges({
    passedScenarios,
    attempts: parseInt(row.attempts) || 0,
    perfectScore: !!row.perfect,
  })

  return NextResponse.json({ badges: BADGES.map((b) => ({ ...b, earned: earned.has(b.key) })) })
}
