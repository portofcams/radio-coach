'use client'

/**
 * Realistic aviation-radio FX, applied to the ElevenLabs ATC voice entirely
 * client-side via the Web Audio API ($0 — no extra API calls).
 *
 * Two knobs, both saved to localStorage:
 *  - mode:  clean | radio | busy   → bandpass + presence + soft-clip + static/squelch
 *  - speed: normal | fast | real   → pitch-PRESERVED tempo via ElevenLabs voice speed
 *
 * The "radio" sound comes from squeezing the voice into a ~320–2700 Hz comm band,
 * adding a touch of grit, a low static bed during the transmission, and a squelch
 * click on key-up and key-down — the way a real handheld/panel radio sounds.
 */

export type RadioMode = 'clean' | 'radio' | 'busy'
export type RadioSpeed = 'normal' | 'fast' | 'real'

export interface RadioFxSettings {
  mode: RadioMode
  speed: RadioSpeed
}

const STORE_KEY = 'wilco_radio_fx'
const DEFAULT: RadioFxSettings = { mode: 'radio', speed: 'normal' }

// ElevenLabs voice_settings.speed tops out at ~1.2 and preserves pitch.
const SPEED_MAP: Record<RadioSpeed, number> = { normal: 1.0, fast: 1.12, real: 1.2 }

export function getRadioFx(): RadioFxSettings {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return DEFAULT
    const v = JSON.parse(raw)
    const modes: RadioMode[] = ['clean', 'radio', 'busy']
    const speeds: RadioSpeed[] = ['normal', 'fast', 'real']
    return {
      mode: modes.includes(v?.mode) ? v.mode : DEFAULT.mode,
      speed: speeds.includes(v?.speed) ? v.speed : DEFAULT.speed,
    }
  } catch {
    return DEFAULT
  }
}

export function setRadioFx(v: RadioFxSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

/** ElevenLabs voice-speed value for a pace setting (pitch preserved). */
export function ttsSpeed(speed: RadioSpeed): number {
  return SPEED_MAP[speed] ?? 1.0
}

// ── Web Audio graph ───────────────────────────────────────────────────────
let _ctx: AudioContext | null = null
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (_ctx) return _ctx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  _ctx = new AC()
  return _ctx
}

let _noiseBuf: AudioBuffer | null = null
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (_noiseBuf) return _noiseBuf
  const len = Math.floor(c.sampleRate * 2)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  _noiseBuf = buf
  return buf
}

// Pre-rendered party-line chatter clips (public/chatter/c1..c10.mp3), decoded once.
const CHATTER_COUNT = 10
const _chatterBufs: Array<AudioBuffer | null> = []
async function loadChatter(c: AudioContext, idx: number): Promise<AudioBuffer | null> {
  if (_chatterBufs[idx] !== undefined && _chatterBufs[idx] !== null) return _chatterBufs[idx]
  try {
    const res = await fetch(`/chatter/c${idx + 1}.mp3`)
    const buf = await c.decodeAudioData(await res.arrayBuffer())
    _chatterBufs[idx] = buf
    return buf
  } catch { return null }
}

/** Soft-clip transfer curve — gentle AM-radio grit. */
function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 256
  const curve = new Float32Array(new ArrayBuffer(n * 4))
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x))
  }
  return curve
}

export interface RadioFxController {
  setMode(mode: RadioMode): void
  /** call right before audio.play() — key-up squelch click + start the static bed.
   * Pass steppedOn=true for a scenario's `steppedOn` transmission: a hard,
   * sustained mute + party-line overlay that fires regardless of the user's
   * comms-FX mode (unlike the cosmetic busy-mode dip, this must never silently
   * no-op just because the pilot has FX set to clean). */
  cue(steppedOn?: boolean): void
  /** call on audio 'ended' — key-down squelch tail + fade the static out */
  release(): void
}

const _attached = new WeakMap<HTMLAudioElement, RadioFxController>()

const STATIC_LEVEL: Record<RadioMode, number> = { clean: 0, radio: 0.012, busy: 0.03 }
const SQUELCH_LEVEL: Record<RadioMode, number> = { clean: 0, radio: 0.09, busy: 0.16 }

/**
 * Route an <audio> element's output through the radio graph. Safe to call more
 * than once per element (returns the existing controller). Returns null if Web
 * Audio is unavailable or the element is already captured by another graph.
 */
export function attachRadioFx(el: HTMLAudioElement, initialMode: RadioMode = getRadioFx().mode): RadioFxController | null {
  const existing = _attached.get(el)
  if (existing) {
    existing.setMode(initialMode)
    return existing
  }
  const c = audioCtx()
  if (!c) return null

  let src: MediaElementAudioSourceNode
  try {
    src = c.createMediaElementSource(el)
  } catch {
    return null // already captured elsewhere
  }

  const hp = c.createBiquadFilter(); hp.type = 'highpass'
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'
  const presence = c.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 1800; presence.Q.value = 0.9
  const shaper = c.createWaveShaper(); shaper.oversample = '2x'
  const voiceGain = c.createGain()
  const master = c.createGain(); master.gain.value = 1.0

  src.connect(hp); hp.connect(presence); presence.connect(lp); lp.connect(shaper)
  shaper.connect(voiceGain); voiceGain.connect(master); master.connect(c.destination)

  // Static bed + squelch — a single looping noise source whose gain we automate.
  const noise = c.createBufferSource(); noise.buffer = noiseBuffer(c); noise.loop = true
  const noiseBp = c.createBiquadFilter(); noiseBp.type = 'bandpass'; noiseBp.frequency.value = 1600; noiseBp.Q.value = 0.7
  const noiseGain = c.createGain(); noiseGain.gain.value = 0
  noise.connect(noiseBp); noiseBp.connect(noiseGain); noiseGain.connect(master)
  try { noise.start() } catch { /* already started */ }

  // Party-line chatter (busy mode) — other aircraft on the frequency, low + filtered.
  const chatterBp = c.createBiquadFilter(); chatterBp.type = 'bandpass'; chatterBp.frequency.value = 1700; chatterBp.Q.value = 0.8
  const chatterGain = c.createGain(); chatterGain.gain.value = 0
  chatterBp.connect(chatterGain); chatterGain.connect(master)
  let chatterSrc: AudioBufferSourceNode | null = null

  let mode: RadioMode = initialMode

  function applyMode() {
    const t = c!.currentTime
    if (mode === 'clean') {
      hp.frequency.setTargetAtTime(20, t, 0.01)
      lp.frequency.setTargetAtTime(20000, t, 0.01)
      presence.gain.setTargetAtTime(0, t, 0.01)
      shaper.curve = driveCurve(0)
      voiceGain.gain.setTargetAtTime(1.0, t, 0.01)
    } else if (mode === 'radio') {
      hp.frequency.setTargetAtTime(320, t, 0.01)
      lp.frequency.setTargetAtTime(2700, t, 0.01)
      presence.gain.setTargetAtTime(6, t, 0.01)
      shaper.curve = driveCurve(3)
      voiceGain.gain.setTargetAtTime(1.18, t, 0.01)
    } else {
      hp.frequency.setTargetAtTime(380, t, 0.01)
      lp.frequency.setTargetAtTime(2500, t, 0.01)
      presence.gain.setTargetAtTime(8, t, 0.01)
      shaper.curve = driveCurve(6)
      voiceGain.gain.setTargetAtTime(1.28, t, 0.01)
    }
  }
  applyMode()

  function squelchBurst(at: number, dur: number) {
    if (mode === 'clean') return
    const peak = SQUELCH_LEVEL[mode]
    const bed = STATIC_LEVEL[mode]
    noiseGain.gain.cancelScheduledValues(at)
    noiseGain.gain.setValueAtTime(Math.max(bed, 0.0001), at)
    noiseGain.gain.linearRampToValueAtTime(peak, at + 0.008)
    noiseGain.gain.linearRampToValueAtTime(bed, at + dur)
  }

  const controller: RadioFxController = {
    setMode(m) {
      mode = m
      applyMode()
      // reflect new bed level if we're mid-transmission
      noiseGain.gain.setTargetAtTime(noiseGain.gain.value > 0 ? STATIC_LEVEL[m] : 0, c!.currentTime, 0.05)
    },
    cue(steppedOn) {
      if (c!.state === 'suspended') c!.resume().catch(() => {})
      const t = c!.currentTime
      noiseGain.gain.cancelScheduledValues(t)
      noiseGain.gain.setValueAtTime(STATIC_LEVEL[mode], t)
      squelchBurst(t, 0.06)
      if (steppedOn) {
        // A scenario-authored stepped-on/blocked transmission: a hard, sustained
        // mute + party-line overlay that must fire regardless of comms-FX mode
        // (including 'clean') — this is content the scenario requires the pilot
        // to notice, not a cosmetic realism touch, so it can't silently no-op.
        // Fixed onset (not random, unlike the busy-mode dip below) so it
        // reliably lands after the callsign and before the substantive
        // instruction across every scenario's transmission.
        const t0 = t + 1.2
        voiceGain.gain.cancelScheduledValues(t0)
        voiceGain.gain.setValueAtTime(voiceGain.gain.value, t0)
        voiceGain.gain.linearRampToValueAtTime(0.03, t0 + 0.09) // hard, sustained mute — no ramp back up
        const peak = Math.max(SQUELCH_LEVEL[mode], 0.16)
        const bed = Math.max(STATIC_LEVEL[mode], 0.14)
        noiseGain.gain.cancelScheduledValues(t0)
        noiseGain.gain.setValueAtTime(Math.max(bed, 0.0001), t0)
        noiseGain.gain.linearRampToValueAtTime(peak, t0 + 0.008)
        noiseGain.gain.setValueAtTime(bed, t0 + 0.5) // keep the bed audible through the rest of the clip
        const idx = Math.floor(Math.random() * CHATTER_COUNT) // WHICH clip is cosmetic variety; WHETHER/WHEN it fires is deterministic
        loadChatter(c!, idx).then((buf) => {
          if (!buf) return
          try { chatterSrc?.stop() } catch { /* */ }
          chatterSrc = c!.createBufferSource()
          chatterSrc.buffer = buf
          chatterSrc.loop = true // sustain for whatever remains of the clip — duration is unknown
          chatterSrc.connect(chatterBp)
          chatterGain.gain.cancelScheduledValues(t0)
          chatterGain.gain.setValueAtTime(0.34, t0) // louder than busy's 0.17 — this must mask, not just flavor
          try { chatterSrc.start(t0 + 0.1) } catch { /* */ }
        })
        return
      }
      // Busy mode: a cosmetic "stepped-on" flavor moment — someone keys over the
      // controller mid-call, so part of it is lost under a squelch break.
      // Scheduled at a random point during the call. Unlike the steppedOn
      // branch above, this is realism flavor, not a graded requirement, so it
      // stays gated behind the user's own comms-FX preference.
      if (mode === 'busy') {
        const t0 = t + 1.4 + Math.random() * 1.8
        voiceGain.gain.cancelScheduledValues(t0)
        voiceGain.gain.setValueAtTime(1.28, t0)
        voiceGain.gain.linearRampToValueAtTime(0.1, t0 + 0.06)
        voiceGain.gain.linearRampToValueAtTime(1.28, t0 + 0.5)
        squelchBurst(t0, 0.5)
        // party-line chatter: another aircraft on the frequency, low + filtered
        const idx = Math.floor(Math.random() * CHATTER_COUNT)
        loadChatter(c!, idx).then((buf) => {
          if (!buf || mode !== 'busy') return
          try { chatterSrc?.stop() } catch { /* */ }
          chatterSrc = c!.createBufferSource()
          chatterSrc.buffer = buf
          chatterSrc.connect(chatterBp)
          chatterGain.gain.setValueAtTime(0.17, c!.currentTime)
          try { chatterSrc.start(c!.currentTime + 0.15) } catch { /* */ }
        })
      }
    },
    release() {
      const t = c!.currentTime
      squelchBurst(t, 0.1)
      noiseGain.gain.setTargetAtTime(0, t + 0.14, 0.06)
      chatterGain.gain.setTargetAtTime(0, t, 0.1)
      try { chatterSrc?.stop(t + 0.3) } catch { /* */ }
    },
  }

  _attached.set(el, controller)
  return controller
}
