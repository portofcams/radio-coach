// Exports the canonical bundled data (scenario library + listening/oral decks)
// from src/lib/*.ts to JSON files bundled into the native iOS app
// (ios/App/App/Native/Resources/*.json). The TS files stay the single source
// of truth — re-run this whenever they change so the native app and the website
// never drift.
//
//   node scripts/export-scenarios.mjs
//
// Uses the TypeScript compiler's transpileModule (types-only strip, no type
// resolution) so we don't need tsx/ts-node/esbuild installed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'ios/App/App/Native/Resources')
mkdirSync(outDir, { recursive: true })

// (source .ts, exported symbol, output .json)
const exports = [
  ['src/lib/scenarios.ts', 'scenarios', 'scenarios.json'],
  ['src/lib/listening.ts', 'LISTEN_CALLS', 'listening.json'],
  ['src/lib/oral.ts', 'ORAL_QUESTIONS', 'oral.json'],
]

for (const [srcPath, symbol, outName] of exports) {
  const src = readFileSync(resolve(root, srcPath), 'utf8')
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
  const mod = await import(dataUrl)
  const data = mod[symbol]
  const outPath = resolve(outDir, outName)
  writeFileSync(outPath, JSON.stringify(data, null, 2))
  console.log(`Wrote ${data.length} items (${symbol}) → ${outName}`)
}
