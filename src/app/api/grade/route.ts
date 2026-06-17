import { NextRequest, NextResponse } from 'next/server'
import { gradeReadback } from '@/lib/grader'
import { getScenario } from '@/lib/scenarios'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { scenarioId, readback, hintUsed } = await req.json()

  if (!scenarioId || !readback?.trim()) {
    return NextResponse.json({ error: 'Missing scenarioId or readback' }, { status: 400 })
  }

  const scenario = getScenario(scenarioId)
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  const result = await gradeReadback(scenario, readback.trim(), hintUsed)

  // Save to DB if user is authenticated
  const user = await getAuthUser()
  const db = getPool()
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
