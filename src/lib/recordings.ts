// CLIENT-ONLY. Keeps the LAST readback recording per scenario in IndexedDB so a
// pilot can hear themselves played back through the radio FX — even after a
// reload. On-device, offline, never leaves the browser/app. SSR-safe (no-ops
// when indexedDB is unavailable).
const DB_NAME = 'rc-recordings'
const STORE = 'readbacks'

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return }
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE) }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
}

/** Store the most recent readback recording for a scenario (overwrites prior). */
export async function saveRecording(scenarioId: string, blob: Blob): Promise<void> {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, scenarioId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch { resolve() }
  })
  db.close()
}

/** Load the last readback recording for a scenario, or null. */
export async function loadRecording(scenarioId: string): Promise<Blob | null> {
  const db = await openDb()
  if (!db) return null
  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(scenarioId)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => resolve(null)
    } catch { resolve(null) }
  })
  db.close()
  return blob
}
