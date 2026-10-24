import {
	ActionType,
	Direction,
	Phase,
	type Action,
	type ServerMessage,
	type TurnData,
	type PhaseData,
	type WelcomeData,
	type PlayerConnectedData,
} from "./types.ts"

import type { State } from "./types.ts"

export interface Store {
	state: State
	tick: () => void
	handle: (msg: ServerMessage) => void
}

const DX: Record<Direction, number> = {
	[Direction.LEFT]: -1,
	[Direction.RIGHT]: 1,
	[Direction.UP]:    0,
	[Direction.DOWN]:  0,
}

const DY: Record<Direction, number> = {
	[Direction.LEFT]:  0,
	[Direction.RIGHT]: 0,
	[Direction.UP]:   -1,
	[Direction.DOWN]:  1,
}

export const createStore = (nickname: string): Store => {
	let cellsPerPlayer = 10

	let state: State = {
		nickname,
		connected: false,
		gameId: 0,
		playerId: 0,
		tickNumber: 0,
		tickInterval: 0,
		phaseInterval: 0,
		winnerId: 0,
		arenaSize: cellsPerPlayer,
		phase: Phase.PENDING,
		players: [],
	}

	const tick = () => {
		if (state.phase !== Phase.GAME) {
			return
		}
		state.players.forEach((p) => {
			p.x += DX[p.direction]
			p.y += DY[p.direction]
		})
	}

	const handlers: Record<ActionType, (msg: unknown) => void> = {
		[ActionType.WELCOME]: (msg) => {
			const data = msg as WelcomeData

			state.connected = true
			state.gameId = data.g
			state.playerId = data.i
			state.tickInterval = data.s
			cellsPerPlayer = data.a

			const p = data.p.find((p) => p.i === data.i) as PlayerConnectedData

			state.nickname = p.n

			data.p.forEach((p) => {
				const pp = state.players.find((pp) => pp.id === p.i)

				if (pp) {
					pp.x = p.x
					pp.y = p.y
					pp.trace = [p.x, p.y]
					pp.direction = p.d
					pp.games = p.g
					pp.wins = p.w
					return
				}

				state.players.push({
					id: p.i,
					nickname: p.n,
					x: p.x,
					y: p.y,
					direction: p.d,
					color: p.c,
					isAlive: true,
					connected: true,
					games: p.g,
					wins: p.w,
					trace: [p.x, p.y],
				})
			})

			const activePlayers = state.players.filter((p) => p.connected)
			
			state.arenaSize = activePlayers.length * cellsPerPlayer
		},
		[ActionType.PLAYER_CONNECTED]: (msg) => {
			const data = msg as PlayerConnectedData

			const p = state.players.find((p) => p.id === data.i)

			if (p) {
				p.x = data.x
				p.y = data.y
				p.direction = data.d
				p.isAlive = true
				p.connected = true
				p.trace = [data.x, data.y]
				return
			}

			state.players.push({
				id: data.i,
				nickname: data.n,
				color: data.c,
				direction: data.d,
				x: data.x,
				y: data.y,
				wins: data.w,
				games: data.g,
				trace: [data.x, data.y],
				isAlive: true,
				connected: true,
			})

			const activePlayers = state.players.filter((p) => p.connected)

			state.arenaSize = cellsPerPlayer * activePlayers.length
		},
		[ActionType.PLAYER_TURNED]: (msg) => {
			const data = msg as TurnData
			
			const p = state.players.find((p) => p.id === data.i)

			if (!p) {
				return
			}

			p.direction = data.d
			p.trace.push(p.x, p.y)
		},
		[ActionType.PLAYER_DIED]: (msg) => {
			const p = state.players.find((p) => p.id === Number(msg))

			if (p) {
				p.isAlive = false
			}
		},
		[ActionType.GAME_PHASE]: (msg) => {
			// TODO: fix
			const data = msg as PhaseData

			state.phase = data.p
			state.winnerId = data.w
			state.phaseInterval = data.n

			if (data.p === Phase.END) {
				state.players.forEach((p) => {
					p.connected = false
				})
			}
		},
		[ActionType.DATA]: (msg) => {
			state = {
				...state,
				...msg as State,
				connected: true,
				arenaSize: msg.cellPerPlayer * msg.players.length
			}
		},
	}

	return {
		get state() {
			return state
		},
		tick,
		handle: (msg: ServerMessage) => {
			state.tickNumber = msg.i
			msg.a.forEach((a: Action) => {
				handlers[a.t](a.d)
			})
		}
	}
}
