import type { AirportRunway } from './realfield'

export interface ActiveRunwayPick {
  runway: AirportRunway
  end: 'le' | 'he'
  ident: string
  headwindKt: number
}

/**
 * Pick the wind-favored runway end (max headwind component). Falls back to
 * today's existing "longest runway" pick (same as realfield.ts's
 * `primaryRunway`) whenever wind is calm/unknown or no runway end has usable
 * heading data -- both real, common gaps in the bundled dataset, never a
 * crash or a fabricated value.
 */
export function pickActiveRunway(
  runways: AirportRunway[],
  windDirDeg: number | null,
  windSpeedKt: number,
): ActiveRunwayPick | null {
  if (!runways.length) return null

  const ends = runways.flatMap((r) => [
    r.leHdg != null ? { runway: r, end: 'le' as const, ident: r.le, hdg: r.leHdg } : null,
    r.heHdg != null ? { runway: r, end: 'he' as const, ident: r.he, hdg: r.heHdg } : null,
  ]).filter((e): e is { runway: AirportRunway; end: 'le' | 'he'; ident: string; hdg: number } => e != null)

  if (!ends.length || windDirDeg == null || windSpeedKt === 0) {
    const sorted = [...runways].sort((a, b) => (b.length ?? 0) - (a.length ?? 0))
    return { runway: sorted[0], end: 'le', ident: sorted[0].le, headwindKt: 0 }
  }

  let best = ends[0]
  let bestHeadwind = -Infinity
  for (const e of ends) {
    const angle = ((windDirDeg - e.hdg + 540) % 360) - 180
    const headwind = windSpeedKt * Math.cos((angle * Math.PI) / 180)
    if (headwind > bestHeadwind) { bestHeadwind = headwind; best = e }
  }
  return { runway: best.runway, end: best.end, ident: best.ident, headwindKt: Math.round(bestHeadwind) }
}
