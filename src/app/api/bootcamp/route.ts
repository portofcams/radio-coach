import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { computeWeakspots, drillScenariosFor, CATEGORIES } from '@/lib/weakspots'
import { getScenario } from '@/lib/scenarios'

const titleFor = (id: string) => getScenario(id)?.title ?? id

// A focused daily plan from the pilot's worst recent elements. Falls back to the
// common trouble spots for new / signed-out pilots.
export async function GET() {
  const user = await getAuthUser()
  const db = getPool()

  let weak: ReturnType<typeof computeWeakspots> = []
  if (user && db) {
    const g = await db.query(
      'SELECT scenario_id, missed_elements FROM rc_grades WHERE user_id=$1 ORDER BY created_at DESC LIMIT 300',
      [user.userId],
    )
    weak = computeWeakspots(g.rows)
  }

  // Fallback: the categories pilots most commonly miss.
  const fallback = weak.length === 0
  const keys = fallback
    ? ['hold-short', 'frequency', 'runway']
    : weak.slice(0, 3).map((w) => w.key)

  const blocks = keys.map((key) => {
    const cat = CATEGORIES.find((c) => c.key === key)!
    const w = weak.find((x) => x.key === key)
    return {
      key,
      label: cat.label,
      tip: cat.tip,
      missRate: w ? Math.round(w.rate * 100) : null,
      scenarios: drillScenariosFor(key, 4).map((id) => ({ id, title: titleFor(id) })),
    }
  })

  return NextResponse.json({ fallback, blocks })
}
