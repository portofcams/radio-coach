import Anthropic from '@anthropic-ai/sdk'
import type { GradeResult, Scenario } from './types'
import { ruleGradeReadback } from './rule-grader'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Default is the deterministic $0 rule grader. Set GRADER_MODE=ai (and a funded
// ANTHROPIC_API_KEY) to use the LLM grader; it falls back to rules on any error.
function aiEnabled(): boolean {
  return process.env.GRADER_MODE === 'ai' && !!process.env.ANTHROPIC_API_KEY
}

const SYSTEM_PROMPT = `You are a strict but encouraging FAA-certified flight instructor grading a student pilot's radio readback.

You grade readbacks against FAA Aeronautical Information Manual (AIM) Chapter 4 standards. Your job is to catch every omission and every non-standard phrase — because in real airspace, these mistakes cause incidents.

GRADING RULES (apply every time):
1. Call sign must be included. Missing call sign = deduct 15 points.
2. ALL numbers must be read back verbatim: runway designators, headings, altitudes, squawk codes, frequencies, taxiway intersections. Missing any = deduct 10-20 points each.
3. HOLD SHORT instructions are safety-critical. Missing a hold short = FAIL (score ≤ 40), regardless of other elements.
4. Non-standard phrases to flag:
   - "Copy" or "copy that" — not standard pilot response
   - "10-4" — never
   - "Will do" / "For sure" — non-standard
   - "Roger that" — "Roger" is acceptable; "roger that" is informal
   - "Negative" used where a specific refusal is needed
   - "Affirmative" where the actual element should be stated
5. Altitude format: say all digits ("five thousand five hundred", NOT "fifty-five hundred")
6. Runway designators must include L/R/C when assigned (e.g. "two two left", not "two two")
7. Frequency format: say each digit ("one two four point zero", NOT "one twenty-four")
8. Squawk: say each digit ("four five two one", NOT "forty-five twenty-one")

SCORING:
- 90-100: All required elements, standard phraseology. PASS.
- 70-89: Minor omissions or minor phraseology issues. PARTIAL.
- Below 70: Missing safety-critical elements or multiple errors. FAIL.
- A missing hold short or runway crossing clearance is always FAIL.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "score": <0-100>,
  "passFail": <"PASS" | "PARTIAL" | "FAIL">,
  "elements": {
    "required": [<list of required element strings>],
    "hit": [<elements correctly included>],
    "missed": [<required elements not included or incomplete>]
  },
  "phraseologyIssues": [<specific non-standard phrases detected, empty array if none>],
  "correctReadback": <the textbook-correct full readback>,
  "feedback": <1-2 sentence instructor summary, encouraging but honest>
}`

export async function gradeReadback(
  scenario: Scenario,
  studentReadback: string,
  hintUsed?: boolean,
): Promise<GradeResult> {
  // $0 default — no LLM spend unless explicitly enabled
  if (!aiEnabled()) {
    return ruleGradeReadback(scenario, studentReadback, hintUsed)
  }

  const userMessage = `
SCENARIO: ${scenario.title}
ATC TRANSMISSION: "${scenario.atcTransmission}"
REQUIRED ELEMENTS: ${scenario.requiredElements.join(', ')}
CORRECT READBACK: "${scenario.correctReadback}"
COMMON MISTAKES FOR THIS SCENARIO: ${scenario.commonMistakes.join('; ')}

STUDENT READBACK: "${studentReadback}"

Grade this readback.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const result = JSON.parse(text) as GradeResult
    if (hintUsed) {
      result.score = Math.max(0, result.score - 10)
      if (result.score < 70 && result.passFail === 'PARTIAL') result.passFail = 'FAIL'
      if (result.score < 90 && result.passFail === 'PASS') result.passFail = 'PARTIAL'
    }
    return result
  } catch {
    // API error, no credits, or unparseable output → deterministic grader
    return ruleGradeReadback(scenario, studentReadback, hintUsed)
  }
}
