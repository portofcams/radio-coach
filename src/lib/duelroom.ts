// Realtime duel rooms — in-memory, single Next process (ephemeral; lost on restart).
// Transport is SSE (server→client) + POST (client→server); no WebSocket server /
// proxy config needed. Two pilots race the same scenario; fastest passing wins.
import { scenarios } from './scenarios'

export interface DuelPlayer {
  pid: string
  name: string
  ready: boolean
  submitted: boolean
  score: number
  timeMs: number
}
interface Room {
  code: string
  players: Map<string, DuelPlayer>
  scenarioId: string | null
  state: 'lobby' | 'racing' | 'done'
  result: { winner: string | null; players: Array<{ pid: string; name: string; score: number | null; timeMs: number | null }> } | null
  listeners: Set<(msg: string) => void>
  createdAt: number
  timer: ReturnType<typeof setTimeout> | null
}

const rooms = new Map<string, Room>()
// Short, library scenarios make for fair, quick races.
const POOL = scenarios.filter((s) => s.tier !== 'pro' && s.category !== 'helicopter' && !s.curveball && s.requiredElements.length <= 4)

function gc() {
  const now = Date.now()
  for (const [c, r] of rooms) if (now - r.createdAt > 900_000) { if (r.timer) clearTimeout(r.timer); rooms.delete(c) }
}

function room(code: string): Room {
  let r = rooms.get(code)
  if (!r) { r = { code, players: new Map(), scenarioId: null, state: 'lobby', result: null, listeners: new Set(), createdAt: Date.now(), timer: null }; rooms.set(code, r) }
  return r
}

function snapshot(r: Room) {
  return {
    type: 'state',
    state: r.state,
    scenarioId: r.scenarioId,
    result: r.result,
    players: [...r.players.values()].map((p) => ({
      pid: p.pid, name: p.name, ready: p.ready, submitted: p.submitted,
      score: p.submitted ? p.score : null, timeMs: p.submitted ? p.timeMs : null,
    })),
  }
}

function broadcast(r: Room, obj: unknown) {
  const msg = `data: ${JSON.stringify(obj)}\n\n`
  for (const l of r.listeners) l(msg)
}
const pushState = (r: Room) => broadcast(r, snapshot(r))

export function currentSnapshot(code: string) { return snapshot(room(code)) }

export function addListener(code: string, fn: (msg: string) => void): () => void {
  gc()
  const r = room(code)
  r.listeners.add(fn)
  return () => { r.listeners.delete(fn) }
}

export function join(code: string, pid: string, name: string) {
  const r = room(code)
  if (!r.players.has(pid) && r.state === 'lobby' && r.players.size < 2) {
    r.players.set(pid, { pid, name: (name || 'Pilot').slice(0, 24), ready: false, submitted: false, score: 0, timeMs: 0 })
  }
  pushState(r)
}

function finish(r: Room) {
  if (r.state === 'done') return
  r.state = 'done'
  if (r.timer) { clearTimeout(r.timer); r.timer = null }
  const ps = [...r.players.values()]
  ps.sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
  const tie = ps.length === 2 && ps[0].score === ps[1].score && ps[0].timeMs === ps[1].timeMs
  const winner = ps.length === 2 && !tie ? ps[0].pid : null
  r.result = { winner, players: ps.map((p) => ({ pid: p.pid, name: p.name, score: p.submitted ? p.score : null, timeMs: p.submitted ? p.timeMs : null })) }
  broadcast(r, { type: 'result', ...r.result })
}

export function setReady(code: string, pid: string) {
  const r = room(code)
  const p = r.players.get(pid)
  if (!p) return
  p.ready = true
  if (r.state === 'lobby' && r.players.size === 2 && [...r.players.values()].every((x) => x.ready)) {
    r.scenarioId = POOL[Math.floor(Math.random() * POOL.length)].id
    r.state = 'racing'
    broadcast(r, { type: 'start', scenarioId: r.scenarioId })
    // Safety timeout: end the race even if a player never submits.
    r.timer = setTimeout(() => finish(r), 90_000)
  }
  pushState(r)
}

export function submit(code: string, pid: string, score: number, timeMs: number) {
  const r = room(code)
  const p = r.players.get(pid)
  if (!p || r.state !== 'racing') return
  p.submitted = true
  p.score = Math.max(0, Math.min(100, Math.round(score)))
  p.timeMs = Math.max(0, Math.round(timeMs))
  pushState(r)
  if ([...r.players.values()].length === 2 && [...r.players.values()].every((x) => x.submitted)) finish(r)
}
