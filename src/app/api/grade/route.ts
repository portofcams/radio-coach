import { NextRequest, NextResponse } from 'next/server'
import { gradeReadback } from '@/lib/grader'
import { getScenario } from '@/lib/scenarios'

export async function POST(req: NextRequest) {
  const { scenarioId, readback } = await req.json()

  if (!scenarioId || !readback?.trim()) {
    return NextResponse.json({ error: 'Missing scenarioId or readback' }, { status: 400 })
  }

  const scenario = getScenario(scenarioId)
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  const result = await gradeReadback(scenario, readback.trim())
  return NextResponse.json(result)
}
