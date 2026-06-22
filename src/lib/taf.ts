// TAF decoder — parses a raw US TAF into plain-English forecast periods.
// Reuses the METAR token decoders (wind / visibility / clouds / weather).
import { decodeWind, decodeVis, decodeCloud, decodeWx } from './metar'

export interface TafPeriod {
  label: string
  lines: string[]
}
export interface DecodedTaf {
  station?: string
  issued?: string
  valid?: string
  periods: TafPeriod[]
  raw: string
}

function ddhh(s: string): string {
  // DDHH → "the DDth at HH:00Z"
  const d = s.slice(0, 2), h = s.slice(2, 4)
  return `the ${parseInt(d)}${ord(parseInt(d))} at ${h}:00Z`
}
function ord(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function decodeGroupTokens(tokens: string[]): string[] {
  const lines: string[] = []
  for (const t of tokens) {
    if (!t) continue
    const w = decodeWind(t); if (w) { lines.push(w); continue }
    const v = decodeVis(t); if (v) { lines.push(v.text); continue }
    const c = decodeCloud(t); if (c) { lines.push(c.text); continue }
    const wx = decodeWx(t); if (wx) { lines.push(`Weather: ${wx}`); continue }
    if (/^WS\d{3}\//.test(t)) { lines.push('Low-level wind shear'); continue }
    // unknown token ignored
  }
  return lines
}

export function decodeTaf(rawInput: string): DecodedTaf {
  const raw = rawInput.trim().replace(/=$/, '')
  const out: DecodedTaf = { periods: [], raw }
  if (!raw) return out
  const body = raw.replace(/\b(TAF|AMD|COR)\b/g, '').trim()
  const tokens = body.split(/\s+/)

  let i = 0
  // station
  if (tokens[i] && /^[A-Z0-9]{4}$/.test(tokens[i])) { out.station = tokens[i]; i++ }
  // issue time DDHHMMZ
  if (tokens[i] && /^\d{6}Z$/.test(tokens[i])) { out.issued = `${tokens[i].slice(0, 2)} at ${tokens[i].slice(2, 4)}:${tokens[i].slice(4, 6)}Z`; i++ }
  // valid period DDHH/DDHH
  if (tokens[i] && /^\d{4}\/\d{4}$/.test(tokens[i])) {
    const [a, b] = tokens[i].split('/')
    out.valid = `${ddhh(a)} through ${ddhh(b)}`
    i++
  }

  // Remaining tokens → change groups. The first (no FM/BECMG/TEMPO) is the base forecast.
  const rest = tokens.slice(i)
  let curLabel = 'Initial forecast'
  let bucket: string[] = []
  const flush = () => { if (bucket.length) { out.periods.push({ label: curLabel, lines: decodeGroupTokens(bucket) }); bucket = [] } }

  for (let k = 0; k < rest.length; k++) {
    const t = rest[k]
    if (/^FM\d{6}$/.test(t)) { flush(); const dd = parseInt(t.slice(2, 4)); curLabel = `From the ${dd}${ord(dd)} at ${t.slice(4, 6)}:${t.slice(6, 8)}Z`; continue }
    if (t === 'BECMG') { flush(); const win = rest[k + 1]; curLabel = `Becoming${win && /^\d{4}\/\d{4}$/.test(win) ? ` (${ddhh(win.split('/')[0])}–${ddhh(win.split('/')[1])})` : ''}`; if (win && /^\d{4}\/\d{4}$/.test(win)) k++; continue }
    if (t === 'TEMPO') { flush(); const win = rest[k + 1]; curLabel = 'Temporarily'; if (win && /^\d{4}\/\d{4}$/.test(win)) k++; continue }
    if (/^PROB\d{2}$/.test(t)) { flush(); curLabel = `${t.slice(4)}% probability`; const win = rest[k + 1]; if (win && /^\d{4}\/\d{4}$/.test(win)) k++; continue }
    bucket.push(t)
  }
  flush()
  return out
}
