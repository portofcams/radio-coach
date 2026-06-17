// Ground School progress — stored client-side in localStorage.
// No server round-trip → free to run, works offline. (Server sync can come later.)

const KEY = 'rc_groundschool_v1'

export interface GsProgress {
  /** lesson ids the user has completed */
  completed: string[]
  /** cumulative XP */
  xp: number
  /** current daily streak (days) */
  streak: number
  /** ISO date (YYYY-MM-DD) of the last day a lesson was finished */
  lastDay: string | null
}

const EMPTY: GsProgress = { completed: [], xp: 0, streak: 0, lastDay: null }

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

/** Record a finished lesson. Idempotent on XP/streak per day & per lesson. */
export function completeLesson(lessonId: string, xp: number): GsProgress {
  const p = loadProgress()
  const firstTime = !p.completed.includes(lessonId)
  if (firstTime) {
    p.completed = [...p.completed, lessonId]
    p.xp += xp
  }
  // streak: advance once per calendar day
  const today = todayStr()
  if (p.lastDay !== today) {
    p.streak = p.lastDay === yesterdayStr() ? p.streak + 1 : 1
    p.lastDay = today
  }
  save(p)
  return p
}

/**
 * Push local progress to the server and return the merged result (union of
 * completed, max xp/streak). For logged-in users this syncs across devices; for
 * anonymous users the server returns null and local progress is kept as-is.
 * Best-effort: any failure just returns the local copy unchanged.
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
