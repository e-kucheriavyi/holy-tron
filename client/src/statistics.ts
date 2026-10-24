import { Phase, type State, type Direction } from './types.ts'

export type RaceResult = 'win' | 'loss' | 'draw' | 'quit'
export type RaceRecord = { id?: string; at: number; result: RaceResult; seconds: number; distance: number; turns: number; place: number | null; pilots: number }
export type Career = { races: number; wins: number; distance: number; turns: number; bestSeconds: number; streak: number; bestStreak: number; history: RaceRecord[] }
export type RaceMetrics = { seconds: number; distance: number; turns: number; place: number | null; pilots: number }
export const emptyCareer = (): Career => ({ races: 0, wins: 0, distance: 0, turns: 0, bestSeconds: 0, streak: 0, bestStreak: 0, history: [] })
const nonnegative = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0
export const readCareer = (raw: string | null): Career => {
  try {
    const data = JSON.parse(raw ?? '{}') as Career
    const fields = ['races', 'wins', 'distance', 'turns', 'bestSeconds', 'streak', 'bestStreak'] as const
    if (!fields.every(key => nonnegative(data[key])) || data.wins > data.races || !Array.isArray(data.history)) return emptyCareer()
    const history = data.history.filter(r => r && ['win', 'loss', 'draw', 'quit'].includes(r.result) && [r.at, r.seconds, r.distance, r.turns, r.pilots].every(nonnegative) && (r.place === null || nonnegative(r.place))).slice(0, 8)
    return { ...Object.fromEntries(fields.map(key => [key, data[key]])), history } as Career
  } catch { return emptyCareer() }
}
export const careerKey = (nickname: string, mode: string) => `tron-career-v1:${encodeURIComponent(nickname.trim())}:${mode}`
export const createStatistics = (initial = emptyCareer(), save: (career: Career, record: RaceRecord) => void = () => {}) => {
  const career: Career = structuredClone(initial)
  let metrics: RaceMetrics = { seconds: 0, distance: 0, turns: 0, place: null, pilots: 0 }
  let currentGame: number | undefined, firstTick = 0, active = false, recorded = false
  let previous: { x: number; y: number; direction: Direction } | undefined
  const finish = (result: RaceResult, place: number | null) => {
    if (!active || recorded) return
    recorded = true; metrics.place = place
    const record: RaceRecord = { ...metrics, id: crypto.randomUUID(), at: Date.now(), result }
    career.races++; career.wins += Number(result === 'win'); career.distance += metrics.distance; career.turns += metrics.turns
    career.bestSeconds = Math.max(career.bestSeconds, metrics.seconds)
    career.streak = result === 'win' ? career.streak + 1 : 0
    career.bestStreak = Math.max(career.bestStreak, career.streak)
    career.history = [record, ...career.history].slice(0, 8)
    save(structuredClone(career), record)
  }
  return {
    get career() { return career }, get metrics() { return metrics },
    abandon: () => finish('quit', null),
    observe: (state: State) => {
      const me = state.players.find(p => p.id === state.playerId)
      if (!me) return
      if (currentGame !== state.gameId) {
        finish('quit', null)
        currentGame = state.gameId; active = false; recorded = false; previous = undefined
        metrics = { seconds: 0, distance: 0, turns: 0, place: null, pilots: state.players.filter(p => p.connected).length }
      }
      if (state.phase === Phase.GAME && !active) {
        active = true; firstTick = state.tickNumber
        previous = { x: me.x, y: me.y, direction: me.direction }
      }
      if (!active || recorded) return
      metrics.seconds = Math.max(0, state.tickNumber - firstTick) * state.tickInterval / 1000
      if (previous) {
        const distance = Math.abs(me.x - previous.x) + Math.abs(me.y - previous.y)
        // Ignore a spawn/teleport rather than inflating a race distance.
        if (distance <= Math.max(2, state.tickNumber - firstTick + 1)) metrics.distance += distance * 3
        if (me.direction !== previous.direction) metrics.turns++
      }
      previous = { x: me.x, y: me.y, direction: me.direction }
      const alive = state.players.filter(p => p.isAlive && p.connected).length
      if (!me.isAlive) finish(alive === 0 && state.winnerId < 0 ? 'draw' : 'loss', alive > 0 ? alive + 1 : null)
      else if (state.phase === Phase.WINNER || state.phase === Phase.END) finish(state.winnerId === me.id ? 'win' : 'draw', state.winnerId === me.id ? 1 : null)
    },
  }
}
