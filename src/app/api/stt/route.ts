import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/ratelimit'

// Higher-accuracy speech-to-text via ElevenLabs Scribe (same vendor/key as TTS).
// Better at aviation phraseology than the browser's Web Speech API.
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const MAX_AUDIO_BYTES = 4_000_000 // ~30s of speech; bounds cost per call

export async function POST(req: NextRequest) {
  if (!ELEVENLABS_API_KEY) return NextResponse.json({ error: 'STT not configured' }, { status: 503 })
  if (!rateLimit(`stt:${clientIp(req)}`, 40, 600_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const form = await req.formData()
  const audio = form.get('audio')
  if (!(audio instanceof Blob)) return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
  if (audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'audio_too_large' }, { status: 413 })

  // NOTE: no_verbatim is deliberately NOT set. Default Scribe behavior preserves
  // filler words ("um"/"uh") verbatim in `text` -- lib/grader.ts's deliveryNotes
  // (feature #82) depends on that. Setting no_verbatim:true here would silently
  // zero out that feature with no error anywhere.
  const fd = new FormData()
  fd.append('file', audio, 'readback.webm')
  fd.append('model_id', 'scribe_v1')
  fd.append('language_code', 'eng')

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    body: fd,
  })
  if (!res.ok) return NextResponse.json({ error: 'STT failed' }, { status: 502 })

  const data = await res.json()
  return NextResponse.json({ text: (data?.text ?? '').trim() })
}
