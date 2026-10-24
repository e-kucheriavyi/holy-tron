import type { Connection } from "./network.ts"
import {
	ActionType,
	Direction,
	Phase,
	type Action,
	type PhaseData,
	type PlayerConnectedData,
	type ServerMessage,
	type TurnData,
	type WelcomeData,
} from "./types.ts"

const ticks: Action[][] = [
	[
		{
			t: ActionType.WELCOME,
			d: {
				i: 1,
				g: 1,
				s: 1000,
				a: 10,
				p: [
					{
						i: 1,
						n: "hlebaev",
						x: 5,
						y: 5,
						d: Direction.RIGHT,
						c: "#ffa500",
						g: 0,
						w: 0,
					} satisfies PlayerConnectedData,
				],
			} satisfies WelcomeData,
		},
	],
	[
		{
			t: ActionType.PLAYER_CONNECTED,
			d: {
				i: 2,
				n: "hlebaev (1)",
				c: "#3caa3c",
				x: 10,
				y: 10,
				d: Direction.RIGHT,
				g: 0,
				w: 0,
			} satisfies PlayerConnectedData,
		},
	],
	[],
	[],
	[],
	[],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.READY,
				n: 5000,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.READY,
				n: 4000,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.READY,
				n: 3000,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.READY,
				n: 2000,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.READY,
				n: 1000,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.GAME,
				n: 0,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[],
	[],
	[],
	[],
	[],
	[
		{
			t: ActionType.PLAYER_TURNED,
			d: {
				i: 2,
				d: Direction.UP,
			} satisfies TurnData,
		},
	],
	[],
	[
		{
			t: ActionType.PLAYER_TURNED,
			d: {
				i: 2,
				d: Direction.LEFT,
			} satisfies TurnData,
		},
	],
	[],
	[],
	[
		{
			t: ActionType.PLAYER_TURNED,
			d: {
				i: 2,
				d: Direction.UP,
			} satisfies TurnData,
		},
	],
	[],
	[],
	[
		{
			t: ActionType.PLAYER_DIED,
			d: 2,
		},
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.WINNER,
				n: 5000,
				w: 1,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.WINNER,
				n: 4000,
				w: 1,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.WINNER,
				n: 3000,
				w: 1,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.WINNER,
				n: 2000,
				w: 1,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.WINNER,
				n: 1000,
				w: 1,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.END,
				n: 0,
				w: 0,
			} satisfies PhaseData,
		},
	],
	[
		{
			t: ActionType.GAME_PHASE,
			d: {
				p: Phase.PENDING,
				n: 5000,
				w: 0,
			} satisfies PhaseData,
		},
	],
]

const mockTickStream = () => {
	let tickNumber = 0

	return (): ServerMessage => {
		const msg = {
			a: ticks[tickNumber],
			i: tickNumber,
			t: Date.now(),
		}

		tickNumber += 1

		if (tickNumber >= ticks.length) {
			tickNumber = 0
		}

		return msg
	}
}

export const createMockConnection = (): Connection => {
	let callback: Function | null = null
	const nextMessage = mockTickStream()

	const timer = setInterval(() => {
		const msg = nextMessage()
		callback && callback(msg)
	}, 100)

	return {
		close: () => clearInterval(timer),
		send: (msg) => {
			console.log("[MOCK]", msg)
		},
		onMessage: (fn) => {
			callback = fn
		},
	}
}
