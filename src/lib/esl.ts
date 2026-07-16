'use client'

// Learner-paced mode: a per-device presentation/pacing preference, not scenario
// content and not a grading change. Structurally identical to getRadioFx/
// setRadioFx in radio-fx.ts (same try/catch, same SSR guard).
const STORE_KEY = 'wilco_esl_mode'

export function getEslMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORE_KEY) === '1'
  } catch {
    return false
  }
}

export function setEslMode(v: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORE_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
}
