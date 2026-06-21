import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/ratelimit'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'

/** ElevenLabs voice speed is valid in [0.7, 1.2] and preserves pitch. */
function clampSpeed(s: unknown): number {
  const n = typeof s === 'number' && isFinite(s) ? s : 1.0
  return Math.max(0.7, Math.min(1.2, n))
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`tts:${clientIp(req)}`, 60, 600_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const { text, speed } = await req.json()
  if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  if (text.length > 600) return NextResponse.json({ error: 'text_too_long' }, { status: 413 })

  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.85, similarity_boost: 0.75, speed: clampSpeed(speed) },
      }),
    },
  )

  if (!response.ok) {
    return NextResponse.json({ error: 'TTS failed' }, { status: 502 })
  }

  const audio = await response.arrayBuffer()
  return new NextResponse(audio, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}
