// Build src/data/airports.json from OurAirports public-domain CSVs.
// Real frequencies + runway geometry (endpoint lat/lon + true heading) per field.
// Run: node scripts/build-airports.mjs   (downloads fresh CSVs each run)
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://davidmegginson.github.io/ourairports-data'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'airports.json')

// Minimal RFC4180-ish CSV parser (handles quoted fields, embedded commas, "" escapes).
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQ = false
      } else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

function toObjects(rows) {
  const head = rows[0]
  return rows.slice(1).filter(r => r.length === head.length).map(r => {
    const o = {}
    head.forEach((h, i) => { o[h] = r[i] })
    return o
  })
}

async function fetchCSV(name) {
  const res = await fetch(`${BASE}/${name}`)
  if (!res.ok) throw new Error(`fetch ${name}: ${res.status}`)
  return toObjects(parseCSV(await res.text()))
}

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null }

console.log('downloading OurAirports CSVs...')
const [airports, runways, freqs] = await Promise.all([
  fetchCSV('airports.csv'),
  fetchCSV('runways.csv'),
  fetchCSV('airport-frequencies.csv'),
])
console.log(`airports=${airports.length} runways=${runways.length} freqs=${freqs.length}`)

// Frequencies by ident → {TWR,GND,CLD,ATIS,CTAF,APPDEP,UNICOM}
const FREQ_MAP = {
  TWR: 'twr', GND: 'gnd', CLD: 'cld', ATIS: 'atis', 'D-ATIS': 'atis',
  CTAF: 'ctaf', UNIC: 'unicom', 'A/D': 'appdep',
}
const freqByIdent = {}
const descByIdent = {} // TWR/GND on-frequency descriptions → real radio name ("Seattle Tower")
for (const f of freqs) {
  const slot = FREQ_MAP[f.type]
  if (!slot) continue
  const mhz = num(f.frequency_mhz)
  if (!mhz) continue
  const id = f.airport_ident
  ;(freqByIdent[id] ??= {})
  // keep the first of each slot (CTAF only if not already from a real CTAF)
  if (freqByIdent[id][slot] == null) freqByIdent[id][slot] = mhz.toFixed(3).replace(/\.?0+$/, '')
  if ((slot === 'twr' || slot === 'gnd') && f.description) {
    ;(descByIdent[id] ??= {})
    if (descByIdent[id][slot] == null) descByIdent[id][slot] = f.description
  }
}

const titleCase = (s) =>
  s.toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase())

// Strip facility/owner cruft from a field name when no tower name is available.
function cleanName(name) {
  const n = name
    .replace(/"[^"]*"/g, ' ') // drop quoted nicknames, e.g. Warren "Bud" Woods
    .replace(/\b(International|Intl|Regional|Rgnl|Municipal|Muni|Memorial|County|Field|Airport|Airpark|Air Park)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return n || name
}

// The name ATC actually says on the radio. A facility description that cleanly
// ENDS in "Tower"/"Ground" ("Seattle Tower") is authoritative — but many are
// operational notes, so we only trust the clean ones. Else: non-towered fields
// use the city (self-announce name); towered fields use the distinctive last
// word of the cleaned field name ("…Paine Field…" → "Paine").
function radioNameFor(a, desc, towered) {
  for (const [d, re] of [[desc?.twr, /\s*(tower|twr)\.?$/i], [desc?.gnd, /\s*(ground|gnd)\.?$/i]]) {
    if (d && re.test(d.trim())) {
      const n = titleCase(d.trim().replace(re, '').trim())
      if (n) return n
    }
  }
  const cleaned = cleanName(a.name)
  if (!towered && a.municipality) return a.municipality
  const words = cleaned.split(' ').filter(Boolean)
  return words.length > 1 ? words[words.length - 1] : (cleaned || a.name)
}

// Runways by ident (only those with usable endpoint coords)
const rwyByIdent = {}
for (const r of runways) {
  if (r.closed === '1') continue
  const leLat = num(r.le_latitude_deg), leLon = num(r.le_longitude_deg)
  const heLat = num(r.he_latitude_deg), heLon = num(r.he_longitude_deg)
  if (leLat == null || leLon == null || heLat == null || heLon == null) continue
  if (!r.le_ident || !r.he_ident) continue
  ;(rwyByIdent[r.airport_ident] ??= []).push({
    le: r.le_ident, he: r.he_ident,
    leLat, leLon, heLat, heLon,
    leHdg: num(r.le_heading_degT), heHdg: num(r.he_heading_degT),
    length: num(r.length_ft), surface: (r.surface || '').toUpperCase(),
  })
}

// Compose: keep fields that have at least one usable frequency AND one runway w/ coords.
const out = {}
for (const a of airports) {
  const id = (a.ident || '').toUpperCase()
  if (!id) continue
  if (a.type === 'closed' || a.type === 'heliport') continue
  const fq = freqByIdent[a.ident]
  const rw = rwyByIdent[a.ident]
  if (!fq || !rw?.length) continue
  out[id] = {
    icao: a.icao_code || a.gps_code || id,
    name: a.name,
    radioName: radioNameFor(a, descByIdent[a.ident], fq.twr != null),
    region: a.iso_region,
    country: a.iso_country,
    city: a.municipality || '',
    lat: num(a.latitude_deg),
    lon: num(a.longitude_deg),
    elev: num(a.elevation_ft),
    towered: fq.twr != null,
    freqs: fq,
    runways: rw,
  }
}

mkdirSync(dirname(OUT), { recursive: true })
const json = JSON.stringify(out)
writeFileSync(OUT, json)
const towered = Object.values(out).filter(a => a.towered).length
console.log(`wrote ${Object.keys(out).length} fields (${towered} towered) → ${OUT}  (${(json.length / 1e6).toFixed(1)} MB)`)
for (const id of ['KSEA', 'PAAQ', 'KPAE', 'PHTO', 'EIDW', 'KJFK', 'KAPA']) {
  const a = out[id]
  console.log(id, a ? `radioName="${a.radioName}" (${a.towered ? 'TWR' : 'CTAF'}) name="${a.name}"` : 'MISSING')
}
