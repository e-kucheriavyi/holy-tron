import {
	ActionType,
	Direction,
	Phase,
	type PhaseData,
	type TurnData,
	type Action,
	type Player,
	type WelcomeData,
	type PlayerConnectedData,
	type Game,
	type GameServer,
	type GameState,
} from "./types.ts"
import { checkCollision } from "./collision.ts"
import {
	CELLS_PER_PLAYER,
	COLORS,
	DEBUG,
	PHASE_INTERVAL,
	TICK_INTERVAL,
} from "./constants.ts"
import { isOppositeTurn } from "./utilities.ts"
import WebSocket from "ws"

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

const log = (msg: string) => {
	if (DEBUG) {
		console.log(msg)
	}
}

export const createGame = (): Game => {
	const state: GameState = {
		gameId: 0,
		phase: Phase.PENDING,
		phaseInterval: PHASE_INTERVAL,
		players: [],
		winnerId: 0,
		tickInterval: TICK_INTERVAL,
		ticks: [],
		cellPerPlayer: CELLS_PER_PLAYER,
	}

	let lastId = 0

	let lastTick: Action[] = []

	const turn = (id: number, d: Direction) => {
		const p = state.players.find((p) => p.id === id)
		
		if (!p) {
			return
		}

		if (state.phase === Phase.GAME && isOppositeTurn(p.direction, d)) {
			return
		}

		log(`[${p.id}] ${p.nickname} turned: ${d} on ${p.x} ${p.y}`)

		p.direction = d

		const a = lastTick.find((a) => a.t === ActionType.PLAYER_TURNED && (a.d as TurnData).i === id)

		if (a) {
			a.d = d
			return
		}

		if (state.phase === Phase.GAME) {
			p.trace.push(p.x, p.y)
		}

		lastTick.push({
			t: ActionType.PLAYER_TURNED,
			d: { i: id, d } satisfies TurnData,
		})
	}

	const kill = (p: Player) => {
		p.isAlive = false
		lastTick.push({
			t: ActionType.PLAYER_DIED,
			d: p.id,
		})
	}

	const setPhase = (p: Phase, n: number = PHASE_INTERVAL, w: number = 0) => {
		state.phase = p
		state.phaseInterval = n
		state.winnerId = w

		lastTick.push({
			t: ActionType.GAME_PHASE,
			d: { p, n, w } satisfies PhaseData,
		})
	}

	const tickers: Record<Phase, Function> = {
		[Phase.PENDING]: () => {
			const activePlayers = state.players.filter((p) => p.connected)
			if (activePlayers.length < 2) {
				return
			}

			state.phaseInterval -= state.tickInterval

			if (state.phaseInterval > 0) {
				return
			}

			setPhase(Phase.READY)
		},
		[Phase.READY]: () => {
			state.phaseInterval -= state.tickInterval

			if (state.phaseInterval <= 0) {
				state.phase = Phase.GAME
				state.phaseInterval = 0
			}

			setPhase(state.phase, state.phaseInterval)
		},
		[Phase.GAME]: () => {
			const activePlayers = state.players.filter((p) => p.connected)

			activePlayers.forEach((p) => {
				p.x += DX[p.direction]
				p.y += DY[p.direction]
			})

			const arenaSize = state.cellPerPlayer * activePlayers.length

			for (let i = 0; i < state.players.length; i++) {
				const p = state.players[i]

				if (!p.isAlive) {
					continue
				}

				if (
					p.x > arenaSize
					|| p.x < 0
					|| p.y < 0
					|| p.y > arenaSize
				) {
					log(`[${p.id}] ${p.nickname} leaved arena [${p.x}, ${p.y}] ${arenaSize}`)
					kill(p)
					continue
				}

				if (checkCollision(state.players, i)) {
					log(`[${p.id}] ${p.nickname} collided on [${p.x}, ${p.y}]`)
					kill(p)
					continue
				}
			}

			const alivePlayers = state.players.filter(p => p.isAlive)

			state.phaseInterval = PHASE_INTERVAL

			if (alivePlayers.length === 1) {
				const winner = alivePlayers[0]
				log(`[${winner.id}] ${winner.nickname} wins`)
				winner.wins += 1
				setPhase(Phase.WINNER, PHASE_INTERVAL, winner.id)
				return
			}

			if (alivePlayers.length === 0) {
				log("all dead")
				setPhase(Phase.END, PHASE_INTERVAL, 0)
			}
		},
		[Phase.WINNER]: () => {
			state.phaseInterval -= state.tickInterval

			if (state.phaseInterval > 0) {
				setPhase(state.phase, state.phaseInterval, state.winnerId)
				return
			}

			setPhase(Phase.END, 0, 0)
		},
		[Phase.END]: () => {
			state.ticks = []
			state.gameId += 1

			setPhase(Phase.PENDING)

			state.players
				.filter((p) => p.connected)
				.forEach((p, i) => {
					p.games += 1
					const x = (i + 1) * 5
					const y = (i + 1) * 5
					p.x = x
					p.y = y
					p.trace = [x, y]

					log(`[${p.id}] ${p.nickname} [${x}, ${y}]`)

					p.isAlive = true
					p.direction = Direction.RIGHT

					lastTick.push({
						t: ActionType.PLAYER_CONNECTED,
						d: {
							i: p.id,
							n: p.nickname,
							c: p.color,
							x: p.x,
							y: p.y,
							d: p.direction,
							g: p.games,
							w: p.wins,
						} satisfies PlayerConnectedData,
					})
				})
		},
	}

	const tick = (server: GameServer) => {
		tickers[state.phase]()

		state.ticks.push(lastTick)

		server.broadcast({
			i: state.ticks.length,
			t: Date.now(),
			a: lastTick,
		})

		lastTick = []
	}

	const connect = (server: GameServer, ws: WebSocket, nickname: string): number => {
		if (state.phase !== Phase.PENDING) {
			return -1
		}

		let nick = nickname
		const p = state.players.find((p) => p.nickname === nick)

		// TODO:
		// is connected - increment nick, create player
		// not exists - create player
		// exists - change (isAlive, isConnected, x, y, trace)

		if (p && p.connected) {
			nick = `${nick} (${lastId})`
		}

		const activePlayers = state.players.filter((p) => p.connected)

		const x = 5 * (activePlayers.length + 1)
		const y = 5 * (activePlayers.length + 1)

		const player = {
			id: lastId,
			nickname: nick,
			x,
			y,
			direction: Direction.RIGHT,
			trace: [x, y],
			color: COLORS[lastId],
			isAlive: true,
			connected: true,
			wins: 0,
			games: 0,
		}

		state.players.push(player)

		server.clientsById[player.id] = ws

		server.send(lastId, {
			a: [
				{
					t: ActionType.WELCOME,
					d: {
						i: player.id,
						g: state.gameId,
						a: state.cellPerPlayer,
						s: state.tickInterval,
						p: state.players
							.filter((p) => p.isAlive && p.connected)
							.map((p) => {
							return {
								i: p.id,
								n: p.nickname,
								c: p.color,
								d: p.direction,
								x: p.x,
								y: p.y,
								g: p.games,
								w: p.wins,
							} satisfies PlayerConnectedData
						}),
					} satisfies WelcomeData,
				},
			],
			t: Date.now(),
			i: state.ticks.length,
		})

		lastTick.push({
			t: ActionType.PLAYER_CONNECTED,
			d: {
				i: player.id,
				n: player.nickname,
				x,
				y,
				d: player.direction,
				c: player.color,
				g: player.games,
				w: player.wins,
			} satisfies PlayerConnectedData,
		})

		log(`[${player.id}] ${player.nickname} connected`)

		lastId += 1
		state.phaseInterval = PHASE_INTERVAL

		return player.id
	}

	const disconnect = (server: GameServer, id: number) => {
		const p = state.players.find((p) => p.id === id)

		if (p) {
			log(`[${p.id}] ${p.nickname} disconnected`)
			p.isAlive = false
			p.connected = false
			delete server.clientsById[id]
		}
	}

	return {
		state,

		tick,
		turn,

		connect,
		disconnect,
	}
}
