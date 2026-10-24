import { ActionType, Direction, Phase, type Player, type State, type ServerMessage, type TurnData,
  type PhaseData, type WelcomeData, type PlayerConnectedData } from './types.ts'

export interface Store { state: State; tick: () => void; handle: (message: ServerMessage) => void }
type Snapshot = Partial<State> & { players: Player[]; cellPerPlayer?: number }
const dx = { l: -1, r: 1, u: 0, d: 0 }
const dy = { l: 0, r: 0, u: -1, d: 1 }
const playerFrom = (p: PlayerConnectedData): Player => ({ id: p.i, nickname: p.n, color: p.c, direction: p.d,
  connected: true, isAlive: true, x: p.x, y: p.y, trace: [p.x, p.y], wins: p.w, games: p.g })

export const createStore = (nickname: string): Store => {
  let cellsPerPlayer = 10
  let state: State = { nickname, connected: false, gameId: 0, playerId: 0, tickNumber: 0,
    tickInterval: 200, phaseInterval: 0, winnerId: -1, arenaSize: 10, phase: Phase.PENDING, players: [] }
  const recalculateArena = () => { state.arenaSize = Math.max(1, state.players.filter(p => p.connected).length) * cellsPerPlayer }
  const handlers: Record<string, (data: unknown) => void> = {
    [ActionType.WELCOME]: message => {
      const data = message as WelcomeData
      cellsPerPlayer = data.a
      state = { ...state, connected: true, gameId: data.g, playerId: data.i, tickInterval: data.s,
        nickname: data.p.find(p => p.i === data.i)?.n ?? nickname, players: data.p.map(playerFrom) }
      recalculateArena()
    },
    [ActionType.PLAYER_CONNECTED]: message => {
      const data = message as PlayerConnectedData
      const existing = state.players.find(p => p.id === data.i)
      if (existing) Object.assign(existing, playerFrom(data)); else state.players.push(playerFrom(data))
      recalculateArena()
    },
    [ActionType.PLAYER_TURNED]: message => {
      const data = message as TurnData
      const p = state.players.find(p => p.id === data.i)
      if (p && Object.values(Direction).includes(data.d)) { p.trace.push(p.x, p.y); p.direction = data.d }
    },
    [ActionType.PLAYER_DIED]: message => {
      const p = state.players.find(p => p.id === Number(message))
      if (p) p.isAlive = false
    },
    [ActionType.GAME_PHASE]: message => {
      const data = message as PhaseData
      state.phase = data.p; state.phaseInterval = data.n; state.winnerId = data.w
    },
    [ActionType.DATA]: message => {
      const data = message as Snapshot
      state = { ...state, ...data, connected: true,
        arenaSize: data.arenaSize ?? (data.cellPerPlayer ?? cellsPerPlayer) * data.players.filter(p => p.connected).length }
      state.nickname = state.players.find(p => p.id === state.playerId)?.nickname ?? nickname
    },
  }
  return {
    get state() { return state },
    tick: () => {
      if (state.phase === Phase.GAME) for (const p of state.players) if (p.isAlive && p.connected) { p.x += dx[p.direction]; p.y += dy[p.direction] }
    },
    handle: message => {
      for (const action of message.a) handlers[action.t]?.(action.d)
      state.tickNumber = message.i
    },
  }
}
