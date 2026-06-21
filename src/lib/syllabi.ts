import { scenarios } from './scenarios'

/** Named scenario sets a CFI can assign in one tap. Built from the live library
 * so every id is valid (the assign endpoint also re-validates + de-dupes). */
export interface Syllabus { key: string; label: string; scenarioIds: string[] }

export function syllabi(): Syllabus[] {
  const byPhase = (p: string, n = 8) => scenarios.filter((s) => s.phase === p && !s.tier).map((s) => s.id).slice(0, n)
  const list: Syllabus[] = [
    { key: 'ground-taxi', label: 'Ground & taxi', scenarioIds: byPhase('ground') },
    { key: 'tower-pattern', label: 'Tower & pattern', scenarioIds: byPhase('pattern') },
    { key: 'departures', label: 'Departures', scenarioIds: byPhase('departure') },
    { key: 'enroute', label: 'En route & flight following', scenarioIds: byPhase('enroute') },
    {
      key: 'checkride-prep',
      label: 'Checkride prep (mixed)',
      scenarioIds: [...byPhase('ground', 2), ...byPhase('departure', 2), ...byPhase('pattern', 2), ...byPhase('enroute', 2)],
    },
    { key: 'emergencies', label: 'Emergencies & advanced (Pro)', scenarioIds: scenarios.filter((s) => s.tier === 'pro').map((s) => s.id) },
  ]
  return list.filter((s) => s.scenarioIds.length > 0)
}
