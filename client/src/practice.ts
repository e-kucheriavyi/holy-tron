import { ActionType, Direction, Phase, type Player, type State, type ServerMessage } from './types.ts'
import type { Connection } from './network.ts'

const delta: Record<Direction, [number, number]> = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }
const opposite: Record<Direction, Direction> = { l: 'r', r: 'l', u: 'd', d: 'u' }
const colors = ['#86f8d8', '#ffa971', '#a29bff', '#6eacff']

export const createPracticeConnection = (nickname: string, round = 1, wins = 0): Connection => {
  const size = 50
  const starts: [number, number, Direction][] = [[9, 14, 'r'], [41, 36, 'l'], [14, 41, 'u'], [36, 9, 'd']]
  const players: Player[] = starts.map(([x, y, direction], i) => ({
    id: i, nickname: [nickname, 'Ghost.exe', 'Neon Drifter', 'Bit Runner'][i], color: colors[i],
    direction, x, y, trace: [x, y], connected: true, isAlive: true, games: round - 1, wins: i === 0 ? wins : 0,
  }))
  const state: State = { nickname, connected: true, gameId: round, playerId: 0, tickNumber: 0,
    tickInterval: 115, phase: Phase.READY, phaseInterval: 3000, winnerId: -1, arenaSize: size, players }
  let callback: ((message: ServerMessage) => void) | undefined
  let queued: Direction | undefined
  let closed = false
  const occupied = new Set(players.map(p => `${p.x},${p.y}`))
  const safe = (x: number, y: number) => x >= 0 && y >= 0 && x <= size && y <= size && !occupied.has(`${x},${y}`)
  const openSpace = (x: number, y: number) => {
    const seen = new Set<string>()
    const queue: [number, number][] = [[x, y]]
    // A small flood fill lets bots avoid turning into pockets.
    for (let i = 0; i < queue.length && seen.size < 90; i++) {
      const [cx, cy] = queue[i]
      if (!safe(cx, cy) || seen.has(`${cx},${cy}`)) continue
      seen.add(`${cx},${cy}`)
      for (const [dx, dy] of Object.values(delta)) queue.push([cx + dx, cy + dy])
    }
    return seen.size
  }
  const emit = () => callback?.({ i: state.tickNumber, t: Date.now(), a: [{ t: ActionType.DATA, d: structuredClone(state) }] })
  const timer = setInterval(() => {
    if (closed || !callback) return
    state.tickNumber++
    if (state.phase === Phase.READY) {
      state.phaseInterval = Math.max(0, state.phaseInterval - state.tickInterval)
      if (!state.phaseInterval) state.phase = Phase.GAME
    } else if (state.phase === Phase.GAME) {
      for (const p of players.filter(p => p.isAlive)) {
        let direction = p.direction
        if (p.id === 0) {
          if (queued && queued !== opposite[p.direction]) direction = queued
          queued = undefined
        } else {
          const choices = (Object.keys(delta) as Direction[]).filter(d => d !== opposite[p.direction])
          let best = -Infinity
          for (const d of choices) {
            const [dx, dy] = delta[d]
            const x = p.x + dx, y = p.y + dy
            let distance = 0
            while (distance < 12 && safe(x + dx * distance, y + dy * distance)) distance++
            const score = safe(x, y) ? openSpace(x, y) + distance * 2 + Math.random() * 5 + (d === p.direction ? 5 : 0) : -1000
            if (score > best) { best = score; direction = d }
          }
        }
        if (direction !== p.direction) p.trace.push(p.x, p.y)
        p.direction = direction
      }
      const next = players.filter(p => p.isAlive).map(p => ({ p, x: p.x + delta[p.direction][0], y: p.y + delta[p.direction][1] }))
      for (const move of next) {
        if (!safe(move.x, move.y) || next.some(other => other !== move && other.x === move.x && other.y === move.y)) move.p.isAlive = false
      }
      for (const { p, x, y } of next) {
        if (p.isAlive) { p.x = x; p.y = y; occupied.add(`${x},${y}`) }
      }
      const alive = players.filter(p => p.isAlive)
      if (alive.length <= 1) {
        state.phase = Phase.WINNER
        state.winnerId = alive[0]?.id ?? -1
        if (alive[0]) alive[0].wins++
      }
    }
    emit()
  }, state.tickInterval)
  return {
    send: (message) => {
      if (Object.values(Direction).includes(message as Direction) && state.phase === Phase.GAME) queued = message as Direction
    },
    onMessage: fn => { callback = fn; queueMicrotask(() => { if (!closed) emit() }) },
    close: () => { closed = true; clearInterval(timer) },
  }
}
