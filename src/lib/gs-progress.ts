// Ground School progress — stored client-side in localStorage.
// No server round-trip → free to run, works offline. (Logged-in users also sync.)
import { units } from './groundschool'

const KEY = 'rc_groundschool_v1'

export const MAX_HEARTS = 5
export const HEART_REFILL_MS = 30 * 60 * 1000 // one heart every 30 min
export const DAILY_GOAL_XP = 20
export const MAX_FREEZES = 2
export const FREEZE_EVERY = 5 // earn a streak-freeze every 5 streak days

export interface GsProgress {
  /** lesson ids the user has completed */
  completed: string[]
  /** cumulative XP */
  xp: number
  /** current daily streak (days) */
  streak: number
  /** ISO date (YYYY-MM-DD) of the last day a lesson was finished */
  lastDay: string | null
  /** persistent hearts pool (0..MAX), refills over time */
  hearts: number
  /** epoch ms of the last hearts write — drives time-based refill */
  heartsAt: number | null
  /** streak freezes available */
  freezes: number
  /** XP earned today (toward the daily goal) */
  dailyXp: number
  /** day stamp for dailyXp */
  dailyDay: string | null
}

const EMPTY: GsProgress = {
  completed: [], xp: 0, streak: 0, lastDay: null,
  hearts: MAX_HEARTS, heartsAt: null, freezes: 0, dailyXp: 0, dailyDay: null,
}

export function loadProgress(): GsProgress {
  if (typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const p = JSON.parse(raw) as Partial<GsProgress>
    return {
      completed: Array.isArray(p.completed) ? p.completed : [],
      xp: typeof p.xp === 'number' ? p.xp : 0,
      streak: typeof p.streak === 'number' ? p.streak : 0,
      lastDay: typeof p.lastDay === 'string' ? p.lastDay : null,
      hearts: typeof p.hearts === 'number' ? p.hearts : MAX_HEARTS,
      heartsAt: typeof p.heartsAt === 'number' ? p.heartsAt : null,
      freezes: typeof p.freezes === 'number' ? p.freezes : 0,
      dailyXp: typeof p.dailyXp === 'number' ? p.dailyXp : 0,
      dailyDay: typeof p.dailyDay === 'string' ? p.dailyDay : null,
    }
  } catch {
    return { ...EMPTY }
  }
}

function save(p: GsProgress) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
function gapDays(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

// ── hearts (time-based refill) ────────────────────────────────────────────────

/** hearts after applying time-based refill (does not persist) */
export function effectiveHearts(p: GsProgress): number {
  if (p.hearts >= MAX_HEARTS || !p.heartsAt) return Math.min(MAX_HEARTS, p.hearts)
  const refilled = Math.floor((Date.now() - p.heartsAt) / HEART_REFILL_MS)
  return Math.min(MAX_HEARTS, p.hearts + Math.max(0, refilled))
}

/** ms until the next heart refills (0 when full) */
export function msToNextHeart(p: GsProgress): number {
  if (effectiveHearts(p) >= MAX_HEARTS || !p.heartsAt) return 0
  return HEART_REFILL_MS - ((Date.now() - p.heartsAt) % HEART_REFILL_MS)
}

/** fold any earned refill back into the stored value + advance the clock */
function reconcileHearts(p: GsProgress): GsProgress {
  const eff = effectiveHearts(p)
  if (eff !== p.hearts) {
    if (eff >= MAX_HEARTS) {
      p.hearts = MAX_HEARTS
      p.heartsAt = null
    } else {
      const gained = eff - p.hearts
      p.hearts = eff
      p.heartsAt = (p.heartsAt ?? Date.now()) + gained * HEART_REFILL_MS
    }
  }
  return p
}

/** spend one heart on a wrong answer */
export function loseHeart(): GsProgress {
  const p = reconcileHearts(loadProgress())
  if (p.hearts > 0) {
    if (p.hearts >= MAX_HEARTS) p.heartsAt = Date.now() // start the clock on first loss
    p.hearts -= 1
  }
  save(p)
  return p
}

/** reward a clean lesson with a heart (practice-to-refill) */
export function gainHeart(): GsProgress {
  const p = reconcileHearts(loadProgress())
  if (p.hearts < MAX_HEARTS) {
    p.hearts += 1
    if (p.hearts >= MAX_HEARTS) p.heartsAt = null
  }
  save(p)
  return p
}

// ── crowns (derived) ──────────────────────────────────────────────────────────

/** a crown per fully-completed unit */
export function countCrowns(p: GsProgress): number {
  return units.filter((u) => u.lessons.every((l) => p.completed.includes(l.id))).length
}

// ── lesson completion ─────────────────────────────────────────────────────────

/**
 * Record a finished lesson. Idempotent on XP/streak per day & per lesson.
 * `cleanRun` (no hearts lost) earns a heart back.
 */
export function completeLesson(lessonId: string, xp: number, cleanRun = false): GsProgress {
  const p = reconcileHearts(loadProgress())
  const firstTime = !p.completed.includes(lessonId)
  if (firstTime) p.completed = [...p.completed, lessonId]

  const today = todayStr()

  // daily goal — counts every completion (replays included)
  if (p.dailyDay !== today) {
    p.dailyDay = today
    p.dailyXp = 0
  }
  p.dailyXp += xp
  if (firstTime) p.xp += xp

  // streak (with freeze + earned freezes), advanced once per day
  if (p.lastDay !== today) {
    if (p.lastDay === yesterdayStr()) {
      p.streak += 1
    } else if (p.lastDay && gapDays(p.lastDay, today) === 2 && p.freezes > 0) {
      p.freezes -= 1 // a freeze covers exactly one missed day
      p.streak += 1
    } else {
      p.streak = 1
    }
    p.lastDay = today
    if (p.streak > 0 && p.streak % FREEZE_EVERY === 0) {
      p.freezes = Math.min(MAX_FREEZES, p.freezes + 1)
    }
  }

  // clean run earns a heart back
  if (cleanRun && p.hearts < MAX_HEARTS) {
    p.hearts += 1
    if (p.hearts >= MAX_HEARTS) p.heartsAt = null
  }

  save(p)
  return p
}

/**
 * Push local progress to the server and return the merged result (union of
 * completed, max xp/streak). Device-local engagement fields (hearts, freezes,
 * dailyXp) are preserved. Best-effort: any failure returns the local copy.
 */
export async function syncProgress(local?: GsProgress): Promise<GsProgress> {
  const p = local ?? loadProgress()
  if (typeof window === 'undefined') return p
  try {
    const res = await fetch('/api/gs/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!res.ok) return p
    const data = await res.json()
    if (!data?.progress) return p
    const merged: GsProgress = {
      ...p,
      completed: Array.isArray(data.progress.completed) ? data.progress.completed : p.completed,
      xp: typeof data.progress.xp === 'number' ? data.progress.xp : p.xp,
      streak: typeof data.progress.streak === 'number' ? data.progress.streak : p.streak,
      lastDay: typeof data.progress.lastDay === 'string' ? data.progress.lastDay : p.lastDay,
    }
    save(merged)
    return merged
  } catch {
    return p
  }
}

export function isComplete(lessonId: string, p?: GsProgress): boolean {
  return (p ?? loadProgress()).completed.includes(lessonId)
}

/** A lesson is unlocked if it's the first, or the previous lesson is done. */
export function isUnlocked(lessonId: string, prevId: string | null, p?: GsProgress): boolean {
  if (!prevId) return true
  return isComplete(prevId, p)
}
