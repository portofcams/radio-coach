// NOTAM decoder — expands the common FAA/ICAO contractions in a raw NOTAM into
// readable English. (Full NOTAM parsing is open-ended; contraction expansion is
// the high-value, reliable core.)
const CONTRACTIONS: Record<string, string> = {
  RWY: 'runway', TWY: 'taxiway', APRON: 'apron', RAMP: 'ramp', CLSD: 'closed', CLOSED: 'closed',
  OPN: 'open', WIP: 'work in progress', CONST: 'construction', MAINT: 'maintenance',
  ACFT: 'aircraft', AD: 'aerodrome', APT: 'airport', ARPT: 'airport', AVBL: 'available',
  BTN: 'between', U: 'until', UFN: 'until further notice', WEF: 'with effect from', EFF: 'effective',
  DLY: 'daily', EXC: 'except', SR: 'sunrise', SS: 'sunset', TIL: 'until', TO: 'to', THRU: 'through',
  LGT: 'light', LGTD: 'lighted', LGTS: 'lights', UNLGTD: 'unlighted', OUT: 'out of service', OTS: 'out of service',
  UNSERVICEABLE: 'unserviceable', U_S: 'unserviceable', RESTR: 'restricted', PROHIBITED: 'prohibited',
  THR: 'threshold', DISPLACED: 'displaced', DSPLCD: 'displaced', INTXN: 'intersection', INT: 'intersection',
  APCH: 'approach', DEP: 'departure', DEPART: 'departure', ARR: 'arrival', TKOF: 'takeoff', LDG: 'landing',
  PAPI: 'PAPI (precision approach path indicator)', VASI: 'VASI (visual approach slope indicator)',
  ILS: 'ILS (instrument landing system)', GP: 'glideslope', LOC: 'localizer', DME: 'DME', VOR: 'VOR',
  NDB: 'NDB', GPS: 'GPS', RNAV: 'RNAV', MIRL: 'medium-intensity runway lights', HIRL: 'high-intensity runway lights',
  REIL: 'runway end identifier lights', PCL: 'pilot-controlled lighting', ALS: 'approach lighting system',
  OBST: 'obstruction', TWR: 'tower', CTC: 'contact', FREQ: 'frequency', FT: 'feet', AGL: 'above ground level',
  MSL: 'mean sea level', NM: 'nautical miles', MAG: 'magnetic', PSN: 'position', SVC: 'service', SVCS: 'services',
  NA: 'not authorized', AUTH: 'authorized', ABV: 'above', BLW: 'below', ADJ: 'adjacent', N: 'north', S: 'south',
  E: 'east', W: 'west', NE: 'northeast', NW: 'northwest', SE: 'southeast', SW: 'southwest', FUEL: 'fuel',
  FREQ_CHG: 'frequency change', NOTAM: 'NOTAM', FDC: 'Flight Data Center', MON: 'monitor', BCST: 'broadcast',
  ATIS: 'ATIS', AWOS: 'AWOS', ASOS: 'ASOS', CTAF: 'CTAF', UNICOM: 'UNICOM', CL: 'centerline', EDGE: 'edge',
  HEL: 'helicopter', HELI: 'helipad', PAD: 'pad', PARKING: 'parking', PRKG: 'parking', STD: 'stand',
}

export interface DecodedNotam {
  expanded: string
  raw: string
  found: number
}

export function decodeNotam(rawInput: string): DecodedNotam {
  const raw = rawInput.trim()
  let found = 0
  const expanded = raw.replace(/[A-Z][A-Z0-9_]{0,12}/g, (tok) => {
    const key = tok.toUpperCase()
    if (CONTRACTIONS[key]) { found++; return CONTRACTIONS[key] }
    return tok
  })
  return { expanded, raw, found }
}
