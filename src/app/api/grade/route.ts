import { NextRequest, NextResponse } from 'next/server'
import { gradeReadback } from '@/lib/grader'
import { getScenario } from '@/lib/scenarios'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { getEntitlement, dailyGradeCount, FREE_DAILY_LIMIT } from '@/lib/entitlement'
import { resolveHomeProfile } from '@/lib/home-server'
import { homeScenario } from '@/lib/home-client'
import { getCustomScenarioFor } from '@/lib/customscenarios'
import { getCommunityScenario } from '@/lib/community'
import { generateScenario } from '@/lib/procedural'
import type { Scenario } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { scenarioId, readback, hintUsed, part } = await req.json()

  if (!scenarioId || !readback?.trim()) {
    return NextResponse.json({ error: 'Missing scenarioId or readback' }, { status: 400 })
  }

  const user = await getAuthUser()
  const db = getPool()

  // Resolve the scenario: static library, or a per-user home-field scenario
  // (generated server-side from the pilot's saved field, so params stay trusted).
  let scenario: Scenario | undefined = getScenario(scenarioId)
  if (!scenario && scenarioId.startsWith('gen-')) {
    const n = parseInt(scenarioId.slice(4))
    if (Number.isFinite(n)) scenario = generateScenario(n)
  }
  if (!scenario && scenarioId.startsWith('home-') && user && db) {
    const r = await db.query(
      'SELECT callsign, home_ident, home_name, home_tower, home_runway FROM rc_users WHERE id = $1',
      [user.userId],
    )
    const row = r.rows[0]
    const home = resolveHomeProfile(row)
    if (home) scenario = homeScenario(scenarioId, home, row.callsign) ?? undefined
  }
  if (!scenario && scenarioId.startsWith('custom-') && user && db) {
    scenario = (await getCustomScenarioFor(db, parseInt(scenarioId.replace(/^custom-/, '')), user.userId)) ?? undefined
  }
  if (!scenario && scenarioId.startsWith('community-') && db) {
    scenario = (await getCommunityScenario(db, parseInt(scenarioId.replace(/^community-/, '')))) ?? undefined
  }
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  const ent = user && db ? await getEntitlement(user.userId) : null

  // Advanced library (emergencies, CRAFT, Class B) is Solo Pilot only.
  if (scenario.tier === 'pro' && !ent?.pro) {
    return NextResponse.json({ error: 'pro_scenario' }, { status: 402 })
  }

  // Free-tier daily cap — server-enforced for logged-in users (pro = unlimited).
  if (user && db && !ent?.pro) {
    if ((await dailyGradeCount(user.userId)) >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'daily_limit', limit: FREE_DAILY_LIMIT },
        { status: 402 },
      )
    }
  }

  // Curveball: grade the second exchange against the amendment, not the original.
  if (part === 'curveball') {
    if (!scenario.curveball) return NextResponse.json({ error: 'no_curveball' }, { status: 400 })
    scenario = {
      ...scenario,
      atcTransmission: scenario.curveball.atcTransmission,
      requiredElements: scenario.curveball.requiredElements,
      correctReadback: scenario.curveball.correctReadback,
      curveball: undefined,
    }
  }

  const result = await gradeReadback(scenario, readback.trim(), hintUsed)

  // Save to score history if the user is authenticated
  if (user && db) {
    db.query(
      `INSERT INTO rc_grades
         (user_id, scenario_id, score, passed, readback, correct_readback, missed_elements, phrase_issues, hint_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.userId,
        scenarioId,
        result.score,
        result.passFail === 'PASS',
        readback.trim(),
        result.correctReadback,
        JSON.stringify(result.elements.missed),
        JSON.stringify(result.phraseologyIssues),
        hintUsed ?? false,
      ]
    ).catch(console.error)
  }

  return NextResponse.json(result)
}
