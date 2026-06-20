/** Radio-proficiency endorsements a CFI can grant (client-safe — no server deps). */
export const ENDORSEMENT_KINDS: Array<{ key: string; label: string }> = [
  { key: 'solo-radio', label: 'Radio-ready for solo' },
  { key: 'towered-ops', label: 'Towered-field operations' },
  { key: 'class-bravo', label: 'Class B operations' },
  { key: 'checkride-radio', label: 'Radio-ready for checkride' },
]
export function endorsementLabel(key: string): string {
  return ENDORSEMENT_KINDS.find((e) => e.key === key)?.label ?? key
}
