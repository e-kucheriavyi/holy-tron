import WebSocket from "ws"

export const Phase = {
	PENDING: "p",
	READY:   "r",
	GAME:    "g",
	WINNER:  "w",
	END:     "e",
} as const

export type Phase = (typeof Phase)[keyof typeof Phase]

export const Direction = {
	LEFT:  "l",
	RIGHT: "r",
	UP:    "u",
	DOWN:  "d",
} as const

export type Direction = (typeof Direction)[keyof typeof Direction]

export type Player = {
	id:        number
	nickname:  string
	color:     string
	direction: Direction
	connected: boolean
	isAlive:   boolean
	x:         number
	y:         number
	trace:     number[]
	wins:      number
	games:     number
}

export const ActionType = {
	WELCOME:          "w",
	PLAYER_CONNECTED: "p",
	PLAYER_DIED:      "d",
	PLAYER_TURNED:    "t",
	GAME_PHASE:       "h",
	DATA:             "r",
} as const

export type ActionType = (typeof ActionType)[keyof typeof ActionType]

export type Action = {
	t: ActionType
	// data
	d: unknown
}

export type ServerMessage = {
	// list of changes
	a: Action[]
	// tick number
	i: number
	// timestamp
	t: number
}

export type WelcomeData = {
	// player id
	i: number
	// game id
	g: number
	// tick interval
	s: number
		// cells per player: arenaSize = a * players.length
	a: number
	p: PlayerConnectedData[]
}

export type TurnData = {
	// player id
	i: number
	// new direction
	d: Direction
}

export type PhaseData = {
	p: Phase
	// next phase interval
	n: number
	// winner
	w: number
}

export type PlayerConnectedData = {
	// id
	i: number
	// nickname
	n: string
	// color
	c: string
	// direction
	d: Direction
	x: number
	y: number
	// games played
	g: number
	// wins
	w: number
}

export type Client = {
	ws: WebSocket
	mode: "full" | "ticks"
}

export interface GameServer {
	clientsById: Record<number, Client>
	send:        (id: number, msg: ServerMessage) => void
	broadcast:   (msg: ServerMessage) => void
}

export type GameState = {
	gameId:        number
	phase:         Phase
	phaseInterval: number
	tickInterval:  number
	ticks:         Action[][]
	players:       Player[]
	winnerId:      number
	cellPerPlayer: number
}

export interface Game {
	state: GameState

	tick: (server: GameServer) => void
	turn: (id: number, d: Direction) => void

	connect: (server: GameServer, ws: WebSocket, nickname: string) => number
	disconnect: (server: GameServer, id: number) => void
}
