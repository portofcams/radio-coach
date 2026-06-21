// ATC voice variety. IDs verified available on the org ElevenLabs plan (2026-06-20).
// Used by /api/tts (server-side allowlist) and the player (deterministic pick).

export interface AtcVoice {
  id: string
  label: string
}

export const ATC_VOICES: AtcVoice[] = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'US · George' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'US · Adam' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'US · Bella' },
  { id: 'IKne3meq5aSn9XLyUdCD', label: 'AUS · Charlie' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'UK · Daniel' },
]

export const VOICE_IDS = new Set(ATC_VOICES.map((v) => v.id))

/** Deterministic voice for a key (scenario/airport) so a controller's voice stays
 * consistent across replays instead of changing every transmission. */
export function voiceForKey(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return ATC_VOICES[h % ATC_VOICES.length].id
}
