export type Mode = "full" | "ticks"

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

export type State = {
	nickname:      string
	connected:     boolean
	gameId:        number
	tickNumber:    number
	tickInterval:  number
	phase:         Phase
	phaseInterval: number
	winnerId:      number
	playerId:      number
	arenaSize:     number
	players:       Player[]
}
