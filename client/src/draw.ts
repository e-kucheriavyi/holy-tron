import {
	Direction,
	Phase,
	type Player,
	type State,
} from "./types.ts"

declare const canvas: HTMLCanvasElement

const GRID_WIDTH = 1
const GRID_COLOR = "#222"

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

const getCellSize = (state: State): number => {
	return canvas.width / (state.arenaSize + 1)
}

const drawGrid = (state: State) => {
	const s = getCellSize(state)

	ctx.lineWidth = GRID_WIDTH
	ctx.strokeStyle = GRID_COLOR

	ctx.beginPath()

	for (let x = 0; x < canvas.width; x += s) {
		ctx.moveTo(x, 0)
		ctx.lineTo(x, canvas.height)
	}

	for (let y = 0; y < canvas.height; y += s) {
		ctx.moveTo(0, y)
		ctx.lineTo(canvas.width, y)
	}

	ctx.stroke()

	const p = state.players.find((p) => p.id === state.playerId)

	if (p) {
		ctx.strokeStyle = p.color
		ctx.strokeRect(0, 0, canvas.width, canvas.height)
	}
}

const drawPlayer = (state: State, player: Player) => {
	const s = getCellSize(state)

	ctx.fillStyle = player.color
	ctx.strokeStyle = player.color
	ctx.lineWidth = s * 0.5

	ctx.beginPath()

	const trace = [...player.trace, player.x, player.y]

	for (let i = 0; i < trace.length; i += 2) {
		const x = trace[i] * s + s * 0.5
		const y = trace[i + 1] * s + s * 0.5

		if (i === 0) {
			ctx.moveTo(x, y)
		} else {
			ctx.lineTo(x, y)
		}
	}

	ctx.stroke()

	const x = player.x * s
	const y = player.y * s

	ctx.fillRect(
		x + s * 0.1,
		y + s * 0.1,
		s * 0.8,
		s * 0.8,
	)

	ctx.strokeStyle = GRID_COLOR
	ctx.lineWidth = s * 0.3

	ctx.beginPath()

	ctx.moveTo(x + s * 0.5, y + s * 0.5)
	switch (player.direction) {
		case Direction.LEFT:  ctx.lineTo(          x, y + s * 0.5); break
		case Direction.RIGHT: ctx.lineTo(  x + s * 1, y + s * 0.5); break
		case Direction.UP:    ctx.lineTo(x + s * 0.5,           y); break
		case Direction.DOWN:  ctx.lineTo(x + s * 0.5,       y + s); break
	}

	ctx.stroke()
}

const drawText = (text: string) => {
	ctx.fillStyle = "#fff"
	ctx.font = "32px monospace"

	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.fillText(text, canvas.width * 0.5, canvas.height * 0.5)
}

export const draw = (state: State) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	drawGrid(state)

	for (let i = 0; i < state.players.length; i++) {
		const p = state.players[i]

		if (!p.isAlive || !p.connected) {
			continue
		}

		drawPlayer(state, p)
	}

	if (state.phase === Phase.PENDING) {
		drawText("Waiting players...")
	}

	if (state.phase === Phase.READY) {
		drawText(`Start in: ${state.phaseInterval}`)
	}

	if (state.phase === Phase.WINNER) {
		const p = state.players.find((p) => p.id === state.winnerId)

		drawText(p ? `Winner: ${p.nickname}` : "Game over")
	}
}

export const resize = () => {
	const size = Math.min(canvas.clientWidth, canvas.clientHeight)
	canvas.width = size
	canvas.height = size
}
