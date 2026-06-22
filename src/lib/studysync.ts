'use client'

// Cross-device study state: DB is the source of truth when signed in; localStorage
// is the offline cache + the store for signed-out users. Saves write both.

export async function loadStudyState<T>(tool: string, lsKey: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(`/api/study/${tool}`)
    if (r.ok) {
      const d = await r.json()
      if (d.state) { try { localStorage.setItem(lsKey, JSON.stringify(d.state)) } catch { /* ignore */ } return d.state as T }
    }
  } catch { /* fall through to localStorage */ }
  try { const ls = localStorage.getItem(lsKey); if (ls) return JSON.parse(ls) as T } catch { /* ignore */ }
  return fallback
}

export function saveStudyState(tool: string, lsKey: string, state: unknown): void {
  try { localStorage.setItem(lsKey, JSON.stringify(state)) } catch { /* ignore */ }
  // best-effort DB sync (silently no-ops when signed out)
  fetch(`/api/study/${tool}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }).catch(() => {})
}
