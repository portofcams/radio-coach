// METAR decoder — parses a raw US METAR into plain English. Pure, no network.
// Handles the common tokens a student pilot sees; unknown tokens are passed through.

export interface DecodedMetar {
  station?: string
  timeZulu?: string
  wind?: string
  windInfo?: WindInfo
  visibility?: string
  weather?: string[]
  clouds?: string[]
  temp?: string
  altimeter?: string
  flightCategory?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'
  ceilingFt?: number | null
  visSm?: number | null
  lines: string[] // plain-English summary lines
  raw: string
}

export interface WindInfo {
  calm: boolean
  dirDeg: number | null
  variable: boolean
  speedKt: number
  gustKt: number | null
  unit: 'KT' | 'MPS'
}

const WX: Record<string, string> = {
  RA: 'rain', SN: 'snow', DZ: 'drizzle', BR: 'mist', FG: 'fog', HZ: 'haze', FU: 'smoke',
  TS: 'thunderstorm', SH: 'showers', GR: 'hail', GS: 'small hail', SG: 'snow grains',
  FZ: 'freezing', BL: 'blowing', MI: 'shallow', DR: 'drifting', VC: 'in the vicinity',
  PL: 'ice pellets', UP: 'unknown precip', SQ: 'squall', FC: 'funnel cloud', SS: 'sandstorm', DU: 'dust',
}
const COVER: Record<string, string> = { SKC: 'sky clear', CLR: 'clear below 12,000', NSC: 'no significant cloud', FEW: 'few', SCT: 'scattered', BKN: 'broken', OVC: 'overcast', VV: 'vertical visibility' }

/** Structured wind, for anything that needs the numbers (runway selection, ATC
 *  phraseology) rather than the plain-English sentence `decodeWind` returns. */
export function decodeWindStructured(t: string): WindInfo | null {
  if (/^00000(KT|MPS)$/.test(t)) {
    return { calm: true, dirDeg: null, variable: false, speedKt: 0, gustKt: null, unit: t.endsWith('MPS') ? 'MPS' : 'KT' }
  }
  const m = t.match(/^(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?(KT|MPS)$/)
  if (!m) return null
  const variable = m[1] === 'VRB'
  return {
    calm: false,
    dirDeg: variable ? null : parseInt(m[1]),
    variable,
    speedKt: parseInt(m[2]),
    gustKt: m[4] ? parseInt(m[4]) : null,
    unit: m[5] as 'KT' | 'MPS',
  }
}

export function decodeWind(t: string): string | null {
  const w = decodeWindStructured(t)
  if (!w) return null
  if (w.calm) return 'Wind calm'
  // Direction keeps its original 3-digit zero-padded form (e.g. "090°", not
  // "90°") -- re-pad here since dirDeg is stored as a plain number.
  const dir = w.variable ? 'variable' : `from ${String(w.dirDeg).padStart(3, '0')}°`
  const unit = w.unit === 'MPS' ? ' m/s' : ' kt'
  const gust = w.gustKt != null ? `, gusting ${w.gustKt}${unit}` : ''
  return `Wind ${dir} at ${w.speedKt}${unit}${gust}`
}

const SPOKEN_DIGIT: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'niner',
}
function spokenDigits(n: number, pad = 0): string {
  return String(n).padStart(pad, '0').split('').map((d) => SPOKEN_DIGIT[d] ?? d).join(' ')
}

/** ATC-phraseology wind, e.g. "wind two eight zero at one two, gusting one niner" or "wind calm". */
export function spokenWind(w: WindInfo): string {
  if (w.calm) return 'wind calm'
  const dir = w.variable ? 'variable' : spokenDigits(w.dirDeg ?? 0, 3)
  const speed = spokenDigits(w.speedKt)
  const gust = w.gustKt != null ? `, gusting ${spokenDigits(w.gustKt)}` : ''
  return `wind ${dir} at ${speed}${gust}`
}

export function decodeVis(t: string): { text: string; sm: number | null } | null {
  const p = t.match(/^P(\d+)SM$/) // P6SM = greater than 6 SM
  if (p) return { text: `Visibility greater than ${p[1]} statute miles`, sm: parseInt(p[1]) + 0.1 }
  const m = t.match(/^(M)?(\d+)(\/(\d+))?SM$/)
  if (m) {
    const whole = parseInt(m[2])
    const sm = m[4] ? whole / parseInt(m[4]) : whole
    const disp = m[4] ? `${m[2]}/${m[4]}` : m[2]
    return { text: `Visibility ${m[1] ? 'less than ' : ''}${disp} statute miles`, sm }
  }
  return null
}

export function decodeCloud(t: string): { text: string; baseFt: number | null; ceiling: boolean } | null {
  const m = t.match(/^(SKC|CLR|NSC|FEW|SCT|BKN|OVC|VV)(\d{3})?(CB|TCU)?$/)
  if (!m) return null
  const cov = COVER[m[1]]
  if (!m[2]) return { text: cov, baseFt: null, ceiling: false }
  const ft = parseInt(m[2]) * 100
  const extra = m[3] === 'CB' ? ' (cumulonimbus)' : m[3] === 'TCU' ? ' (towering cumulus)' : ''
  const ceiling = m[1] === 'BKN' || m[1] === 'OVC' || m[1] === 'VV'
  return { text: `${cov} at ${ft.toLocaleString()} ft${extra}`, baseFt: ft, ceiling }
}

export function decodeWx(t: string): string | null {
  const sign = t.startsWith('-') ? 'light ' : t.startsWith('+') ? 'heavy ' : ''
  const body = t.replace(/^[-+]/, '')
  const parts: string[] = []
  for (let i = 0; i < body.length; i += 2) {
    const code = body.slice(i, i + 2)
    if (WX[code]) parts.push(WX[code]); else return null
  }
  return parts.length ? sign + parts.join(' ') : null
}

function category(ceil: number | null, vis: number | null): DecodedMetar['flightCategory'] {
  const c = ceil ?? 99999
  const v = vis ?? 99
  if (c < 500 || v < 1) return 'LIFR'
  if (c < 1000 || v < 3) return 'IFR'
  if (c <= 3000 || v <= 5) return 'MVFR'
  return 'VFR'
}

export function decodeMetar(rawInput: string): DecodedMetar {
  const raw = rawInput.trim().replace(/=$/, '')
  const out: DecodedMetar = { lines: [], raw, weather: [], clouds: [] }
  if (!raw) return out
  // Drop a leading "METAR"/"SPECI" and everything from RMK on.
  const body = raw.replace(/\b(METAR|SPECI)\b/g, '').split(/\bRMK\b/)[0].trim()
  const tokens = body.split(/\s+/)
  let ceil: number | null = null
  let vis: number | null = null

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (i === 0 && /^[A-Z0-9]{4}$/.test(t)) { out.station = t; out.lines.push(`Station ${t}`); continue }
    if (/^\d{6}Z$/.test(t)) { out.timeZulu = t; out.lines.push(`Observed ${t.slice(0, 2)} at ${t.slice(2, 4)}:${t.slice(4, 6)} Zulu`); continue }
    if (t === 'AUTO' || t === 'COR') continue
    const w = decodeWind(t); if (w) { out.wind = w; out.windInfo = decodeWindStructured(t) ?? undefined; out.lines.push(w); continue }
    // "1 1/2SM" — combine a bare number with the next fraction token
    if (/^\d$/.test(t) && tokens[i + 1] && /^\d\/\dSM$/.test(tokens[i + 1])) {
      const frac = tokens[i + 1].match(/^(\d)\/(\d)SM$/)!
      const sm = parseInt(t) + parseInt(frac[1]) / parseInt(frac[2])
      out.visibility = `Visibility ${t} ${frac[1]}/${frac[2]} statute miles`; vis = sm; out.lines.push(out.visibility); i++; continue
    }
    const v = decodeVis(t); if (v) { out.visibility = v.text; vis = v.sm; out.lines.push(v.text); continue }
    const c = decodeCloud(t); if (c) { out.clouds!.push(c.text); if (c.ceiling && c.baseFt != null && (ceil == null || c.baseFt < ceil)) ceil = c.baseFt; out.lines.push(c.text); continue }
    const tm = t.match(/^(M?\d{2})\/(M?\d{2})$/)
    if (tm) { const f = (s: string) => (s.startsWith('M') ? -parseInt(s.slice(1)) : parseInt(s)); out.temp = `Temp ${f(tm[1])}°C, dewpoint ${f(tm[2])}°C`; out.lines.push(out.temp); continue }
    const a = t.match(/^A(\d{4})$/); if (a) { out.altimeter = `Altimeter ${a[1].slice(0, 2)}.${a[1].slice(2)}`; out.lines.push(out.altimeter); continue }
    const q = t.match(/^Q(\d{4})$/); if (q) { out.altimeter = `Altimeter ${parseInt(q[1])} hPa`; out.lines.push(out.altimeter); continue }
    const wx = decodeWx(t); if (wx) { out.weather!.push(wx); out.lines.push(`Weather: ${wx}`); continue }
    if (/^\d{3}V\d{3}$/.test(t)) { out.lines.push(`Wind variable ${t.replace('V', '° to ')}°`); continue }
    // unknown token — pass through quietly
  }

  out.ceilingFt = ceil
  out.visSm = vis
  out.flightCategory = category(ceil, vis)
  return out
}
