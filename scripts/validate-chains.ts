// Continuity check for every FlightSession with a `route` set -- catches the
// exact class of bug that shipped in the old cross-country-flight-following
// content (legs spanning two airports a thousand miles apart, presented as
// one continuous flight). Run manually after adding or editing a chain
// session; exits non-zero on the first violation.
//
// Run: npx tsx scripts/validate-chains.ts
//
// NOTE: unlike scripts/build-airports.mjs / export-scenarios.mjs (plain .mjs
// using ts.transpileModule on a single leaf file with no relative imports),
// this needs to resolve flight-sessions.ts's own relative imports
// (./scenarios, ./weakspots, ./types) -- the single-file data-URL transpile
// trick those scripts use can't do that robustly. tsx (already proven
// reliable all session for exactly this kind of multi-file import) is the
// simpler, less fragile choice here.
import { FLIGHT_SESSIONS, validateChainContinuity } from '../src/lib/flight-sessions'
import { getScenario } from '../src/lib/scenarios'

let anyFailed = false
const chains = FLIGHT_SESSIONS.filter((s) => s.route)

if (chains.length === 0) {
  console.log('No chain sessions (route set) to validate.')
  process.exit(0)
}

for (const session of chains) {
  const problems = validateChainContinuity(session, getScenario)
  if (problems.length > 0) {
    anyFailed = true
    console.error(`FAIL ${session.id} (${session.route!.departure} -> ${session.route!.arrival}):`)
    for (const p of problems) console.error(`  - ${p}`)
  } else {
    console.log(`OK   ${session.id} (${session.route!.departure} -> ${session.route!.arrival}), ${session.scenarioIds.length} legs`)
  }
}

if (anyFailed) {
  console.error('\nOne or more chains failed continuity validation.')
  process.exit(1)
}
console.log('\nAll chains valid.')
